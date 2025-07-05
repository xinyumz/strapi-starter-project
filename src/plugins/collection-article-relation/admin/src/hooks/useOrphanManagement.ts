// src/plugins/collection-article-relation/admin/src/hooks/useOrphanManagement.ts

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

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();
            const response = await get('/collection-article-relation/orphans/stats');

            setStats(response.data);
        } catch (err) {
            console.error('Error fetching orphan stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch orphan statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
};

export const useOrphanDetection = () => {
    const [orphans, setOrphans] = useState<OrphanDetectionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const detectOrphans = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { get } = getFetchClient();
            const response = await get('/collection-article-relation/orphans/detect');

            setOrphans(response.data);
        } catch (err) {
            console.error('Error detecting orphans:', err);
            setError(err instanceof Error ? err.message : 'Failed to detect orphans');
        } finally {
            setLoading(false);
        }
    }, []);

    return { orphans, loading, error, detectOrphans };
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
            console.error('Error cleaning up orphan:', err);
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
            console.error('Error previewing cleanup:', err);
            setError(err instanceof Error ? err.message : 'Failed to preview cleanup');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { cleanupOrphan, previewCleanup, loading, error };
};