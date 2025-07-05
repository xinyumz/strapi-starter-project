// src/plugins/collection-article-relation/server/services/collection-autofill-service.ts

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError, ValidationError, NotFoundError } = errors;

interface ArticleData {
    id: number;
    documentId: string;
    Title: string | null;
    Date: string | null;
    Cover: any | null;
    Category: any | null;
    createdAt?: string;
    updatedAt?: string;
}

interface CollectionResult {
    collection: any;
    isExisting: boolean;
    article: ArticleData;
    message: string;
    redirectUrl: string;
    metadata?: {
        processingTime: number;
        cacheHit: boolean;
        duplicateCheck: boolean;
    };
}

// Simple in-memory cache for duplicate checks (production should use Redis)
const duplicateCheckCache = new Map<number, { exists: boolean; collectionId?: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default ({ strapi }: any) => {
    // Helper function to validate article ID
    const validateArticleId = (articleId: any): number => {
        const id = parseInt(articleId?.toString());
        if (!articleId || isNaN(id) || id <= 0) {
            throw new ValidationError('Valid article ID is required');
        }
        return id;
    };

    // Helper function to clean cache entries
    const cleanExpiredCache = (): void => {
        const now = Date.now();
        for (const [key, value] of duplicateCheckCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                duplicateCheckCache.delete(key);
            }
        }
    };

    return {
        /**
         * Method to get article data with validation
         */
        async getArticleData(articleId: number): Promise<ArticleData | null> {
            try {
                const validId = validateArticleId(articleId);

                console.log(`[CollectionAutoFill] Fetching article data for ID: ${validId}`);

                // Use Document Service API for Strapi v5
                const article = await strapi.documents('api::article.article').findFirst({
                    filters: { id: validId },
                    populate: {
                        Cover: true,
                        // REMOVED: Category populate since it's a custom field that might cause issues
                        // Category: {
                        //     fields: ['id', 'name', 'slug']
                        // }
                    }
                });

                if (!article) {
                    console.warn(`[CollectionAutoFill] Article ${validId} not found`);
                    throw new NotFoundError(`Article with ID ${validId} not found`);
                }

                const articleData: ArticleData = {
                    id: parseInt(article.id.toString()),
                    documentId: article.documentId,
                    Title: (article as any).Title || null,
                    Date: (article as any).Date || null,
                    Cover: (article as any).Cover || null,
                    Category: (article as any).Category || null,
                    createdAt: (article as any).createdAt,
                    updatedAt: (article as any).updatedAt
                };

                console.log(`[CollectionAutoFill] Article data retrieved:`, {
                    id: articleData.id,
                    documentId: articleData.documentId,
                    title: articleData.Title,
                    hasDate: !!articleData.Date,
                    hasCover: !!articleData.Cover,
                    hasCategory: !!articleData.Category
                });

                return articleData;

            } catch (error) {
                if (error instanceof NotFoundError || error instanceof ValidationError) {
                    throw error;
                }

                console.error('[CollectionAutoFill] Error getting article data:', error);
                throw new ApplicationError(
                    `Failed to retrieve article data: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Duplicate check with proper article ID filtering
         */
        async checkExistingCollection(articleId: number): Promise<{ exists: boolean; collection?: any; fromCache: boolean }> {
            try {
                const validId = validateArticleId(articleId);

                // Clean expired cache entries periodically
                cleanExpiredCache();

                // Check cache first
                const cached = duplicateCheckCache.get(validId);
                if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
                    console.log(`[CollectionAutoFill] Cache hit for article ${validId}`);

                    if (cached.exists && cached.collectionId) {
                        // Get the actual collection data (might have been updated)
                        try {
                            // Use Document Service API
                            const collection = await strapi.documents('api::collection.collection').findFirst({
                                filters: { id: cached.collectionId }
                            });
                            return { exists: true, collection, fromCache: true };
                        } catch (error) {
                            // Collection might have been deleted, invalidate cache
                            duplicateCheckCache.delete(validId);
                        }
                    } else {
                        return { exists: false, fromCache: true };
                    }
                }

                console.log(`[CollectionAutoFill] Cache miss for article ${validId}, checking database`);

                // Proper query using Document Service API
                // Get all collections first, then filter in memory for precise control
                const allCollections = await strapi.documents('api::collection.collection').findMany({
                    populate: {
                        articles: {
                            fields: ['id', 'documentId']
                        }
                    },
                    limit: 100 // Reasonable limit to avoid performance issues
                });

                console.log(`[CollectionAutoFill] Found ${allCollections.length} total collections to check`);

                // Find collection with exactly one article that matches this ID
                let existingCollection = null;

                for (const collection of allCollections) {
                    const articles = collection.articles || [];

                    // Log for debugging
                    console.log(`[CollectionAutoFill] Collection "${collection.Title}" has ${articles.length} articles:`,
                        articles.map((art: any) => art.id));

                    // Check if this collection has exactly one article and it matches our target article
                    if (articles.length === 1) {
                        const articleInCollection = articles[0];
                        const articleIdInCollection = parseInt(articleInCollection.id.toString());

                        if (articleIdInCollection === validId) {
                            console.log(`[CollectionAutoFill] Found single-article collection for article ${validId}: "${collection.Title}"`);
                            existingCollection = collection;
                            break;
                        }
                    }
                }

                // Cache the result
                if (existingCollection) {
                    duplicateCheckCache.set(validId, {
                        exists: true,
                        collectionId: parseInt(existingCollection.id.toString()),
                        timestamp: Date.now()
                    });
                    console.log(`[CollectionAutoFill] Article ${validId} has existing single-article collection: "${existingCollection.Title}"`);
                    return { exists: true, collection: existingCollection, fromCache: false };
                } else {
                    duplicateCheckCache.set(validId, {
                        exists: false,
                        timestamp: Date.now()
                    });
                    console.log(`[CollectionAutoFill] Article ${validId} does NOT have an existing single-article collection`);
                    return { exists: false, fromCache: false };
                }

            } catch (error) {
                console.error('[CollectionAutoFill] Error checking existing collection:', error);

                if (error instanceof ValidationError) {
                    throw error;
                }

                // Don't throw on duplicate check errors, just log and continue
                return { exists: false, fromCache: false };
            }
        },

        /**
         * Quick collection creation with comprehensive error handling
         */
        async createQuickCollectionFromArticle(articleId: number): Promise<CollectionResult> {
            const startTime = Date.now();

            try {
                const validId = validateArticleId(articleId);
                console.log(`[CollectionAutoFill] Starting quick collection creation for article ${validId}`);

                // Check for existing single-article collection with caching
                const duplicateCheck = await this.checkExistingCollection(validId);

                if (duplicateCheck.exists && duplicateCheck.collection) {
                    console.log(`[CollectionAutoFill] Collection already exists for article ${validId}`);

                    const processingTime = Date.now() - startTime;
                    const collectionDocumentId = duplicateCheck.collection.documentId || duplicateCheck.collection.id;

                    return {
                        collection: duplicateCheck.collection,
                        isExisting: true,
                        article: await this.getArticleData(validId) as ArticleData,
                        message: `Collection "${duplicateCheck.collection.Title}" already exists for this article`,
                        redirectUrl: `/admin/content-manager/collection-types/api::collection.collection/${collectionDocumentId}`,
                        metadata: {
                            processingTime,
                            cacheHit: duplicateCheck.fromCache,
                            duplicateCheck: true
                        }
                    };
                }

                // Get article data
                const article = await this.getArticleData(validId);
                if (!article) {
                    throw new NotFoundError(`Article with ID ${validId} not found`);
                }

                // Prepare collection data with defaults - Handle custom fields properly
                const collectionData: any = {
                    Title: article.Title || `Collection - Article ${validId}`,
                    Date: article.Date || new Date().toISOString().split('T')[0],
                    articles: [validId], // Pre-link the article
                    publishedAt: null // Start as draft
                };

                // Only add Cover if it exists and has a valid ID
                if (article.Cover?.id) {
                    collectionData.Cover = article.Cover.id;
                } else if (article.Cover && typeof article.Cover === 'number') {
                    collectionData.Cover = article.Cover;
                }

                // Only add Category if it exists and is a valid number (custom field value)
                if (article.Category && typeof article.Category === 'number') {
                    collectionData.Category = article.Category;
                }

                console.log(`[CollectionAutoFill] Creating collection with data:`, {
                    title: collectionData.Title,
                    hasDate: !!collectionData.Date,
                    hasCover: !!collectionData.Cover,
                    hasCategory: !!collectionData.Category,
                    linkedArticles: collectionData.articles.length
                });

                // Use Document Service API
                // Create new collection with transaction-like error handling
                let collection;
                try {
                    collection = await strapi.documents('api::collection.collection').create({
                        data: collectionData
                    });
                } catch (createError) {
                    console.error('[CollectionAutoFill] Error creating collection:', createError);

                    // Handle specific database errors
                    if (createError instanceof Error) {
                        if (createError.message.includes('duplicate') || createError.message.includes('unique')) {
                            throw new ValidationError('A collection with this title already exists');
                        }
                        if (createError.message.includes('foreign key') || createError.message.includes('reference')) {
                            throw new ValidationError('Invalid reference to article, category, or cover image');
                        }
                    }

                    throw new ApplicationError(`Failed to create collection: ${createError instanceof Error ? createError.message : 'Unknown database error'}`);
                }

                // Invalidate cache for this article
                duplicateCheckCache.delete(validId);

                const processingTime = Date.now() - startTime;
                const collectionDocumentId = collection.documentId || collection.id;

                console.log(`[CollectionAutoFill] Collection created successfully with ID: ${collection.id} (${processingTime}ms)`);

                return {
                    collection,
                    isExisting: false,
                    article,
                    message: `Collection "${collection.Title}" created successfully`,
                    redirectUrl: `/admin/content-manager/collection-types/api::collection.collection/${collectionDocumentId}`,
                    metadata: {
                        processingTime,
                        cacheHit: duplicateCheck.fromCache,
                        duplicateCheck: true
                    }
                };

            } catch (error) {
                const processingTime = Date.now() - startTime;
                console.error(`[CollectionAutoFill] Error creating quick collection (${processingTime}ms):`, error);

                // Re-throw known errors
                if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ApplicationError) {
                    throw error;
                }

                // Handle unexpected errors
                throw new ApplicationError(
                    `Failed to create quick collection: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Health check method for monitoring
         */
        async healthCheck(): Promise<{ status: string; details: any }> {
            try {
                // Use Document Service API
                // Test database connectivity
                await strapi.documents('api::article.article').findMany({
                    limit: 1
                });

                return {
                    status: 'healthy',
                    details: {
                        documentService: 'available',
                        cacheSize: duplicateCheckCache.size,
                        timestamp: new Date().toISOString()
                    }
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    details: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        documentService: 'unavailable',
                        timestamp: new Date().toISOString()
                    }
                };
            }
        },

        /**
         * Cache management methods
         */
        clearCache(): void {
            duplicateCheckCache.clear();
            console.log('[CollectionAutoFill] Cache cleared');
        },

        getCacheStats(): { size: number; entries: any[] } {
            cleanExpiredCache();
            return {
                size: duplicateCheckCache.size,
                entries: Array.from(duplicateCheckCache.entries()).map(([key, value]) => ({
                    articleId: key,
                    exists: value.exists,
                    collectionId: value.collectionId,
                    age: Date.now() - value.timestamp
                }))
            };
        }
    };
};