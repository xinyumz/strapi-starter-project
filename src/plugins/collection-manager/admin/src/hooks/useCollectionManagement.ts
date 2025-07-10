// src/plugins/collection-manager/admin/src/hooks/useCollectionManagement.ts

import { useState, useEffect, useCallback } from 'react';
import { getFetchClient } from '@strapi/admin/strapi-admin';

const isDebugMode = () => window.location.search.includes('debug');
const debugLog = (message: string, ...args: any[]) => {
    if (isDebugMode()) console.log(message, ...args);
};


export interface OrphanStatus {
    isOrphaned: boolean;
    isEmpty: boolean;
    articleCount: number;
    missingArticleIds: number[];
    validArticleIds: number[];
    orphanType: 'empty' | 'broken_references' | 'single_article' | 'healthy';
    severity: 'low' | 'medium' | 'high';
}

export interface OrphanStats {
    totalCollections: number;
    orphanedCollections: number;
    emptyCollections: number;
    brokenReferenceCollections: number;
    singleArticleCollections: number;
    healthyCollections: number;
    severityBreakdown: { high: number; medium: number; low: number };
    lastAnalysis: string;
    cacheStats: { size: number; hitRate: string };
}

export interface DuplicateStats {
    totalCollections: number;
    duplicateGroups: number;
    duplicateCollections: number;
    duplicatePercentage: number;
    severityBreakdown: { high: number; medium: number; low: number };
    lastAnalysis: string;
    cacheStats: { size: number; hitRate: string };
}

export interface CombinedHealthStats {
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

export interface OrphanDetectionResult {
    collection: {
        id: number;
        documentId: string;
        title: string;
        url: string;
    };
    status: OrphanStatus;
    suggestedActions: string[];
    metadata: {
        lastChecked: string;
        articleRelationships: any[];
    };
}

export interface DuplicateGroup {
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

export interface DuplicateDetectionResult {
    duplicateGroups: DuplicateGroup[];
    totalDuplicateCollections: number;
    totalCollections: number;
    duplicatePercentage: number;
    worstDuplicateGroup: DuplicateGroup | null;
    recommendations: string[];
}

// useCombinedHealth hook with response parsing and debug log
export const useCombinedHealth = () => {
    const [healthStats, setHealthStats] = useState<CombinedHealthStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCombinedHealth = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();

            // Use force endpoint for cache bypass or regular endpoint
            const url = bypassCache
                ? '/collection-manager/health/overview/force'
                : '/collection-manager/health/overview';

            debugLog('[useCombinedHealth] Fetching combined health', bypassCache ? '(bypassing cache)' : '');
            debugLog('[useCombinedHealth] URL:', url);

            const response = await get(url);

            // Log the response in debug mode
            debugLog('[useCombinedHealth] Response received:', { hasData: !!response.data, url });

            // Handle response structure correctly based on actual backend response
            let healthData;

            // The backend returns: { success: true, data: { healthOverview: { overallHealth: {...} } } }
            if (response.data?.data?.healthOverview?.overallHealth) {
                debugLog('[useCombinedHealth] Found healthOverview.overallHealth structure');
                healthData = response.data.data.healthOverview.overallHealth;
            }
            // Fallback: if the structure is { data: { healthOverview: {...} } } where healthOverview IS the health data
            else if (response.data?.data?.healthOverview) {
                debugLog('[useCombinedHealth] Found data.healthOverview structure');
                healthData = response.data.data.healthOverview;
            }
            // Fallback: if the structure is { data: { overallHealth: {...} } }
            else if (response.data?.data?.overallHealth) {
                debugLog('[useCombinedHealth] Found data.overallHealth structure');
                healthData = response.data.data.overallHealth;
            }
            // Last fallback: try data directly
            else if (response.data?.data) {
                debugLog('[useCombinedHealth] Using response.data directly');
                healthData = response.data.data;
            } else {
                console.error('[useCombinedHealth] Invalid response structure - no matching patterns found');
                console.error('[useCombinedHealth] Full response:', JSON.stringify(response, null, 2));
                throw new Error('Invalid response structure: no health data found');
            }

            debugLog('[useCombinedHealth] Extracted health data:', healthData);

            // Validate the health data has required fields
            if (!healthData || typeof healthData !== 'object') {
                throw new Error('Health data is invalid or missing');
            }

            // Ensure we have the basic required fields (with safe defaults)
            const validatedHealthData: CombinedHealthStats = {
                totalCollections: Number(healthData.totalCollections) || 0,
                orphanedCollections: Number(healthData.orphanedCollections) || 0,
                duplicateCollections: Number(healthData.duplicateCollections) || 0,
                healthyCollections: Number(healthData.healthyCollections) || 0,
                singleArticleCollections: Number(healthData.singleArticleCollections) || 0,
                emptyCollections: Number(healthData.emptyCollections) || 0,
                brokenReferenceCollections: Number(healthData.brokenReferenceCollections) || 0,
                duplicateGroups: Number(healthData.duplicateGroups) || 0,
                healthScore: Number(healthData.healthScore) || 100,
                orphanPenalty: Number(healthData.orphanPenalty) || 0,
                duplicatePenalty: Number(healthData.duplicatePenalty) || 0,
                severityBreakdown: healthData.severityBreakdown || {
                    orphans: { high: 0, medium: 0, low: 0 },
                    duplicates: { high: 0, medium: 0, low: 0 }
                },
                lastAnalysis: healthData.lastAnalysis || new Date().toISOString(),
                cacheStats: healthData.cacheStats || {
                    orphanCacheSize: 0,
                    duplicateCacheSize: 0,
                    combinedHitRate: 'Unknown'
                }
            };

            setHealthStats(validatedHealthData);

            if (validatedHealthData.orphanedCollections > 0 || validatedHealthData.duplicateCollections > 0) {
                console.log(`[CollectionManager] Health check: ${validatedHealthData.orphanedCollections} orphaned, ${validatedHealthData.duplicateCollections} duplicated collections (${validatedHealthData.healthScore}% health)`);
            } else {
                debugLog('[useCombinedHealth] Health check: all good', {
                    healthScore: validatedHealthData.healthScore,
                    totalCollections: validatedHealthData.totalCollections,
                    method: bypassCache ? 'force' : 'cached'
                });
            }

        } catch (err) {
            console.error('[useCombinedHealth] Error fetching combined health:', err);

            // Error logging
            if (err instanceof Error) {
                console.error('[useCombinedHealth] Error details:', {
                    message: err.message,
                    stack: err.stack
                });
            }

            setError(err instanceof Error ? err.message : 'Failed to fetch health statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    // Enhanced force refresh with combined cache clearing
    const forceRefresh = useCallback(async () => {
        try {
            debugLog('[useCombinedHealth] Force refresh: clearing all caches');
            const { del } = getFetchClient();

            // Clear all health-related caches
            await del('/collection-manager/health/cache');
            debugLog('[useCombinedHealth] All caches cleared, fetching fresh data');

            // Then fetch fresh data
            await fetchCombinedHealth(true);

        } catch (err) {
            console.error('[useCombinedHealth] Error in force refresh:', err);
            // Even if cache clearing fails, try to fetch fresh data
            await fetchCombinedHealth(true);
        }
    }, [fetchCombinedHealth]);

    useEffect(() => {
        fetchCombinedHealth();
    }, [fetchCombinedHealth]);

    return {
        healthStats,
        loading,
        error,
        refetch: () => fetchCombinedHealth(false),
        forceRefresh
    };
};

// useOrphanStats hook with debugging
export const useOrphanStats = () => {
    const [stats, setStats] = useState<OrphanStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();

            // Use force endpoint for cache bypass or regular endpoint
            const url = bypassCache
                ? '/collection-manager/orphans/stats/force'
                : '/collection-manager/orphans/stats';

            debugLog(`[useOrphanStats] Fetching stats${bypassCache ? ' (bypassing cache)' : ''}`);
            debugLog(`[useOrphanStats] URL: ${url}`);

            const response = await get(url);

            debugLog('[useOrphanStats] Raw response:', response);

            // Handle response structure
            let statsData;
            if (response.data?.data?.statistics) {
                statsData = response.data.data.statistics;
            } else if (response.data?.data) {
                statsData = response.data.data;
            } else {
                throw new Error('Invalid response structure');
            }

            // Validate and set stats
            const validatedStats: OrphanStats = {
                totalCollections: Number(statsData.totalCollections) || 0,
                orphanedCollections: Number(statsData.orphanedCollections) || 0,
                emptyCollections: Number(statsData.emptyCollections) || 0,
                brokenReferenceCollections: Number(statsData.brokenReferenceCollections) || 0,
                singleArticleCollections: Number(statsData.singleArticleCollections) || 0,
                healthyCollections: Number(statsData.healthyCollections) || 0,
                severityBreakdown: statsData.severityBreakdown || { high: 0, medium: 0, low: 0 },
                lastAnalysis: statsData.lastAnalysis || new Date().toISOString(),
                cacheStats: statsData.cacheStats || { size: 0, hitRate: 'Unknown' }
            };

            // Only log when there are orphans or in debug mode
            if (validatedStats.orphanedCollections > 0) {
                console.log(`[CollectionManager] Orphan stats: ${validatedStats.orphanedCollections} orphaned collections found`);
            } else {
                debugLog('[useOrphanStats] Stats updated - no orphans found', {
                    total: validatedStats.totalCollections,
                    healthy: validatedStats.healthyCollections,
                    method: bypassCache ? 'force' : 'cached'
                });
            }

            setStats(validatedStats);

        } catch (err) {
            console.error('[useOrphanStats] Error fetching stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch orphan statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    // Enhanced force refresh that clears cache first, then fetches fresh data
    const forceRefresh = useCallback(async () => {
        try {
            debugLog('[useOrphanStats] Force refresh: clearing cache first');
            const { del } = getFetchClient();

            // Clear the cache first
            await del('/collection-manager/orphans/cache');
            debugLog('[useOrphanStats] Cache cleared, now fetching fresh data');

            // Then fetch fresh data
            await fetchStats(true);

        } catch (err) {
            console.error('[useOrphanStats] Error in force refresh:', err);
            // Even if cache clearing fails, try to fetch fresh data
            await fetchStats(true);
        }
    }, [fetchStats]);

    // Cache management functions
    const clearCache = useCallback(async () => {
        try {
            const { del } = getFetchClient();
            await del('/collection-manager/orphans/cache');
            debugLog('[useOrphanStats] Cache cleared successfully');
        } catch (err) {
            console.error('[useOrphanStats] Error clearing cache:', err);
            throw err;
        }
    }, []);

    const getCacheStats = useCallback(async () => {
        try {
            const { get } = getFetchClient();
            const response = await get('/collection-manager/orphans/cache-stats');
            return response.data;
        } catch (err) {
            console.error('[useOrphanStats] Error getting cache stats:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        refetch: () => fetchStats(false),
        forceRefresh,
        clearCache,
        getCacheStats
    };
};

// useDuplicateDetection hook with debugging
export const useDuplicateDetection = () => {
    const [duplicates, setDuplicates] = useState<DuplicateDetectionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detectDuplicates = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();

            // Use force endpoint for cache bypass or regular endpoint
            const url = bypassCache
                ? '/collection-manager/duplicates/detect/force'
                : '/collection-manager/duplicates/detect';

            debugLog('[useDuplicateDetection] Detecting duplicates', bypassCache ? '(bypassing cache)' : '');
            debugLog('[useDuplicateDetection] URL:', url);

            const response = await get(url);

            debugLog('[useDuplicateDetection] Raw response received');

            // Handle response structure
            let duplicatesData;
            if (response.data?.data) {
                duplicatesData = response.data.data;
            } else {
                throw new Error('Invalid response structure');
            }
            // Calculate duplicate count from the actual data structure
            const duplicateCount = duplicatesData?.totalDuplicateCollections || 0;

            if (duplicateCount > 0) {
                console.log(`[CollectionManager] Found ${duplicateCount} duplicate collection${duplicateCount > 1 ? 's' : ''}`);
            } else {
                debugLog('[useDuplicateDetection] No duplicates detected');
            }
            setDuplicates(duplicatesData);

        } catch (err) {
            console.error('[useDuplicateDetection] Error detecting duplicates:', err);
            setError(err instanceof Error ? err.message : 'Failed to detect duplicates');
        } finally {
            setLoading(false);
        }
    }, []);

    // Remove redundant cache clearing since "Refresh Scan" handles it
    const forceDetect = useCallback(async () => {
        debugLog('[useDuplicateDetection] Force detect: fetching fresh duplicates directly');

        // Just detect with cache bypass - no need to clear cache separately
        // The backend force endpoint handles cache bypass automatically
        await detectDuplicates(true);

    }, [detectDuplicates]);

    return {
        duplicates,
        loading,
        error,
        detectDuplicates: () => detectDuplicates(false),
        forceDetect
    };
};

// useOrphanDetection hook with debugging
export const useOrphanDetection = () => {
    const [orphans, setOrphans] = useState<OrphanDetectionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detectOrphans = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();

            const url = bypassCache
                ? '/collection-manager/orphans/detect/force'
                : '/collection-manager/orphans/detect';

            debugLog('[useOrphanDetection] Detecting orphans', bypassCache ? '(bypassing cache)' : '');
            debugLog('[useOrphanDetection] URL:', url);

            const response = await get(url);
            debugLog('[useOrphanDetection] Raw response received');

            let orphansData = [];
            if (response.data?.data?.orphanedCollections && Array.isArray(response.data.data.orphanedCollections)) {
                orphansData = response.data.data.orphanedCollections;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                // Fallback: if data is directly an array of orphans
                orphansData = response.data.data;
            }

            const orphanCount = Array.isArray(orphansData) ? orphansData.length : 0;

            if (orphanCount > 0) {
                console.log(`[CollectionManager] Found ${orphanCount} orphaned collection${orphanCount > 1 ? 's' : ''}`);
            } else {
                debugLog('[useOrphanDetection] No orphans detected');
            }

            setOrphans(orphansData);

        } catch (err) {
            console.error('[useOrphanDetection] Error detecting orphans:', err);
            setError(err instanceof Error ? err.message : 'Failed to detect orphans');
        } finally {
            setLoading(false);
        }
    }, []);

    // Remove redundant cache clearing
    const forceDetect = useCallback(async () => {
        debugLog('[useOrphanDetection] Force detect: fetching fresh orphans directly');

        // Just detect with cache bypass - the backend handles cache bypass
        await detectOrphans(true);

    }, [detectOrphans]);

    return {
        orphans,
        loading,
        error,
        detectOrphans: () => detectOrphans(false),
        forceDetect
    };
};

export const useOrphanCleanup = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cleanupOrphan = useCallback(async (collectionId: number, options: {
        force?: boolean;
        createBackup?: boolean;
        reason?: string;
    } = {}) => {
        try {
            setLoading(true);
            setError(null);

            const { post, del } = getFetchClient();

            debugLog(`[useOrphanCleanup] Cleaning up orphan ${collectionId}`, options);

            // Perform the cleanup
            const response = await post(`/collection-manager/orphans/cleanup/${collectionId}`, options);

            // Clear cache for this specific collection after cleanup
            try {
                await del(`/collection-manager/orphans/cache/${collectionId}`);
                debugLog(`[useOrphanCleanup] Cache cleared for collection ${collectionId} after cleanup`);
            } catch (cacheError) {
                console.warn('[useOrphanCleanup] Failed to clear cache after cleanup:', cacheError);
                // Don't fail the entire operation if cache clearing fails
            }

            return response.data;
        } catch (err) {
            console.error('[useOrphanCleanup] Error cleaning up orphan:', err);
            setError(err instanceof Error ? err.message : 'Failed to cleanup orphan');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const previewCleanup = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();
            const response = await get('/collection-manager/maintenance/cleanup-preview');

            return response.data;
        } catch (err) {
            console.error('[useOrphanCleanup] Error previewing cleanup:', err);
            setError(err instanceof Error ? err.message : 'Failed to preview cleanup');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { cleanupOrphan, previewCleanup, loading, error };
};