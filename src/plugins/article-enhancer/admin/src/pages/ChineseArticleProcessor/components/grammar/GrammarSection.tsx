// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/GrammarSection.tsx
import React from 'react';
import { Box, Typography, Alert } from '@strapi/design-system';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../../utils/types';
import GrammarToolbar from './GrammarToolbar';
import SentenceItem from './SentenceItem';
import BulkActions from './BulkActions';

interface GrammarSectionProps {
  sentences: GrammarRule[];
  engineChoice: GrammarEngineChoice;
  isLoading: boolean;
  isTranslating: boolean;
  hasTranslationChanges: boolean;
  selectedRulesCount: number;
  selectedRules: SelectedRule[]; // Pass the actual selected rules array
  onEngineChange: (engine: GrammarEngineChoice) => void;
  onGenerateClick: () => Promise<void>;
  onTranslateClick: () => Promise<void>;
  onTranslationChange: (index: number, newTranslation: string) => void;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
}

/**
 * Component for the grammar analysis and translation section
 */
const GrammarSection: React.FC<GrammarSectionProps> = ({
  sentences,
  engineChoice,
  isLoading,
  isTranslating,
  hasTranslationChanges,
  selectedRulesCount,
  selectedRules,
  onEngineChange,
  onGenerateClick,
  onTranslateClick,
  onTranslationChange,
  onToggleRuleSelection,
  onDeleteRuleClick,
  onSaveTranslations,
  onDeleteSelected,
  isRuleSelected
}) => {
  const hasSentences = sentences.length > 0;

  return (
    <Box
      background="neutral0"
      padding={8}
      shadow="tableShadow"
      hasRadius
    >
      <GrammarToolbar
        title="Sentence Analysis & Translation"
        hasSentences={hasSentences}
        isLoading={isLoading}
        isTranslating={isTranslating}
        engineChoice={engineChoice}
        onEngineChange={onEngineChange}
        onGenerateClick={onGenerateClick}
        onTranslateClick={onTranslateClick}
      />

      {hasTranslationChanges && (
        <Alert variant="info" closeLabel="Close alert" marginTop={4} marginBottom={4}>
          You have unsaved translation changes. Remember to save your changes.
        </Alert>
      )}

      {!hasSentences ? (
        <Box paddingTop={4} paddingBottom={4}>
          <Typography>No grammar rules found. Click "Generate Grammar Rules" to analyze the Chinese text.</Typography>
        </Box>
      ) : (
        <>
          <Box paddingTop={4} paddingBottom={4}>
            <Typography variant="epsilon">
              Sentences ({sentences.length})
              {selectedRulesCount > 0 && ` • ${selectedRulesCount} rules selected`}
            </Typography>
          </Box>

          {sentences.map((item, index) => (
            <SentenceItem
              key={`sentence-${index}`}
              sentenceData={item}
              index={index}
              onTranslationChange={onTranslationChange}
              onToggleRuleSelection={onToggleRuleSelection}
              onDeleteRuleClick={onDeleteRuleClick}
              isRuleSelected={isRuleSelected}
            />
          ))}

          <BulkActions
            hasTranslationChanges={hasTranslationChanges}
            selectedRulesCount={selectedRulesCount}
            selectedRules={selectedRules} // Pass the actual selected rules array
            isLoading={isLoading}
            isTranslating={isTranslating}
            onSaveTranslations={onSaveTranslations}
            onDeleteSelected={onDeleteSelected}
          />
        </>
      )}
    </Box>
  );
};

export default GrammarSection;