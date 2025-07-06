// src/plugins/collection-article-relation/admin/src/hooks/useOrphanManagement.ts
// Enhanced version with proper cache management and force refresh capabilities

import { useState, useEffect, useCallback } from 'react';
import { getFetchClient } from '@strapi/admin/strapi-admin';

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

export const useOrphanStats = () => {
    const [stats, setStats] = useState<OrphanStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();

            // Use force endpoint for cache bypass or regular endpoint with query param
            const url = bypassCache
                ? '/collection-article-relation/orphans/stats/force'
                : '/collection-article-relation/orphans/stats';

            console.log(`[useOrphanStats] Fetching stats${bypassCache ? ' (bypassing cache)' : ''}`);
            const response = await get(url);

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

            console.log('[useOrphanStats] Stats updated:', {
                total: validatedStats.totalCollections,
                orphaned: validatedStats.orphanedCollections,
                healthy: validatedStats.healthyCollections,
                method: bypassCache ? 'force' : 'cached'
            });

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
            console.log('[useOrphanStats] Force refresh: clearing cache first');
            const { del } = getFetchClient();

            // Clear the cache first
            await del('/collection-article-relation/orphans/cache');
            console.log('[useOrphanStats] Cache cleared, now fetching fresh data');

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
            await del('/collection-article-relation/orphans/cache');
            console.log('[useOrphanStats] Cache cleared successfully');
        } catch (err) {
            console.error('[useOrphanStats] Error clearing cache:', err);
            throw err;
        }
    }, []);

    const getCacheStats = useCallback(async () => {
        try {
            const { get } = getFetchClient();
            const response = await get('/collection-article-relation/orphans/cache-stats');
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

export const useOrphanDetection = () => {
    const [orphans, setOrphans] = useState<OrphanDetectionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detectOrphans = useCallback(async (bypassCache = false) => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();

            // Use force endpoint for cache bypass or regular endpoint
            const url = bypassCache
                ? '/collection-article-relation/orphans/detect/force'
                : '/collection-article-relation/orphans/detect';

            console.log(`[useOrphanDetection] Detecting orphans${bypassCache ? ' (bypassing cache)' : ''}`);
            const response = await get(url);

            // Handle response structure - use orphanedCollections array
            let orphansData = [];
            if (response.data?.data?.orphanedCollections && Array.isArray(response.data.data.orphanedCollections)) {
                orphansData = response.data.data.orphanedCollections;
            }

            console.log('[useOrphanDetection] Orphans detected:', orphansData.length);
            setOrphans(orphansData);

        } catch (err) {
            console.error('[useOrphanDetection] Error detecting orphans:', err);
            setError(err instanceof Error ? err.message : 'Failed to detect orphans');
        } finally {
            setLoading(false);
        }
    }, []);

    // Enhanced force detect that clears cache first
    const forceDetect = useCallback(async () => {
        try {
            console.log('[useOrphanDetection] Force detect: clearing cache first');
            const { del } = getFetchClient();

            // Clear the cache first
            await del('/collection-article-relation/orphans/cache');
            console.log('[useOrphanDetection] Cache cleared, now detecting fresh orphans');

            // Then detect fresh orphans
            await detectOrphans(true);

        } catch (err) {
            console.error('[useOrphanDetection] Error in force detect:', err);
            // Even if cache clearing fails, try to detect fresh orphans
            await detectOrphans(true);
        }
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

            // Perform the cleanup
            const response = await post(`/collection-article-relation/orphans/cleanup/${collectionId}`, options);

            // Clear cache for this specific collection after cleanup
            try {
                await del(`/collection-article-relation/orphans/cache/${collectionId}`);
                console.log(`[useOrphanCleanup] Cache cleared for collection ${collectionId} after cleanup`);
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
            const response = await get('/collection-article-relation/maintenance/cleanup-preview');

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