// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/GrammarRuleItem.tsx
import React from 'react';
import {
  Box,
  Typography,
  Flex,
  Checkbox,
  Button,
} from '@strapi/design-system';
import { Trash } from '@strapi/icons';

interface GrammarRuleItemProps {
  rule: string;
  sentenceIndex: number;
  ruleIndex: number;
  isSelected: boolean;
  onToggleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDelete: (sentenceIndex: number, ruleIndex: number) => void;
  simplified?: boolean; // Flag to control simplified view
}

/**
 * Component for displaying individual grammar rules
 * With text wrapping and optimized for compact two-column layout
 */
const GrammarRuleItem: React.FC<GrammarRuleItemProps> = ({
  rule,
  sentenceIndex,
  ruleIndex,
  isSelected,
  onToggleSelection,
  onDelete,
  simplified = false
}) => {
  return (
    <Box
      background="neutral0"
      padding={simplified ? 1 : 2} // Reduced padding in simplified mode
      hasRadius
    >
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Flex gap={2} alignItems="flex-start" style={{ flex: 1 }}>
          <Checkbox
            value={isSelected}
            onValueChange={() => onToggleSelection(sentenceIndex, ruleIndex)}
            aria-label={`Select rule ${ruleIndex + 1}`}
          />
          <Typography
            fontSize={simplified ? 2 : 3}
            style={{
              wordBreak: 'break-word',
              wordWrap: 'break-word',
              flex: 1 // Allow text to take available space
            }}
          >
            {rule || 'Empty rule'}
          </Typography>
        </Flex>
        <Button
          variant="danger-light"
          size="S"
          startIcon={<Trash />}
          onClick={() => onDelete(sentenceIndex, ruleIndex)}
        >
          {!simplified && "Delete"}
        </Button>
      </Flex>
    </Box>
  );
};

export default GrammarRuleItem;