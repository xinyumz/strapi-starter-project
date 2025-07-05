// src/plugins/collection-article-relation/admin/src/hooks/useOrphanManagement.ts
// Cleaned up version with cache control

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

            // Add cache busting parameter for manual refreshes
            const url = bypassCache
                ? `/collection-article-relation/orphans/stats?t=${Date.now()}`
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
                healthy: validatedStats.healthyCollections
            });

            setStats(validatedStats);

        } catch (err) {
            console.error('[useOrphanStats] Error fetching stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch orphan statistics');
        } finally {
            setLoading(false);
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
        forceRefresh: () => fetchStats(true)
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

            // Add cache busting for detection too
            const url = bypassCache
                ? `/collection-article-relation/orphans/detect?t=${Date.now()}`
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

    return {
        orphans,
        loading,
        error,
        detectOrphans: () => detectOrphans(false),
        forceDetect: () => detectOrphans(true)
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

            const { post } = getFetchClient();
            const response = await post(`/collection-article-relation/orphans/cleanup/${collectionId}`, options);

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