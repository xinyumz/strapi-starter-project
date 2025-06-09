// src/plugins/chinese-article-processor/admin/src/hooks/useDataSourceInfo.ts

import { useState, useCallback } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';

interface DataSourceInfo {
    articleId: number;
    language: string;
    content: {
        source: 'per_languages' | 'articles' | 'unknown';
        isModern: boolean;
    };
    processedData: {
        source: 'per_languages' | 'articles' | 'none' | 'unknown';
        isModern: boolean;
    };
    overallStatus: 'modern' | 'transition' | 'unknown';
}

interface UseDataSourceInfoProps {
    articleId: string | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export const useDataSourceInfo = ({
    articleId,
    onSuccess,
    onError
}: UseDataSourceInfoProps) => {
    const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { get, post } = useFetchClient();

    /**
     * Get data source information for current article
     */
    const getDataSourceInfo = useCallback(async (id: string) => {
        if (!id) {
            console.log(`[DataSource Hook] No ID provided`);
            return;
        }

        console.log(`[DataSource Hook] Starting fetch for article ${id}`);
        setIsLoading(true);

        try {
            const response = await get(`/per-language/data-source/${id}?language=zh`);

            console.log(`[DataSource Hook] Response received:`, {
                status: response.status,
                hasData: !!response.data,
                hasNestedData: !!response.data?.data
            });

            if (response.data?.data) {
                const data = response.data.data;
                console.log(`[DataSource Hook] Setting data source info:`, {
                    articleId: data.articleId,
                    language: data.language,
                    contentSource: data.content?.source,
                    processedSource: data.processedData?.source,
                    overallStatus: data.overallStatus
                });

                setDataSourceInfo(data);

                // Show status info
                if (data.overallStatus === 'modern') {
                    console.log(`[DataSource Hook] Calling onSuccess for modern system`);
                    if (onSuccess) {
                        onSuccess('Article is using modern multi-language system');
                    }
                } else if (data.overallStatus === 'transition') {
                    if (onSuccess) {
                        onSuccess(`Article is in transition state (Content: ${data.content.source}, Processed: ${data.processedData.source})`);
                    }
                }
            } else {
                console.error(`[DataSource Hook] No data in response`);
                if (onError) {
                    onError('No data source information received');
                }
            }
        } catch (error) {
            console.error('[DataSource Hook] Fetch error:', error);
            if (onError) {
                onError('Failed to get data source information');
            }
        } finally {
            console.log(`[DataSource Hook] Setting loading to false`);
            setIsLoading(false);
        }
    }, [get, onSuccess, onError]);

    /**
     * Create per_language entry for current article
     */
    const createPerLanguageEntry = useCallback(async (id: string) => {
        if (!id) return false;

        try {
            console.log(`[DataSource Hook] Creating per_language entry for article ${id}`);

            const response = await post(`/per-language/create-entry/${id}`, {
                data: { language: 'zh' }
            });

            if (response.data?.data?.success) {
                console.log(`[DataSource Hook] ✅ Per_language entry created`);

                // Refresh data source info
                await getDataSourceInfo(id);

                if (onSuccess) {
                    onSuccess('Article transitioned to modern multi-language system');
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('[DataSource Hook] Error creating per_language entry:', error);
            if (onError) {
                const errorMessage = error instanceof Error ? error.message : 'Creation failed';
                onError(`Failed to create per_language entry: ${errorMessage}`);
            }
            return false;
        }
    }, [post, getDataSourceInfo, onSuccess, onError]);

    // Computed properties for easy UI usage
    const isUsingModernSystem = dataSourceInfo?.overallStatus === 'modern';
    const isInTransition = dataSourceInfo?.overallStatus === 'transition';
    const needsTransition = dataSourceInfo?.content?.source === 'articles' && !dataSourceInfo?.content?.isModern;

    const statusMessage = (() => {
        if (!dataSourceInfo) return 'Unknown';
        if (isUsingModernSystem) return 'Using modern multi-language system';
        if (isInTransition) return 'In transition to modern system';
        return 'Using legacy system';
    })();

    const statusColor = (() => {
        if (isUsingModernSystem) return 'success';
        if (isInTransition) return 'warning';
        return 'danger';
    })();

    // Simplified debug logging
    console.log(`[DataSource Hook] Current state:`, {
        loading: isLoading,
        hasData: !!dataSourceInfo,
        status: dataSourceInfo?.overallStatus
    });

    return {
        // State
        dataSourceInfo,
        isLoading,

        // Status info
        isUsingModernSystem,
        isInTransition,
        needsTransition,
        statusMessage,
        statusColor,

        // Actions
        getDataSourceInfo,
        createPerLanguageEntry
    };
};

/**
 * System overview hook for admin dashboard
 */
export const useSystemOverview = () => {
    const [overview, setOverview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { get } = useFetchClient();

    const loadSystemOverview = useCallback(async (limit: number = 50) => {
        setIsLoading(true);
        try {
            const response = await get(`/per-language/system-overview?language=zh&limit=${limit}`);
            if (response.data?.data) {
                setOverview(response.data.data);
            }
        } catch (error) {
            console.error('Error loading system overview:', error);
        } finally {
            setIsLoading(false);
        }
    }, [get]);

    const testDataSources = useCallback(async () => {
        try {
            const response = await get('/per-language/test-sources');
            return response.data?.data;
        } catch (error) {
            console.error('Error testing data sources:', error);
            return null;
        }
    }, [get]);

    return {
        overview,
        isLoading,
        loadSystemOverview,
        testDataSources
    };
};