// src/plugins/per-language/admin/src/components/processed-data/TranslationAnalysis.tsx

import React from 'react';
import { Box, Button, Flex, Typography, Badge } from '@strapi/design-system';
import { GrammarSentence, Translation, LanguageProcessor } from '../shared/types';

interface TranslationAnalysisProps {
    sentences: GrammarSentence[];
    processor: LanguageProcessor;
    languageId: number;
    isExpanded: boolean;
    onToggleExpansion: () => void;
}

export const TranslationAnalysis: React.FC<TranslationAnalysisProps> = ({
    sentences,
    processor,
    languageId,
    isExpanded,
    onToggleExpansion
}) => {
    if (!sentences || sentences.length === 0) {
        return (
            <Typography variant="pi" color="neutral600">
                No translation data available
            </Typography>
        );
    }

    const hasMultilingualTranslations = sentences.some((s: GrammarSentence) => s.translations && s.translations.length > 1);

    const defaultShowCount = 4; // Show more by default for translation analysis (right side)
    const displaySentences = isExpanded ? sentences : sentences.slice(0, defaultShowCount);
    const hasMore = sentences.length > defaultShowCount;

    return (
        <Box>
            <Typography variant="epsilon" fontWeight="bold" paddingBottom={2}>
                Translation Analysis
            </Typography>

            <Flex gap={2}>
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
                            onClick={onToggleExpansion}
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
            </Flex>
        </Box>
    );
};