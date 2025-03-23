// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/SentenceProcessingSection.tsx
import React from 'react';
import { Box, Typography, Alert, Grid, GridItem } from '@strapi/design-system';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../../utils/types';
import { GrammarToolbar } from './grammar';
import { SentenceItem } from './';
import { BulkActions } from './grammar';
import { TranslationManagement } from './sentence-translation';
import SimplifiedTranslationManagement from './sentence-translation/SimplifiedTranslationManagement';

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
  simplified?: boolean; // Control simplified view
  // New batch processing props
  useBatch: boolean;
  onToggleBatch: (value: boolean) => void;
}

/**
 * Component for the grammar analysis and translation section
 * Updated with multi-language translation support and batch processing toggle
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
  onAddBulkTranslation,
  onRemoveBulkTranslation,
  onToggleRuleSelection,
  onDeleteRuleClick,
  onSaveTranslations,
  onDeleteSelected,
  isRuleSelected,
  simplified = false,
  // New batch processing props
  useBatch,
  onToggleBatch
}) => {
  const hasSentences = sentences.length > 0;

  // Get all active languages across all sentences
  const getActiveLanguages = (sentences: GrammarRule[]): string[] => {
    const languagesSet = new Set<string>();

    // Always include English
    languagesSet.add('en');

    // Collect all languages from all sentences
    sentences.forEach(sentence => {
      if (Array.isArray(sentence.translations)) {
        sentence.translations.forEach(translation => {
          languagesSet.add(translation.language);
        });
      }
    });

    return Array.from(languagesSet);
  };

  // Function to render sentence items
  const renderSentenceItem = (item: GrammarRule, index: number) => (
    <SentenceItem
      key={`sentence-${index}`}
      sentenceData={item}
      index={index}
      supportedLanguages={supportedLanguages}
      onTranslationChange={onTranslationChange}
      onToggleRuleSelection={onToggleRuleSelection}
      onDeleteRuleClick={onDeleteRuleClick}
      isRuleSelected={isRuleSelected}
      simplified={simplified}
    />
  );

  // Function to render sentences in one or two columns
  const renderSentences = () => {
    if (!simplified) {
      // Standard view - one sentence per row
      return sentences.map((item, index) => renderSentenceItem(item, index));
    } else {
      // Compact view - two sentences per row using Grid
      return (
        <Grid gap={4}> {/* Increased gap for more spacing between sentences */}
          {sentences.map((item, index) => (
            <GridItem key={`grid-sentence-${index}`} col={6}>
              {renderSentenceItem(item, index)}
            </GridItem>
          ))}
        </Grid>
      );
    }
  };

  // Get active languages for translation management
  const activeLanguages = getActiveLanguages(sentences);

  return (
    <Box
      background="neutral0"
      padding={simplified ? 6 : 8} // Reduced padding in simplified mode
      shadow="tableShadow"
      hasRadius
    >
      <GrammarToolbar
        title={simplified ? "Sentences" : "Sentence Analysis & Translation"}
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
        // Add batch processing props
        useBatch={useBatch}
        onToggleBatch={onToggleBatch}
      />

      {hasTranslationChanges && (
        <Alert
          variant="info"
          closeLabel="Close alert"
          marginTop={simplified ? 2 : 4}
          marginBottom={simplified ? 3 : 4}
        >
          {simplified ?
            "You have unsaved translation changes." :
            "You have unsaved translation changes. Remember to save your changes."}
        </Alert>
      )}

      {!hasSentences ? (
        <Box paddingTop={4} paddingBottom={4}>
          <Typography>
            {simplified ?
              "Click 'Generate Grammar Rules' to analyze text." :
              "No grammar rules found. Click 'Generate Grammar Rules' to analyze the Chinese text."}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Only show selected count when there are selections */}
          {selectedRulesCount > 0 && (
            <Box paddingTop={simplified ? 2 : 4} paddingBottom={simplified ? 2 : 4}>
              <Typography variant="pi">
                {selectedRulesCount} rules selected
              </Typography>
            </Box>
          )}

          <Box marginTop={simplified ? 3 : 4}> {/* Slight increase in top margin */}
            {renderSentences()}
          </Box>

          <BulkActions
            hasTranslationChanges={hasTranslationChanges}
            selectedRulesCount={selectedRulesCount}
            selectedRules={selectedRules}
            isLoading={isLoading}
            isTranslating={isTranslating}
            onSaveTranslations={onSaveTranslations}
            onDeleteSelected={onDeleteSelected}
          />

          {/* Add Simplified Translation Management Section in simplified view */}
          {simplified && activeLanguages.length > 1 && (
            <Box marginTop={4}>
              <SimplifiedTranslationManagement
                activeLanguages={activeLanguages}
                supportedLanguages={supportedLanguages}
                onBulkDeleteLanguage={(language: string) => {
                  void onRemoveBulkTranslation(language);
                }}
                isLoading={isLoading || isTranslating}
              />
            </Box>
          )}

          {/* Add Full Translation Management Section in standard view */}
          {!simplified && (
            <Box marginTop={6}>
              <TranslationManagement
                activeLanguages={activeLanguages}
                supportedLanguages={supportedLanguages}
                onAddLanguage={(language: string) => {
                  void onAddBulkTranslation(language);
                }}
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