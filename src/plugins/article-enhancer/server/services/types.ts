// src/plugins/article-enhancer/server/services/types.ts

/**
 * Interfaces for server-side use in the article-enhancer plugin
 */

export interface SupportedLanguage {
    code: string;
    name: string;
}

export interface Translation {
    language: string;
    text: string;
}

export interface EnhancedSentence {
    chinese: string;
    translations: {
        [language: string]: string;
    };
    grammarRules: string[];
}

export interface BatchTranslationOptions {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    concurrentRequests?: number;
}

export interface TranslationResult {
    sourceLanguage?: string;
    targetLanguage: string;
    originalText: string;
    translatedText: string;
    success: boolean;
    error?: string;
}

export interface TranslationServiceInterface {
    translate: (text: string, targetLanguage: string) => Promise<string>;
    listLanguages?: () => Promise<SupportedLanguage[]>;
    detectLanguage?: (text: string) => Promise<string>;
}