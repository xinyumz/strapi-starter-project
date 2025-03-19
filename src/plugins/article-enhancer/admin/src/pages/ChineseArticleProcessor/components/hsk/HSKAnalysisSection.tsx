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
 * Simplified with more compact layout
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
      padding={6} // Reduced padding
      shadow="tableShadow"
      hasRadius
      marginBottom={4} // Reduced margin
    >
      <Flex justifyContent="space-between" alignItems="center" marginBottom={3}>
        <Typography variant="delta">HSK Analysis</Typography>

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
        <Box padding={3} textAlign="center">
          <Loader>Calculating HSK level...</Loader>
        </Box>
      ) : hskData.distribution.length === 0 ? (
        <Box paddingBottom={3}>
          <Typography>
            No HSK analysis found. Click "Calculate HSK Level" to analyze the Chinese text.
          </Typography>
        </Box>
      ) : (
        <Grid gap={3}>
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