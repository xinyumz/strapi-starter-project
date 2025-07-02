// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/grammar/GrammarToolbar.tsx
import React from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  Flex,
  SingleSelect,
  SingleSelectOption,
  Grid,

} from '@strapi/design-system';
import { ChartCircle, Play } from '@strapi/icons';
import { GrammarEngineChoice } from '../../../../../utils/types';
import LanguageSelector from '../sentence-translation/LanguageSelector';

interface GrammarToolbarProps {
  title: string;
  hasSentences: boolean;
  isLoading: boolean;
  isTranslating: boolean;
  engineChoice: GrammarEngineChoice;
  targetLanguage: string;
  hasSupportedLanguages: boolean;
  onEngineChange: (engine: GrammarEngineChoice) => void;
  onLanguageChange: (language: string) => void;
  onGenerateClick: () => Promise<void>;
  onTranslateClick: () => Promise<void>;
}

/**
 * Toolbar component for grammar controls
 */
const GrammarToolbar: React.FC<GrammarToolbarProps> = ({
  title,
  hasSentences,
  isLoading,
  isTranslating,
  engineChoice,
  targetLanguage,
  hasSupportedLanguages,
  onEngineChange,
  onLanguageChange,
  onGenerateClick,
  onTranslateClick
}) => {
  return (
    <Box paddingBottom={4}>
      {/* Title row */}
      <Flex justifyContent="space-between" alignItems="center" paddingBottom={4}>
        <Typography variant="beta">{title}</Typography>
      </Flex>

      <Grid gap={4}>
        {/* Engine Selection */}
        <Grid.Item col={3}>
          <SingleSelect
            id="engine-select"
            name="engine"
            label="Grammar Engine"
            value={engineChoice}
            onChange={(value: GrammarEngineChoice) => onEngineChange(value)}
            disabled={isLoading}
          >
            <SingleSelectOption value="stanford">Stanford</SingleSelectOption>
            <SingleSelectOption value="jieba">Jieba</SingleSelectOption>
            <SingleSelectOption value="both">Both (Stanford + Jieba)</SingleSelectOption>
          </SingleSelect>
        </Grid.Item>

        {/* Language Selection */}
        <Grid.Item col={3}>
          <LanguageSelector
            value={targetLanguage}
            onChange={onLanguageChange}
            disabled={isLoading || isTranslating || !hasSupportedLanguages}
            hint={!hasSupportedLanguages ? "Translator plugin not configured" : undefined}
          />
        </Grid.Item>

        {/* Action Buttons */}
        <Grid.Item col={6}>
          <Flex justifyContent="flex-end" alignItems="flex-end" gap={2} style={{ height: '100%' }}>
            <Button
              variant="secondary"
              startIcon={<ChartCircle />}
              onClick={onGenerateClick}
              disabled={isLoading}
              loading={isLoading && !isTranslating}
            >
              Generate Grammar Rules
            </Button>

            <Button
              variant="default"
              startIcon={<Play />}
              onClick={onTranslateClick}
              disabled={isLoading || !hasSentences}
              loading={isTranslating}
            >
              Translate All
            </Button>
          </Flex>
        </Grid.Item>
      </Grid>

      <Box paddingTop={4}>
        <Divider />
      </Box>
    </Box>
  );
};

export default GrammarToolbar;