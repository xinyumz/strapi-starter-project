// src/plugins/collection-manager/server/controllers/collection-health-controller.ts
// Combined health controller for unified orphan + duplicate health monitoring

export default ({ strapi }: any) => ({

    // ====================================
    // COMBINED HEALTH ENDPOINTS
    // ====================================

    /**
     * Get combined health overview (orphans + duplicates)
     * GET /collection-manager/health/overview
     * Supports ?bypass=true query parameter for cache bypass
     */
    async getCombinedHealthOverview(ctx: any) {
        const startTime = Date.now();

        try {
            // Check for cache bypass query parameter
            const bypassCache = ctx.query.bypass === 'true' || ctx.query.t;

            console.log(`[CollectionHealthController] Getting combined health overview${bypassCache ? ' (bypassing cache)' : ''}`);

            const collectionHealthService = strapi.plugin('collection-manager').service('collectionHealth');

            if (!collectionHealthService || typeof collectionHealthService.getCombinedHealthOverview !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Collection health service not available',
                        code: 'COLLECTION_HEALTH_UNAVAILABLE'
                    }
                };
                return;
            }

            // Get combined health overview with cache bypass if requested
            const healthOverview = await collectionHealthService.getCombinedHealthOverview(bypassCache);
            const processingTime = Date.now() - startTime;

            // Calculate performance insights
            const performanceInsights = {
                processingSpeed: processingTime < 100 ? 'Excellent' : processingTime < 500 ? 'Good' : 'Needs optimization',
                cacheEfficiency: healthOverview.overallHealth.cacheStats.combinedHitRate,
                dataFreshness: bypassCache ? 'Real-time' : 'Cached (up to 2 minutes old)',
                systemLoad: calculateSystemLoad(healthOverview.overallHealth)
            };

            ctx.body = {
                success: true,
                data: {
                    healthOverview,
                    performanceInsights,
                    actionableItems: generateActionableItems(healthOverview),
                    systemStatus: getSystemStatusSummary(healthOverview.overallHealth)
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    cacheUtilization: bypassCache ? 'Bypassed for fresh data' : 'Cache utilized',
                    queryParams: ctx.query
                }
            };

            console.log(`[CollectionHealthController] Health overview completed in ${processingTime}ms: ${healthOverview.overallHealth.healthScore}% health score${bypassCache ? ' (cache bypassed)' : ''}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CollectionHealthController] Error getting health overview (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get collection health overview',
                    code: 'HEALTH_OVERVIEW_FAILED',
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
     * Force health overview bypassing cache
     * GET /collection-manager/health/overview/force
     */
    async forceGetHealthOverview(ctx: any) {
        // Set bypass flag and delegate to main health method
        ctx.query.bypass = 'true';
        console.log('[CollectionHealthController] Force health overview requested');
        return this.getCombinedHealthOverview(ctx);
    },

    /**
     * Get health metrics summary (lightweight endpoint for widgets)
     * GET /collection-manager/health/metrics
     */
    async getHealthMetrics(ctx: any) {
        const startTime = Date.now();

        try {
            const bypassCache = ctx.query.bypass === 'true' || ctx.query.t;

            const collectionHealthService = strapi.plugin('collection-manager').service('collectionHealth');
            const healthOverview = await collectionHealthService.getCombinedHealthOverview(bypassCache);
            const processingTime = Date.now() - startTime;

            // Extract just the key metrics for dashboard widgets
            const metrics = {
                healthScore: healthOverview.overallHealth.healthScore,
                totalCollections: healthOverview.overallHealth.totalCollections,
                orphanedCollections: healthOverview.overallHealth.orphanedCollections,
                duplicateCollections: healthOverview.overallHealth.duplicateCollections,
                healthyCollections: healthOverview.overallHealth.healthyCollections,
                totalIssues: healthOverview.issues.totalIssues,
                criticalIssues: healthOverview.issues.criticalIssues,
                systemStatus: getSystemStatusLevel(healthOverview.overallHealth.healthScore),
                lastAnalysis: healthOverview.overallHealth.lastAnalysis
            };

            ctx.body = {
                success: true,
                data: metrics,
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    optimizedForWidgets: true
                }
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[CollectionHealthController] Error getting health metrics (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get health metrics',
                    code: 'HEALTH_METRICS_FAILED'
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Clear all health-related caches
     * DELETE /collection-manager/health/cache
     */
    async clearHealthCache(ctx: any) {
        try {
            console.log('[CollectionHealthController] Clearing all health-related caches');

            // Get all health-related services
            const collectionHealthService = strapi.plugin('collection-manager').service('collectionHealth');
            const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');
            const duplicateDetectionService = strapi.plugin('collection-manager').service('duplicateDetection');

            let clearedCaches = [];

            // Clear all caches
            if (collectionHealthService && typeof collectionHealthService.clearHealthCache === 'function') {
                collectionHealthService.clearHealthCache();
                clearedCaches.push('health');
            }

            if (orphanDetectionService && typeof orphanDetectionService.clearOrphanCache === 'function') {
                orphanDetectionService.clearOrphanCache();
                clearedCaches.push('orphan');
            }

            if (duplicateDetectionService && typeof duplicateDetectionService.clearDuplicateCache === 'function') {
                duplicateDetectionService.clearDuplicateCache();
                clearedCaches.push('duplicate');
            }

            ctx.body = {
                success: true,
                data: {
                    clearedCaches,
                    message: `Successfully cleared ${clearedCaches.length} cache(s)`,
                    nextRefresh: 'Immediate - caches will be rebuilt on next request'
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    operation: 'cache_clear_all'
                }
            };

            console.log(`[CollectionHealthController] Cleared caches: ${clearedCaches.join(', ')}`);

        } catch (error) {
            console.error('[CollectionHealthController] Error clearing health cache:', error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to clear health cache',
                    code: 'HEALTH_CACHE_CLEAR_FAILED'
                }
            };
        }
    }
});

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Calculate system load based on health statistics
 */
function calculateSystemLoad(healthStats: any): string {
    const totalIssues = (healthStats.orphanedCollections || 0) + (healthStats.duplicateCollections || 0);
    const totalCollections = healthStats.totalCollections || 1;
    const issuePercentage = (totalIssues / totalCollections) * 100;

    if (issuePercentage >= 30) return 'High - System needs immediate attention';
    if (issuePercentage >= 15) return 'Medium - Some maintenance required';
    if (issuePercentage >= 5) return 'Low - Minor cleanup needed';
    return 'Minimal - System is well maintained';
}

/**
 * Generate actionable items based on health overview
 */
function generateActionableItems(healthOverview: any): Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
    estimatedTime: string;
}> {
    const items = [];
    const health = healthOverview.overallHealth;
    const issues = healthOverview.issues;

    // High priority items
    if (issues.criticalIssues > 0) {
        items.push({
            priority: 'high' as const,
            action: `Address ${issues.criticalIssues} critical collection issue(s)`,
            impact: 'Immediate system health improvement',
            estimatedTime: '10-30 minutes'
        });
    }

    if (health.orphanedCollections > 0) {
        items.push({
            priority: health.orphanedCollections >= 5 ? 'high' as const : 'medium' as const,
            action: `Clean up ${health.orphanedCollections} orphaned collection(s)`,
            impact: 'Reduce storage waste and improve organization',
            estimatedTime: `${health.orphanedCollections * 2}-${health.orphanedCollections * 5} minutes`
        });
    }

    // Medium priority items
    if (health.duplicateCollections > 0) {
        items.push({
            priority: health.duplicateCollections >= 8 ? 'high' as const : 'medium' as const,
            action: `Consolidate ${health.duplicateCollections} duplicate collection(s)`,
            impact: 'Improve content organization and reduce confusion',
            estimatedTime: `${health.duplicateCollections * 3}-${health.duplicateCollections * 8} minutes`
        });
    }

    // Low priority items
    if (health.singleArticleCollections > 10) {
        items.push({
            priority: 'low' as const,
            action: `Review ${health.singleArticleCollections} single-article collections for consolidation`,
            impact: 'Optimize content structure',
            estimatedTime: '15-30 minutes'
        });
    }

    if (items.length === 0) {
        items.push({
            priority: 'low' as const,
            action: 'Monitor system health and maintain current standards',
            impact: 'Maintain excellent system health',
            estimatedTime: '5 minutes weekly'
        });
    }

    return items;
}

/**
 * Get system status summary
 */
function getSystemStatusSummary(healthStats: any): {
    status: 'excellent' | 'good' | 'needs_attention' | 'critical';
    message: string;
    color: string;
} {
    const healthScore = healthStats.healthScore;

    if (healthScore >= 95) {
        return {
            status: 'excellent',
            message: 'System is in excellent condition',
            color: 'success'
        };
    } else if (healthScore >= 80) {
        return {
            status: 'good',
            message: 'System is in good condition with minor issues',
            color: 'primary'
        };
    } else if (healthScore >= 60) {
        return {
            status: 'needs_attention',
            message: 'System needs attention - several issues detected',
            color: 'warning'
        };
    } else {
        return {
            status: 'critical',
            message: 'System requires immediate attention',
            color: 'danger'
        };
    }
}

/**
 * Get system status level for widgets
 */
function getSystemStatusLevel(healthScore: number): string {
    if (healthScore >= 95) return 'excellent';
    if (healthScore >= 80) return 'good';
    if (healthScore >= 60) return 'fair';
    return 'poor';
}