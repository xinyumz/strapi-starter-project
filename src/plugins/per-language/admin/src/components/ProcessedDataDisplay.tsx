// src/plugins/per-language/admin/src/components/ProcessedDataDisplay.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    Stack,
    EmptyStateLayout,
    Tag
} from '@strapi/design-system';
import {
    Refresh,
    ExclamationMarkCircle
} from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';

import {
    SUPPORTED_LANGUAGES,
    LanguageData,
} from './shared';

import {
    BulkControls,
    LanguageCard
} from './processed-data';

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

    // FIXED: Move useState hooks to component level to avoid re-render issues
    const [showAllGrammar, setShowAllGrammar] = useState<Record<number, boolean>>({});
    const [showAllTranslations, setShowAllTranslations] = useState<Record<number, boolean>>({});

    const { get, put } = useFetchClient();

    useEffect(() => {
        if (articleId) {
            loadLanguageData();
        }
    }, [articleId]);

    const loadLanguageData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await get(`/per-language/article/${articleId}/languages`);

            let data = [];
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                data = response.data.data;
            } else if (response.data && Array.isArray(response.data)) {
                data = response.data;
            }

            setLanguageData(data);

        } catch (err: any) {
            console.error('Error loading language data:', err);
            setError(err.message || 'Failed to load language data');
            setLanguageData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await loadLanguageData();
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleLanguageRefresh = async (languageId: number, languageCode: string) => {
        try {
            setIsUpdating(prev => ({ ...prev, [`refresh_${languageId}`]: true }));

            console.log(`[Frontend Refresh] Refreshing language ${languageCode} for article ${articleId}`);

            // Call the individual refresh endpoint to update backend data
            await get(`/per-language/article/${articleId}/language/${languageCode}/refresh`);

            // Then reload all language data to get the updated information
            await loadLanguageData();

            console.log(`[Frontend Refresh] ✅ Successfully refreshed language ${languageCode}`);

        } catch (error) {
            console.error(`[Frontend Refresh] Error refreshing language ${languageCode}:`, error);
            setError(`Failed to refresh ${languageCode} data`);
        } finally {
            setIsUpdating(prev => ({ ...prev, [`refresh_${languageId}`]: false }));
        }
    };

    const handlePublishToggle = async (languageId: number, currentPublished: boolean) => {
        try {
            setIsUpdating(prev => ({ ...prev, [`publish_${languageId}`]: true }));

            await put(`/per-language/content/${languageId}/publish`, {
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
    };

    // FIXED: Updated access tier change handler to handle null values properly
    const handleAccessTierChange = async (languageId: number, newTier: string) => {
        // Don't allow selection of the placeholder option
        if (newTier === '') {
            return;
        }

        try {
            setIsUpdating(prev => ({ ...prev, [`tier_${languageId}`]: true }));

            await put(`/per-language/content/${languageId}/access-tier`, {
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
    };

    const handleOpenProcessor = async (language: string) => {
        const processor = SUPPORTED_LANGUAGES.find(l => l.code === language);

        if (processor?.hasProcessor && processor.processorUrl) {
            // Check if there's already content for this language
            const existingLang = languageData.find(lang => lang.language === language);

            if (!existingLang) {
                // Create an empty entry in per_languages table first
                try {
                    console.log(`[ProcessedDataDisplay] Creating empty ${language} entry for article ${articleId}`);

                    // Use the same endpoint that works for translation
                    const response = await put(`/per-language/article/${articleId}/content`, {
                        language: language,
                        content: ' ' // Use a space instead of empty string to ensure it's not filtered out
                    });

                    console.log(`[ProcessedDataDisplay] ✅ Empty ${language} entry created:`, response);

                    // Refresh the data to show the new entry
                    await loadLanguageData();

                    // Small delay to ensure backend processing is complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`[ProcessedDataDisplay] Failed to create ${language} entry:`, error);
                    alert(`Failed to initialize ${language} content. Please translate content first using the "Translate to ${processor.name}" button above.`);
                    return;
                }
            }

            const processorUrl = `${processor.processorUrl}?articleId=${articleId}`;
            console.log(`[ProcessedDataDisplay] Opening processor: ${processorUrl}`);
            window.open(processorUrl, '_blank');
        }
    };
    const handleBulkPublish = async (publish: boolean) => {
        try {
            if (!Array.isArray(languageData)) return;

            const targetLanguages = languageData.filter(lang => lang.published !== publish);

            for (const lang of targetLanguages) {
                await handlePublishToggle(lang.id, lang.published);
            }
        } catch (error) {
            console.error('Error in bulk publish:', error);
        }
    };

    const handleBulkAccessTier = async (tier: string) => {
        try {
            if (!Array.isArray(languageData)) return;

            const targetLanguages = languageData.filter(lang => lang.access_tier !== tier);

            for (const lang of targetLanguages) {
                await handleAccessTierChange(lang.id, tier);
            }
        } catch (error) {
            console.error('Error in bulk access tier update:', error);
        }
    };

    const toggleCardExpansion = (languageId: number) => {
        setExpandedCards(prev => ({
            ...prev,
            [languageId]: !prev[languageId]
        }));
    };

    const handleOpenLanguageCard = async (languageCode: string) => {
        try {
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
                    access_tier: null, // FIXED: Start with null instead of 'Free'
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                setLanguageData(prev => [...prev, newLangData]);
                setVisibleCards(prev => new Set([...prev, newLangData.id]));
            }
        } catch (error) {
            console.error('Error opening language card:', error);
        }
    };

    const handleBulkPublishToggle = async (checked: boolean) => {
        setBulkPublishState(checked);
        await handleBulkPublish(checked);
    };

    const handleCloseCard = (languageId: number) => {
        setLanguageData(prev => prev.filter(lang => lang.id !== languageId));
    };

    const getLanguageInfo = (languageCode: string) => {
        if (!languageCode || typeof languageCode !== 'string') {
            return {
                code: 'unknown',
                name: 'Unknown Language',
                hasProcessor: false,
                difficultyLabel: 'Level'
            };
        }

        const found = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
        if (found) {
            return found;
        }

        return {
            code: languageCode,
            name: languageCode.toUpperCase(),
            hasProcessor: false,
            difficultyLabel: 'Level'
        };
    };

    if (isLoading) {
        return (
            <Box padding={4}>
                <Typography>Loading language data...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box padding={4}>
                <Alert variant="danger" title="Error" message={error} />
                <Button onClick={handleRefresh} marginTop={2}>
                    Try Again
                </Button>
            </Box>
        );
    }

    if (!Array.isArray(languageData) || languageData.length === 0) {
        return (
            <Box padding={4}>
                <EmptyStateLayout
                    icon={ExclamationMarkCircle}
                    content="No language content found for this article. Use the Language Processor field in the article editor to create translated content."
                    action={
                        <Button onClick={handleRefresh} startIcon={<Refresh />}>
                            Refresh
                        </Button>
                    }
                />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with bulk controls */}
            <BulkControls
                onLanguageSelect={handleOpenLanguageCard}
                onRefresh={handleRefresh}
                onBulkPublish={handleBulkPublish}
                onBulkAccessTier={handleBulkAccessTier}
                bulkPublishState={bulkPublishState}
            />
            {/* Language cards */}
            <Stack spacing={4}>
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
            </Stack>
        </Box>
    );
};