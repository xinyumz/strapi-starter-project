// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/GrammarToolbar.tsx
import React from 'react';
import { Flex, Typography, Button, Radio, Stack, Box, Divider } from '@strapi/design-system';
import { Refresh, Plus } from '@strapi/icons';
import { GrammarEngineChoice } from '../../../../utils/types';
import { GRAMMAR_ENGINE_OPTIONS } from '../../../../utils/constants';

interface GrammarToolbarProps {
  title: string;
  hasSentences: boolean;
  isLoading: boolean;
  isTranslating: boolean;
  engineChoice: GrammarEngineChoice;
  onEngineChange: (engine: GrammarEngineChoice) => void;
  onGenerateClick: () => Promise<void>;
  onTranslateClick: () => Promise<void>;
}

/**
 * Component for grammar generation and translation controls
 */
const GrammarToolbar: React.FC<GrammarToolbarProps> = ({
  title,
  hasSentences,
  isLoading,
  isTranslating,
  engineChoice,
  onEngineChange,
  onGenerateClick,
  onTranslateClick
}) => {
  return (
    <>
      <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Typography variant="delta">{title}</Typography>

        <Flex gap={2}>
          <Button
            onClick={onGenerateClick}
            disabled={isLoading || isTranslating}
            loading={isLoading && !isTranslating}
            startIcon={<Refresh />}
          >
            Generate Grammar Rules
          </Button>

          {hasSentences && (
            <Button
              variant="secondary"
              onClick={onTranslateClick}
              disabled={isLoading || isTranslating}
              loading={isTranslating}
              startIcon={<Plus />}
            >
              Translate All
            </Button>
          )}
        </Flex>
      </Flex>

      <Box paddingBottom={4}>
        <Stack spacing={2}>
          <Typography variant="epsilon">Grammar Engine</Typography>
          <Flex gap={4}>
            <Radio
              value={GRAMMAR_ENGINE_OPTIONS.STANFORD}
              checked={engineChoice === GRAMMAR_ENGINE_OPTIONS.STANFORD}
              onChange={() => onEngineChange(GRAMMAR_ENGINE_OPTIONS.STANFORD)}
            >
              Stanford
            </Radio>
            <Radio
              value={GRAMMAR_ENGINE_OPTIONS.JIEBA}
              checked={engineChoice === GRAMMAR_ENGINE_OPTIONS.JIEBA}
              onChange={() => onEngineChange(GRAMMAR_ENGINE_OPTIONS.JIEBA)}
            >
              Jieba
            </Radio>
            <Radio
              value={GRAMMAR_ENGINE_OPTIONS.BOTH}
              checked={engineChoice === GRAMMAR_ENGINE_OPTIONS.BOTH}
              onChange={() => onEngineChange(GRAMMAR_ENGINE_OPTIONS.BOTH)}
            >
              Both
            </Radio>
          </Flex>
        </Stack>
      </Box>

      <Divider />
    </>
  );
};

export default GrammarToolbar;