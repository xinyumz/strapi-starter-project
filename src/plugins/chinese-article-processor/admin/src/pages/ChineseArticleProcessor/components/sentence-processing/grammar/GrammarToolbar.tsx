// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/grammar/GrammarToolbar.tsx
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
 * Grammar Toolbar matching original layout patterns
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
        <Typography variant="beta" textColor="neutral800">
          {title}
        </Typography>
      </Flex>

      <Grid.Root gap={4}>
        {/* Engine Selection */}
        <Grid.Item col={3}>
          <Box width="100%">
            <SingleSelect
              label="Grammar Engine"
              value={engineChoice}
              onChange={onEngineChange}
              disabled={isLoading}
              placeholder="Select engine"
            >
              <SingleSelectOption value="stanford">Stanford</SingleSelectOption>
              <SingleSelectOption value="jieba">Jieba</SingleSelectOption>
              <SingleSelectOption value="both">Both (Stanford + Jieba)</SingleSelectOption>
            </SingleSelect>
          </Box>
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
          <Flex justifyContent="flex-end" alignItems="flex-end" gap={2} style={{ height: '100%', width: '100%' }}>
            <Button
              variant="secondary"
              onClick={onGenerateClick}
              disabled={isLoading}
              loading={isLoading && !isTranslating}
            >
              Generate Grammar Rules
            </Button>

            <Button
              variant="default"
              onClick={onTranslateClick}
              disabled={isLoading || !hasSentences}
              loading={isTranslating}
            >
              Translate All
            </Button>
          </Flex>
        </Grid.Item>
      </Grid.Root>

      <Box paddingTop={4}>
        <Divider />
      </Box>
    </Box >
  );
};

export default GrammarToolbar;