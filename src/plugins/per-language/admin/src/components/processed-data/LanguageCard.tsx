// src/plugins/per-language/admin/src/components/processed-data/LanguageCard.tsx

import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Flex,
    Typography,
    Badge,
    Button,
    ToggleCheckbox,
    Box,
    Stack,
    Divider,
    Grid,
    GridItem
} from '@strapi/design-system';
import {
    Refresh,
    Play,
    Eye,
    EyeStriked,
    ExclamationMarkCircle,
    Trash
} from '@strapi/icons';

import { LanguageData, LanguageProcessor } from '../shared/types';
import { ACCESS_TIERS } from '../shared/constants';
import { AccessTierSelect } from '../shared/AccessTierSelect';
import { HSKAnalysis, GrammarAnalysis, TranslationAnalysis } from './';

interface LanguageCardProps {
    language: LanguageData;
    processor: LanguageProcessor;
    index: number;
    isExpanded: boolean;
    isUpdating: Record<string, boolean>;
    showAllGrammar: Record<number, boolean>;
    showAllTranslations: Record<number, boolean>;
    onToggleExpansion: (languageId: number) => void;
    onClose: (languageId: number) => void;
    onRefresh: (languageId: number, languageCode: string) => void;
    onPublishToggle: (languageId: number, currentPublished: boolean) => void;
    onAccessTierChange: (languageId: number, tier: string) => void;
    onOpenProcessor: (language: string) => void;
    onGrammarExpansionToggle: (languageId: number) => void;
    onTranslationExpansionToggle: (languageId: number) => void;
    onDelete?: (languageId: number, languageName: string) => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
    language: lang,
    processor,
    index,
    isExpanded,
    isUpdating,
    showAllGrammar,
    showAllTranslations,
    onToggleExpansion,
    onClose,
    onRefresh,
    onPublishToggle,
    onAccessTierChange,
    onOpenProcessor,
    onGrammarExpansionToggle,
    onTranslationExpansionToggle,
    onDelete
}) => {
    // Helper function to get the correct icon for access tier
    const getAccessTierIcon = (accessTier: string | null) => {
        if (!accessTier) {
            return ExclamationMarkCircle;
        }
        const tier = ACCESS_TIERS.find(t => t.value === accessTier);
        return tier?.icon || ExclamationMarkCircle;
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

            return <Badge backgroundColor="secondary200" textColor="secondary700">Content Ready</Badge>;
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
                                    <Badge backgroundColor="secondary200" textColor="secondary700">{lang.display_skill}</Badge>
                                </Flex>
                            )}

                            {lang.processed_data.grammar?.sentences && (
                                <>
                                    <Flex gap={2} alignItems="center">
                                        <Typography variant="pi" textColor="neutral600">Grammar Rules:</Typography>
                                        <Badge backgroundColor="success200" textColor="success700">
                                            {lang.processed_data.grammar.sentences.reduce((total: number, sentence: any) =>
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

    // SIMPLIFIED: Handle delete with simple confirm dialog
    const handleDeleteClick = async () => {
        if (!onDelete) return;

        // Calculate what will be deleted for the warning
        const contentLength = lang.per_language_text?.length || 0;
        const sentenceCount = lang.processed_data?.grammar?.sentences?.length || 0;
        const grammarRuleCount = lang.processed_data?.grammar?.sentences?.reduce((total: number, sentence: any) =>
            total + (sentence.rules?.length || 0), 0
        ) || 0;

        // Create detailed warning message
        const warningMessage = `⚠️ DELETE ${processor.name.toUpperCase()} CONTENT

This will permanently delete:
• Translated content (${contentLength} characters)
• ${sentenceCount} processed sentences
• ${grammarRuleCount} grammar rules
• All processing metadata and settings
• Related sentence data from connected tables

The base article content will remain unchanged.

This action CANNOT be undone!

Are you sure you want to delete all ${processor.name} content?`;

        // Show confirmation dialog
        const confirmed = confirm(warningMessage);

        if (confirmed) {
            try {
                console.log(`[LanguageCard] User confirmed deletion of ${processor.name} content`);
                await onDelete(lang.id, processor.name);
            } catch (error) {
                console.error('Error deleting language content:', error);
                alert(`Failed to delete ${processor.name} content. Please try again.`);
            }
        } else {
            console.log(`[LanguageCard] User canceled deletion of ${processor.name} content`);
        }
    };

    // Handle invalid language data
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

    const TierIcon = getAccessTierIcon(lang.access_tier);

    // Helper function to get language names
    const getLanguageName = (languageCode: string) => {
        const languageNames: Record<string, string> = {
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'en': 'English'
        };
        return languageNames[languageCode] || languageCode.toUpperCase();
    };

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
                        onClick={() => onClose(lang.id)}
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
                        {/* Status badges and action buttons - Flex with wrap */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3}>
                            <Flex gap={3} alignItems="center" wrap="wrap" style={{ minWidth: 'fit-content' }}>
                                {processor.hasProcessor && (
                                    <Badge backgroundColor="success200" textColor="success700">
                                        Processor Available
                                    </Badge>
                                )}
                                {getStatusBadge(lang, processor)}
                                {!lang.access_tier && (
                                    <Badge backgroundColor="warning200" textColor="warning700">
                                        ⚠️ Access Tier Required
                                    </Badge>
                                )}
                            </Flex>

                            <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                                <Button
                                    variant="tertiary"
                                    startIcon={<Refresh />}
                                    onClick={() => onRefresh(lang.id, lang.language)}
                                    disabled={isUpdating[`refresh_${lang.id}`]}
                                    size="S"
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant={processor.hasProcessor ? "default" : "secondary"}
                                    startIcon={<Play />}
                                    onClick={() => onOpenProcessor(lang.language)}
                                    disabled={!processor.hasProcessor}
                                >
                                    Open Processor
                                </Button>
                            </Flex>
                        </Flex>

                        {/* Access tier, publish controls, and DELETE BUTTON - Flex with wrap */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3}>
                            <Flex gap={4} alignItems="center" wrap="wrap" style={{ minWidth: 'fit-content' }}>
                                <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                                    <TierIcon width="16px" height="16px" />
                                    <AccessTierSelect
                                        value={lang.access_tier}
                                        onChange={(value: string) => onAccessTierChange(lang.id, value)}
                                        disabled={isUpdating[`tier_${lang.id}`]}
                                        size="S"
                                        error={!lang.access_tier ? "Access tier is required" : undefined}
                                    />
                                </Flex>

                                <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                                    {lang.published ? <Eye width="16px" height="16px" /> : <EyeStriked width="16px" height="16px" />}
                                    <ToggleCheckbox
                                        checked={lang.published || false}
                                        onChange={() => onPublishToggle(lang.id, lang.published)}
                                        disabled={isUpdating[`publish_${lang.id}`]}
                                    />
                                    <Typography variant="pi" fontWeight="semiBold" style={{ whiteSpace: 'nowrap' }}>
                                        {lang.published ? 'Published' : 'Draft'}
                                    </Typography>
                                </Flex>
                            </Flex>

                            <Flex gap={3} alignItems="center" style={{ flexShrink: 0 }}>
                                <Typography variant="pi" textColor="neutral500" style={{ whiteSpace: 'nowrap' }}>
                                    Last updated: {new Date(lang.updatedAt || lang.updated_at).toLocaleDateString()}
                                </Typography>

                                {onDelete && (
                                    <Button
                                        variant="danger-light"
                                        startIcon={<Trash />}
                                        onClick={handleDeleteClick}
                                        disabled={isUpdating[`delete_${lang.id}`]}
                                        size="S"
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Flex>
                        </Flex>

                        {/* Metrics display */}
                        {getMetricsDisplay(lang, processor)}

                        {/* Expandable Details Section - Redesigned */}
                        {lang.processed_data && Object.keys(lang.processed_data).length > 0 && (
                            <>
                                <Divider />
                                <Box width="100%">
                                    <Button
                                        variant="tertiary"
                                        size="S"
                                        onClick={() => onToggleExpansion(lang.id)}
                                        fullWidth
                                    >
                                        {isExpanded ? 'Hide Sentence Details' : 'Show Sentence Details'}
                                    </Button>
                                </Box>

                                {isExpanded && (
                                    <Box padding={4} background="neutral50" borderRadius="4px">
                                        <Stack spacing={4}>
                                            {/* 1. Difficulty Levels Section - Dynamic */}
                                            {lang.display_skill && (
                                                <Flex gap={2} alignItems="center">
                                                    <Typography variant="beta" fontWeight="semiBold">
                                                        Difficulty Level:
                                                    </Typography>
                                                    <Badge backgroundColor="secondary200" textColor="secondary700">
                                                        {lang.display_skill}
                                                    </Badge>
                                                </Flex>
                                            )}

                                            {/* Fallback for when display_skill is not available but we have data */}
                                            {!lang.display_skill && lang.processed_data.hsk && (
                                                <Flex gap={2} alignItems="center">
                                                    <Typography variant="beta" fontWeight="semiBold">
                                                        Difficulty Level:
                                                    </Typography>
                                                    <Badge backgroundColor="secondary200" textColor="secondary700">
                                                        {processor.difficultyLabel} {lang.processed_data.hsk.selectedLevel || lang.processed_data.hsk.calculatedLevel}
                                                    </Badge>
                                                </Flex>
                                            )}

                                            {/* 2. Sentences Section */}
                                            {lang.processed_data.grammar?.sentences && lang.processed_data.grammar.sentences.length > 0 && (
                                                <Box>
                                                    <Typography variant="beta" fontWeight="semiBold" paddingBottom={3}>
                                                        Sentences
                                                    </Typography>

                                                    <Stack spacing={4}>
                                                        {lang.processed_data.grammar.sentences
                                                            .slice(0, showAllGrammar[lang.id] ? undefined : 3)
                                                            .map((sentence: any, index: number) => (
                                                                <Box key={index} padding={3} background="neutral0" borderRadius="4px" shadow="filterShadow">
                                                                    <Stack spacing={2}>
                                                                        {/* Original sentence */}
                                                                        <Typography variant="epsilon" fontWeight="semiBold">
                                                                            {sentence.sentence}
                                                                        </Typography>

                                                                        {/* English translation */}
                                                                        {sentence.translation && (
                                                                            <Typography variant="pi" textColor="secondary600">
                                                                                {sentence.translation}
                                                                            </Typography>
                                                                        )}

                                                                        {/* Other language translations */}
                                                                        {sentence.translations && sentence.translations
                                                                            .filter((trans: any) => trans.language !== 'en')
                                                                            .length > 0 && (
                                                                                <Flex gap={1} alignItems="center" wrap="wrap">
                                                                                    <Typography variant="pi" textColor="secondary600">
                                                                                        Also available in:
                                                                                    </Typography>
                                                                                    {sentence.translations
                                                                                        .filter((trans: any) => trans.language !== 'en')
                                                                                        .map((trans: any, transIndex: number) => (
                                                                                            <Badge
                                                                                                key={transIndex}
                                                                                                backgroundColor="secondary100"
                                                                                                textColor="secondary700"
                                                                                                variant="secondary"
                                                                                            >
                                                                                                {getLanguageName(trans.language)}
                                                                                            </Badge>
                                                                                        ))}
                                                                                </Flex>
                                                                            )}

                                                                        {/* Grammar rules */}
                                                                        {sentence.rules && sentence.rules.length > 0 && (
                                                                            <Box paddingTop={1}>
                                                                                {sentence.rules.map((rule: string, ruleIndex: number) => (
                                                                                    <Typography key={ruleIndex} variant="pi" textColor="neutral800" style={{ display: 'block', marginBottom: '4px' }}>
                                                                                        • {rule}
                                                                                    </Typography>
                                                                                ))}
                                                                            </Box>
                                                                        )}
                                                                    </Stack>
                                                                </Box>
                                                            ))}

                                                        {/* Show/Hide toggle for sentences */}
                                                        {lang.processed_data.grammar.sentences.length > 3 && (
                                                            <Box paddingTop={2}>
                                                                <Button
                                                                    variant="tertiary"
                                                                    size="S"
                                                                    onClick={() => onGrammarExpansionToggle(lang.id)}
                                                                >
                                                                    {showAllGrammar[lang.id]
                                                                        ? `Hide ${lang.processed_data.grammar.sentences.length - 3} more sentences`
                                                                        : `Show ${lang.processed_data.grammar.sentences.length - 3} more sentences`
                                                                    }
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>
                                )}
                            </>
                        )}
                    </Stack>
                </Box>
            </CardBody>
        </Card>
    );
};