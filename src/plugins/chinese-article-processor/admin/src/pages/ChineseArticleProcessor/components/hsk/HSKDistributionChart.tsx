// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKDistributionChart.tsx
import React from 'react';
import {
    Box,
    Typography,
    Flex
} from '@strapi/design-system';
import { COLORS, COLOR_THRESHOLDS } from '../../../../utils/constants';

interface HSKDistributionChartProps {
    distribution: number[];
}

/**
 * HSK Distribution Chart matching original layout with proper progress bars
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
        <Box background="neutral0" padding={4} hasRadius shadow="filterShadow" width="100%" height="100%">
            <Typography variant="delta" paddingBottom={2} textColor="neutral800">
                HSK Level Distribution
            </Typography>
            <Box>
                {distribution.map((percentage: number, index: number) => (
                    <Box key={index} marginBottom={2}>
                        <Flex justifyContent="space-between" paddingBottom={1}>
                            <Typography variant="pi" textColor="neutral700">
                                HSK {index + 1}
                            </Typography>
                            <Typography variant="pi" textColor="neutral700">
                                {percentage}%
                            </Typography>
                        </Flex>
                        <Box
                            background="neutral200"
                            hasRadius
                            height="8px"
                            position="relative"
                            style={{ overflow: 'hidden' }}
                        >
                            <Box
                                height="100%"
                                width={`${percentage}%`}
                                hasRadius
                                style={{
                                    backgroundColor: getColorForPercentage(percentage),
                                    transition: 'width 0.3s ease'
                                }}
                            />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default HSKDistributionChart;