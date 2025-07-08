// src/plugins/revalidate/server/controllers/revalidate-controller.ts

export default ({ strapi }: any) => ({

    /**
     * Trigger revalidation for a specific path
     * POST /revalidate/trigger
     */
    async triggerRevalidation(ctx: any) {
        const startTime = Date.now();

        try {
            const { path } = ctx.request.body;

            console.log(`[Revalidate Controller] Triggering revalidation for path: ${path}`);

            // Get the revalidate service
            const revalidateService = strapi.plugin('revalidate').service('revalidateService');

            if (!revalidateService) {
                ctx.status = 500;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'SERVICE_UNAVAILABLE',
                        message: 'Revalidate service not available',
                        code: 'SERVICE_NOT_FOUND'
                    }
                };
                return;
            }

            // Use service to perform revalidation
            const result = await revalidateService.performRevalidation(path);
            const totalProcessingTime = Date.now() - startTime;

            if (result.success) {
                console.log(`[Revalidate Controller] ✅ Success in ${totalProcessingTime}ms`);

                ctx.body = {
                    success: true,
                    data: {
                        path: path?.trim(),
                        status: result.status,
                        statusText: result.statusText,
                        message: `Successfully revalidated: ${path?.trim()}`,
                        responseText: result.responseText || null,
                        processingTime: result.processingTime
                    },
                    metadata: {
                        totalProcessingTime,
                        timestamp: new Date().toISOString(),
                        serviceUsed: 'revalidateService'
                    }
                };
            } else {
                console.error(`[Revalidate Controller] ❌ Failed: ${result.error}`);

                ctx.status = result.status ? (result.status >= 400 ? result.status : 500) : 500;
                ctx.body = {
                    success: false,
                    error: {
                        type: result.status ? 'REVALIDATION_FAILED' : 'VALIDATION_ERROR',
                        message: result.error || 'Revalidation failed',
                        code: result.status ? 'EXTERNAL_API_ERROR' : 'INVALID_REQUEST',
                        details: {
                            httpStatus: result.status,
                            httpStatusText: result.statusText,
                            path: path?.trim(),
                            responseText: result.responseText
                        }
                    },
                    metadata: {
                        totalProcessingTime,
                        serviceProcessingTime: result.processingTime,
                        timestamp: new Date().toISOString()
                    }
                };
            }

        } catch (error) {
            const totalProcessingTime = Date.now() - startTime;
            console.error(`[Revalidate Controller] ❌ Controller error (${totalProcessingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Internal server error occurred',
                    code: 'CONTROLLER_ERROR',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    totalProcessingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Get revalidation service health
     * GET /revalidate/health
     */
    async health(ctx: any) {
        try {
            const revalidateService = strapi.plugin('revalidate').service('revalidateService');

            if (!revalidateService) {
                ctx.status = 503;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'SERVICE_UNAVAILABLE',
                        message: 'Revalidate service not available'
                    }
                };
                return;
            }

            const serviceHealth = await revalidateService.getServiceHealth();

            ctx.body = {
                success: true,
                data: {
                    plugin: 'revalidate',
                    version: '1.0.0',
                    ...serviceHealth
                }
            };

        } catch (error) {
            console.error('[Revalidate Controller] Health check error:', error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'HEALTH_CHECK_FAILED',
                    message: 'Health check failed'
                }
            };
        }
    },

    /**
     * Get revalidation history (placeholder for future implementation)
     * GET /revalidate/history
     */
    async getRevalidationHistory(ctx: any) {
        ctx.body = {
            success: true,
            data: {
                history: [],
                message: 'Revalidation history feature coming soon',
                note: 'This endpoint will track revalidation requests in a future version'
            }
        };
    }
});