// FIXED VERSION: ProcessedDataDisplay with proper access_tier handling
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
    Crown,
    Gift,
    CheckCircle,
    ExclamationMarkCircle
} from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';

interface ProcessedDataDisplayProps {
    articleId: string;
    onRefresh?: () => void;
}

interface LanguageData {
    id: number;
    language: string;
    per_language_text: string;
    processed_data: ProcessedData;
    difficulty_data: any;
    display_skill: string;
    published: boolean;
    access_tier: string | null; // FIXED: Allow null values
    created_at: string;
    updated_at: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ProcessedData {
    hsk?: HSKData;
    grammar?: GrammarData;
}

interface HSKData {
    calculatedLevel: number;
    selectedLevel: number;
    distribution: number[];
}

interface GrammarData {
    sentences: GrammarSentence[];
}

interface GrammarSentence {
    sentence: string;
    translation: string;
    rules: string[];
    translations?: Translation[];
}

interface Translation {
    text: string;
    language: string;
}

interface LanguageProcessor {
    code: string;
    name: string;
    hasProcessor: boolean;
    processorUrl?: string;
    difficultyLabel: string;
}

const SUPPORTED_LANGUAGES: LanguageProcessor[] = [
    {
        code: 'zh',
        name: 'Chinese (中文)',
        hasProcessor: true,
        processorUrl: '/admin/plugins/chinese-article-processor/chinese-processor',
        difficultyLabel: 'HSK'
    },
    {
        code: 'es',
        name: 'Spanish (Español)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    },
    {
        code: 'fr',
        name: 'French (Français)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    },
    {
        code: 'de',
        name: 'German (Deutsch)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    },
    {
        code: 'ja',
        name: 'Japanese (日本語)',
        hasProcessor: false,
        difficultyLabel: 'JLPT'
    },
    {
        code: 'pt',
        name: 'Portuguese (Português)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    }
];

// FIXED: Updated access tiers to handle null state properly
const ACCESS_TIERS = [
    { value: '', label: 'Select Access Tier', icon: ExclamationMarkCircle, disabled: true }, // Placeholder option
    { value: 'Free', label: 'Free', icon: Gift, disabled: false },
    { value: 'Login', label: 'Login Required', icon: CheckCircle, disabled: false },
    { value: 'Premium', label: 'Premium', icon: Crown, disabled: false }
];

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

    const handleOpenProcessor = (language: string) => {
        const processor = SUPPORTED_LANGUAGES.find(l => l.code === language);

        if (processor?.hasProcessor && processor.processorUrl) {
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

    const renderGrammarRules = (lang: LanguageData, processor: LanguageProcessor) => {
        if (!lang.processed_data?.grammar?.sentences) {
            return (
                <Typography variant="pi" color="neutral600">
                    No grammar rules available
                </Typography>
            );
        }

        // FILTER: Only show sentences that have grammar rules
        const sentencesWithRules = lang.processed_data.grammar.sentences.filter(
            (sentence: GrammarSentence) => sentence.rules && sentence.rules.length > 0
        );

        const totalRules = sentencesWithRules.reduce((total, sentence) => total + (sentence.rules?.length || 0), 0);

        if (totalRules === 0) {
            return (
                <Typography variant="pi" color="neutral600">
                    No grammar rules generated
                </Typography>
            );
        }

        const defaultShowCount = 2; // Show fewer by default for grammar
        const isExpanded = showAllGrammar[lang.id] || false;
        const displaySentences = isExpanded ? sentencesWithRules : sentencesWithRules.slice(0, defaultShowCount);
        const hasMore = sentencesWithRules.length > defaultShowCount;

        const toggleGrammarExpansion = () => {
            setShowAllGrammar(prev => ({
                ...prev,
                [lang.id]: !prev[lang.id]
            }));
        };

        return (
            <Box>
                <Flex gap={2} alignItems="center" paddingBottom={2}>
                    <Typography variant="epsilon" fontWeight="bold">Grammar Analysis</Typography>
                    <Badge backgroundColor="primary200" textColor="primary700">{totalRules} rules</Badge>
                </Flex>

                <Stack spacing={3}>
                    {displaySentences.map((sentence: GrammarSentence, index: number) => (
                        <Box key={index} padding={2} background="neutral100" borderRadius="4px">
                            <Typography variant="pi" fontWeight="bold" color="primary600" paddingBottom={2}>
                                {sentence.sentence}
                            </Typography>
                            {sentence.rules && sentence.rules.length > 0 && (
                                <Box>
                                    {sentence.rules.map((rule: string, ruleIndex: number) => (
                                        <Typography key={ruleIndex} variant="pi" color="neutral600" paddingLeft={2} paddingBottom={1}>
                                            • {rule}
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    ))}

                    {hasMore && (
                        <Box textAlign="center" paddingTop={2}>
                            <Button
                                variant="ghost"
                                size="S"
                                onClick={toggleGrammarExpansion}
                                style={{ color: '#4945ff', textDecoration: 'underline', background: 'none', border: 'none' }}
                            >
                                {isExpanded
                                    ? `Show less...`
                                    : `See more sentences... (${sentencesWithRules.length - defaultShowCount} more)`
                                }
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Box>
        );
    };

    const renderTranslationData = (lang: LanguageData, processor: LanguageProcessor) => {
        if (!lang.processed_data?.grammar?.sentences) {
            return (
                <Typography variant="pi" color="neutral600">
                    No translation data available
                </Typography>
            );
        }

        const sentences = lang.processed_data.grammar.sentences;
        const hasMultilingualTranslations = sentences.some((s: GrammarSentence) => s.translations && s.translations.length > 1);

        const defaultShowCount = 4; // Show more by default for translation analysis (right side)
        const isExpanded = showAllTranslations[lang.id] || false;
        const displaySentences = isExpanded ? sentences : sentences.slice(0, defaultShowCount);
        const hasMore = sentences.length > defaultShowCount;

        const toggleTranslationExpansion = () => {
            setShowAllTranslations(prev => ({
                ...prev,
                [lang.id]: !prev[lang.id]
            }));
        };

        return (
            <Box>
                <Typography variant="epsilon" fontWeight="bold" paddingBottom={2}>
                    Translation Analysis
                </Typography>

                <Stack spacing={2}>
                    {displaySentences.map((sentence: GrammarSentence, index: number) => (
                        <Box key={index} padding={2} background="neutral100" borderRadius="4px">
                            <Typography variant="pi" fontWeight="bold" color="primary600">
                                {sentence.sentence}
                            </Typography>
                            <Typography variant="pi" color="neutral700" paddingTop={1}>
                                Primary: {sentence.translation}
                            </Typography>

                            {sentence.translations && sentence.translations.length > 1 && (
                                <Box paddingTop={1}>
                                    {sentence.translations.slice(0, 2).map((trans: Translation, transIndex: number) => (
                                        <Flex key={transIndex} gap={2} alignItems="center" paddingTop={1}>
                                            <Badge size="S" backgroundColor="secondary200">
                                                {trans.language?.toUpperCase() || 'EN'}
                                            </Badge>
                                            <Typography variant="pi" color="neutral600">
                                                {trans.text}
                                            </Typography>
                                        </Flex>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    ))}

                    {hasMore && (
                        <Box textAlign="center" paddingTop={2}>
                            <Button
                                variant="ghost"
                                size="S"
                                onClick={toggleTranslationExpansion}
                                style={{ color: '#4945ff', textDecoration: 'underline', background: 'none', border: 'none' }}
                            >
                                {isExpanded
                                    ? `Show less...`
                                    : `See more sentences... (${sentences.length - defaultShowCount} more)`
                                }
                            </Button>
                        </Box>
                    )}

                    {hasMultilingualTranslations && (
                        <Flex gap={1} paddingTop={2}>
                            <Typography variant="pi" color="neutral600">Available in:</Typography>
                            {[...new Set(sentences.flatMap((s: GrammarSentence) => s.translations?.map((t: Translation) => t.language) || []))].map((lang: string) => (
                                <Badge key={lang} size="S" backgroundColor="secondary200">
                                    {lang?.toUpperCase()}
                                </Badge>
                            ))}
                        </Flex>
                    )}
                </Stack>
            </Box>
        );
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
            <Card marginBottom={4}>
                <CardBody>
                    <Box width="100%" padding={4}>
                        <Stack spacing={4}>
                            {/* Line 1: Open Language Card */}
                            <Flex justifyContent="space-between" alignItems="center">
                                <Flex gap={3} alignItems="center">
                                    <Typography variant="pi" fontWeight="bold">Open Language Card:</Typography>
                                    <Select placeholder="Select language to view" size="S" onChange={(value: string) => handleOpenLanguageCard(value)}>
                                        <Option value="zh">Chinese (中文) ⚙️</Option>
                                        <Option value="es">Spanish (Español) 🚧</Option>
                                        <Option value="fr">French (Français) 🚧</Option>
                                        <Option value="de">German (Deutsch) 🚧</Option>
                                        <Option value="ja">Japanese (日本語) 🚧</Option>
                                        <Option value="pt">Portuguese (Português) 🚧</Option>
                                    </Select>
                                </Flex>
                                <Button
                                    startIcon={<Refresh />}
                                    variant="tertiary"
                                    onClick={handleRefresh}
                                    size="S"
                                >
                                    Refresh All
                                </Button>
                            </Flex>

                            {/* Line 2: Streamlined Bulk Actions */}
                            <Flex gap={4} alignItems="center" wrap="wrap">
                                <Typography variant="pi" fontWeight="bold">Bulk Actions:</Typography>

                                <Flex gap={2} alignItems="center" wrap="nowrap">
                                    <Typography variant="pi" style={{ whiteSpace: 'nowrap' }}>Publish All:</Typography>
                                    <ToggleCheckbox
                                        checked={bulkPublishState}
                                        onChange={(checked: boolean) => handleBulkPublishToggle(checked)}
                                    />
                                </Flex>

                                <Flex gap={2} alignItems="center">
                                    <Typography variant="pi">Set All:</Typography>
                                    <Select size="S" onChange={(value: string) => handleBulkAccessTier(value)}>
                                        <Option value="Free">Free</Option>
                                        <Option value="Login">Login Required</Option>
                                        <Option value="Premium">Premium</Option>
                                    </Select>
                                </Flex>
                            </Flex>
                        </Stack>
                    </Box>
                </CardBody>
            </Card>

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
                                                            <Select
                                                                value={getAccessTierDisplayValue(lang.access_tier)}
                                                                onChange={(value: string) => handleAccessTierChange(lang.id, value)}
                                                                disabled={isUpdating[`tier_${lang.id}`]}
                                                                size="S"
                                                                placeholder="Select Access Tier"
                                                                // Add visual indicator for required field
                                                                error={!lang.access_tier ? "Access tier is required" : undefined}
                                                            >
                                                                {ACCESS_TIERS.map(tier => (
                                                                    <Option
                                                                        key={tier.value}
                                                                        value={tier.value}
                                                                        disabled={tier.disabled}
                                                                    >
                                                                        {tier.label}
                                                                    </Option>
                                                                ))}
                                                            </Select>
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
                                                                        {/* HSK Level Details for Chinese */}
                                                                        {processor.code === 'zh' && lang.processed_data.hsk && (
                                                                            <Box paddingBottom={4}>
                                                                                <Typography variant="epsilon" fontWeight="bold" paddingBottom={3}>
                                                                                    HSK Analysis
                                                                                </Typography>
                                                                                <Flex gap={3} alignItems="center">
                                                                                    <Flex gap={1} alignItems="center">
                                                                                        <Typography variant="pi">Calculated:</Typography>
                                                                                        <Badge backgroundColor="primary200" textColor="primary700">
                                                                                            HSK {lang.processed_data.hsk.calculatedLevel}
                                                                                        </Badge>
                                                                                    </Flex>
                                                                                    <Flex gap={1} alignItems="center">
                                                                                        <Typography variant="pi">Selected:</Typography>
                                                                                        <Badge backgroundColor="success200" textColor="success700">
                                                                                            HSK {lang.processed_data.hsk.selectedLevel}
                                                                                        </Badge>
                                                                                    </Flex>
                                                                                </Flex>
                                                                            </Box>
                                                                        )}

                                                                        {/* Grammar Rules Section */}
                                                                        {renderGrammarRules(lang, processor)}
                                                                    </GridItem>

                                                                    <GridItem col={6}>
                                                                        {/* Translation Data Section */}
                                                                        {renderTranslationData(lang, processor)}
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