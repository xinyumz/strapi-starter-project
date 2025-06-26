// src/plugins/collection-article-relation/admin/src/hooks/useCollectionAutoFill.ts

import { useState, useCallback } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';

interface AutoFillData {
    scenario: 'no_articles' | 'single_article' | 'multiple_articles';
    message: string;
    suggestedData?: {
        title?: string;
        date?: string;
        cover?: any;
        category?: any;
    };
    conflicts?: {
        categories?: boolean;
        dates?: boolean;
        covers?: boolean;
    };
    articleDetails?: {
        count: number;
        articles: any[];
    };
}

interface UseCollectionAutoFillReturn {
    autoFillData: AutoFillData | null;
    isLoading: boolean;
    error: string | null;
    analyzeArticles: (articleIds: number[]) => Promise<void>;
    clearAutoFill: () => void;
    quickCreateCollection: (articleId: number) => Promise<any>;
}

export const useCollectionAutoFill = (): UseCollectionAutoFillReturn => {
    const [autoFillData, setAutoFillData] = useState<AutoFillData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { post } = useFetchClient();

    const analyzeArticles = useCallback(async (articleIds: number[]) => {
        if (!articleIds || articleIds.length === 0) {
            setAutoFillData(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('[useCollectionAutoFill] Analyzing articles:', articleIds);

            const response = await post('/collection-article-relation/analyze-articles', {
                articleIds
            });

            if (response.data?.success && response.data?.data) {
                setAutoFillData(response.data.data);
                console.log('[useCollectionAutoFill] Analysis complete:', response.data.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('[useCollectionAutoFill] Analysis failed:', err);
            setError(err instanceof Error ? err.message : 'Analysis failed');
            setAutoFillData(null);
        } finally {
            setIsLoading(false);
        }
    }, [post]);

    const clearAutoFill = useCallback(() => {
        setAutoFillData(null);
        setError(null);
    }, []);

    const quickCreateCollection = useCallback(async (articleId: number) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('[useCollectionAutoFill] Quick creating collection from article:', articleId);

            const response = await post('/collection-article-relation/quick-create', {
                articleId
            });

            if (response.data?.success && response.data?.data) {
                console.log('[useCollectionAutoFill] Quick creation complete:', response.data.data);
                return response.data.data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('[useCollectionAutoFill] Quick creation failed:', err);
            setError(err instanceof Error ? err.message : 'Quick creation failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [post]);

    return {
        autoFillData,
        isLoading,
        error,
        analyzeArticles,
        clearAutoFill,
        quickCreateCollection
    };
};