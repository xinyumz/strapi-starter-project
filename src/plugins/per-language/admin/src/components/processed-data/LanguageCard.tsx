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
    Checkbox,
    Box,
    Divider
} from '@strapi/design-system';
import {
    ChartCircle,
    Eye,
    EyeStriked,
    Play
} from '@strapi/icons';

import { LanguageData, LanguageProcessor } from '../shared/types';
import { AccessTierSelect } from '../shared/AccessTierSelect';
import { LanguageCardDetails } from './LanguageCardDetails';

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

            return <Badge backgroundColor="primary200" textColor="neutral800">Content Ready</Badge>;
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
                <Flex gap={5} alignItems="center" wrap="wrap" justifyContent="flex-start" marginBottom={4}>
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
                                    <Badge backgroundColor="primary200" textColor="neutral800">{lang.display_skill}</Badge>
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

    // Handle delete with simple confirm dialog
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
        <Card key={`lang-${lang.id}-${lang.language}-${index}`} width="100%">
            <CardHeader>
                <Flex justifyContent="space-between" alignItems="center" width="100%">
                    <Box margin={3}>
                        <Typography variant="epsilon" fontWeight="semiBold" textColor="neutral800">
                            {processor.name}
                        </Typography>
                    </Box>
                    <Button
                        variant="ghost"
                        size="S"
                        onClick={() => onClose(lang.id)}
                    >
                        ✕
                    </Button>
                </Flex>
            </CardHeader>

            <CardBody>
                <Box width="100%">
                    <Box margin={4}>
                        {/* Status badges and action buttons */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3} marginBottom={4}>
                            <Flex gap={3} alignItems="center" wrap="wrap">
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

                            <Flex gap={2} alignItems="center">
                                <Button
                                    variant="tertiary"
                                    startIcon={<ChartCircle stroke="silver" />}
                                    onClick={() => onRefresh(lang.id, lang.language)}
                                    disabled={isUpdating[`refresh_${lang.id}`]}
                                    size="S"
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant={processor.hasProcessor ? "default" : "secondary"}
                                    onClick={() => onOpenProcessor(lang.language)}
                                    disabled={!processor.hasProcessor}
                                    size="S"
                                    startIcon={<Play stroke="white" />}
                                >
                                    Open Processor
                                </Button>
                            </Flex>
                        </Flex>

                        {/* Access tier, publish controls, and DELETE BUTTON */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3} marginBottom={4}>
                            <Flex gap={4} alignItems="center" wrap="wrap">
                                <Flex gap={2} alignItems="center">
                                    <AccessTierSelect
                                        value={lang.access_tier}
                                        onChange={(value: string) => onAccessTierChange(lang.id, value)}
                                        disabled={isUpdating[`tier_${lang.id}`]}
                                        size="S"
                                        error={!lang.access_tier ? "Access tier is required" : undefined}
                                    />
                                </Flex>

                                <Flex gap={2} alignItems="center">
                                    {lang.published ? <Eye width="16px" height="16px" stroke="silver" /> : <EyeStriked width="16px" height="16px" stroke="silver" />}
                                    <Checkbox
                                        checked={lang.published || false}
                                        onCheckedChange={() => onPublishToggle(lang.id, lang.published)}
                                        disabled={isUpdating[`publish_${lang.id}`]}
                                    />
                                    <Typography variant="pi" fontWeight="semiBold">
                                        {lang.published ? 'Published' : 'Draft'}
                                    </Typography>
                                </Flex>
                            </Flex>

                            <Flex gap={3} alignItems="center">
                                <Typography variant="pi" textColor="neutral500">
                                    Last updated: {new Date(lang.updatedAt || lang.updated_at).toLocaleDateString()}
                                </Typography>

                                {onDelete && (
                                    <Button
                                        variant="danger-light"
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

                        {/* Expandable Details Section */}
                        {lang.processed_data && Object.keys(lang.processed_data).length > 0 && (
                            <>
                                <Divider marginBottom={4} />
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
                                    <LanguageCardDetails
                                        language={lang}
                                        processor={processor}
                                        showAllGrammar={showAllGrammar[lang.id] || false}
                                        onGrammarExpansionToggle={() => onGrammarExpansionToggle(lang.id)}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </CardBody>
        </Card>
    );
};