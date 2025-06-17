// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKLevelSelector.tsx
import React from 'react';
import { Box, Typography, Stack, Select, Option, Button, Badge, Flex } from '@strapi/design-system';
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
      <Stack spacing={4}>
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
            <Select
              label="Select Final HSK Level"
              value={selectedLevel?.toString() || "1"}
              onChange={onLevelChange}
            >
              {HSK_LEVELS.map((level) => (
                <Option key={level} value={level.toString()}>
                  HSK {level}
                </Option>
              ))}
            </Select>
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
      </Stack>
    </Box>
  );
};

export default HSKLevelSelector;