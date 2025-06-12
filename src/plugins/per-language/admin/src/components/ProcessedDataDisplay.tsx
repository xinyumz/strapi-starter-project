// src/plugins/per-language/admin/src/components/ProcessedDataDisplay.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Flex,
    Typography,
    Badge,
    Select,
    Option,
    ToggleCheckbox,
    Grid,
    GridItem,
    Divider,
    Alert,
    Stack,
    EmptyStateLayout,
    Tag
} from '@strapi/design-system';
import {
    Refresh,
    Play,
    Eye,
    EyeStriked,
    ExclamationMarkCircle
} from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';

import {
    SUPPORTED_LANGUAGES,
    ACCESS_TIERS,
    LanguageData,
    ProcessedData,
    HSKData,
    GrammarData,
    GrammarSentence,
    Translation,
    LanguageProcessor,
    AccessTierSelect
} from './shared';

import {
    BulkControls,
    HSKAnalysis,
    GrammarAnalysis,
    TranslationAnalysis
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

                    await put(`/per-language/article/${articleId}/content`, {
                        language: language,
                        content: '' // Empty content to start
                    });

                    console.log(`[ProcessedDataDisplay] ✅ Empty ${language} entry created`);

                    // Refresh the data to show the new entry
                    await loadLanguageData();
                } catch (error) {
                    console.error(`[ProcessedDataDisplay] Failed to create ${language} entry:`, error);
                    alert(`Failed to initialize ${language} content. Please try translating content first.`);
                    return;
                }
            }

            const processorUrl = `${processor.processorUrl}?articleId=${articleId}`;
            window.open(processorUrl, '_blank');
        }
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

    const getStatusBadge = (lang: LanguageData, processor: LanguageProcessor) => {
        try {
            const hasContent = lang.per_language_text && lang.per_language_text.trim().length > 0;
            const hasProcessedData = lang.processed_data && Object.keys(lang.processed_data).length > 0;

            if (!hasContent) {
                return <Badge backgroundColor="neutral200" textColor="neutral700">No Content</Badge>;
            }

            if (!processor.hasProcessor) {
                return <Badge backgroundColor="warning200" textColor="warning700">Processor Coming Soon</Badge>;
            }

            if (hasProcessedData) {
                return <Badge backgroundColor="success200" textColor="success700">✅ Processed</Badge>;
            }

            return <Badge backgroundColor="primary200" textColor="primary700">Content Ready</Badge>;
        } catch (error) {
            console.error('Error in getStatusBadge:', error);
            return <Badge backgroundColor="neutral200">Unknown</Badge>;
        }
    };

    const getMetricsDisplay = (lang: LanguageData, processor: LanguageProcessor) => {
        try {
            const hasContent = lang.per_language_text && lang.per_language_text.trim().length > 0;
            const hasProcessedData = lang.processed_data && typeof lang.processed_data === 'object' && Object.keys(lang.processed_data).length > 0;

            return (
                <Flex gap={4} alignItems="center" wrap="wrap" justifyContent="flex-start">
                    <Flex gap={2} alignItems="center">
                        <Typography variant="pi" textColor="neutral600">Content:</Typography>
                        <Badge backgroundColor={hasContent ? "success200" : "neutral200"} textColor={hasContent ? "success700" : "neutral700"}>
                            {hasContent ? 'Available' : 'None'}
                        </Badge>
                    </Flex>

                    {hasProcessedData && (
                        <>
                            {lang.display_skill && (
                                <Flex gap={2} alignItems="center">
                                    <Typography variant="pi" textColor="neutral600">{processor.difficultyLabel}:</Typography>
                                    <Badge backgroundColor="primary200" textColor="primary700">{lang.display_skill}</Badge>
                                </Flex>
                            )}

                            {lang.processed_data.grammar?.sentences && (
                                <>
                                    <Flex gap={2} alignItems="center">
                                        <Typography variant="pi" textColor="neutral600">Grammar Rules:</Typography>
                                        <Badge backgroundColor="success200" textColor="success700">
                                            {lang.processed_data.grammar.sentences.reduce((total: number, sentence: GrammarSentence) =>
                                                total + (sentence.rules?.length || 0), 0
                                            )} rules
                                        </Badge>
                                    </Flex>

                                    <Flex gap={2} alignItems="center">
                                        <Typography variant="pi" textColor="neutral600">Sentences:</Typography>
                                        <Badge backgroundColor="neutral200" textColor="neutral700">
                                            {lang.processed_data.grammar.sentences.length} processed
                                        </Badge>
                                    </Flex>
                                </>
                            )}
                        </>
                    )}
                </Flex>
            );
        } catch (error) {
            console.error('Error in getMetricsDisplay:', error);
            return (
                <Typography variant="pi" color="danger600">
                    Error displaying metrics
                </Typography>
            );
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

    // FIXED: Helper function to get the correct icon for access tier
    const getAccessTierIcon = (accessTier: string | null) => {
        if (!accessTier) {
            return ExclamationMarkCircle; // Show warning icon for unset tier
        }
        const tier = ACCESS_TIERS.find(t => t.value === accessTier);
        return tier?.icon || ExclamationMarkCircle;
    };

    // FIXED: Helper function to get display value for access tier select
    const getAccessTierDisplayValue = (accessTier: string | null) => {
        return accessTier || ''; // Return empty string for null to show placeholder
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

            {/* Language cards - Full width with clean two-line layout */}
            <Stack spacing={4}>
                {languageData
                    .filter(lang => visibleCards.size === 0 || visibleCards.has(lang.id))
                    .map((lang, index) => {
                        try {
                            if (!lang || typeof lang !== 'object') {
                                return (
                                    <Card key={`invalid-${index}`}>
                                        <CardBody>
                                            <Typography variant="pi" color="danger600">
                                                Invalid language data at index {index}
                                            </Typography>
                                        </CardBody>
                                    </Card>
                                );
                            }

                            const processor = getLanguageInfo(lang.language);
                            const TierIcon = getAccessTierIcon(lang.access_tier); // FIXED: Use helper function

                            return (
                                <Card key={`lang-${lang.id}-${lang.language}-${index}`}>
                                    <CardHeader>
                                        <Flex justifyContent="space-between" alignItems="center" width="100%" padding={5}>
                                            <Typography variant="epsilon" fontWeight="semiBold" color="neutral800">
                                                {processor.name}
                                            </Typography>
                                            <Button
                                                variant="ghost"
                                                size="S"
                                                onClick={() => handleCloseCard(lang.id)}
                                                style={{
                                                    border: 'none',
                                                    padding: '4px',
                                                    minWidth: 'auto',
                                                    height: 'auto'
                                                }}
                                            >
                                                ✕
                                            </Button>
                                        </Flex>
                                    </CardHeader>
                                    <CardBody>
                                        <Box width="100%" padding={4}>
                                            <Stack spacing={4}>
                                                {/* Line 2: Status badges left, processor and refresh button right */}
                                                <Flex justifyContent="space-between" alignItems="center">
                                                    <Flex gap={3} alignItems="center">
                                                        {processor.hasProcessor && (
                                                            <Badge backgroundColor="success200" textColor="success700">
                                                                Processor Available
                                                            </Badge>
                                                        )}
                                                        {getStatusBadge(lang, processor)}
                                                        {/* FIXED: Add warning badge for unset access tier */}
                                                        {!lang.access_tier && (
                                                            <Badge backgroundColor="warning200" textColor="warning700">
                                                                ⚠️ Access Tier Required
                                                            </Badge>
                                                        )}
                                                    </Flex>

                                                    <Flex gap={2} alignItems="center">
                                                        <Button
                                                            variant="tertiary"
                                                            startIcon={<Refresh />}
                                                            onClick={() => handleLanguageRefresh(lang.id, lang.language)}
                                                            disabled={isUpdating[`refresh_${lang.id}`]}
                                                            size="S"
                                                        >
                                                            Refresh
                                                        </Button>
                                                        <Button
                                                            variant={processor.hasProcessor ? "default" : "secondary"}
                                                            startIcon={<Play />}
                                                            onClick={() => handleOpenProcessor(lang.language)}
                                                            disabled={!processor.hasProcessor}
                                                        >
                                                            Open Processor
                                                        </Button>
                                                    </Flex>
                                                </Flex>

                                                {/* Line 3: Access tier and publish toggle left, update date right */}
                                                <Flex justifyContent="space-between" alignItems="center">
                                                    <Flex gap={4} alignItems="center">
                                                        <Flex gap={2} alignItems="center">
                                                            <TierIcon width="16px" height="16px" />
                                                            <Typography variant="pi" textColor="neutral600">Access Tier:</Typography>
                                                            {/* FIXED: Proper handling of null access tier */}
                                                            <AccessTierSelect
                                                                value={lang.access_tier}
                                                                onChange={(value: string) => handleAccessTierChange(lang.id, value)}
                                                                disabled={isUpdating[`tier_${lang.id}`]}
                                                                size="S"
                                                                error={!lang.access_tier ? "Access tier is required" : undefined}
                                                            />
                                                        </Flex>

                                                        <Flex gap={2} alignItems="center">
                                                            {lang.published ? <Eye width="16px" height="16px" /> : <EyeStriked width="16px" height="16px" />}
                                                            <ToggleCheckbox
                                                                checked={lang.published || false}
                                                                onChange={() => handlePublishToggle(lang.id, lang.published)}
                                                                disabled={isUpdating[`publish_${lang.id}`]}
                                                            />
                                                            <Typography variant="pi" fontWeight="semiBold">
                                                                {lang.published ? 'Published' : 'Draft'}
                                                            </Typography>
                                                        </Flex>
                                                    </Flex>

                                                    <Typography variant="pi" textColor="neutral500">
                                                        Last updated: {new Date(lang.updatedAt || lang.updated_at).toLocaleDateString()}
                                                    </Typography>
                                                </Flex>

                                                {/* Metrics row */}
                                                {getMetricsDisplay(lang, processor)}

                                                {/* Expandable Details Section */}
                                                {lang.processed_data && Object.keys(lang.processed_data).length > 0 && (
                                                    <>
                                                        <Divider />
                                                        <Box width="100%">
                                                            <Button
                                                                variant="tertiary"
                                                                size="S"
                                                                onClick={() => toggleCardExpansion(lang.id)}
                                                                fullWidth
                                                            >
                                                                {expandedCards[lang.id] ? 'Hide Grammar & Translation Details' : 'Show Grammar & Translation Details'}
                                                            </Button>
                                                        </Box>

                                                        {expandedCards[lang.id] && (
                                                            <Box padding={4} background="neutral50" borderRadius="4px">
                                                                <Grid gap={6}>
                                                                    <GridItem col={6}>
                                                                        {/* HSK Level Details */}
                                                                        {lang.processed_data.hsk && (
                                                                            <HSKAnalysis
                                                                                hskData={lang.processed_data.hsk}
                                                                                processor={processor}
                                                                            />
                                                                        )}

                                                                        {/* Grammar Rules Section */}
                                                                        <GrammarAnalysis
                                                                            sentences={lang.processed_data.grammar?.sentences || []}
                                                                            processor={processor}
                                                                            languageId={lang.id}
                                                                            isExpanded={showAllGrammar[lang.id] || false}
                                                                            onToggleExpansion={() => setShowAllGrammar(prev => ({
                                                                                ...prev,
                                                                                [lang.id]: !prev[lang.id]
                                                                            }))}
                                                                        />
                                                                    </GridItem>

                                                                    <GridItem col={6}>
                                                                        {/* Translation Data Section */}
                                                                        <TranslationAnalysis
                                                                            sentences={lang.processed_data.grammar?.sentences || []}
                                                                            processor={processor}
                                                                            languageId={lang.id}
                                                                            isExpanded={showAllTranslations[lang.id] || false}
                                                                            onToggleExpansion={() => setShowAllTranslations(prev => ({
                                                                                ...prev,
                                                                                [lang.id]: !prev[lang.id]
                                                                            }))}
                                                                        />
                                                                    </GridItem>
                                                                </Grid>
                                                            </Box>
                                                        )}
                                                    </>
                                                )}
                                            </Stack>
                                        </Box>
                                    </CardBody>
                                </Card>
                            );
                        } catch (error) {
                            console.error('Error rendering language card:', error, lang);
                            return (
                                <Card key={`error-${index}`}>
                                    <CardBody>
                                        <Typography variant="pi" color="danger600">
                                            Error rendering language: {lang?.language || 'Unknown'}
                                        </Typography>
                                    </CardBody>
                                </Card>
                            );
                        }
                    })}
            </Stack>
        </Box>
    );
};