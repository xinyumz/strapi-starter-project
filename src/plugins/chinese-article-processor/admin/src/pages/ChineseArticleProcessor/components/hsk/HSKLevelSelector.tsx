// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKLevelSelector.tsx
import React from 'react';
import {
  Box,
  Typography,
  SingleSelect,
  SingleSelectOption,
  Button,
  Badge,
  Flex
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { HSK_LEVELS } from '../../../../utils/constants';

interface HSKLevelSelectorProps {
  calculatedLevel: number | null;
  selectedLevel: number | null;
  hasChanges: boolean;
  isLoading: boolean;
  onLevelChange: (level: string) => void;
  onSave: () => Promise<void>;
}

/**
 * HSK Level Selector matching original layout patterns
 */
const HSKLevelSelector: React.FC<HSKLevelSelectorProps> = ({
  calculatedLevel,
  selectedLevel,
  hasChanges,
  isLoading,
  onLevelChange,
  onSave,
}) => {
  return (
    <Box background="neutral0" padding={4} hasRadius shadow="filterShadow" width="100%" height="100%">
      <Box>
        {/* Calculated Level Section */}
        <Box marginBottom={4}>
          <Flex gap={3} alignItems="center">
            <Typography variant="delta" textColor="neutral800">
              Calculated HSK Level
            </Typography>
            {calculatedLevel ? (
              <Badge backgroundColor="primary200" textColor="neutral800">
                HSK {calculatedLevel}
              </Badge>
            ) : (
              <Badge backgroundColor="neutral200" textColor="neutral800">
                N/A
              </Badge>
            )}
          </Flex>
        </Box>

        {/* Manual Selection Section */}
        <Box marginBottom={4}>
          <Typography variant="delta" textColor="neutral800" marginBottom={2}>
            Manual Selection
          </Typography>
          <Box paddingTop={2}>
            <SingleSelect
              label="Select Final HSK Level"
              value={selectedLevel?.toString() || "1"}
              onChange={onLevelChange}
              placeholder="Choose HSK level"
            >
              {HSK_LEVELS.map((level) => (
                <SingleSelectOption key={level} value={level.toString()}>
                  HSK {level}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Box>

          {hasChanges && (
            <Box paddingTop={2} marginBottom={4}>
              <Button
                onClick={onSave}
                disabled={!hasChanges || isLoading}
                size="S"
                variant="success"
                loading={isLoading}
                startIcon={<Check />}
              >
                Save HSK Level
              </Button>
            </Box>
          )}

          <Box paddingTop={2}>
            <Typography variant="omega" textColor="neutral600">
              {hasChanges
                ? "Click 'Save HSK Level' to save your selection"
                : "The selected HSK level has been saved to the article."}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HSKLevelSelector;