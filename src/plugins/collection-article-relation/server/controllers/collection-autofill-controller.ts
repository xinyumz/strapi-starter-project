// src/plugins/collection-article-relation/server/controllers/collection-autofill-controller.ts

import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Create quick collection from single article
     * POST /collection-article-relation/quick-create
     * Body: { articleId: number }
     */
    async quickCreateCollection(ctx: any) {
        const startTime = Date.now();

        try {
            const { articleId } = ctx.request.body;

            // Input validation
            if (articleId === undefined || articleId === null) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Article ID is required',
                        code: 'MISSING_ARTICLE_ID'
                    }
                };
                return;
            }

            const parsedId = parseInt(articleId?.toString());
            if (isNaN(parsedId) || parsedId <= 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Article ID must be a positive integer',
                        code: 'INVALID_ARTICLE_ID',
                        received: articleId
                    }
                };
                return;
            }

            console.log(`[CollectionController] Processing quick create request for article ${parsedId}`);

            // Get auto-fill service
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            if (!autoFillService) {
                throw new Error('AutoFill service is not available');
            }

            // Create or find existing collection
            const result = await autoFillService.createQuickCollectionFromArticle(parsedId);
            const processingTime = Date.now() - startTime;

            // Success response
            ctx.status = result.isExisting ? 200 : 201;
            ctx.body = {
                success: true,
                data: {
                    collection: {
                        id: result.collection.id,
                        title: result.collection.Title,
                        url: result.redirectUrl
                    },
                    article: {
                        id: result.article.id,
                        title: result.article.Title
                    },
                    isExisting: result.isExisting,
                    message: result.message,
                    redirectUrl: result.redirectUrl,
                    metadata: {
                        processingTime,
                        timestamp: new Date().toISOString(),
                        ...(result.metadata || {})
                    }
                }
            };

            console.log(`[CollectionController] Request completed successfully in ${processingTime}ms`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CollectionController] Error in quickCreateCollection (${processingTime}ms):`, error);

            // Error response based on error type
            if (error instanceof Error) {
                // Handle specific error types
                if (error.message.includes('not found') || error.message.includes('NotFoundError')) {
                    ctx.status = 404;
                    ctx.body = {
                        success: false,
                        error: {
                            type: 'NOT_FOUND',
                            message: 'Article not found',
                            code: 'ARTICLE_NOT_FOUND',
                            details: error.message
                        }
                    };
                    return;
                }

                if (error.message.includes('ValidationError') || error.message.includes('validation')) {
                    ctx.status = 400;
                    ctx.body = {
                        success: false,
                        error: {
                            type: 'VALIDATION_ERROR',
                            message: 'Invalid input data',
                            code: 'VALIDATION_FAILED',
                            details: error.message
                        }
                    };
                    return;
                }

                if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    ctx.status = 403;
                    ctx.body = {
                        success: false,
                        error: {
                            type: 'PERMISSION_ERROR',
                            message: 'Insufficient permissions to create collection',
                            code: 'PERMISSION_DENIED'
                        }
                    };
                    return;
                }

                if (error.message.includes('duplicate') || error.message.includes('unique')) {
                    ctx.status = 409;
                    ctx.body = {
                        success: false,
                        error: {
                            type: 'CONFLICT',
                            message: 'Collection with this title already exists',
                            code: 'DUPLICATE_COLLECTION'
                        }
                    };
                    return;
                }
            }

            // Generic server error
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Internal server error occurred',
                    code: 'COLLECTION_CREATION_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : undefined
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Health check endpoint with detailed status
     * GET /collection-article-relation/health
     */
    async health(ctx: any) {
        try {
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            let serviceHealth = { status: 'unknown', details: {} };
            if (autoFillService && typeof autoFillService.healthCheck === 'function') {
                serviceHealth = await autoFillService.healthCheck();
            }

            const cacheStats = autoFillService && typeof autoFillService.getCacheStats === 'function'
                ? autoFillService.getCacheStats()
                : { size: 0, entries: [] };

            ctx.body = {
                success: true,
                plugin: {
                    name: 'collection-article-relation',
                    version: '2.0.0',
                    status: 'healthy'
                },
                services: {
                    autoFill: serviceHealth
                },
                cache: {
                    duplicateCheck: {
                        size: cacheStats.size,
                        maxAge: '5 minutes'
                    }
                },
                endpoints: {
                    quickCreate: '/collection-article-relation/quick-create',
                    health: '/collection-article-relation/health',
                    cacheStats: '/collection-article-relation/cache/stats'
                },
                capabilities: [
                    'single-article-collection-creation',
                    'duplicate-prevention',
                    'auto-field-filling',
                    'enhanced-error-handling'
                ],
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };

        } catch (error) {
            console.error('[CollectionController] Health check failed:', error);

            ctx.status = 503;
            ctx.body = {
                success: false,
                plugin: {
                    name: 'collection-article-relation',
                    version: '2.0.0',
                    status: 'unhealthy'
                },
                error: {
                    type: 'SERVICE_UNAVAILABLE',
                    message: 'Plugin health check failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                },
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Cache statistics endpoint for monitoring and debugging
     * GET /collection-article-relation/cache/stats
     */
    async cacheStats(ctx: any) {
        try {
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            if (!autoFillService || typeof autoFillService.getCacheStats !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Cache statistics not available',
                        code: 'CACHE_STATS_UNAVAILABLE'
                    }
                };
                return;
            }

            const stats = autoFillService.getCacheStats();

            ctx.body = {
                success: true,
                cache: {
                    duplicateCheck: {
                        size: stats.size,
                        maxSize: 1000, // Theoretical max
                        ttl: '5 minutes',
                        entries: stats.entries.map(entry => ({
                            articleId: entry.articleId,
                            exists: entry.exists,
                            collectionId: entry.collectionId,
                            ageMs: entry.age,
                            ageFormatted: `${Math.round(entry.age / 1000)}s`
                        }))
                    }
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    totalCacheHits: 'Not tracked', // Could implement counter
                    totalCacheMisses: 'Not tracked'
                }
            };

        } catch (error) {
            console.error('[CollectionController] Cache stats failed:', error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to retrieve cache statistics',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    },

    /**
     * Clear cache endpoint for maintenance
     * POST /collection-article-relation/cache/clear
     */
    async clearCache(ctx: any) {
        try {
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            if (!autoFillService || typeof autoFillService.clearCache !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Cache clearing not available',
                        code: 'CACHE_CLEAR_UNAVAILABLE'
                    }
                };
                return;
            }

            autoFillService.clearCache();

            ctx.body = {
                success: true,
                message: 'Cache cleared successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    clearedBy: ctx.state.user?.id || 'system'
                }
            };

        } catch (error) {
            console.error('[CollectionController] Cache clear failed:', error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to clear cache',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
});