// src/plugins/collection-manager/server/controllers/orphan-detection-controller.ts
// Focused on detection and read operations

export default ({ strapi }: any) => ({

    // ====================================
    // ORPHAN DETECTION ENDPOINTS
    // ====================================

    /**
     * Detect all orphaned collections in the system
     * GET /collection-manager/orphans/detect
     * Supports ?bypass=true query parameter for cache bypass
     */
    async detectOrphans(ctx: any) {
        const startTime = Date.now();

        try {
            // Check for cache bypass query parameter
            const bypassCache = ctx.query.bypass === 'true' || ctx.query.t;

            console.log(`[OrphanDetectionController] Starting orphan detection${bypassCache ? ' (bypassing cache)' : ''}`);

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

            if (!orphanDetectionService || typeof orphanDetectionService.detectOrphanedCollections !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Orphan detection service not available',
                        code: 'ORPHAN_DETECTION_UNAVAILABLE'
                    }
                };
                return;
            }

            // Use cache bypass if requested
            const orphanResults = await orphanDetectionService.detectOrphanedCollections(bypassCache);
            const processingTime = Date.now() - startTime;

            // Separate results by status for easier frontend consumption
            const orphanedOnly = orphanResults.filter(r => r.status.isOrphaned);
            const byType = {
                empty: orphanResults.filter(r => r.status.orphanType === 'empty'),
                brokenReferences: orphanResults.filter(r => r.status.orphanType === 'broken_references'),
                singleArticle: orphanResults.filter(r => r.status.orphanType === 'single_article'),
                healthy: orphanResults.filter(r => r.status.orphanType === 'healthy')
            };

            const bySeverity = {
                high: orphanResults.filter(r => r.status.severity === 'high'),
                medium: orphanResults.filter(r => r.status.severity === 'medium'),
                low: orphanResults.filter(r => r.status.severity === 'low')
            };

            ctx.body = {
                success: true,
                data: {
                    orphanedCollections: orphanedOnly,
                    allCollections: orphanResults,
                    summary: {
                        total: orphanResults.length,
                        orphaned: orphanedOnly.length,
                        healthy: byType.healthy.length,
                        byType: {
                            empty: byType.empty.length,
                            brokenReferences: byType.brokenReferences.length,
                            singleArticle: byType.singleArticle.length,
                            healthy: byType.healthy.length
                        },
                        bySeverity: {
                            high: bySeverity.high.length,
                            medium: bySeverity.medium.length,
                            low: bySeverity.low.length
                        }
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    cacheUtilization: bypassCache ? 'Bypassed' : 'Available',
                    queryParams: ctx.query
                }
            };

            console.log(`[OrphanDetectionController] Detection completed in ${processingTime}ms: ${orphanedOnly.length}/${orphanResults.length} orphaned${bypassCache ? ' (cache bypassed)' : ''}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanDetectionController] Error in orphan detection (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to detect orphaned collections',
                    code: 'ORPHAN_DETECTION_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
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
     * Get orphan status for a specific collection
     * GET /collection-manager/orphans/status/:id
     * Supports ?bypass=true query parameter for cache bypass
     */
    async getOrphanStatus(ctx: any) {
        const startTime = Date.now();

        try {
            const { id } = ctx.params;
            const collectionId = parseInt(id);

            if (isNaN(collectionId) || collectionId <= 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Valid collection ID is required',
                        code: 'INVALID_COLLECTION_ID',
                        received: id
                    }
                };
                return;
            }

            console.log('[OrphanDetectionController] Getting status for collection:', collectionId);

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

            if (!orphanDetectionService || typeof orphanDetectionService.getCollectionOrphanStatus !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Orphan status service not available',
                        code: 'ORPHAN_STATUS_UNAVAILABLE'
                    }
                };
                return;
            }

            // Get both orphan status and detailed relationship status
            const [orphanStatus, relationshipStatus] = await Promise.all([
                orphanDetectionService.getCollectionOrphanStatus(collectionId),
                orphanDetectionService.getCollectionRelationshipStatus(collectionId)
            ]);

            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    collectionId,
                    orphanStatus,
                    relationshipStatus,
                    collection: {
                        id: relationshipStatus.collection.id,
                        documentId: relationshipStatus.collection.documentId,
                        title: relationshipStatus.collection.Title,
                        url: `/admin/content-manager/collection-types/api::collection.collection/${relationshipStatus.collection.documentId || relationshipStatus.collection.id}`
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    cacheHit: processingTime < 50 // Simple heuristic for cache hit
                }
            };

            console.log(`[OrphanDetectionController] Status retrieved for collection ${collectionId} in ${processingTime}ms`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanDetectionController] Error getting orphan status (${processingTime}ms):`, error);

            if (error instanceof Error && error.message.includes('not found')) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_FOUND',
                        message: 'Collection not found',
                        code: 'COLLECTION_NOT_FOUND'
                    }
                };
                return;
            }

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get orphan status',
                    code: 'ORPHAN_STATUS_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
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
     * Get orphan detection statistics
     * GET /collection-manager/orphans/stats
     * Supports ?bypass=true query parameter for cache bypass
     */
    async getOrphanStats(ctx: any) {
        const startTime = Date.now();

        try {
            // Check for cache bypass query parameter
            const bypassCache = ctx.query.bypass === 'true' || ctx.query.t;

            console.log(`[OrphanDetectionController] Getting orphan detection statistics${bypassCache ? ' (bypassing cache)' : ''}`);

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

            if (!orphanDetectionService || typeof orphanDetectionService.getOrphanDetectionStats !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Orphan statistics service not available',
                        code: 'ORPHAN_STATS_UNAVAILABLE'
                    }
                };
                return;
            }

            // Use cache bypass if requested
            const stats = await orphanDetectionService.getOrphanDetectionStats(bypassCache);
            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    statistics: stats,
                    healthScore: stats.totalCollections > 0
                        ? Math.round(((stats.totalCollections - stats.orphanedCollections) / stats.totalCollections) * 100)
                        : 100,
                    recommendations: generateStatsRecommendations(stats)
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    dataFreshness: bypassCache ? 'Fresh (cache bypassed)' : 'Cached',
                    queryParams: ctx.query
                }
            };

            console.log(`[OrphanDetectionController] Stats retrieved in ${processingTime}ms: ${stats.orphanedCollections}/${stats.totalCollections} orphaned${bypassCache ? ' (cache bypassed)' : ''}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanDetectionController] Error getting orphan stats (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get orphan statistics',
                    code: 'ORPHAN_STATS_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    // ====================================
    // BATCH ANALYSIS ENDPOINTS
    // ====================================

    /**
     * Batch analyze multiple collections
     * POST /collection-manager/batch/analyze-collections
     */
    async batchAnalyzeCollections(ctx: any) {
        const startTime = Date.now();

        try {
            const { collectionIds = [], includeHealthy = false } = ctx.request.body || {};

            if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Array of collection IDs is required',
                        code: 'MISSING_COLLECTION_IDS'
                    }
                };
                return;
            }

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');
            const results = [];

            for (const collectionId of collectionIds) {
                try {
                    const status = await orphanDetectionService.getCollectionOrphanStatus(collectionId);

                    // Only include if orphaned or if specifically requested to include healthy
                    if (status.isOrphaned || includeHealthy) {
                        results.push({
                            collectionId,
                            status,
                            success: true
                        });
                    }
                } catch (error) {
                    results.push({
                        collectionId,
                        status: null,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    results,
                    summary: {
                        totalAnalyzed: collectionIds.length,
                        orphanedFound: results.filter(r => r.status?.isOrphaned).length,
                        healthyFound: results.filter(r => r.status && !r.status.isOrphaned).length,
                        failedAnalysis: results.filter(r => !r.success).length
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanDetectionController] Error in batch analysis (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to perform batch analysis',
                    code: 'BATCH_ANALYSIS_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    // ====================================
    // FORCE REFRESH ENDPOINTS
    // ====================================

    /**
     * Force orphan detection bypassing cache
     * GET /collection-manager/orphans/detect/force
     */
    async forceDetectOrphans(ctx: any) {
        // Set bypass flag and delegate to main detection method
        ctx.query.bypass = 'true';
        console.log('[OrphanDetectionController] Force orphan detection requested');
        return this.detectOrphans(ctx);
    },

    /**
     * Force orphan statistics bypassing cache
     * GET /collection-manager/orphans/stats/force
     */
    async forceGetOrphanStats(ctx: any) {
        // Set bypass flag and delegate to main stats method
        ctx.query.bypass = 'true';
        console.log('[OrphanDetectionController] Force orphan stats requested');
        return this.getOrphanStats(ctx);
    }
});

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Helper function to generate recommendations based on stats
 */
function generateStatsRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.orphanedCollections === 0) {
        recommendations.push('✅ All collections are healthy - no orphaned collections found');
    } else {
        if (stats.emptyCollections > 0) {
            recommendations.push(`🗑️ Consider deleting ${stats.emptyCollections} empty collection(s)`);
        }

        if (stats.brokenReferenceCollections > 0) {
            recommendations.push(`🔧 Repair ${stats.brokenReferenceCollections} collection(s) with broken references`);
        }

        if (stats.singleArticleCollections > 5) {
            recommendations.push(`📚 Consider consolidating ${stats.singleArticleCollections} single-article collections`);
        }

        if (stats.severityBreakdown.high > 0) {
            recommendations.push(`🚨 Priority: Address ${stats.severityBreakdown.high} high-severity orphaned collection(s)`);
        }
    }

    if (stats.totalCollections > 100) {
        recommendations.push('📊 Large collection count - consider implementing automated maintenance schedules');
    }

    return recommendations.length > 0 ? recommendations : ['✅ No specific recommendations at this time'];
}