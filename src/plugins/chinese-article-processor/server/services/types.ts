// src/plugins/chinese-article-processor/server/services/types.ts
import { Context } from 'koa';

/**
 * Interfaces for server-side use in the chinese-article-processor plugin
 */

export interface SupportedLanguage {
    code: string;
    name: string;
}

export interface Translation {
    language: string;
    text: string;
}

export interface GrammarRule {
    sentence: string;
    rules: string[];
    translation?: string;
    translations?: Translation[];
}

export interface RulesResponse {
    rules: GrammarRule[];
}

export interface EnhancedSentence {
    chinese: string;
    translations: {
        [language: string]: string;
    };
    grammarRules: string[];
}

// Options for batch translation processing
export interface BatchTranslationOptions {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    concurrentRequests?: number;
}

// New interface for batch grammar processing options
export interface BatchGrammarOptions {
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

export interface GrammarRuleResult {
    success: boolean;
    sentences?: GrammarRule[];
    error?: string;
}

export interface ArticleGrammarResult {
    sentences: GrammarRule[];
    success: boolean;
    error?: string;
}

export interface FailedOperation {
    type: 'sentence' | 'rule' | 'translation';
    data: any;
    error: string;
    timestamp: number;
    articleId: number;
    sentenceId?: number;
}

export interface RecoveryResult {
    success: boolean;
    recovered: number;
    failed: number;
    errors: string[];
}

export interface CacheEntry {
    data: GrammarRule[];
    timestamp: number;
}

// Context extension for controllers
export interface ExtendedContext extends Context {
    body: any;
    request: Context['request'] & {
        body: {
            data?: {
                text?: string;
                engineChoice?: 'stanford' | 'jieba' | 'both';
                sentences?: Array<GrammarRule>;
                content?: string;
                targetLanguages?: string[];
                articleId?: number;
                useBatch?: boolean;
                useBatchGrammar?: boolean;
                batchOptions?: BatchGrammarOptions;
            };
            text?: string;
            engineChoice?: 'stanford' | 'jieba' | 'both';
            sentences?: Array<GrammarRule>;
            content?: string;
            targetLanguages?: string[];
            articleId?: number;
            useBatch?: boolean;
            useBatchGrammar?: boolean;
            batchOptions?: BatchGrammarOptions;
        };
    };
    params: {
        id?: string;
    };
}