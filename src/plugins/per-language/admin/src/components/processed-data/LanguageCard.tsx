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
    ExclamationMarkCircle
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
    onTranslationExpansionToggle
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
                        {/* Status badges and action buttons */}
                        <Flex justifyContent="space-between" alignItems="center">
                            <Flex gap={3} alignItems="center">
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

                        {/* Access tier and publish controls */}
                        <Flex justifyContent="space-between" alignItems="center">
                            <Flex gap={4} alignItems="center">
                                <Flex gap={2} alignItems="center">
                                    <TierIcon width="16px" height="16px" />
                                    <Typography variant="pi" textColor="neutral600">Access Tier:</Typography>
                                    <AccessTierSelect
                                        value={lang.access_tier}
                                        onChange={(value: string) => onAccessTierChange(lang.id, value)}
                                        disabled={isUpdating[`tier_${lang.id}`]}
                                        size="S"
                                        error={!lang.access_tier ? "Access tier is required" : undefined}
                                    />
                                </Flex>

                                <Flex gap={2} alignItems="center">
                                    {lang.published ? <Eye width="16px" height="16px" /> : <EyeStriked width="16px" height="16px" />}
                                    <ToggleCheckbox
                                        checked={lang.published || false}
                                        onChange={() => onPublishToggle(lang.id, lang.published)}
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

                        {/* Metrics display */}
                        {getMetricsDisplay(lang, processor)}

                        {/* Expandable Details Section */}
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
                                        {isExpanded ? 'Hide Grammar & Translation Details' : 'Show Grammar & Translation Details'}
                                    </Button>
                                </Box>

                                {isExpanded && (
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
                                                    onToggleExpansion={() => onGrammarExpansionToggle(lang.id)}
                                                />
                                            </GridItem>

                                            <GridItem col={6}>
                                                {/* Translation Data Section */}
                                                <TranslationAnalysis
                                                    sentences={lang.processed_data.grammar?.sentences || []}
                                                    processor={processor}
                                                    languageId={lang.id}
                                                    isExpanded={showAllTranslations[lang.id] || false}
                                                    onToggleExpansion={() => onTranslationExpansionToggle(lang.id)}
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
};