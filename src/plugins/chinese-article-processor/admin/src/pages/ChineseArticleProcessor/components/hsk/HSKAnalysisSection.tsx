// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKAnalysisSection.tsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Flex,
  Grid,
  Loader
} from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import HSKDistributionChart from './HSKDistributionChart';
import HSKLevelSelector from './HSKLevelSelector';
import { HSKData } from '../../../../utils/types';

interface HSKAnalysisSectionProps {
  hskData: HSKData;
  isCalculatingHSK: boolean;
  hasHskChanges: boolean;
  isLoading: boolean;
  onCalculate: () => Promise<void>;
  onLevelChange: (level: string) => void;
  onSaveLevel: () => Promise<void>;
}

/**
 * HSK Analysis section matching original layout patterns
 */
const HSKAnalysisSection: React.FC<HSKAnalysisSectionProps> = ({
  hskData,
  isCalculatingHSK,
  hasHskChanges,
  isLoading,
  onCalculate,
  onLevelChange,
  onSaveLevel,
}) => {
  return (
    <Box
      background="neutral0"
      padding={4}
      shadow="tableShadow"
      hasRadius
      marginBottom={4}
    >
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center" marginBottom={3}>
        <Typography variant="delta" textColor="neutral800">
          HSK Analysis
        </Typography>

        <Button
          onClick={onCalculate}
          disabled={isLoading || isCalculatingHSK}
          loading={isCalculatingHSK}
          variant="default"
          startIcon={<ArrowClockwise />}
        >
          Calculate HSK Level
        </Button>
      </Flex>

      {/* Content */}
      {isCalculatingHSK ? (
        <Box padding={3} textAlign="center">
          <Loader>Calculating HSK level...</Loader>
        </Box>
      ) : hskData.distribution.length === 0 ? (
        <Box paddingBottom={3}>
          <Typography textColor="neutral700">
            No HSK analysis found. Click "Calculate HSK Level" to analyze the Chinese text.
          </Typography>
        </Box>
      ) : (
        <Grid.Root gap={3}>
          <Grid.Item col={6}>
            <HSKDistributionChart distribution={hskData.distribution} />
          </Grid.Item>
          <Grid.Item col={6}>
            <HSKLevelSelector
              calculatedLevel={hskData.calculatedLevel}
              selectedLevel={hskData.selectedLevel}
              hasChanges={hasHskChanges}
              isLoading={isLoading}
              onLevelChange={onLevelChange}
              onSave={onSaveLevel}
            />
          </Grid.Item>
        </Grid.Root>
      )}
    </Box>
  );
};

export default HSKAnalysisSection;