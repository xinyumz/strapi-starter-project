// src/plugins/chinese-article-processor/admin/src/utils/types.ts

// Grammar rule interface
export interface Translation {
  language: string;
  text: string;
}

export interface GrammarRule {
  sentence: string;
  translation: string; // Keep for backward compatibility
  translations?: Translation[]; // New field for multi-language support
  rules: string[];
  hskLevel?: number;
}

// Interface for tracking selected rules
export interface SelectedRule {
  sentenceIndex: number;
  ruleIndex: number;
}

// Interface for HSK data
export interface HSKData {
  calculatedLevel: number | null;
  selectedLevel: number | null;
  distribution: number[];
}

// Type for the Chinese Processor data stored in the article
export interface ChineseProcessorData {
  hsk: HSKData;
  grammar: Record<string, any>;
}

// Article data interface
export interface ArticleData {
  id: string;
  title: string;
  translation: string;
}

// Grammar engine choice type
export type GrammarEngineChoice = 'stanford' | 'jieba' | 'both';

// New interfaces for translation and API responses

// Supported language definition
export interface SupportedLanguage {
  code: string;
  name: string;
}

// Sentence representation for API responses
export interface EnhancedSentence {
  chinese: string;
  translations: {
    [language: string]: string;
  };
  grammarRules: string[];
}

// Translation result with detailed information
export interface TranslationResult {
  sourceLanguage?: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  success: boolean;
  error?: string;
}

// Options for batch translation
export interface BatchTranslationOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  concurrentRequests?: number;
}