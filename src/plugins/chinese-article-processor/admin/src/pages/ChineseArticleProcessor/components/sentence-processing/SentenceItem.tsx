// src/pages/ChineseArticleProcessor/components/sentence-processing/SentenceItem.tsx
import React from 'react';
import {
  Box,
  Textarea,
  Stack,
  Typography,
  Flex,
  Badge,
  Tabs,
  Tab,
  TabGroup,
  TabPanel,
  TabPanels
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
  simplified?: boolean;
}

/**
 * Component for displaying individual sentences and their grammar rules
 * Enhanced with multi-language translation support
 */
const SentenceItem: React.FC<SentenceItemProps> = ({
  sentenceData,
  index,
  supportedLanguages,
  onTranslationChange,
  onToggleRuleSelection,
  onDeleteRuleClick,
  isRuleSelected,
  simplified = false
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
      padding={simplified ? 3 : 4}
      hasRadius
      height="100%"
      marginBottom={simplified ? 0 : 6}
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
            fontSize: '16px'
          }}
        >
          {sentenceData?.sentence || 'No sentence text'}
        </Typography>
      </Box>

      {/* Translations with tabs for each language */}
      <Box paddingTop={1} paddingBottom={2}>
        {translations.length > 0 ? (
          <TabGroup
            id={`translations-${index}`}
            label={`Translations for sentence ${index + 1}`}
            variant="simple"
          >
            <Tabs>
              {translations.map((translation) => (
                <Tab key={translation.language}>
                  {getLanguageName(translation.language)}
                </Tab>
              ))}
            </Tabs>

            <TabPanels>
              {translations.map((translation) => (
                <TabPanel key={translation.language}>
                  <Flex gap={2}>
                    <Box style={{ flexGrow: 1 }}>
                      <Textarea
                        name={`translation-${index}-${translation.language}`}
                        placeholder={`Translation (${getLanguageName(translation.language)})`}
                        value={translation.text}
                        onChange={(e: any) => onTranslationChange(index, translation.language, e.target.value)}
                        style={{ minHeight: simplified ? '60px' : '80px' }}
                      />
                    </Box>
                  </Flex>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        ) : (
          <Box marginBottom={2}>
            <Typography>No translations available. Click 'Translate All' to generate translations.</Typography>
          </Box>
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