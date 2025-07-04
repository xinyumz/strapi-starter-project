// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/SentenceProcessingSection.tsx
import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Grid
} from '@strapi/design-system';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../../utils/types';

// Import sub-components
import GrammarToolbar from './grammar/GrammarToolbar';
import BulkActions from './grammar/BulkActions';
import SentenceItem from './SentenceItem';
import TranslationManagement from './sentence-translation/TranslationManagement';

interface SentenceProcessingSectionProps {
  sentences: GrammarRule[];
  engineChoice: GrammarEngineChoice;
  activeLanguage: string;
  supportedLanguages: { code: string, name: string }[];
  hasSupportedLanguages: boolean;
  isLoading: boolean;
  isTranslating: boolean;
  hasTranslationChanges: boolean;
  selectedRulesCount: number;
  selectedRules: SelectedRule[];
  onEngineChange: (engine: GrammarEngineChoice) => void;
  onLanguageChange: (language: string) => void;
  onGenerateClick: () => Promise<void>;
  onTranslateClick: () => Promise<void>;
  onTranslationChange: (sentenceIndex: number, language: string, newTranslation: string) => void;
  onAddBulkTranslation: (language: string) => Promise<void>;
  onRemoveBulkTranslation: (language: string) => Promise<void>;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
}

/**
 * Sentence Processing Section matching original layout patterns
 */
const SentenceProcessingSection: React.FC<SentenceProcessingSectionProps> = ({
  sentences,
  engineChoice,
  activeLanguage,
  supportedLanguages,
  hasSupportedLanguages,
  isLoading,
  isTranslating,
  hasTranslationChanges,
  selectedRulesCount,
  selectedRules,
  onEngineChange,
  onLanguageChange,
  onGenerateClick,
  onTranslateClick,
  onTranslationChange,
  onRemoveBulkTranslation,
  onToggleRuleSelection,
  onDeleteRuleClick,
  onSaveTranslations,
  onDeleteSelected,
  isRuleSelected,
}) => {
  const hasSentences = sentences.length > 0;

  // Get all active languages across all sentences
  const getActiveLanguages = (sentences: GrammarRule[]): string[] => {
    const languagesSet = new Set<string>();
    languagesSet.add('en'); // Always include English

    sentences.forEach(sentence => {
      if (Array.isArray(sentence.translations)) {
        sentence.translations.forEach(translation => {
          languagesSet.add(translation.language);
        });
      }
    });

    return Array.from(languagesSet);
  };

  // Function to render sentences in one or two columns like original
  const renderSentences = () => {
    return (
      <Grid.Root gap={4}>
        {sentences.map((item, index) => (
          <Grid.Item key={`grid-sentence-${index}`} col={6}>
            <SentenceItem
              key={`sentence-${index}`}
              sentenceData={item}
              index={index}
              supportedLanguages={supportedLanguages}
              onTranslationChange={onTranslationChange}
              onToggleRuleSelection={onToggleRuleSelection}
              onDeleteRuleClick={onDeleteRuleClick}
              isRuleSelected={isRuleSelected}
            />
          </Grid.Item>
        ))}
      </Grid.Root>
    );
  };

  // Get active languages for translation management
  const activeLanguages = getActiveLanguages(sentences);

  return (
    <Box
      background="neutral0"
      padding={6}
      shadow="tableShadow"
      hasRadius
    >
      {/* Grammar Toolbar */}
      <GrammarToolbar
        title="Sentence Analysis & Translation"
        hasSentences={hasSentences}
        isLoading={isLoading}
        isTranslating={isTranslating}
        engineChoice={engineChoice}
        targetLanguage={activeLanguage}
        hasSupportedLanguages={hasSupportedLanguages}
        onEngineChange={onEngineChange}
        onLanguageChange={onLanguageChange}
        onGenerateClick={onGenerateClick}
        onTranslateClick={onTranslateClick}
      />

      {/* Translation Changes Alert */}
      {hasTranslationChanges && (
        <Alert
          variant="default"
          closeLabel="Close alert"
          marginTop={2}
          marginBottom={3}
          title="Unsaved Changes"
        >
          You have unsaved translation changes. Remember to save your changes.
        </Alert>
      )}

      {/* Content */}
      {!hasSentences ? (
        <Box paddingTop={4} paddingBottom={4}>
          <Typography textColor="neutral700">
            No grammar rules found. Click 'Generate Grammar Rules' to analyze the Chinese text.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Selected Rules Count */}
          {selectedRulesCount > 0 && (
            <Box paddingTop={2} paddingBottom={2}>
              <Typography variant="pi" textColor="neutral600">
                {selectedRulesCount} rules selected
              </Typography>
            </Box>
          )}

          {/* Sentences Grid */}
          <Box marginTop={3}>
            {renderSentences()}
          </Box>

          {/* Bulk Actions */}
          <BulkActions
            hasTranslationChanges={hasTranslationChanges}
            selectedRulesCount={selectedRulesCount}
            selectedRules={selectedRules}
            isLoading={isLoading}
            isTranslating={isTranslating}
            onSaveTranslations={onSaveTranslations}
            onDeleteSelected={onDeleteSelected}
          />

          {/* Translation Management*/}
          {activeLanguages.length > 1 && (
            <Box marginTop={4}>
              <TranslationManagement
                activeLanguages={activeLanguages}
                supportedLanguages={supportedLanguages}
                onBulkDeleteLanguage={(language: string) => {
                  void onRemoveBulkTranslation(language);
                }}
                isLoading={isLoading || isTranslating}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SentenceProcessingSection;