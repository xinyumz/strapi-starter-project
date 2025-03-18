// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/SentenceItem.tsx
import React from 'react';
import { Box, Typography, TextInput, Stack } from '@strapi/design-system';
import GrammarRuleItem from './GrammarRuleItem';
import { GrammarRule } from '../../../../utils/types';

interface SentenceItemProps {
  sentenceData: GrammarRule;
  index: number;
  onTranslationChange: (index: number, newTranslation: string) => void;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
}

/**
 * Component to display a sentence with its translation and grammar rules
 */
const SentenceItem: React.FC<SentenceItemProps> = ({
  sentenceData,
  index,
  onTranslationChange,
  onToggleRuleSelection,
  onDeleteRuleClick,
  isRuleSelected
}) => {
  const { sentence, translation, rules } = sentenceData;
  
  return (
    <Box key={`sentence-${index}`} marginBottom={6}>
      <Box
        background="neutral100"
        padding={4}
        hasRadius
      >
        <Typography variant="epsilon" fontWeight="bold">Sentence {index + 1}</Typography>
        <Box paddingTop={2}>
          <Typography variant="omega" fontWeight="bold">Original:</Typography>
          <Box
            background="neutral0"
            padding={2}
            marginTop={1}
            hasRadius
          >
            <Typography>{sentence || 'No sentence text'}</Typography>
          </Box>
        </Box>

        <Box paddingTop={2}>
          <TextInput
            name={`translation-${index}`}
            label={`Translation for sentence ${index + 1}`}
            value={translation || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              onTranslationChange(index, e.target.value)
            }
            placeholder="No translation available. Click 'Translate All' to generate translations."
          />
        </Box>

        <Box paddingTop={2}>
          <Typography variant="omega" fontWeight="bold">
            Grammar Rules ({Array.isArray(rules) ? rules.length : 0}):
          </Typography>
          {Array.isArray(rules) && rules.length > 0 ? (
            <Stack spacing={2} marginTop={1}>
              {rules.map((rule, ruleIndex) => (
                <GrammarRuleItem
                  key={`rule-${index}-${ruleIndex}`}
                  rule={rule}
                  sentenceIndex={index}
                  ruleIndex={ruleIndex}
                  isSelected={isRuleSelected(index, ruleIndex)}
                  onToggleSelection={onToggleRuleSelection}
                  onDeleteClick={onDeleteRuleClick}
                />
              ))}
            </Stack>
          ) : (
            <Box padding={2}>
              <Typography>No grammar rules found</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SentenceItem;