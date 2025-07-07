// src/plugins/collection-manager/server/services/duplicate-detection-service.ts

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError, ValidationError } = errors;

// Duplicate Detection Interfaces
interface DuplicateGroup {
    fingerprint: string;
    collectionCount: number;
    collections: Array<{
        id: number;
        documentId: string;
        title: string;
        url: string;
        articleIds: number[];
        createdAt: string;
    }>;
    articleCount: number;
    duplicateType: 'exact_match' | 'subset_match';
    severity: 'low' | 'medium' | 'high';
    suggestedActions: string[];
}

interface DuplicateDetectionResult {
    duplicateGroups: DuplicateGroup[];
    totalDuplicateCollections: number;
    totalCollections: number;
    duplicatePercentage: number;
    worstDuplicateGroup: DuplicateGroup | null;
    recommendations: string[];
}

// Duplicate detection cache with 2-minute TTL (consistent with orphan system)
const duplicateDetectionCache = new Map<string, { result: DuplicateDetectionResult; timestamp: number }>();
const DUPLICATE_CACHE_TTL = 2 * 60 * 1000;

// Stats cache for better performance
const duplicateStatsCache = {
    data: null as any,
    timestamp: 0,
    ttl: 2 * 60 * 1000
};

export default ({ strapi }: any) => {

    // Helper function to clean expired cache entries
    const cleanExpiredCache = (): void => {
        const now = Date.now();
        for (const [key, value] of duplicateDetectionCache.entries()) {
            if (now - value.timestamp > DUPLICATE_CACHE_TTL) {
                duplicateDetectionCache.delete(key);
            }
        }
    };

    // Helper to check if we should bypass cache
    const shouldBypassCache = (bypassCache?: boolean): boolean => {
        return bypassCache === true;
    };

    // Generate fingerprint for collection based on sorted article IDs
    const generateCollectionFingerprint = (articleIds: number[]): string => {
        if (!articleIds || articleIds.length === 0) {
            return 'empty';
        }

        // Sort article IDs and join with commas for consistent fingerprint
        const sortedIds = [...articleIds].sort((a, b) => a - b);
        return sortedIds.join(',');
    };

    // Determine duplicate severity based on collection count and article count
    const calculateDuplicateSeverity = (collectionCount: number, articleCount: number): DuplicateGroup['severity'] => {
        if (collectionCount >= 4 || (collectionCount >= 3 && articleCount >= 3)) {
            return 'high'; // Many duplicates or significant content duplication
        } else if (collectionCount === 3 || articleCount >= 2) {
            return 'medium'; // Multiple duplicates or multi-article duplication
        } else {
            return 'low'; // Just 2 duplicates with single article
        }
    };

    // Generate suggested actions for duplicate groups
    const generateSuggestedActions = (group: DuplicateGroup): string[] => {
        const actions: string[] = [];

        if (group.collectionCount === 2) {
            actions.push('Merge collections into one');
            actions.push('Keep the most recently updated collection');
        } else if (group.collectionCount >= 3) {
            actions.push('Consolidate all duplicates into a single collection');
            actions.push('Review collection titles and descriptions for differences');
        }

        if (group.articleCount === 1) {
            actions.push('Simple single-article duplicate - safe to merge');
        } else {
            actions.push('Multi-article duplicate - verify article order and relationships');
        }

        switch (group.severity) {
            case 'high':
                actions.push('⚠️ High priority - significant content duplication');
                break;
            case 'medium':
                actions.push('⚡ Medium priority - review and consolidate');
                break;
            case 'low':
                actions.push('📝 Low priority - clean up when convenient');
                break;
        }

        return actions;
    };

    return {
        /**
         * Detect duplicate collections based on identical article sets
         * @param bypassCache - Whether to bypass cache and force fresh detection
         */
        async detectDuplicateCollections(bypassCache = false): Promise<DuplicateDetectionResult> {
            try {
                const cacheKey = 'duplicate_detection_all';

                // Check cache first (unless bypassing)
                if (!shouldBypassCache(bypassCache)) {
                    cleanExpiredCache();
                    const cached = duplicateDetectionCache.get(cacheKey);
                    if (cached && (Date.now() - cached.timestamp) < DUPLICATE_CACHE_TTL) {
                        console.log('[DuplicateDetection] Cache hit for duplicate detection');
                        return cached.result;
                    }
                } else {
                    console.log('[DuplicateDetection] Bypassing cache for duplicate detection');
                }

                console.log('[DuplicateDetection] Starting duplicate collection detection');

                // Get all collections with article relationships
                const allCollections = await strapi.documents('api::collection.collection').findMany({
                    populate: {
                        articles: {
                            fields: ['id', 'documentId', 'Title']
                        }
                    },
                    fields: ['id', 'documentId', 'Title', 'createdAt'],
                    limit: 200 // Reasonable limit for performance
                });

                console.log(`[DuplicateDetection] Analyzing ${allCollections.length} collections for duplicates`);

                // Group collections by fingerprint
                const fingerprintGroups = new Map<string, Array<any>>();

                for (const collection of allCollections) {
                    const articles = collection.articles || [];
                    const articleIds = articles.map((art: any) => parseInt(art.id.toString()));
                    const fingerprint = generateCollectionFingerprint(articleIds);

                    if (!fingerprintGroups.has(fingerprint)) {
                        fingerprintGroups.set(fingerprint, []);
                    }

                    fingerprintGroups.get(fingerprint)!.push({
                        ...collection,
                        articleIds,
                        fingerprint
                    });
                }

                // Find groups with duplicates (more than 1 collection with same fingerprint)
                const duplicateGroups: DuplicateGroup[] = [];
                let totalDuplicateCollections = 0;

                for (const [fingerprint, collections] of fingerprintGroups.entries()) {
                    if (collections.length > 1 && fingerprint !== 'empty') {
                        // This is a duplicate group
                        const articleCount = collections[0].articleIds.length;
                        const severity = calculateDuplicateSeverity(collections.length, articleCount);

                        const duplicateGroup: DuplicateGroup = {
                            fingerprint,
                            collectionCount: collections.length,
                            collections: collections.map(col => ({
                                id: parseInt(col.id.toString()),
                                documentId: col.documentId,
                                title: col.Title || 'Untitled Collection',
                                url: `/admin/content-manager/collection-types/api::collection.collection/${col.documentId || col.id}`,
                                articleIds: col.articleIds,
                                createdAt: col.createdAt
                            })),
                            articleCount,
                            duplicateType: 'exact_match', // We only detect exact matches for now
                            severity,
                            suggestedActions: []
                        };

                        // Generate suggested actions
                        duplicateGroup.suggestedActions = generateSuggestedActions(duplicateGroup);

                        duplicateGroups.push(duplicateGroup);
                        totalDuplicateCollections += collections.length;
                    }
                }

                // Sort duplicate groups by severity (high to low) and then by collection count
                duplicateGroups.sort((a, b) => {
                    const severityOrder = { high: 3, medium: 2, low: 1 };
                    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                    if (severityDiff !== 0) return severityDiff;

                    // Secondary sort by collection count (more duplicates first)
                    return b.collectionCount - a.collectionCount;
                });

                // Calculate statistics
                const duplicatePercentage = allCollections.length > 0
                    ? Math.round((totalDuplicateCollections / allCollections.length) * 100)
                    : 0;

                const worstDuplicateGroup = duplicateGroups.length > 0 ? duplicateGroups[0] : null;

                // Generate recommendations
                const recommendations: string[] = [];
                if (duplicateGroups.length === 0) {
                    recommendations.push('✅ No duplicate collections found - all collections have unique article sets');
                } else {
                    recommendations.push(`📋 Found ${duplicateGroups.length} duplicate group(s) affecting ${totalDuplicateCollections} collections`);

                    const highSeverityGroups = duplicateGroups.filter(g => g.severity === 'high');
                    if (highSeverityGroups.length > 0) {
                        recommendations.push(`🚨 Priority: Address ${highSeverityGroups.length} high-severity duplicate group(s) first`);
                    }

                    if (worstDuplicateGroup && worstDuplicateGroup.collectionCount >= 4) {
                        recommendations.push(`⚠️ Largest duplicate group has ${worstDuplicateGroup.collectionCount} identical collections`);
                    }

                    recommendations.push('💡 Consider consolidating duplicates to improve content organization');
                }

                const result: DuplicateDetectionResult = {
                    duplicateGroups,
                    totalDuplicateCollections,
                    totalCollections: allCollections.length,
                    duplicatePercentage,
                    worstDuplicateGroup,
                    recommendations
                };

                // Cache the result (always cache fresh results)
                duplicateDetectionCache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });

                console.log(`[DuplicateDetection] Detection completed: ${duplicateGroups.length} duplicate groups found affecting ${totalDuplicateCollections}/${allCollections.length} collections${bypassCache ? ' (cache bypassed)' : ''}`);

                return result;

            } catch (error) {
                console.error('[DuplicateDetection] Error detecting duplicate collections:', error);
                throw new ApplicationError(
                    `Failed to detect duplicate collections: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Get duplicate detection statistics only (optimized for dashboard widgets)
         * @param bypassCache - Whether to bypass stats cache
         */
        async getDuplicateDetectionStats(bypassCache = false): Promise<{
            totalCollections: number;
            duplicateGroups: number;
            duplicateCollections: number;
            duplicatePercentage: number;
            severityBreakdown: { high: number; medium: number; low: number };
            lastAnalysis: string;
            cacheStats: { size: number; hitRate: string };
        }> {
            try {
                console.log(`[DuplicateStats] Generating duplicate detection statistics${bypassCache ? ' (bypassing cache)' : ''}`);

                // Check stats cache first
                if (!bypassCache && duplicateStatsCache.data && (Date.now() - duplicateStatsCache.timestamp) < duplicateStatsCache.ttl) {
                    console.log('[DuplicateStats] Using cached stats');
                    return duplicateStatsCache.data;
                }

                const detectionResult = await this.detectDuplicateCollections(bypassCache);

                const stats = {
                    totalCollections: detectionResult.totalCollections,
                    duplicateGroups: detectionResult.duplicateGroups.length,
                    duplicateCollections: detectionResult.totalDuplicateCollections,
                    duplicatePercentage: detectionResult.duplicatePercentage,
                    severityBreakdown: {
                        high: detectionResult.duplicateGroups.filter(g => g.severity === 'high').length,
                        medium: detectionResult.duplicateGroups.filter(g => g.severity === 'medium').length,
                        low: detectionResult.duplicateGroups.filter(g => g.severity === 'low').length
                    },
                    lastAnalysis: new Date().toISOString(),
                    cacheStats: {
                        size: duplicateDetectionCache.size,
                        hitRate: `${Math.round((duplicateDetectionCache.size / (detectionResult.totalCollections || 1)) * 100)}%`
                    }
                };

                // Cache the stats
                duplicateStatsCache.data = stats;
                duplicateStatsCache.timestamp = Date.now();

                console.log('[DuplicateStats] Statistics generated:', stats);
                return stats;

            } catch (error) {
                console.error('[DuplicateStats] Error generating statistics:', error);
                throw new ApplicationError(
                    `Failed to generate duplicate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Get detailed information about a specific duplicate group
         * @param fingerprint - The fingerprint identifying the duplicate group
         */
        async getDuplicateGroupDetails(fingerprint: string): Promise<DuplicateGroup | null> {
            try {
                console.log(`[DuplicateDetection] Getting details for duplicate group: ${fingerprint}`);

                const detectionResult = await this.detectDuplicateCollections();
                const duplicateGroup = detectionResult.duplicateGroups.find(group => group.fingerprint === fingerprint);

                if (!duplicateGroup) {
                    console.log(`[DuplicateDetection] Duplicate group not found: ${fingerprint}`);
                    return null;
                }

                return duplicateGroup;

            } catch (error) {
                console.error('[DuplicateDetection] Error getting duplicate group details:', error);
                throw new ApplicationError(
                    `Failed to get duplicate group details: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Enhanced cache management methods
         */
        clearDuplicateCache(): void {
            const cacheSize = duplicateDetectionCache.size;
            duplicateDetectionCache.clear();
            duplicateStatsCache.data = null;
            duplicateStatsCache.timestamp = 0;
            console.log(`[DuplicateDetection] Duplicate detection cache cleared (removed ${cacheSize} entries)`);
        },

        getDuplicateCacheStats(): { size: number; entries: any[]; statsCache: any } {
            cleanExpiredCache();
            return {
                size: duplicateDetectionCache.size,
                entries: Array.from(duplicateDetectionCache.entries()).map(([key, value]) => ({
                    cacheKey: key,
                    duplicateGroups: value.result.duplicateGroups.length,
                    duplicateCollections: value.result.totalDuplicateCollections,
                    age: Date.now() - value.timestamp,
                    expiresIn: Math.max(0, DUPLICATE_CACHE_TTL - (Date.now() - value.timestamp))
                })),
                statsCache: {
                    hasData: !!duplicateStatsCache.data,
                    age: duplicateStatsCache.timestamp ? Date.now() - duplicateStatsCache.timestamp : null,
                    expiresIn: duplicateStatsCache.timestamp ? Math.max(0, duplicateStatsCache.ttl - (Date.now() - duplicateStatsCache.timestamp)) : null
                }
            };
        }
    };
};