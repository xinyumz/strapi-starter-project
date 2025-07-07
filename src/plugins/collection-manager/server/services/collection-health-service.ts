// src/plugins/collection-manager/server/services/collection-health-service.ts

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

// Combined Health Interfaces
interface CombinedHealthStats {
    totalCollections: number;
    orphanedCollections: number;
    duplicateCollections: number;
    healthyCollections: number;
    singleArticleCollections: number;
    emptyCollections: number;
    brokenReferenceCollections: number;
    duplicateGroups: number;
    healthScore: number;
    orphanPenalty: number;
    duplicatePenalty: number;
    severityBreakdown: {
        orphans: { high: number; medium: number; low: number };
        duplicates: { high: number; medium: number; low: number };
    };
    lastAnalysis: string;
    cacheStats: {
        orphanCacheSize: number;
        duplicateCacheSize: number;
        combinedHitRate: string;
    };
}

interface HealthOverview {
    overallHealth: CombinedHealthStats;
    issues: {
        orphanIssues: number;
        duplicateIssues: number;
        totalIssues: number;
        criticalIssues: number;
    };
    recommendations: string[];
    quickActions: {
        priority: string[];
        suggested: string[];
    };
}

// Combined health cache with 2-minute TTL
const healthCache = new Map<string, { stats: CombinedHealthStats; timestamp: number }>();
const HEALTH_CACHE_TTL = 2 * 60 * 1000;

export default ({ strapi }: any) => {

    // Helper function to clean expired cache entries
    const cleanExpiredCache = (): void => {
        const now = Date.now();
        for (const [key, value] of healthCache.entries()) {
            if (now - value.timestamp > HEALTH_CACHE_TTL) {
                healthCache.delete(key);
            }
        }
    };

    // Helper to check if we should bypass cache
    const shouldBypassCache = (bypassCache?: boolean): boolean => {
        return bypassCache === true;
    };

    // Calculate unified health score
    const calculateHealthScore = (
        totalCollections: number,
        orphanedCollections: number,
        duplicateCollections: number
    ): { healthScore: number; orphanPenalty: number; duplicatePenalty: number } => {
        if (totalCollections === 0) {
            return { healthScore: 100, orphanPenalty: 0, duplicatePenalty: 0 };
        }

        // Calculate penalties
        const orphanPenalty = (orphanedCollections / totalCollections);
        const duplicatePenalty = (duplicateCollections / totalCollections);

        // Apply your specified formula: healthScore = 100 - (orphanPenalty * 50) - (duplicatePenalty * 30)
        const healthScore = Math.max(0, Math.round(100 - (orphanPenalty * 50) - (duplicatePenalty * 30)));

        return {
            healthScore,
            orphanPenalty: Math.round(orphanPenalty * 100), // Convert to percentage
            duplicatePenalty: Math.round(duplicatePenalty * 100) // Convert to percentage
        };
    };

    // Generate combined recommendations
    const generateCombinedRecommendations = (
        orphanStats: any,
        duplicateStats: any,
        healthScore: number
    ): string[] => {
        const recommendations: string[] = [];

        // Overall health assessment
        if (healthScore >= 90) {
            recommendations.push('✅ Excellent collection health - minimal issues detected');
        } else if (healthScore >= 70) {
            recommendations.push('⚡ Good collection health with minor improvements needed');
        } else if (healthScore >= 50) {
            recommendations.push('⚠️ Moderate collection health - several issues need attention');
        } else {
            recommendations.push('🚨 Poor collection health - immediate cleanup required');
        }

        // Priority-based recommendations
        const orphanIssues = orphanStats.orphanedCollections || 0;
        const duplicateIssues = duplicateStats.duplicateCollections || 0;

        if (orphanIssues > 0 && duplicateIssues > 0) {
            recommendations.push(`📋 Address both ${orphanIssues} orphan(s) and ${duplicateIssues} duplicate(s)`);

            // Prioritize based on severity
            if (orphanStats.severityBreakdown?.high > 0) {
                recommendations.push('🔥 Priority: Fix high-severity orphaned collections first');
            } else if (duplicateStats.severityBreakdown?.high > 0) {
                recommendations.push('🔥 Priority: Consolidate high-severity duplicate groups first');
            }
        } else if (orphanIssues > 0) {
            recommendations.push(`🗑️ Focus on cleaning up ${orphanIssues} orphaned collection(s)`);
        } else if (duplicateIssues > 0) {
            recommendations.push(`📂 Focus on consolidating ${duplicateIssues} duplicate collection(s)`);
        }

        // Specific action recommendations
        if (orphanStats.emptyCollections > 0) {
            recommendations.push(`🗂️ Remove ${orphanStats.emptyCollections} empty collection(s)`);
        }

        if (duplicateStats.duplicateGroups > 3) {
            recommendations.push('🔄 Implement duplicate prevention in content creation workflow');
        }

        if (orphanStats.singleArticleCollections > 10) {
            recommendations.push('📚 Consider consolidating numerous single-article collections');
        }

        return recommendations.length > 0 ? recommendations : ['✅ No specific recommendations at this time'];
    };

    return {
        /**
         * Get combined health overview (orphans + duplicates)
         * @param bypassCache - Whether to bypass cache and force fresh analysis
         */
        async getCombinedHealthOverview(bypassCache = false): Promise<HealthOverview> {
            try {
                const cacheKey = 'combined_health_overview';

                // Check cache first (unless bypassing)
                if (!shouldBypassCache(bypassCache)) {
                    cleanExpiredCache();
                    const cached = healthCache.get(cacheKey);
                    if (cached && (Date.now() - cached.timestamp) < HEALTH_CACHE_TTL) {
                        console.log('[CollectionHealth] Cache hit for combined health overview');

                        // Generate fresh overview data from cached stats
                        return this.generateHealthOverview(cached.stats);
                    }
                } else {
                    console.log('[CollectionHealth] Bypassing cache for combined health overview');
                }

                console.log('[CollectionHealth] Generating fresh combined health overview');

                // Get both orphan and duplicate services
                const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');
                const duplicateDetectionService = strapi.plugin('collection-manager').service('duplicateDetection');

                if (!orphanDetectionService || !duplicateDetectionService) {
                    throw new ApplicationError('Required health services not available');
                }

                // Fetch both stats in parallel
                const [orphanStats, duplicateStats] = await Promise.all([
                    orphanDetectionService.getOrphanDetectionStats(bypassCache),
                    duplicateDetectionService.getDuplicateDetectionStats(bypassCache)
                ]);

                // Combine the statistics
                const combinedStats = this.combineHealthStats(orphanStats, duplicateStats);

                // Cache the combined result
                healthCache.set(cacheKey, {
                    stats: combinedStats,
                    timestamp: Date.now()
                });

                // Generate and return overview
                return this.generateHealthOverview(combinedStats);

            } catch (error) {
                console.error('[CollectionHealth] Error generating combined health overview:', error);
                throw new ApplicationError(
                    `Failed to generate health overview: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Combine orphan and duplicate statistics into unified health stats
         */
        combineHealthStats(orphanStats: any, duplicateStats: any): CombinedHealthStats {
            // Use the total collections from orphan stats as the authoritative source
            const totalCollections = orphanStats.totalCollections || 0;
            const orphanedCollections = orphanStats.orphanedCollections || 0;
            const duplicateCollections = duplicateStats.duplicateCollections || 0;

            // Calculate health score using the specified formula
            const { healthScore, orphanPenalty, duplicatePenalty } = calculateHealthScore(
                totalCollections,
                orphanedCollections,
                duplicateCollections
            );

            return {
                totalCollections,
                orphanedCollections,
                duplicateCollections,
                healthyCollections: orphanStats.healthyCollections || 0,
                singleArticleCollections: orphanStats.singleArticleCollections || 0,
                emptyCollections: orphanStats.emptyCollections || 0,
                brokenReferenceCollections: orphanStats.brokenReferenceCollections || 0,
                duplicateGroups: duplicateStats.duplicateGroups || 0,
                healthScore,
                orphanPenalty,
                duplicatePenalty,
                severityBreakdown: {
                    orphans: orphanStats.severityBreakdown || { high: 0, medium: 0, low: 0 },
                    duplicates: duplicateStats.severityBreakdown || { high: 0, medium: 0, low: 0 }
                },
                lastAnalysis: new Date().toISOString(),
                cacheStats: {
                    orphanCacheSize: orphanStats.cacheStats?.size || 0,
                    duplicateCacheSize: duplicateStats.cacheStats?.size || 0,
                    combinedHitRate: `${Math.round(((orphanStats.cacheStats?.size || 0) + (duplicateStats.cacheStats?.size || 0)) / 2)}%`
                }
            };
        },

        /**
         * Generate health overview from combined stats
         */
        generateHealthOverview(combinedStats: CombinedHealthStats): HealthOverview {
            const orphanIssues = combinedStats.orphanedCollections;
            const duplicateIssues = combinedStats.duplicateCollections;
            const totalIssues = orphanIssues + duplicateIssues;

            // Count critical issues (high severity)
            const criticalIssues = (combinedStats.severityBreakdown.orphans.high || 0) +
                (combinedStats.severityBreakdown.duplicates.high || 0);

            // Generate recommendations (this will need orphan and duplicate stats)
            const recommendations = [
                `📊 Health Score: ${combinedStats.healthScore}% (${combinedStats.totalCollections} total collections)`,
                ...(totalIssues > 0 ?
                    [`🔧 ${totalIssues} collections need attention (${orphanIssues} orphaned, ${duplicateIssues} duplicated)`] :
                    ['✅ All collections are healthy'])
            ];

            // Quick actions based on current state
            const quickActions = {
                priority: [] as string[],
                suggested: [] as string[]
            };

            if (criticalIssues > 0) {
                quickActions.priority.push(`Address ${criticalIssues} critical issue(s) immediately`);
            }

            if (orphanIssues > 0) {
                quickActions.priority.push(`Clean up ${orphanIssues} orphaned collection(s)`);
            }

            if (duplicateIssues > 0) {
                quickActions.suggested.push(`Consolidate ${duplicateIssues} duplicate collection(s)`);
            }

            if (totalIssues === 0) {
                quickActions.suggested.push('Monitor for new issues', 'Review collection creation workflow');
            }

            return {
                overallHealth: combinedStats,
                issues: {
                    orphanIssues,
                    duplicateIssues,
                    totalIssues,
                    criticalIssues
                },
                recommendations,
                quickActions
            };
        },

        /**
         * Clear combined health cache
         */
        clearHealthCache(): void {
            const cacheSize = healthCache.size;
            healthCache.clear();
            console.log(`[CollectionHealth] Combined health cache cleared (removed ${cacheSize} entries)`);
        },

        /**
         * Get health cache statistics
         */
        getHealthCacheStats(): { size: number; entries: any[] } {
            cleanExpiredCache();
            return {
                size: healthCache.size,
                entries: Array.from(healthCache.entries()).map(([key, value]) => ({
                    cacheKey: key,
                    healthScore: value.stats.healthScore,
                    totalIssues: value.stats.orphanedCollections + value.stats.duplicateCollections,
                    age: Date.now() - value.timestamp,
                    expiresIn: Math.max(0, HEALTH_CACHE_TTL - (Date.now() - value.timestamp))
                }))
            };
        }
    };
};