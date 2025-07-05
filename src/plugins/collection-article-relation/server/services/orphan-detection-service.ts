// src/plugins/collection-article-relation/server/services/orphan-detection-service.ts
// Focused on orphan detection and analysis logic

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError, ValidationError, NotFoundError } = errors;

// Orphan Detection Interfaces
interface OrphanStatus {
    isOrphaned: boolean;
    isEmpty: boolean;
    articleCount: number;
    missingArticleIds: number[];
    validArticleIds: number[];
    orphanType: 'empty' | 'broken_references' | 'single_article' | 'healthy';
    severity: 'low' | 'medium' | 'high';
}

interface OrphanDetectionResult {
    collection: {
        id: number;
        documentId: string;
        title: string;
        url: string;
    };
    status: OrphanStatus;
    suggestedActions: string[];
    metadata: {
        lastChecked: string;
        articleRelationships: any[];
    };
}

interface RelationshipStatus {
    collection: any;
    totalArticles: number;
    validArticles: number;
    missingArticles: number;
    articleDetails: Array<{
        id: number;
        exists: boolean;
        title?: string;
        status: 'valid' | 'missing' | 'inaccessible';
    }>;
    healthScore: number; // 0-100
    recommendations: string[];
}

// Orphan detection cache
const orphanDetectionCache = new Map<number, { status: OrphanStatus; timestamp: number }>();
const ORPHAN_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export default ({ strapi }: any) => {
    // Helper function to validate collection ID
    const validateCollectionId = (collectionId: any): number => {
        const id = parseInt(collectionId?.toString());
        if (!collectionId || isNaN(id) || id <= 0) {
            throw new ValidationError('Valid collection ID is required');
        }
        return id;
    };

    // Helper function to clean expired cache entries
    const cleanExpiredCache = (): void => {
        const now = Date.now();
        for (const [key, value] of orphanDetectionCache.entries()) {
            if (now - value.timestamp > ORPHAN_CACHE_TTL) {
                orphanDetectionCache.delete(key);
            }
        }
    };

    // Helper to check if articles exist
    const checkArticlesExistence = async (articleIds: number[]): Promise<Map<number, boolean>> => {
        const existenceMap = new Map<number, boolean>();

        if (articleIds.length === 0) return existenceMap;

        try {
            const existingArticles = await strapi.documents('api::article.article').findMany({
                filters: {
                    id: { $in: articleIds }
                },
                fields: ['id']
            });

            const existingIds = new Set(existingArticles.map((art: any) => parseInt(art.id.toString())));

            articleIds.forEach(id => {
                existenceMap.set(id, existingIds.has(id));
            });

            return existenceMap;
        } catch (error) {
            console.error('[OrphanDetection] Error checking article existence:', error);
            // Default to assuming all articles exist if we can't check
            articleIds.forEach(id => existenceMap.set(id, true));
            return existenceMap;
        }
    };

    return {
        /**
         * Detect orphaned status of a specific collection
         */
        async getCollectionOrphanStatus(collectionId: number): Promise<OrphanStatus> {
            try {
                const validId = validateCollectionId(collectionId);

                // Check cache first
                cleanExpiredCache();
                const cached = orphanDetectionCache.get(validId);
                if (cached && (Date.now() - cached.timestamp) < ORPHAN_CACHE_TTL) {
                    console.log(`[OrphanDetection] Cache hit for collection ${validId}`);
                    return cached.status;
                }

                console.log(`[OrphanDetection] Analyzing collection ${validId} for orphan status`);

                // Get collection with article relationships
                const collection = await strapi.documents('api::collection.collection').findFirst({
                    filters: { id: validId },
                    populate: {
                        articles: {
                            fields: ['id', 'documentId', 'Title']
                        }
                    }
                });

                if (!collection) {
                    throw new NotFoundError(`Collection with ID ${validId} not found`);
                }

                const articles = collection.articles || [];
                const articleIds = articles.map((art: any) => parseInt(art.id.toString()));

                console.log(`[OrphanDetection] Collection "${collection.Title}" has ${articles.length} linked articles`);

                // Check which articles actually exist
                const articleExistenceMap = await checkArticlesExistence(articleIds);
                const validArticleIds = articleIds.filter(id => articleExistenceMap.get(id) === true);
                const missingArticleIds = articleIds.filter(id => articleExistenceMap.get(id) === false);

                // Determine orphan status
                let orphanType: OrphanStatus['orphanType'];
                let severity: OrphanStatus['severity'];
                let isOrphaned = false;

                if (articles.length === 0) {
                    // Collection has no articles at all
                    orphanType = 'empty';
                    severity = 'medium';
                    isOrphaned = true;
                } else if (missingArticleIds.length === articles.length) {
                    // All articles are missing/deleted
                    orphanType = 'broken_references';
                    severity = 'high';
                    isOrphaned = true;
                } else if (missingArticleIds.length > 0) {
                    // Some articles are missing
                    orphanType = 'broken_references';
                    severity = 'medium';
                    isOrphaned = true;
                } else if (articles.length === 1) {
                    // Single article collection (potential for cleanup)
                    orphanType = 'single_article';
                    severity = 'low';
                    isOrphaned = false; // Not technically orphaned, but worth noting
                } else {
                    // Healthy multi-article collection
                    orphanType = 'healthy';
                    severity = 'low';
                    isOrphaned = false;
                }

                const status: OrphanStatus = {
                    isOrphaned,
                    isEmpty: articles.length === 0,
                    articleCount: articles.length,
                    missingArticleIds,
                    validArticleIds,
                    orphanType,
                    severity
                };

                // Cache the result
                orphanDetectionCache.set(validId, {
                    status,
                    timestamp: Date.now()
                });

                console.log(`[OrphanDetection] Collection ${validId} status:`, {
                    orphanType,
                    severity,
                    isOrphaned,
                    totalArticles: articles.length,
                    validArticles: validArticleIds.length,
                    missingArticles: missingArticleIds.length
                });

                return status;

            } catch (error) {
                if (error instanceof NotFoundError || error instanceof ValidationError) {
                    throw error;
                }

                console.error('[OrphanDetection] Error getting collection orphan status:', error);
                throw new ApplicationError(
                    `Failed to check orphan status: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Get detailed relationship status for a collection
         */
        async getCollectionRelationshipStatus(collectionId: number): Promise<RelationshipStatus> {
            try {
                const validId = validateCollectionId(collectionId);

                console.log(`[OrphanDetection] Getting detailed relationship status for collection ${validId}`);

                // Get collection with full article details
                const collection = await strapi.documents('api::collection.collection').findFirst({
                    filters: { id: validId },
                    populate: {
                        articles: {
                            fields: ['id', 'documentId', 'Title', 'Date', 'createdAt']
                        }
                    }
                });

                if (!collection) {
                    throw new NotFoundError(`Collection with ID ${validId} not found`);
                }

                const articles = collection.articles || [];
                const articleIds = articles.map((art: any) => parseInt(art.id.toString()));

                // Check article existence
                const articleExistenceMap = await checkArticlesExistence(articleIds);

                // Build detailed article status
                const articleDetails = articles.map((article: any) => {
                    const articleId = parseInt(article.id.toString());
                    const exists = articleExistenceMap.get(articleId) === true;

                    return {
                        id: articleId,
                        exists,
                        title: exists ? article.Title : undefined,
                        status: exists ? 'valid' as const : 'missing' as const
                    };
                });

                const validArticles = articleDetails.filter(art => art.exists).length;
                const missingArticles = articleDetails.filter(art => !art.exists).length;

                // Calculate health score (0-100)
                let healthScore = 100;
                if (articles.length === 0) {
                    healthScore = 0; // Empty collection
                } else {
                    healthScore = Math.round((validArticles / articles.length) * 100);
                }

                // Generate recommendations
                const recommendations: string[] = [];
                if (articles.length === 0) {
                    recommendations.push('Collection is empty - consider adding articles or deleting');
                } else if (missingArticles === articles.length) {
                    recommendations.push('All articles are missing - collection should be deleted');
                } else if (missingArticles > 0) {
                    recommendations.push(`Remove ${missingArticles} missing article reference(s)`);
                    recommendations.push('Consider adding new articles to maintain collection value');
                } else if (articles.length === 1) {
                    recommendations.push('Single-article collection - consider if this could be merged with others');
                } else {
                    recommendations.push('Collection is healthy with multiple valid articles');
                }

                return {
                    collection,
                    totalArticles: articles.length,
                    validArticles,
                    missingArticles,
                    articleDetails,
                    healthScore,
                    recommendations
                };

            } catch (error) {
                if (error instanceof NotFoundError || error instanceof ValidationError) {
                    throw error;
                }

                console.error('[OrphanDetection] Error getting relationship status:', error);
                throw new ApplicationError(
                    `Failed to get relationship status: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Detect all orphaned collections in the system
         */
        async detectOrphanedCollections(): Promise<OrphanDetectionResult[]> {
            try {
                console.log('[OrphanDetection] Starting system-wide orphan detection');

                // Get all collections with article relationships
                const allCollections = await strapi.documents('api::collection.collection').findMany({
                    populate: {
                        articles: {
                            fields: ['id', 'documentId', 'Title']
                        }
                    },
                    limit: 200 // Reasonable limit for performance
                });

                console.log(`[OrphanDetection] Analyzing ${allCollections.length} collections`);

                const results: OrphanDetectionResult[] = [];

                for (const collection of allCollections) {
                    try {
                        const collectionId = parseInt(collection.id.toString());
                        const status = await this.getCollectionOrphanStatus(collectionId);

                        // Generate suggested actions based on status
                        const suggestedActions: string[] = [];
                        switch (status.orphanType) {
                            case 'empty':
                                suggestedActions.push('Delete empty collection');
                                suggestedActions.push('Add articles to collection');
                                break;
                            case 'broken_references':
                                if (status.missingArticleIds.length === status.articleCount) {
                                    suggestedActions.push('Delete collection (all articles missing)');
                                } else {
                                    suggestedActions.push('Remove broken article references');
                                    suggestedActions.push('Add replacement articles');
                                }
                                break;
                            case 'single_article':
                                suggestedActions.push('Consider merging with other collections');
                                suggestedActions.push('Add more articles to enhance value');
                                break;
                            case 'healthy':
                                suggestedActions.push('No action needed - collection is healthy');
                                break;
                        }

                        const result: OrphanDetectionResult = {
                            collection: {
                                id: collectionId,
                                documentId: collection.documentId,
                                title: collection.Title || 'Untitled Collection',
                                url: `/admin/content-manager/collection-types/api::collection.collection/${collection.documentId || collectionId}`
                            },
                            status,
                            suggestedActions,
                            metadata: {
                                lastChecked: new Date().toISOString(),
                                articleRelationships: collection.articles || []
                            }
                        };

                        results.push(result);

                    } catch (error) {
                        console.error(`[OrphanDetection] Error analyzing collection ${collection.id}:`, error);
                        // Continue with other collections even if one fails
                    }
                }

                // Sort results by severity (high to low) and then by orphan type
                results.sort((a, b) => {
                    const severityOrder = { high: 3, medium: 2, low: 1 };
                    const severityDiff = severityOrder[b.status.severity] - severityOrder[a.status.severity];
                    if (severityDiff !== 0) return severityDiff;

                    // Secondary sort by orphan type
                    const typeOrder = { broken_references: 4, empty: 3, single_article: 2, healthy: 1 };
                    return typeOrder[b.status.orphanType] - typeOrder[a.status.orphanType];
                });

                console.log(`[OrphanDetection] Found ${results.filter(r => r.status.isOrphaned).length} orphaned collections out of ${results.length} total`);

                return results;

            } catch (error) {
                console.error('[OrphanDetection] Error in system-wide orphan detection:', error);
                throw new ApplicationError(
                    `Failed to detect orphaned collections: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Get orphan detection statistics
         */
        async getOrphanDetectionStats(): Promise<{
            totalCollections: number;
            orphanedCollections: number;
            emptyCollections: number;
            brokenReferenceCollections: number;
            singleArticleCollections: number;
            healthyCollections: number;
            severityBreakdown: { high: number; medium: number; low: number };
            lastAnalysis: string;
            cacheStats: { size: number; hitRate: string };
        }> {
            try {
                console.log('[OrphanStats] Generating orphan detection statistics');

                const allResults = await this.detectOrphanedCollections();

                const stats = {
                    totalCollections: allResults.length,
                    orphanedCollections: allResults.filter(r => r.status.isOrphaned).length,
                    emptyCollections: allResults.filter(r => r.status.orphanType === 'empty').length,
                    brokenReferenceCollections: allResults.filter(r => r.status.orphanType === 'broken_references').length,
                    singleArticleCollections: allResults.filter(r => r.status.orphanType === 'single_article').length,
                    healthyCollections: allResults.filter(r => r.status.orphanType === 'healthy').length,
                    severityBreakdown: {
                        high: allResults.filter(r => r.status.severity === 'high').length,
                        medium: allResults.filter(r => r.status.severity === 'medium').length,
                        low: allResults.filter(r => r.status.severity === 'low').length
                    },
                    lastAnalysis: new Date().toISOString(),
                    cacheStats: {
                        size: orphanDetectionCache.size,
                        hitRate: 'Not tracked' // Could implement hit rate tracking
                    }
                };

                console.log('[OrphanStats] Statistics generated:', stats);
                return stats;

            } catch (error) {
                console.error('[OrphanStats] Error generating statistics:', error);
                throw new ApplicationError(
                    `Failed to generate orphan statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Cache management methods
         */
        clearOrphanCache(): void {
            orphanDetectionCache.clear();
            console.log('[OrphanDetection] Orphan detection cache cleared');
        },

        getOrphanCacheStats(): { size: number; entries: any[] } {
            cleanExpiredCache();
            return {
                size: orphanDetectionCache.size,
                entries: Array.from(orphanDetectionCache.entries()).map(([key, value]) => ({
                    collectionId: key,
                    orphanType: value.status.orphanType,
                    severity: value.status.severity,
                    age: Date.now() - value.timestamp
                }))
            };
        }
    };
};