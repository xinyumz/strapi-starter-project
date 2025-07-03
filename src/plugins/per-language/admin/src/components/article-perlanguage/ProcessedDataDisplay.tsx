// src/plugins/per-language/admin/src/components/article-perlanguage/ProcessedDataDisplay.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    Flex,
    EmptyStateLayout,
    Loader
} from '@strapi/design-system';
import { ChartCircle } from '@strapi/icons';
import { useFetchClient } from "@strapi/strapi/admin";

import {
    SUPPORTED_LANGUAGES,
    LanguageData,
} from '../shared';

import {
    BulkControls,
    LanguageCard
} from '../processed-data';

interface ProcessedDataDisplayProps {
    articleId: string;
    onRefresh?: () => void;
}

export const ProcessedDataDisplay: React.FC<ProcessedDataDisplayProps> = ({
    articleId,
    onRefresh
}) => {
    const [languageData, setLanguageData] = useState<LanguageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
    const [bulkPublishState, setBulkPublishState] = useState<boolean>(false);

    const [showAllGrammar, setShowAllGrammar] = useState<Record<number, boolean>>({});
    const [showAllTranslations, setShowAllTranslations] = useState<Record<number, boolean>>({});

    // SAFE: Get fetch client
    const fetchClient = useFetchClient();

    // Memoized data loading function to prevent infinite loops
    const loadLanguageData = useCallback(async () => {
        if (!articleId) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetchClient.get(`/per-language/article/${articleId}/languages`);

            let data = [];
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                data = response.data.data;
            } else if (response.data && Array.isArray(response.data)) {
                data = response.data;
            }

            setLanguageData(data);

        } catch (err: any) {
            console.error('[ProcessedDataDisplay] Error loading language data:', err);
            setError(err.message || 'Failed to load language data');
            setLanguageData([]);
        } finally {
            setIsLoading(false);
        }
    }, [articleId, fetchClient.get]);

    // Only load data when articleId changes
    useEffect(() => {
        if (articleId) {
            loadLanguageData();
        }
    }, [articleId]); // REMOVED loadLanguageData from deps to prevent infinite loop

    const handleRefresh = useCallback(async () => {
        await loadLanguageData();
        if (onRefresh) {
            onRefresh();
        }
    }, [loadLanguageData, onRefresh]);

    const handleLanguageRefresh = useCallback(async (languageId: number, languageCode: string) => {
        try {
            setIsUpdating(prev => ({ ...prev, [`refresh_${languageId}`]: true }));

            console.log(`[Frontend Refresh] Refreshing language ${languageCode} for article ${articleId}`);

            await fetchClient.get(`/per-language/article/${articleId}/language/${languageCode}/refresh`);
            await loadLanguageData();

            console.log(`[Frontend Refresh] ✅ Successfully refreshed language ${languageCode}`);

        } catch (error) {
            console.error(`[Frontend Refresh] Error refreshing language ${languageCode}:`, error);
            setError(`Failed to refresh ${languageCode} data`);
        } finally {
            setIsUpdating(prev => ({ ...prev, [`refresh_${languageId}`]: false }));
        }
    }, [articleId, fetchClient.get, loadLanguageData]);

    // SAFE: Delete handler with proper error handling
    const handleLanguageDelete = useCallback(async (languageId: number, languageName: string) => {
        try {
            setIsUpdating(prev => ({ ...prev, [`delete_${languageId}`]: true }));

            console.log(`[ProcessedDataDisplay] Deleting language content:`, {
                languageId,
                languageName,
                articleId
            });

            // Try to use del method, fallback to delete if not available
            let response;
            try {
                if (fetchClient && fetchClient.del) {
                    response = await fetchClient.del(`/per-language/content/${languageId}`);
                } else {
                    // Manual fetch as fallback
                    response = await fetch(`/per-language/content/${languageId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                    });
                }
            } catch (fetchError) {
                console.error('Fetch client error, using manual fetch:', fetchError);
                response = await fetch(`/per-language/content/${languageId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                });
            }

            console.log(`[ProcessedDataDisplay] Delete response:`, response);

            // Remove from local state immediately
            setLanguageData(prev => prev.filter(lang => lang.id !== languageId));

            // Clean up related state
            setVisibleCards(prev => {
                const newSet = new Set(prev);
                newSet.delete(languageId);
                return newSet;
            });

            setExpandedCards(prev => {
                const newExpanded = { ...prev };
                delete newExpanded[languageId];
                return newExpanded;
            });

            setShowAllGrammar(prev => {
                const newGrammar = { ...prev };
                delete newGrammar[languageId];
                return newGrammar;
            });

            setShowAllTranslations(prev => {
                const newTranslations = { ...prev };
                delete newTranslations[languageId];
                return newTranslations;
            });

            // Optional refresh
            if (onRefresh) {
                onRefresh();
            }

            console.log(`[ProcessedDataDisplay] ✅ ${languageName} content deleted successfully`);

        } catch (error: any) {
            console.error(`[ProcessedDataDisplay] Error deleting ${languageName} content:`, error);
            setError(`Failed to delete ${languageName} content: ${error.message || 'Unknown error'}`);
            throw error;
        } finally {
            setIsUpdating(prev => ({ ...prev, [`delete_${languageId}`]: false }));
        }
    }, [articleId, fetchClient, onRefresh]);

    const handlePublishToggle = useCallback(async (languageId: number, currentPublished: boolean) => {
        try {
            setIsUpdating(prev => ({ ...prev, [`publish_${languageId}`]: true }));

            await fetchClient.put(`/per-language/content/${languageId}/publish`, {
                published: !currentPublished
            });

            setLanguageData(prev => {
                if (!Array.isArray(prev)) return [];
                return prev.map(lang =>
                    lang.id === languageId
                        ? { ...lang, published: !currentPublished }
                        : lang
                );
            });
        } catch (err: any) {
            console.error('Error updating publish status:', err);
            setError(err.message || 'Failed to update publish status');
        } finally {
            setIsUpdating(prev => ({ ...prev, [`publish_${languageId}`]: false }));
        }
    }, [fetchClient.put]);

    const handleAccessTierChange = useCallback(async (languageId: number, newTier: string) => {
        if (newTier === '') return;

        try {
            setIsUpdating(prev => ({ ...prev, [`tier_${languageId}`]: true }));

            await fetchClient.put(`/per-language/content/${languageId}/access-tier`, {
                access_tier: newTier
            });

            setLanguageData(prev => {
                if (!Array.isArray(prev)) return [];
                return prev.map(lang =>
                    lang.id === languageId
                        ? { ...lang, access_tier: newTier }
                        : lang
                );
            });
        } catch (err: any) {
            console.error('Error updating access tier:', err);
            setError(err.message || 'Failed to update access tier');
        } finally {
            setIsUpdating(prev => ({ ...prev, [`tier_${languageId}`]: false }));
        }
    }, [fetchClient.put]);

    const handleOpenProcessor = useCallback(async (language: string) => {
        const processor = SUPPORTED_LANGUAGES.find(l => l.code === language);

        if (processor?.hasProcessor && processor.processorUrl) {
            const existingLang = languageData.find(lang => lang.language === language);

            if (!existingLang) {
                try {
                    console.log(`[ProcessedDataDisplay] Creating empty ${language} entry for article ${articleId}`);

                    await fetchClient.put(`/per-language/article/${articleId}/content`, {
                        language: language,
                        content: ' '
                    });

                    await loadLanguageData();
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`[ProcessedDataDisplay] Failed to create ${language} entry:`, error);
                    alert(`Failed to initialize ${language} content.`);
                    return;
                }
            }

            const processorUrl = `${processor.processorUrl}?articleId=${articleId}`;
            window.open(processorUrl, '_blank');
        }
    }, [articleId, languageData, fetchClient.put, loadLanguageData]);

    // Bulk publish handler that sets all to the desired state
    const handleBulkPublish = useCallback(async (shouldPublish: boolean) => {
        try {
            console.log(`[ProcessedDataDisplay] Bulk publish: setting all languages to ${shouldPublish ? 'published' : 'draft'}`);

            if (!Array.isArray(languageData)) return;

            // Update the bulk state immediately for UI feedback
            setBulkPublishState(shouldPublish);

            // Update all languages to the desired state
            const updatePromises = languageData.map(async (lang) => {
                // Only update if the current state is different from desired state
                if (lang.published !== shouldPublish) {
                    try {
                        setIsUpdating(prev => ({ ...prev, [`bulk_publish_${lang.id}`]: true }));

                        // Use fetchClient.put directly without extra data
                        const response = await fetch(`/per-language/content/${lang.id}/publish`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                            },
                            body: JSON.stringify({
                                published: shouldPublish
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to update ${lang.language}: ${response.status}`);
                        }

                        console.log(`[ProcessedDataDisplay] ✅ ${lang.language} set to ${shouldPublish ? 'published' : 'draft'}`);
                    } catch (error) {
                        console.error(`[ProcessedDataDisplay] Error updating ${lang.language} publish state:`, error);
                        throw error;
                    } finally {
                        setIsUpdating(prev => ({ ...prev, [`bulk_publish_${lang.id}`]: false }));
                    }
                }
            });

            // Wait for all updates to complete
            await Promise.all(updatePromises);

            // Update local state to reflect the changes
            setLanguageData(prev => {
                if (!Array.isArray(prev)) return [];
                return prev.map(lang => ({
                    ...lang,
                    published: shouldPublish
                }));
            });

            console.log(`[ProcessedDataDisplay] ✅ Bulk publish completed: all languages set to ${shouldPublish ? 'published' : 'draft'}`);

        } catch (error) {
            console.error('[ProcessedDataDisplay] Error in bulk publish:', error);
            setError(`Bulk publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [languageData]);

    // Update bulk publish state based on current language data
    useEffect(() => {
        if (languageData && Array.isArray(languageData) && languageData.length > 0) {
            // Set bulk state based on majority of languages
            const publishedCount = languageData.filter(lang => lang.published).length;
            const shouldBeBulkPublished = publishedCount > languageData.length / 2;
            setBulkPublishState(shouldBeBulkPublished);
        }
    }, [languageData]);

    const handleBulkAccessTier = useCallback(async (tier: string) => {
        try {
            if (!Array.isArray(languageData)) return;
            const targetLanguages = languageData.filter(lang => lang.access_tier !== tier);
            for (const lang of targetLanguages) {
                await handleAccessTierChange(lang.id, tier);
            }
        } catch (error) {
            console.error('Error in bulk access tier update:', error);
        }
    }, [languageData, handleAccessTierChange]);

    // All other handlers with useCallback...
    const toggleCardExpansion = useCallback((languageId: number) => {
        setExpandedCards(prev => ({
            ...prev,
            [languageId]: !prev[languageId]
        }));
    }, []);

    const handleOpenLanguageCard = useCallback(async (languageCode: string) => {
        const existingLang = languageData.find(lang => lang.language === languageCode);
        if (existingLang) {
            setVisibleCards(prev => new Set([...prev, existingLang.id]));
        } else {
            const newLangData = {
                id: Date.now(),
                language: languageCode,
                per_language_text: '',
                processed_data: {},
                difficulty_data: {},
                display_skill: '',
                published: false,
                access_tier: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            setLanguageData(prev => [...prev, newLangData]);
            setVisibleCards(prev => new Set([...prev, newLangData.id]));
        }
    }, [languageData]);

    const handleCloseCard = useCallback((languageId: number) => {
        setLanguageData(prev => prev.filter(lang => lang.id !== languageId));
    }, []);

    const getLanguageInfo = useCallback((languageCode: string) => {
        if (!languageCode || typeof languageCode !== 'string') {
            return {
                code: 'unknown',
                name: 'Unknown Language',
                hasProcessor: false,
                difficultyLabel: 'Level'
            };
        }

        const found = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
        return found || {
            code: languageCode,
            name: languageCode.toUpperCase(),
            hasProcessor: false,
            difficultyLabel: 'Level'
        };
    }, []);

    if (isLoading) {
        return (
            <Box padding={4}>
                <Flex direction="column" alignItems="center" gap={3}>
                    <Loader />
                    <Typography variant="pi" color="neutral600">Loading language data...</Typography>
                </Flex>
            </Box>
        );
    }

    if (error) {
        return (
            <Box padding={4}>
                <Flex direction="column" gap={3}>
                    <Alert variant="danger" title="Error">
                        {error}
                    </Alert>
                    <Button onClick={handleRefresh} startIcon={<ChartCircle stroke="silver" />}>
                        Try Again
                    </Button>
                </Flex>
            </Box>
        );
    }

    if (!Array.isArray(languageData) || languageData.length === 0) {
        return (
            <Box padding={4}>
                <EmptyStateLayout
                    content="No language content found for this article. Use the Language Processor field in the article editor to create translated content."
                    action={
                        <Button onClick={handleRefresh} startIcon={<ChartCircle stroke="silver" />}>
                            Refresh
                        </Button>
                    }
                />
            </Box>
        );
    }

    return (
        <Box width="100%">
            <BulkControls
                onLanguageSelect={handleOpenLanguageCard}
                onRefresh={handleRefresh}
                onBulkPublish={handleBulkPublish}
                onBulkAccessTier={handleBulkAccessTier}
                bulkPublishState={bulkPublishState}
            />
            <Flex direction="column" gap={4}>
                {languageData
                    .filter(lang => visibleCards.size === 0 || visibleCards.has(lang.id))
                    .map((lang, index) => {
                        const processor = getLanguageInfo(lang.language);

                        return (
                            <LanguageCard
                                key={`lang-${lang.id}-${lang.language}-${index}`}
                                language={lang}
                                processor={processor}
                                index={index}
                                isExpanded={expandedCards[lang.id] || false}
                                isUpdating={isUpdating}
                                showAllGrammar={showAllGrammar}
                                showAllTranslations={showAllTranslations}
                                onToggleExpansion={toggleCardExpansion}
                                onClose={handleCloseCard}
                                onRefresh={handleLanguageRefresh}
                                onPublishToggle={handlePublishToggle}
                                onAccessTierChange={handleAccessTierChange}
                                onOpenProcessor={handleOpenProcessor}
                                onDelete={handleLanguageDelete}
                                onGrammarExpansionToggle={(languageId: number) =>
                                    setShowAllGrammar(prev => ({
                                        ...prev,
                                        [languageId]: !prev[languageId]
                                    }))
                                }
                                onTranslationExpansionToggle={(languageId: number) =>
                                    setShowAllTranslations(prev => ({
                                        ...prev,
                                        [languageId]: !prev[languageId]
                                    }))
                                }
                            />
                        );
                    })}
            </Flex>
        </Box>
    );
};