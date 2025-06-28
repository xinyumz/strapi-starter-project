// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKDistributionChart.tsx

import React from 'react';
import { Box, Typography, Flex } from '@strapi/design-system';
import { COLORS, COLOR_THRESHOLDS } from '../../../../utils/constants';

interface HSKDistributionChartProps {
    distribution: number[];
}

/**
 * Component for visualizing HSK level distribution
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
            <Flex gap={2}>
                {distribution.map((percentage: number, index: number) => (
                    <Box key={index}>
                        <Flex justifyContent="space-between" paddingBottom={1}>
                            <Typography variant="pi">HSK {index + 1}</Typography>
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
                ))}
            </Flex>
        </Box>
    );
};

export default HSKDistributionChart;