// src/plugins/collection-manager/server/controllers/duplicate-detection-controller.ts
// Focused on duplicate detection and read operations

export default ({ strapi }: any) => ({

    // ====================================
    // DUPLICATE DETECTION ENDPOINTS
    // ====================================

    /**
     * Detect all duplicate collections in the system
     * GET /collection-manager/duplicates/detect
     * Supports ?bypass=true query parameter for cache bypass
     */
    async detectDuplicates(ctx: any) {
        const startTime = Date.now();

        try {
            // Check for cache bypass query parameter
            const bypassCache = ctx.query.bypass === 'true' || ctx.query.t;

            console.log(`[DuplicateDetectionController] Starting duplicate detection${bypassCache ? ' (bypassing cache)' : ''}`);

            const duplicateDetectionService = strapi.plugin('collection-manager').service('duplicateDetection');

            if (!duplicateDetectionService || typeof duplicateDetectionService.detectDuplicateCollections !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Duplicate detection service not available',
                        code: 'DUPLICATE_DETECTION_UNAVAILABLE'
                    }
                };
                return;
            }

            // Use cache bypass if requested
            const duplicateResult = await duplicateDetectionService.detectDuplicateCollections(bypassCache);
            const processingTime = Date.now() - startTime;

            // Separate results for easier frontend consumption
            const duplicateGroupsOnly = duplicateResult.duplicateGroups;
            const bySeverity = {
                high: duplicateGroupsOnly.filter(g => g.severity === 'high'),
                medium: duplicateGroupsOnly.filter(g => g.severity === 'medium'),
                low: duplicateGroupsOnly.filter(g => g.severity === 'low')
            };

            ctx.body = {
                success: true,
                data: {
                    duplicateGroups: duplicateGroupsOnly,
                    duplicateCollections: duplicateResult.totalDuplicateCollections,
                    summary: {
                        totalCollections: duplicateResult.totalCollections,
                        duplicateGroups: duplicateResult.duplicateGroups.length,
                        duplicateCollections: duplicateResult.totalDuplicateCollections,
                        duplicatePercentage: duplicateResult.duplicatePercentage,
                        bySeverity: {
                            high: bySeverity.high.length,
                            medium: bySeverity.medium.length,
                            low: bySeverity.low.length
                        },
                        worstDuplicateGroup: duplicateResult.worstDuplicateGroup
                    },
                    recommendations: duplicateResult.recommendations
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    cacheUtilization: bypassCache ? 'Bypassed' : 'Available',
                    queryParams: ctx.query
                }
            };

            console.log(`[DuplicateDetectionController] Detection completed in ${processingTime}ms: ${duplicateResult.duplicateGroups.length} duplicate groups found${bypassCache ? ' (cache bypassed)' : ''}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[DuplicateDetectionController] Error in duplicate detection (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to detect duplicate collections',
                    code: 'DUPLICATE_DETECTION_FAILED',
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
     * Get duplicate detection statistics (optimized for dashboard widgets)
     * GET /collection-manager/duplicates/stats
     * Supports ?bypass=true query parameter for cache bypass
     */
    async getDuplicateStats(ctx: any) {
        const startTime = Date.now();

        try {
            // Check for cache bypass query parameter
            const bypassCache = ctx.query.bypass === 'true' || ctx.query.t;

            console.log(`[DuplicateDetectionController] Getting duplicate detection statistics${bypassCache ? ' (bypassing cache)' : ''}`);

            const duplicateDetectionService = strapi.plugin('collection-manager').service('duplicateDetection');

            if (!duplicateDetectionService || typeof duplicateDetectionService.getDuplicateDetectionStats !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Duplicate statistics service not available',
                        code: 'DUPLICATE_STATS_UNAVAILABLE'
                    }
                };
                return;
            }

            // Use cache bypass if requested
            const stats = await duplicateDetectionService.getDuplicateDetectionStats(bypassCache);
            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    statistics: stats,
                    duplicateImpact: calculateDuplicateImpact(stats),
                    recommendations: generateDuplicateRecommendations(stats)
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    dataFreshness: bypassCache ? 'Fresh (cache bypassed)' : 'Cached',
                    queryParams: ctx.query
                }
            };

            console.log(`[DuplicateDetectionController] Stats retrieved in ${processingTime}ms: ${stats.duplicateGroups} groups with ${stats.duplicateCollections} duplicates${bypassCache ? ' (cache bypassed)' : ''}`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[DuplicateDetectionController] Error getting duplicate stats (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get duplicate statistics',
                    code: 'DUPLICATE_STATS_FAILED',
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
     * Get detailed information about a specific duplicate group
     * GET /collection-manager/duplicates/groups/:fingerprint
     */
    async getDuplicateGroup(ctx: any) {
        const startTime = Date.now();

        try {
            const { fingerprint } = ctx.params;

            if (!fingerprint || fingerprint.trim() === '') {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Valid fingerprint is required',
                        code: 'INVALID_FINGERPRINT',
                        received: fingerprint
                    }
                };
                return;
            }

            console.log(`[DuplicateDetectionController] Getting duplicate group details for fingerprint: ${fingerprint}`);

            const duplicateDetectionService = strapi.plugin('collection-manager').service('duplicateDetection');

            if (!duplicateDetectionService || typeof duplicateDetectionService.getDuplicateGroupDetails !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Duplicate group details service not available',
                        code: 'DUPLICATE_GROUP_DETAILS_UNAVAILABLE'
                    }
                };
                return;
            }

            const duplicateGroup = await duplicateDetectionService.getDuplicateGroupDetails(fingerprint);
            const processingTime = Date.now() - startTime;

            if (!duplicateGroup) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_FOUND',
                        message: 'Duplicate group not found',
                        code: 'DUPLICATE_GROUP_NOT_FOUND',
                        fingerprint
                    },
                    metadata: {
                        processingTime,
                        timestamp: new Date().toISOString()
                    }
                };
                return;
            }

            ctx.body = {
                success: true,
                data: {
                    duplicateGroup,
                    analysisDetails: {
                        fingerprint: duplicateGroup.fingerprint,
                        impactScore: calculateGroupImpactScore(duplicateGroup),
                        consolidationEstimate: estimateConsolidationEffort(duplicateGroup)
                    }
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };

            console.log(`[DuplicateDetectionController] Group details retrieved for ${fingerprint} in ${processingTime}ms`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[DuplicateDetectionController] Error getting duplicate group details (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to get duplicate group details',
                    code: 'DUPLICATE_GROUP_DETAILS_FAILED',
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
     * Force duplicate detection bypassing cache
     * GET /collection-manager/duplicates/detect/force
     */
    async forceDetectDuplicates(ctx: any) {
        // Set bypass flag and delegate to main detection method
        ctx.query.bypass = 'true';
        console.log('[DuplicateDetectionController] Force duplicate detection requested');
        return this.detectDuplicates(ctx);
    },

    /**
     * Force duplicate statistics bypassing cache
     * GET /collection-manager/duplicates/stats/force
     */
    async forceGetDuplicateStats(ctx: any) {
        // Set bypass flag and delegate to main stats method
        ctx.query.bypass = 'true';
        console.log('[DuplicateDetectionController] Force duplicate stats requested');
        return this.getDuplicateStats(ctx);
    }
});

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Calculate the impact of duplicate collections on the system
 */
function calculateDuplicateImpact(stats: any): {
    impactLevel: 'low' | 'medium' | 'high';
    wastedStorage: string;
    maintenanceOverhead: string;
    userConfusion: string;
} {
    const duplicatePercentage = stats.duplicatePercentage || 0;
    const duplicateCollections = stats.duplicateCollections || 0;

    let impactLevel: 'low' | 'medium' | 'high' = 'low';
    if (duplicatePercentage >= 20 || duplicateCollections >= 10) {
        impactLevel = 'high';
    } else if (duplicatePercentage >= 10 || duplicateCollections >= 5) {
        impactLevel = 'medium';
    }

    return {
        impactLevel,
        wastedStorage: duplicateCollections > 0 ? `${duplicateCollections} redundant collections` : 'None',
        maintenanceOverhead: impactLevel === 'high' ? 'Significant' : impactLevel === 'medium' ? 'Moderate' : 'Minimal',
        userConfusion: duplicatePercentage >= 15 ? 'High - users may select wrong collection' : 'Low'
    };
}

/**
 * Generate recommendations based on duplicate statistics
 */
function generateDuplicateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.duplicateGroups === 0) {
        recommendations.push('✅ No duplicate collections found - all collections have unique article sets');
    } else {
        if (stats.severityBreakdown.high > 0) {
            recommendations.push(`🚨 Priority: Address ${stats.severityBreakdown.high} high-severity duplicate group(s) first`);
        }

        if (stats.duplicateCollections >= 10) {
            recommendations.push(`📋 Consider implementing automated duplicate prevention rules`);
        }

        if (stats.duplicatePercentage >= 20) {
            recommendations.push(`⚠️ High duplicate percentage (${stats.duplicatePercentage}%) - conduct comprehensive cleanup`);
        }

        recommendations.push('💡 Review collection creation workflow to prevent future duplicates');
        recommendations.push('🔧 Use the auto-fill feature to create collections instead of manual duplication');
    }

    return recommendations.length > 0 ? recommendations : ['✅ No specific recommendations at this time'];
}

/**
 * Calculate impact score for a specific duplicate group
 */
function calculateGroupImpactScore(group: any): number {
    // Score based on: collection count (40%), article count (30%), severity (30%)
    const collectionScore = Math.min(group.collectionCount * 25, 100); // Max 4 collections = 100 points
    const articleScore = Math.min(group.articleCount * 33, 100); // Max 3 articles = 100 points
    const severityScore = group.severity === 'high' ? 100 : group.severity === 'medium' ? 66 : 33;

    return Math.round((collectionScore * 0.4) + (articleScore * 0.3) + (severityScore * 0.3));
}

/**
 * Estimate effort required to consolidate a duplicate group
 */
function estimateConsolidationEffort(group: any): {
    effortLevel: 'low' | 'medium' | 'high';
    estimatedTime: string;
    complexity: string;
    steps: string[];
} {
    const collectionCount = group.collectionCount;
    const articleCount = group.articleCount;

    let effortLevel: 'low' | 'medium' | 'high' = 'low';
    let estimatedTime = '5-10 minutes';
    let complexity = 'Simple merge';

    if (collectionCount >= 4 || articleCount >= 3) {
        effortLevel = 'high';
        estimatedTime = '20-30 minutes';
        complexity = 'Complex consolidation with review needed';
    } else if (collectionCount === 3 || articleCount === 2) {
        effortLevel = 'medium';
        estimatedTime = '10-15 minutes';
        complexity = 'Moderate merge with some review';
    }

    const steps = [];
    if (articleCount === 1) {
        steps.push('Simple single-article duplicate - merge immediately');
        steps.push('Keep the most recently updated collection');
        steps.push('Delete the duplicate collections');
    } else {
        steps.push('Review all collections for unique metadata');
        steps.push('Identify the most complete collection as primary');
        steps.push('Merge any unique articles or metadata');
        steps.push('Update any external references');
        steps.push('Delete the duplicate collections');
    }

    return {
        effortLevel,
        estimatedTime,
        complexity,
        steps
    };
}