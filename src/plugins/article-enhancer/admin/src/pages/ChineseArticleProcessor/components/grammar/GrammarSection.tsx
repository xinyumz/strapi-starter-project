// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/GrammarSection.tsx
import React from 'react';
import { Box, Typography, Alert, Grid, GridItem } from '@strapi/design-system';
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
  selectedRules: SelectedRule[];
  onEngineChange: (engine: GrammarEngineChoice) => void;
  onGenerateClick: () => Promise<void>;
  onTranslateClick: () => Promise<void>;
  onTranslationChange: (index: number, newTranslation: string) => void;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
  simplified?: boolean; // Control simplified view
}

/**
 * Component for the grammar analysis and translation section
 * Supports both standard and two-column compact view with improved spacing
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
  isRuleSelected,
  simplified = false
}) => {
  const hasSentences = sentences.length > 0;

  // Function to render sentence items
  const renderSentenceItem = (item: GrammarRule, index: number) => (
    <SentenceItem
      key={`sentence-${index}`}
      sentenceData={item}
      index={index}
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
        onEngineChange={onEngineChange}
        onGenerateClick={onGenerateClick}
        onTranslateClick={onTranslateClick}
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
        </>
      )}
    </Box>
  );
};

export default GrammarSection;