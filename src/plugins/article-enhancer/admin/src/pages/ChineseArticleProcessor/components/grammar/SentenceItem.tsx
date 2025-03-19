// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/SentenceItem.tsx
import React from 'react';
import {
  Box,
  Textarea,
  Stack,
  Typography,
  Flex,
  Badge
} from '@strapi/design-system';
import { GrammarRule } from '../../../../utils/types';
import GrammarRuleItem from './GrammarRuleItem';

interface SentenceItemProps {
  sentenceData: GrammarRule;
  index: number;
  onTranslationChange: (index: number, newTranslation: string) => void;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
  simplified?: boolean; // Flag to control simplified view
}

/**
 * Component for displaying individual sentences and their grammar rules
 * Enhanced with sentence numbering, larger Chinese text, and multi-line translations
 */
const SentenceItem: React.FC<SentenceItemProps> = ({
  sentenceData,
  index,
  onTranslationChange,
  onToggleRuleSelection,
  onDeleteRuleClick,
  isRuleSelected,
  simplified = false
}) => {
  const hasRules = Array.isArray(sentenceData?.rules) && sentenceData.rules.length > 0;

  return (
    <Box
      background="neutral100"
      padding={simplified ? 3 : 4} // Increased padding slightly
      hasRadius
      height="100%" // Fill the grid item completely
      marginBottom={simplified ? 0 : 6} // No extra bottom margin in simplified mode (handled by Grid)
    >
      {/* Sentence Number Badge */}
      <Flex justifyContent="flex-start" marginBottom={2}>
        <Badge>{index + 1}</Badge>
      </Flex>

      {/* Original sentence - with larger, bold text */}
      <Box
        background="neutral0"
        padding={3}
        marginBottom={2}
        hasRadius
      >
        <Typography
          variant="epsilon"
          fontWeight="bold"
          style={{
            wordBreak: 'break-word',
            wordWrap: 'break-word',
            fontSize: '16px' // Larger font size for Chinese text
          }}
        >
          {sentenceData?.sentence || 'No sentence text'}
        </Typography>
      </Box>

      {/* Translation field - using Textarea for multi-line support */}
      <Box paddingTop={1} paddingBottom={2}>
        {simplified ? (
          // No label in simplified mode
          <Textarea
            name={`translation-${index}`}
            placeholder="Translation"
            value={sentenceData?.translation || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onTranslationChange(index, e.target.value)
            }
            aria-label={`Translation for sentence ${index + 1}`} // Keep for accessibility
            style={{ minHeight: '60px' }} // Ensure adequate height
          />
        ) : (
          // Keep label in normal mode
          <Textarea
            name={`translation-${index}`}
            label={`Translation for sentence ${index + 1}`}
            value={sentenceData?.translation || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onTranslationChange(index, e.target.value)
            }
            placeholder="No translation available. Click 'Translate All' to generate translations."
            style={{ minHeight: '80px' }} // Slightly taller in normal mode
          />
        )}
      </Box>

      {/* Grammar rules with more compact display */}
      {hasRules && (
        <Box paddingTop={1}>
          {!simplified && (
            <Typography variant="omega" fontWeight="bold">
              Grammar Rules ({sentenceData.rules.length}):
            </Typography>
          )}

          <Stack spacing={simplified ? 1 : 2} marginTop={1}>
            {sentenceData.rules.map((rule, ruleIndex) => (
              <GrammarRuleItem
                key={`rule-${index}-${ruleIndex}`}
                rule={rule}
                sentenceIndex={index}
                ruleIndex={ruleIndex}
                isSelected={isRuleSelected(index, ruleIndex)}
                onToggleSelection={onToggleRuleSelection}
                onDelete={onDeleteRuleClick}
                simplified={simplified}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default SentenceItem;