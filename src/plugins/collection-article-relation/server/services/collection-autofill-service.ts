// src/plugins/collection-article-relation/server/services/collection-autofill-service.ts

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError, ValidationError, NotFoundError } = errors;

interface ArticleData {
    id: number;
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
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

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
                const entityService = getEntityService();

                console.log(`[CollectionAutoFill] Fetching article data for ID: ${validId}`);

                const article = await entityService.findOne('api::article.article', validId, {
                    populate: {
                        Cover: {
                            fields: ['id', 'name', 'url', 'mime', 'size']
                        },
                        Category: {
                            fields: ['id', 'name', 'slug']
                        }
                    }
                });

                if (!article) {
                    console.warn(`[CollectionAutoFill] Article ${validId} not found`);
                    throw new NotFoundError(`Article with ID ${validId} not found`);
                }

                const articleData: ArticleData = {
                    id: parseInt(article.id.toString()),
                    Title: (article as any).Title || null,
                    Date: (article as any).Date || null,
                    Cover: (article as any).Cover || null,
                    Category: (article as any).Category || null,
                    createdAt: (article as any).createdAt,
                    updatedAt: (article as any).updatedAt
                };

                console.log(`[CollectionAutoFill] Article data retrieved:`, {
                    id: articleData.id,
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
         * Duplicate check with caching
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
                            const entityService = getEntityService();
                            const collection = await entityService.findOne('api::collection.collection', cached.collectionId);
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

                const entityService = getEntityService();

                // Optimized query - only get collections with this specific article
                const collections = await entityService.findMany('api::collection.collection', {
                    filters: {
                        articles: {
                            id: {
                                $eq: validId
                            }
                        }
                    },
                    populate: {
                        articles: {
                            fields: ['id']
                        }
                    },
                    pagination: {
                        limit: 10 // Limit results for performance
                    }
                });

                // Find collection with exactly one article that matches this ID
                const existingCollection = collections.find((collection: any) => {
                    const articles = collection.articles || [];
                    return articles.length === 1 && articles[0].id === validId;
                });

                // Cache the result
                if (existingCollection) {
                    duplicateCheckCache.set(validId, {
                        exists: true,
                        collectionId: parseInt(existingCollection.id.toString()),
                        timestamp: Date.now()
                    });
                    return { exists: true, collection: existingCollection, fromCache: false };
                } else {
                    duplicateCheckCache.set(validId, {
                        exists: false,
                        timestamp: Date.now()
                    });
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
                    return {
                        collection: duplicateCheck.collection,
                        isExisting: true,
                        article: await this.getArticleData(validId) as ArticleData,
                        message: `Collection "${duplicateCheck.collection.Title}" already exists for this article`,
                        redirectUrl: `/admin/content-manager/collectionType/api::collection.collection/${duplicateCheck.collection.id}`,
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

                // Prepare collection data with defaults
                const collectionData = {
                    Title: article.Title || `Collection - Article ${validId}`,
                    Date: article.Date || new Date().toISOString().split('T')[0],
                    Cover: article.Cover?.id || article.Cover || null,
                    Category: article.Category?.id || article.Category || null,
                    articles: [validId], // Pre-link the article
                    publishedAt: null // Start as draft
                };

                console.log(`[CollectionAutoFill] Creating collection with data:`, {
                    title: collectionData.Title,
                    hasDate: !!collectionData.Date,
                    hasCover: !!collectionData.Cover,
                    hasCategory: !!collectionData.Category,
                    linkedArticles: collectionData.articles.length
                });

                const entityService = getEntityService();

                // Create new collection with transaction-like error handling
                let collection;
                try {
                    collection = await entityService.create('api::collection.collection', {
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

                console.log(`[CollectionAutoFill] Collection created successfully with ID: ${collection.id} (${processingTime}ms)`);

                return {
                    collection,
                    isExisting: false,
                    article,
                    message: `Collection "${collection.Title}" created successfully`,
                    redirectUrl: `/admin/content-manager/collectionType/api::collection.collection/${collection.id}`,
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
                const entityService = getEntityService();

                // Test database connectivity
                await entityService.findMany('api::article.article', {
                    start: 0,
                    limit: 1
                });

                return {
                    status: 'healthy',
                    details: {
                        entityService: 'available',
                        cacheSize: duplicateCheckCache.size,
                        timestamp: new Date().toISOString()
                    }
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    details: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        entityService: 'unavailable',
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