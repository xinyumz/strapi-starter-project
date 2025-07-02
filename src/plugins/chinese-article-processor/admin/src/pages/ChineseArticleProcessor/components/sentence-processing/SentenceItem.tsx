// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/SentenceItem.tsx
import React from 'react';
import {
  Box,
  Textarea,
  Typography,
  Flex,
  Badge,
  Tabs,
} from '@strapi/design-system';
import { GrammarRule, Translation } from '../../../../utils/types';
import GrammarRuleItem from './grammar/GrammarRuleItem';

interface SentenceItemProps {
  sentenceData: GrammarRule;
  index: number;
  supportedLanguages: { code: string, name: string }[];
  onTranslationChange: (sentenceIndex: number, language: string, text: string) => void;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
}

/**
 * Sentence Item matching original layout patterns
 */
const SentenceItem: React.FC<SentenceItemProps> = ({
  sentenceData,
  index,
  supportedLanguages,
  onTranslationChange,
  onToggleRuleSelection,
  onDeleteRuleClick,
  isRuleSelected,
}) => {
  const hasRules = Array.isArray(sentenceData?.rules) && sentenceData.rules.length > 0;

  // Combine legacy translation with new multi-language translations
  const getTranslations = (): Translation[] => {
    const translations: Translation[] = [];

    // Add the legacy translation as English if it exists
    if (sentenceData.translation) {
      translations.push({ language: 'en', text: sentenceData.translation });
    }

    // Add any new format translations
    if (Array.isArray(sentenceData.translations)) {
      // Filter out any duplicates that might already be in the legacy field
      sentenceData.translations.forEach(trans => {
        if (!translations.some(t => t.language === trans.language)) {
          translations.push(trans);
        }
      });
    }

    return translations;
  };

  const translations = getTranslations();

  // Get the display name for a language code
  const getLanguageName = (code: string): string => {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  return (
    <Box
      background="neutral100"
      padding={3}
      hasRadius
      height="100%"
      width="100%"
    >
      {/* Sentence Number Badge */}
      <Flex justifyContent="flex-start" marginBottom={2}>
        <Badge backgroundColor="primary600" textColor="neutral0">
          {index + 1}
        </Badge>
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
          textColor="neutral800"
          style={{
            wordBreak: 'break-word',
            wordWrap: 'break-word',
            fontSize: '16px'
          }}
        >
          {sentenceData?.sentence || 'No sentence text'}
        </Typography>
      </Box>

      {/* Translations with tabs for each language */}
      <Box paddingTop={1} paddingBottom={2}>
        {translations.length > 0 ? (
          <Tabs.Root
            variant="simple"
            defaultValue={translations[0]?.language || 'default'}
            id={`translations-${index}`}
          >
            <Tabs.List aria-label={`Translations for sentence ${index + 1}`}>
              {translations.map((translation) => (
                <Tabs.Trigger key={translation.language} value={translation.language}>
                  {getLanguageName(translation.language)}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {translations.map((translation) => (
              <Tabs.Content key={translation.language} value={translation.language}>
                <Box paddingTop={2}>
                  <Textarea
                    name={`translation-${index}-${translation.language}`}
                    placeholder={`Translation (${getLanguageName(translation.language)})`}
                    value={translation.text}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      onTranslationChange(index, translation.language, e.target.value)
                    }
                    style={{
                      minHeight: '50px',
                      width: '100%'
                    }}
                  />
                </Box>
              </Tabs.Content>
            ))}
          </Tabs.Root>
        ) : (
          <Box marginBottom={2}>
            <Typography variant="omega" textColor="neutral600">
              No translations available. Click 'Translate All' to generate translations.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Grammar rules display */}
      {hasRules && (
        <Box paddingTop={1}>
          <Box marginTop={1}>
            {sentenceData.rules.map((rule, ruleIndex) => (
              <GrammarRuleItem
                key={`rule-${index}-${ruleIndex}`}
                rule={rule}
                sentenceIndex={index}
                ruleIndex={ruleIndex}
                isSelected={isRuleSelected(index, ruleIndex)}
                onToggleSelection={onToggleRuleSelection}
                onDelete={onDeleteRuleClick}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SentenceItem;