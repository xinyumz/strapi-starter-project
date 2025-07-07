// src/plugins/collection-manager/server/controllers/cache-management-controller.ts
// Focused on cache management and force refresh operations

export default ({ strapi }: any) => ({

    // ====================================
    // CACHE MANAGEMENT ENDPOINTS
    // ====================================

    /**
     * Clear all orphan detection cache
     * DELETE /collection-manager/orphans/cache
     */
    async clearOrphanCache(ctx: any) {
        const startTime = Date.now();

        try {
            console.log('[CacheManagementController] Clearing orphan detection cache');

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

            if (!orphanDetectionService || typeof orphanDetectionService.clearOrphanCache !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Cache clearing service not available',
                        code: 'CACHE_CLEAR_UNAVAILABLE'
                    }
                };
                return;
            }

            // Get cache stats before clearing
            const cacheBefore = orphanDetectionService.getOrphanCacheStats();

            // Clear the cache
            orphanDetectionService.clearOrphanCache();

            // Get cache stats after clearing (should be empty)
            const cacheAfter = orphanDetectionService.getOrphanCacheStats();

            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    message: 'Orphan detection cache cleared successfully',
                    before: {
                        size: cacheBefore.size,
                        entries: cacheBefore.entries.length
                    },
                    after: {
                        size: cacheAfter.size,
                        entries: cacheAfter.entries.length
                    },
                    cleared: {
                        entries: cacheBefore.size,
                        statsCache: cacheBefore.statsCache.hasData
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    operation: 'cache_clear_all'
                }
            };

            console.log(`[CacheManagementController] Cache cleared in ${processingTime}ms: ${cacheBefore.size} entries removed`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CacheManagementController] Error clearing cache (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to clear orphan cache',
                    code: 'CACHE_CLEAR_FAILED',
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
     * Clear cache for a specific collection
     * DELETE /collection-manager/orphans/cache/:id
     */
    async clearCollectionCache(ctx: any) {
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

            console.log('[CacheManagementController] Clearing cache for collection:', collectionId);

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

            if (!orphanDetectionService || typeof orphanDetectionService.clearCollectionCache !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Collection cache clearing service not available',
                        code: 'COLLECTION_CACHE_CLEAR_UNAVAILABLE'
                    }
                };
                return;
            }

            // Get cache stats before clearing
            const cacheBefore = orphanDetectionService.getOrphanCacheStats();
            const hadEntry = cacheBefore.entries.some(entry => entry.collectionId === collectionId);

            // Clear the specific collection cache
            orphanDetectionService.clearCollectionCache(collectionId);

            // Get cache stats after clearing
            const cacheAfter = orphanDetectionService.getOrphanCacheStats();

            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    message: `Cache cleared for collection ${collectionId}`,
                    collectionId,
                    hadCacheEntry: hadEntry,
                    cacheSize: {
                        before: cacheBefore.size,
                        after: cacheAfter.size
                    },
                    statsCache: {
                        alsoCleared: true // Stats cache is also cleared when individual collections are cleared
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    operation: 'cache_clear_collection'
                }
            };

            console.log(`[CacheManagementController] Collection ${collectionId} cache cleared in ${processingTime}ms${hadEntry ? ' (entry existed)' : ' (no entry)'}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CacheManagementController] Error clearing collection cache (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to clear collection cache',
                    code: 'COLLECTION_CACHE_CLEAR_FAILED',
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
     * Get cache statistics and information
     * GET /collection-manager/orphans/cache-stats
     */
    async getCacheStats(ctx: any) {
        const startTime = Date.now();

        try {
            console.log('[CacheManagementController] Getting cache statistics');

            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

            if (!orphanDetectionService || typeof orphanDetectionService.getOrphanCacheStats !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Cache stats service not available',
                        code: 'CACHE_STATS_UNAVAILABLE'
                    }
                };
                return;
            }

            const cacheStats = orphanDetectionService.getOrphanCacheStats();
            const processingTime = Date.now() - startTime;

            // Calculate additional metrics
            const now = Date.now();
            const expiredEntries = cacheStats.entries.filter(entry => entry.expiresIn <= 0);
            const validEntries = cacheStats.entries.filter(entry => entry.expiresIn > 0);

            // Group by orphan type
            const byOrphanType = validEntries.reduce((acc, entry) => {
                acc[entry.orphanType] = (acc[entry.orphanType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // Group by severity
            const bySeverity = validEntries.reduce((acc, entry) => {
                acc[entry.severity] = (acc[entry.severity] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            ctx.body = {
                success: true,
                data: {
                    cache: {
                        totalEntries: cacheStats.size,
                        validEntries: validEntries.length,
                        expiredEntries: expiredEntries.length,
                        breakdown: {
                            byOrphanType,
                            bySeverity
                        }
                    },
                    statsCache: cacheStats.statsCache,
                    entries: validEntries.map(entry => ({
                        collectionId: entry.collectionId,
                        orphanType: entry.orphanType,
                        severity: entry.severity,
                        ageMs: entry.age,
                        expiresInMs: entry.expiresIn,
                        isExpired: entry.expiresIn <= 0
                    })),
                    performance: {
                        cacheEfficiency: validEntries.length > 0 ? `${Math.round((validEntries.length / cacheStats.size) * 100)}%` : '0%',
                        averageAge: validEntries.length > 0 ? Math.round(validEntries.reduce((sum, entry) => sum + entry.age, 0) / validEntries.length) : 0,
                        oldestEntry: validEntries.length > 0 ? Math.max(...validEntries.map(entry => entry.age)) : 0
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    cacheConfig: {
                        ttlMs: 30000, // 30 seconds
                        statsttlMs: 30000
                    }
                }
            };

            console.log(`[CacheManagementController] Cache stats retrieved in ${processingTime}ms: ${cacheStats.size} entries`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CacheManagementController] Error getting cache stats (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get cache statistics',
                    code: 'CACHE_STATS_FAILED',
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
    // FORCE REFRESH ENDPOINTS (CACHE BYPASS)
    // ====================================

    /**
     * Force refresh orphan detection (bypass cache)
     * GET /collection-manager/orphans/detect/force
     */
    async forceDetectOrphans(ctx: any) {
        const startTime = Date.now();

        try {
            console.log('[CacheManagementController] Force detecting orphans (bypassing cache)');

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

            // Force bypass cache for fresh detection
            const orphanResults = await orphanDetectionService.detectOrphanedCollections(true);
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
                    cacheUtilization: 'Bypassed',
                    forced: true
                }
            };

            console.log(`[CacheManagementController] Force detection completed in ${processingTime}ms: ${orphanedOnly.length}/${orphanResults.length} orphaned`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CacheManagementController] Error in force orphan detection (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to force detect orphaned collections',
                    code: 'FORCE_ORPHAN_DETECTION_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    forced: true
                }
            };
        }
    },

    /**
     * Force refresh orphan statistics (bypass cache)
     * GET /collection-manager/orphans/stats/force
     */
    async forceGetOrphanStats(ctx: any) {
        const startTime = Date.now();

        try {
            console.log('[CacheManagementController] Force getting orphan statistics (bypassing cache)');

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

            // Force bypass cache for fresh stats
            const stats = await orphanDetectionService.getOrphanDetectionStats(true);
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
                    dataFreshness: 'Fresh (cache bypassed)',
                    forced: true
                }
            };

            console.log(`[CacheManagementController] Force stats retrieved in ${processingTime}ms: ${stats.orphanedCollections}/${stats.totalCollections} orphaned`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CacheManagementController] Error getting force orphan stats (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to force get orphan statistics',
                    code: 'FORCE_ORPHAN_STATS_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    forced: true
                }
            };
        }
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