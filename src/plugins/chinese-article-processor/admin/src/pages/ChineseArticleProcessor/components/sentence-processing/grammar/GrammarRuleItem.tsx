// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/grammar/GrammarRuleItem.tsx
import React from 'react';
import {
  Box,
  Typography,
  Flex,
  Checkbox,
  Button,
} from '@strapi/design-system';
import styled from 'styled-components';

interface GrammarRuleItemProps {
  rule: string;
  sentenceIndex: number;
  ruleIndex: number;
  isSelected: boolean;
  onToggleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDelete: (sentenceIndex: number, ruleIndex: number) => void;
}

// Styled components
const RuleContainer = styled(Box)`
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const RuleText = styled(Typography)`
  word-break: break-word;
  word-wrap: break-word;
  flex: 1;
  font-size: 1.3rem;
`;

/**
 * Displaying individual grammar rules
 * With text wrapping and optimized for compact two-column layout
 */
const GrammarRuleItem: React.FC<GrammarRuleItemProps> = ({
  rule,
  sentenceIndex,
  ruleIndex,
  isSelected,
  onToggleSelection,
  onDelete,
}) => {
  const handleToggle = () => {
    onToggleSelection(sentenceIndex, ruleIndex);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(sentenceIndex, ruleIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };


  return (
    <RuleContainer
      background={isSelected ? "primary100" : "neutral0"}
      marginBottom={1}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Flex justifyContent="space-between" alignItems="center" gap={2}>
        <Flex gap={2} alignItems="flex-start" style={{ flex: 1 }}>
          <Checkbox
            checked={isSelected}
            onChange={handleToggle}
            aria-label={`Select rule ${ruleIndex + 1}`}
          />
          <RuleText
            variant="pi"
            textColor="neutral700"
          >
            {rule || 'Empty rule'}
          </RuleText>
        </Flex>

        <Button
          variant="danger-light"
          size="S"
          onClick={handleDelete}
          aria-label="Delete rule"  // Add aria-label for accessibility
        >
          Delete
        </Button>
      </Flex>
    </RuleContainer>
  );
};

export default GrammarRuleItem;