// src/plugins/article-enhancer/admin/src/utils/types.ts

// Grammar rule interface
export interface GrammarRule {
  sentence: string;
  rules: string[];
  translation?: string;
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
