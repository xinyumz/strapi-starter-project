// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKLevelSelector.tsx
import React from 'react';
import { Box, Typography, Flex, SingleSelect, SingleSelectOption, Button, Badge } from '@strapi/design-system';
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
 * Component for displaying and selecting HSK level
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
    <Box background="neutral0" padding={4} hasRadius shadow="filterShadow">
      <Flex gap={4}>
        <Box>
          <Flex gap={3}>
            <Typography variant="delta">
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

        <Box>
          <Typography variant="delta">Manual Selection</Typography>
          <Box paddingTop={2}>
            <SingleSelect
              label="Select Final HSK Level"
              value={selectedLevel?.toString() || "1"}
              onChange={onLevelChange}
            >
              {HSK_LEVELS.map((level) => (
                <SingleSelectOption key={level} value={level.toString()}>
                  HSK {level}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Box>

          {hasChanges && (
            <Box paddingTop={2}>
              <Button
                onClick={onSave}
                disabled={!hasChanges || isLoading}
                startIcon={<Check />}
                size="S"
              >
                Save HSK Level
              </Button>
            </Box>
          )}

          <Box paddingTop={2}>
            <Typography variant="omega">
              {hasChanges
                ? "Click 'Save HSK Level' to save your selection"
                : "The selected HSK level has been saved to the article."}
            </Typography>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default HSKLevelSelector;