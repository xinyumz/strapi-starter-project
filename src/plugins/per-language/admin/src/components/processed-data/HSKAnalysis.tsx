// src/plugins/per-language/admin/src/components/processed-data/HSKAnalysis.tsx

import React from 'react';
import { Box, Flex, Typography, Badge } from '@strapi/design-system';
import { HSKData, LanguageProcessor } from '../shared/types';

interface HSKAnalysisProps {
    hskData: HSKData;
    processor: LanguageProcessor;
}

export const HSKAnalysis: React.FC<HSKAnalysisProps> = ({ hskData, processor }) => {
    // Only show for Chinese or other languages with HSK-like data
    if (processor.code !== 'zh' || !hskData) {
        return null;
    }

    return (
        <Box paddingBottom={4}>
            <Typography variant="epsilon" fontWeight="bold" paddingBottom={3}>
                {processor.difficultyLabel} Analysis
            </Typography>
            <Flex gap={3} alignItems="center">
                <Flex gap={1} alignItems="center">
                    <Typography variant="pi">Calculated:</Typography>
                    <Badge backgroundColor="primary200" textColor="primary700">
                        {processor.difficultyLabel} {hskData.calculatedLevel}
                    </Badge>
                </Flex>
                <Flex gap={1} alignItems="center">
                    <Typography variant="pi">Selected:</Typography>
                    <Badge backgroundColor="success200" textColor="success700">
                        {processor.difficultyLabel} {hskData.selectedLevel}
                    </Badge>
                </Flex>
            </Flex>
        </Box>
    );
};