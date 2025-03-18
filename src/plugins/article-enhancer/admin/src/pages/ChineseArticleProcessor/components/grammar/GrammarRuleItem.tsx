// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/GrammarRuleItem.tsx
import React from 'react';
import { Box, Flex, Typography, Checkbox, Button } from '@strapi/design-system';
import { Trash } from '@strapi/icons';

interface GrammarRuleItemProps {
  rule: string;
  sentenceIndex: number;
  ruleIndex: number;
  isSelected: boolean;
  onToggleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteClick: (sentenceIndex: number, ruleIndex: number) => void;
}

/**
 * Component for displaying a single grammar rule with selection and delete options
 */
const GrammarRuleItem: React.FC<GrammarRuleItemProps> = ({
  rule,
  sentenceIndex,
  ruleIndex,
  isSelected,
  onToggleSelection,
  onDeleteClick
}) => {
  return (
    <Box
      key={`rule-${sentenceIndex}-${ruleIndex}`}
      background="neutral0"
      padding={2}
      hasRadius
    >
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Flex gap={3} alignItems="center">
          <Checkbox
            value={isSelected}
            onValueChange={() => onToggleSelection(sentenceIndex, ruleIndex)}
            aria-label={`Select rule ${ruleIndex + 1}`}
          />
          <Typography>{rule || 'Empty rule'}</Typography>
        </Flex>
        <Button
          variant="danger-light"
          size="S"
          startIcon={<Trash />}
          onClick={() => onDeleteClick(sentenceIndex, ruleIndex)}
        >
          Delete
        </Button>
      </Flex>
    </Box>
  );
};

export default GrammarRuleItem;