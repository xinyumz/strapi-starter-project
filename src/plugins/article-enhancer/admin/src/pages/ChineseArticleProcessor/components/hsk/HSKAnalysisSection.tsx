// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKAnalysisSection.tsx
import React from 'react';
import {
  Box,
  Typography,
  Loader,
  Button,
  Flex,
  Grid,
  GridItem
} from '@strapi/design-system';
import { Refresh } from '@strapi/icons';
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
 * Component for HSK analysis section
 * Contains HSK distribution chart and level selector
 */
const HSKAnalysisSection: React.FC<HSKAnalysisSectionProps> = ({
  hskData,
  isCalculatingHSK,
  hasHskChanges,
  isLoading,
  onCalculate,
  onLevelChange,
  onSaveLevel
}) => {
  return (
    <Box
      background="neutral0"
      padding={8}
      shadow="tableShadow"
      hasRadius
      marginBottom={6}
    >
      <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Typography variant="delta">HSK Level Analysis</Typography>

        <Button
          onClick={onCalculate}
          disabled={isLoading || isCalculatingHSK}
          loading={isCalculatingHSK}
          startIcon={<Refresh />}
        >
          Calculate HSK Level
        </Button>
      </Flex>

      {isCalculatingHSK ? (
        <Box padding={4} textAlign="center">
          <Loader>Calculating HSK level...</Loader>
        </Box>
      ) : hskData.distribution.length === 0 ? (
        <Box paddingBottom={4}>
          <Typography>
            No HSK analysis found. Click the "Calculate HSK Level" button above to analyze the Chinese text.
          </Typography>
        </Box>
      ) : (
        <Grid gap={4}>
          <GridItem col={6}>
            <HSKDistributionChart distribution={hskData.distribution} />
          </GridItem>

          <GridItem col={6}>
            <HSKLevelSelector
              calculatedLevel={hskData.calculatedLevel}
              selectedLevel={hskData.selectedLevel}
              hasChanges={hasHskChanges}
              isLoading={isLoading}
              onLevelChange={onLevelChange}
              onSave={onSaveLevel}
            />
          </GridItem>
        </Grid>
      )}
    </Box>
  );
};

export default HSKAnalysisSection;