// src/plugins/chinese-article-processor/admin/src/utils/constants.ts

export const GRAMMAR_ENGINE_OPTIONS = {
  STANFORD: 'stanford',
  JIEBA: 'jieba',
  BOTH: 'both'
};

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const DEFAULT_HSK_DATA = {
  calculatedLevel: null,
  selectedLevel: null,
  distribution: []
};

export const COLOR_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25
};

export const COLORS = {
  HIGH: '#2563eb',
  MEDIUM: '#3b82f6',
  LOW: '#60a5fa',
  LOWEST: '#93c5fd'
};

export const STATUS_MESSAGES = {
  HSK_CALCULATED: 'HSK level calculated successfully',
  HSK_SAVED: 'HSK level saved successfully',
  GRAMMAR_GENERATED: 'Grammar rules generated and saved successfully',
  TRANSLATIONS_SAVED: 'All translations saved successfully',
  RULE_DELETED: 'Grammar rule deleted successfully',
  BULK_DELETE_SUCCESS: (count: number) => `${count} grammar rules deleted successfully`,
  SENTENCES_TRANSLATED: 'All sentences translated successfully'
};

export const ERROR_MESSAGES = {
  ARTICLE_LOAD_FAILED: 'Failed to load article information. Please check if you have permission to access this article.',
  GRAMMAR_LOAD_FAILED: 'Failed to load grammar data',
  HSK_SAVE_FAILED: 'Failed to save HSK level to article',
  ARTICLE_ID_MISSING: 'No article ID provided',
  RETRIEVE_ARTICLE_FAILED: 'Failed to retrieve article data',
  TRANSLATION_REQUIRED: 'Translation text is required',
  GRAMMAR_GENERATION_FAILED: 'Failed to generate grammar rules',
  GRAMMAR_SAVE_FAILED: 'Failed to save grammar data',
  NO_SENTENCES: 'No sentences available for translation',
  NO_VALID_SENTENCES: 'No valid sentences found for translation',
  TRANSLATION_RESPONSE_INVALID: 'Invalid response from translation service',
  TRANSLATION_SAVE_FAILED: 'Failed to save translations',
  TRANSLATION_FAILED: 'Failed to translate sentences',
  SAVE_TRANSLATIONS_FAILED: 'Failed to save translation changes',
  DELETE_RULE_FAILED: 'Failed to delete rule',
  UPDATE_GRAMMAR_FAILED: 'Failed to save updated grammar data',
  BULK_DELETE_FAILED: 'Failed to delete rules',
  NO_RULES_SELECTED: 'No rules selected for deletion'
};
