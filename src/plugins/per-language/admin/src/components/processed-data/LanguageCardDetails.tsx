// src/plugins/per-language/admin/src/components/processed-data/LanguageCardDetails.tsx

import React from 'react';
import {
    Box,
    Flex,
    Typography,
    Badge,
    Button
} from '@strapi/design-system';
import { LanguageData, LanguageProcessor } from '../shared/types';

interface LanguageCardDetailsProps {
    language: LanguageData;
    processor: LanguageProcessor;
    showAllGrammar: boolean;
    onGrammarExpansionToggle: () => void;
}

export const LanguageCardDetails: React.FC<LanguageCardDetailsProps> = ({
    language: lang,
    processor,
    showAllGrammar,
    onGrammarExpansionToggle
}) => {
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
        <Box padding={4} background="neutral50" borderRadius="4px">
            <Box>
                {/* 1. Difficulty Levels Section - Dynamic */}
                {lang.display_skill && (
                    <Flex gap={2} alignItems="center" marginBottom={3}>
                        <Typography variant="beta" fontWeight="semiBold">
                            Difficulty Level:
                        </Typography>
                        <Badge backgroundColor="primary200" textColor="neutral800">
                            {lang.display_skill}
                        </Badge>
                    </Flex>
                )}

                {/* Fallback for when display_skill is not available but we have data */}
                {!lang.display_skill && lang.processed_data.hsk && (
                    <Flex gap={2} alignItems="center" marginBottom={3}>
                        <Typography variant="beta" fontWeight="semiBold">
                            Difficulty Level:
                        </Typography>
                        <Badge backgroundColor="primary200" textColor="neutral800">
                            {processor.difficultyLabel} {lang.processed_data.hsk.selectedLevel || lang.processed_data.hsk.calculatedLevel}
                        </Badge>
                    </Flex>
                )}

                {/* 2. Sentences Section */}
                {lang.processed_data.grammar?.sentences && lang.processed_data.grammar.sentences.length > 0 && (
                    <Box>
                        <Box marginBottom={3}>
                            <Typography variant="beta" fontWeight="semiBold" paddingBottom={3}>
                                Sentences
                            </Typography>
                        </Box>

                        <Box>
                            {lang.processed_data.grammar.sentences
                                .slice(0, showAllGrammar ? undefined : 3)
                                .map((sentence: any, index: number) => (
                                    <Box key={index} padding={3} background="neutral0" borderRadius="4px" shadow="filterShadow" marginBottom={2}>
                                        <Box>
                                            <Box marginBottom={2}>
                                                {/* Original sentence */}
                                                <Typography variant="epsilon" fontWeight="semiBold">
                                                    {sentence.sentence}
                                                </Typography>
                                            </Box>

                                            {/* English translation */}
                                            {sentence.translation && (
                                                <Box marginBottom={2}>
                                                    <Typography variant="pi" textColor="secondary600">
                                                        {sentence.translation}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Other language translations */}
                                            {sentence.translations && sentence.translations
                                                .filter((trans: any) => trans.language !== 'en')
                                                .length > 0 && (
                                                    <Box marginBottom={2}>
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
                                                                    >
                                                                        {getLanguageName(trans.language)}
                                                                    </Badge>
                                                                ))}
                                                        </Flex>
                                                    </Box>
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
                                        </Box>
                                    </Box>
                                ))}

                            {/* Show/Hide toggle for sentences */}
                            {lang.processed_data.grammar.sentences.length > 3 && (
                                <Box paddingTop={2}>
                                    <Button
                                        variant="tertiary"
                                        size="S"
                                        onClick={onGrammarExpansionToggle}
                                    >
                                        {showAllGrammar
                                            ? `Hide ${lang.processed_data.grammar.sentences.length - 3} more sentences`
                                            : `Show ${lang.processed_data.grammar.sentences.length - 3} more sentences`
                                        }
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};