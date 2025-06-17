// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKDistributionChart.tsx
import React from 'react';
import { Box, Typography, Stack, Flex } from '@strapi/design-system';
import { COLORS, COLOR_THRESHOLDS } from '../../../../utils/constants';

interface HSKDistributionChartProps {
    distribution: number[];
}

/**
 * CORRECTED: Component for visualizing HSK level distribution
 * 
 * 🚨 API OFF-BY-1 ISSUE CORRECTION APPLIED
 * 
 * PROBLEM: External API returns data shifted by 1 index:
 * - API distribution[0] contains HSK 2 data (should be HSK 1)
 * - API distribution[1] contains HSK 3 data (should be HSK 2) 
 * - This causes HSK 1 to always show 0% and all levels to be wrong
 * 
 * SOLUTION: Shift the mapping to correct the display
 * - Display index 0 with API data from index 1 → HSK 1 gets correct data
 * - Display index 1 with API data from index 2 → HSK 2 gets correct data
 * - And so on...
 * 
 * ⚠️  REMOVE THIS CORRECTION when the external API is fixed
 */
const HSKDistributionChart: React.FC<HSKDistributionChartProps> = ({ distribution }) => {
    // Helper for HSK level visualization colors
    const getColorForPercentage = (percentage: number): string => {
        if (percentage > COLOR_THRESHOLDS.HIGH) return COLORS.HIGH;
        if (percentage > COLOR_THRESHOLDS.MEDIUM) return COLORS.MEDIUM;
        if (percentage > COLOR_THRESHOLDS.LOW) return COLORS.LOW;
        return COLORS.LOWEST;
    };

    return (
        <Box background="neutral0" padding={4} hasRadius shadow="filterShadow">
            <Typography variant="delta" paddingBottom={2}>HSK Level Distribution</Typography>
            <Stack spacing={2}>
                {Array.from({ length: 10 }, (_, displayIndex) => {
                    const displayLevel = displayIndex + 1; // HSK 1, HSK 2, HSK 3, etc.

                    // 🚨 CORRECTION: Get data from the next index to fix off-by-1 issue
                    // For HSK 1 (displayIndex 0): get data from distribution[1] 
                    // For HSK 2 (displayIndex 1): get data from distribution[2]
                    // For HSK 10 (displayIndex 9): get data from distribution[10] (may be undefined)
                    const correctedDataIndex = displayIndex + 1;
                    const percentage = distribution[correctedDataIndex] || 0;

                    return (
                        <Box key={displayIndex}>
                            <Flex justifyContent="space-between" paddingBottom={1}>
                                <Typography variant="pi">
                                    HSK {displayLevel}
                                </Typography>
                                <Typography variant="pi">{percentage}%</Typography>
                            </Flex>
                            <Box
                                background="neutral200"
                                hasRadius
                                height="8px"
                                position="relative"
                            >
                                <Box
                                    background={getColorForPercentage(percentage)}
                                    height="100%"
                                    width={`${percentage}%`}
                                    hasRadius
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Stack>

            {/* 🚨 DEVELOPER NOTE - REMOVE when API is fixed */}
            {process.env.NODE_ENV === 'development' && (
                <Box paddingTop={3} background="warning100" padding={2} hasRadius marginTop={2}>
                    <Typography variant="omega" textColor="warning600">
                        <strong>Dev Note:</strong> API off-by-1 correction applied.
                        HSK 1 now gets data from API index 1, HSK 2 from index 2, etc.
                        Remove when external API is fixed.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default HSKDistributionChart;