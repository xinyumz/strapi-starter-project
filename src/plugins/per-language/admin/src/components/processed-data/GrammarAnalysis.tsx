// src/plugins/per-language/admin/src/components/processed-data/GrammarAnalysis.tsx

import React from 'react';
import { Box, Button, Flex, Typography, Badge } from '@strapi/design-system';
import { GrammarSentence, LanguageProcessor } from '../shared/types';

interface GrammarAnalysisProps {
    sentences: GrammarSentence[];
    processor: LanguageProcessor;
    languageId: number;
    isExpanded: boolean;
    onToggleExpansion: () => void;
}

export const GrammarAnalysis: React.FC<GrammarAnalysisProps> = ({
    sentences,
    processor,
    languageId,
    isExpanded,
    onToggleExpansion
}) => {
    if (!sentences || sentences.length === 0) {
        return (
            <Typography variant="pi" color="neutral600">
                No grammar rules available
            </Typography>
        );
    }

    // Filter: Only show sentences that have grammar rules
    const sentencesWithRules = sentences.filter(
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
    const displaySentences = isExpanded ? sentencesWithRules : sentencesWithRules.slice(0, defaultShowCount);
    const hasMore = sentencesWithRules.length > defaultShowCount;

    return (
        <Box>
            <Flex gap={2} alignItems="center" paddingBottom={2}>
                <Typography variant="epsilon" fontWeight="bold">Grammar Analysis</Typography>
                <Badge backgroundColor="primary200" textColor="primary700">{totalRules} rules</Badge>
            </Flex>

            <Flex gap={3}>
                {displaySentences.map((sentence: GrammarSentence, index: number) => (
                    <Box key={index} padding={2} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" fontWeight="bold" color="primary600" paddingBottom={2}>
                            {sentence.sentence}
                        </Typography>
                        {/* Focus only on grammar rules - no translations */}
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
                            onClick={onToggleExpansion}
                            style={{ color: '#4945ff', textDecoration: 'underline', background: 'none', border: 'none' }}
                        >
                            {isExpanded
                                ? `Show less...`
                                : `See more sentences... (${sentencesWithRules.length - defaultShowCount} more)`
                            }
                        </Button>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};