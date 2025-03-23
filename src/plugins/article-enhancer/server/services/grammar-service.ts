// server/services/grammar-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import crypto from 'crypto';
import {
    GrammarRule,
    RulesResponse,
    ArticleGrammarResult,
    FailedOperation,
    RecoveryResult,
    CacheEntry
} from './types';

const { ApplicationError } = errors;

// Simple in-memory cache
const rulesCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting parameters
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// In-memory store for failed operations
let failedOperationsStore: FailedOperation[] = [];

// Function to generate a cache key
function generateCacheKey(text: string, engineChoice: string): string {
    return crypto.createHash('md5').update(`${text}:${engineChoice}`).digest('hex');
}

/**
 * Validates and sanitizes Chinese text input
 * @param {string} text - The Chinese text to validate
 * @param {number} maxLength - Maximum allowed text length
 * @returns {string} - Sanitized text
 * @throws {Error} - If validation fails
 */
function validateChineseText(text: string, maxLength: number = 10000): string {
    // Check if text is provided and is a string
    if (!text || typeof text !== 'string') {
        throw new Error('Input must be a non-empty string');
    }

    // Check text length
    if (text.length > maxLength) {
        throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
    }

    // Check if text contains at least some Chinese characters
    // This regex matches common Chinese character ranges
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (!chineseRegex.test(text)) {
        throw new Error('Text must contain Chinese characters');
    }

    // Sanitize the text: strip potentially harmful characters
    const sanitized = text
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/\\x[0-9a-fA-F]{2}/g, ''); // Remove hex escape sequences

    return sanitized;
}

/**
 * Registers a failed operation for later recovery
 */
function registerFailedOperation(
    type: 'sentence' | 'rule' | 'translation',
    data: any,
    error: string,
    articleId: number,
    sentenceId?: number
): void {
    failedOperationsStore.push({
        type,
        data,
        error,
        timestamp: Date.now(),
        articleId,
        sentenceId
    });

    strapi.log.warn(`Registered failed ${type} operation for article ${articleId}: ${error}`);
}

export default ({ strapi }: { strapi: Strapi }) => ({
    // Generate grammar rules from external API with improved error handling and caching
    async generateRules(text: string, engineChoice: 'stanford' | 'jieba' | 'both' = 'both'): Promise<GrammarRule[]> {
        try {
            // Validate and sanitize input
            text = validateChineseText(text);

            strapi.log.info(`Generating grammar rules with engine: ${engineChoice}`);

            // Generate cache key
            const cacheKey = generateCacheKey(text, engineChoice);

            // Check cache first
            if (rulesCache[cacheKey] &&
                (Date.now() - rulesCache[cacheKey].timestamp) < CACHE_TTL) {
                strapi.log.info(`Returning cached grammar rules for key: ${cacheKey}`);
                return rulesCache[cacheKey].data;
            }

            // Implementation with retry logic
            let retries = 0;
            let lastError: Error | null = null;

            while (retries <= MAX_RETRIES) {
                try {
                    // Create abort controller for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                    try {
                        const response = await fetch('https://api.pandaist.com/api/v1/rulesgen/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                text,
                                rule_choice: engineChoice
                            }),
                            signal: controller.signal
                        });

                        // Clear the timeout
                        clearTimeout(timeoutId);

                        // Handle rate limiting explicitly
                        if (response.status === 429) {
                            // Get retry-after header if available
                            const retryAfter = response.headers.get('retry-after');
                            const retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 :
                                INITIAL_RETRY_DELAY * Math.pow(2, retries);

                            strapi.log.warn(`Rate limit exceeded. Retrying after ${retryDelay}ms. Retry ${retries + 1}/${MAX_RETRIES}`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            retries++;
                            continue;
                        }

                        // Check for other HTTP errors
                        if (!response.ok) {
                            const errorText = await response.text();
                            strapi.log.error(`Grammar rules API error: ${response.status} ${response.statusText} - ${errorText}`);

                            // Different handling based on status code
                            if (response.status >= 500) {
                                throw new Error('Grammar rules service is currently unavailable. Please try again later.');
                            } else {
                                throw new Error(`Grammar rules generation failed: ${response.statusText}`);
                            }
                        }

                        const data = (await response.json()) as RulesResponse;

                        if (!data.rules || !Array.isArray(data.rules)) {
                            throw new Error('Invalid response format from grammar rules API');
                        }

                        // Store in cache
                        rulesCache[cacheKey] = {
                            data: data.rules,
                            timestamp: Date.now()
                        };

                        return data.rules;
                    } catch (fetchError) {
                        // Clear the timeout to prevent memory leaks
                        clearTimeout(timeoutId);

                        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                            strapi.log.error('Grammar rules API request timed out after 30 seconds');
                            throw new Error('Grammar rules generation timed out. Please try with shorter text.');
                        }

                        throw fetchError;
                    }
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    // For server errors (5xx), we retry with exponential backoff
                    if (error instanceof Error &&
                        error.message.includes('unavailable') &&
                        retries < MAX_RETRIES) {
                        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
                        strapi.log.warn(`Server error. Retrying after ${retryDelay}ms. Retry ${retries + 1}/${MAX_RETRIES}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries++;
                    } else {
                        // For other errors, we don't retry
                        throw error;
                    }
                }
            }

            // If we've exhausted retries, throw the last error
            if (lastError) {
                throw lastError;
            }

            // This should never happen due to the loop logic, but TypeScript needs it
            throw new Error('Unexpected error in retry logic');
        } catch (error) {
            console.error('Grammar rules generation error:', error);
            throw error;
        }
    },

    /**
     * Processes a large text by splitting it into batches for better performance
     * @param {string} text - Full text to process
     * @param {string} engineChoice - Parser engine choice
     * @param {number} batchSize - Maximum number of sentences per batch
     * @returns {Promise<GrammarRule[]>} - Combined grammar rules
     */
    async batchProcessText(
        text: string,
        engineChoice: 'stanford' | 'jieba' | 'both' = 'both',
        batchSize: number = 20
    ): Promise<GrammarRule[]> {
        // Validate input
        const validatedText = validateChineseText(text);

        // Split text into sentences (assuming '|' is the sentence separator)
        const sentences = validatedText.split('|').filter(s => s.trim());

        // If text is small enough, process directly
        if (sentences.length <= batchSize) {
            return this.generateRules(validatedText, engineChoice);
        }

        strapi.log.info(`Processing large text with ${sentences.length} sentences in batches of ${batchSize}`);

        // Process in batches
        const batches: string[][] = [];
        for (let i = 0; i < sentences.length; i += batchSize) {
            batches.push(sentences.slice(i, i + batchSize));
        }

        const results: GrammarRule[] = [];

        // Process each batch with reasonable delay between batches
        for (let i = 0; i < batches.length; i++) {
            const batchText = batches[i].join('|');
            strapi.log.info(`Processing batch ${i + 1}/${batches.length} with ${batches[i].length} sentences`);

            try {
                const batchResults = await this.generateRules(batchText, engineChoice);
                results.push(...batchResults);

                // Add delay between batches to avoid rate limiting
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                strapi.log.error(`Error processing batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
                // Continue with next batch despite errors
            }
        }

        return results;
    },

    // Get all grammar data for an article from the normalized database
    async getArticleGrammar(articleId: number): Promise<ArticleGrammarResult> {
        try {
            strapi.log.info(`Getting grammar data for article ID: ${articleId}`);

            if (!strapi.db || !strapi.db.connection) {
                throw new Error('Database connection not available');
            }

            // Check if article exists
            const articleExists = await strapi.db.connection('articles')
                .where('id', articleId)
                .first();

            if (!articleExists) {
                return {
                    sentences: [],
                    success: false,
                    error: `Article with ID ${articleId} not found`
                };
            }

            // Use Knex query builder to get sentences
            const sentences = await strapi.db.connection
                .select(
                    'article_sentences.id as sentence_id',
                    'article_sentences.sentence_text',
                    'article_sentences.sentence_order'
                )
                .from('article_sentences')
                .where('article_sentences.article_id', articleId)
                .orderBy('article_sentences.sentence_order');

            strapi.log.info(`Found ${sentences.length} sentences for article ID: ${articleId}`);

            // Get grammar rules for all sentences
            const sentenceIds = sentences.map((s: any) => s.sentence_id);

            // Get grammar rules for all sentences from the new table
            const grammarRules = await strapi.db.connection('sentence_grammar_rules')
                .whereIn('sentence_id', sentenceIds)
                .select('sentence_id', 'rule');

            strapi.log.info(`Found ${grammarRules.length} grammar rules for article ID: ${articleId}`);

            // Group grammar rules by sentence_id
            const rulesBySentence: Record<number, string[]> = {};
            grammarRules.forEach(rule => {
                if (!rulesBySentence[rule.sentence_id]) {
                    rulesBySentence[rule.sentence_id] = [];
                }
                rulesBySentence[rule.sentence_id].push(rule.rule);
            });

            // Get translations for all sentences
            const translations = await strapi.db.connection('sentence_translations')
                .whereIn('sentence_id', sentenceIds)
                .select('sentence_id', 'translation_language', 'translation_text');

            strapi.log.info(`Found ${translations.length} translations for article ID: ${articleId}`);

            // Group translations by sentence_id and language
            const translationsBySentence: Record<number, Record<string, string>> = {};
            translations.forEach(translation => {
                if (!translationsBySentence[translation.sentence_id]) {
                    translationsBySentence[translation.sentence_id] = {};
                }
                translationsBySentence[translation.sentence_id][translation.translation_language] = translation.translation_text;
            });

            // Format sentences with their rules and translations
            const formattedSentences: GrammarRule[] = sentences.map(sentence => {
                // Get rules for this sentence
                const rules = rulesBySentence[sentence.sentence_id] || [];

                // Get English translation for backward compatibility
                const translations = translationsBySentence[sentence.sentence_id] || {};
                const englishTranslation = translations['en'] || '';

                // Format translations array
                const translationsArray = Object.entries(translations).map(([language, text]) => ({
                    language,
                    text
                }));

                return {
                    sentence: sentence.sentence_text,
                    rules: rules,
                    translation: englishTranslation, // For backward compatibility
                    translations: translationsArray
                };
            });

            return {
                sentences: formattedSentences,
                success: true
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            strapi.log.error(`Error fetching article grammar: ${errorMessage}`);
            return {
                sentences: [],
                success: false,
                error: errorMessage
            };
        }
    },

    // Save grammar data for an article to the normalized database with optimized approach
    async saveArticleGrammar(articleId: number, sentences: GrammarRule[]): Promise<{ success: boolean, error?: string }> {
        if (!strapi.db || !strapi.db.connection) {
            return {
                success: false,
                error: 'Database connection not available'
            };
        }

        strapi.log.info(`Saving grammar data for article ID: ${articleId} with ${sentences.length} sentences`);

        // Clear any existing failed operations for this article to avoid duplicates
        failedOperationsStore = failedOperationsStore.filter(op => op.articleId !== articleId);

        // Check if article exists
        try {
            const articleExists = await strapi.db.connection('articles')
                .where('id', articleId)
                .first();

            if (!articleExists) {
                strapi.log.error(`Article with ID ${articleId} not found`);
                return {
                    success: false,
                    error: `Article with ID ${articleId} not found`
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            strapi.log.error(`Error checking article existence: ${errorMessage}`);
            return {
                success: false,
                error: `Error checking article existence: ${errorMessage}`
            };
        }

        const trx = await strapi.db.connection.transaction();

        try {
            // 1. Get existing sentences for this article
            const existingSentences = await trx
                .select('id', 'sentence_text', 'sentence_order')
                .from('article_sentences')
                .where('article_id', articleId);

            strapi.log.info(`Found ${existingSentences.length} existing sentences`);

            // 2. Compare with new sentences to find what needs to be updated/deleted/added
            const existingSentenceMap = new Map();
            existingSentences.forEach(s => existingSentenceMap.set(s.sentence_order, s));

            const sentencesToDelete = [];
            const sentencesToUpdate = [];
            const sentencesToAdd = [];

            // Identify sentences that need to be deleted (no longer in the new set)
            if (existingSentences.length > sentences.length) {
                // Find sentences that are no longer present
                for (const existing of existingSentences) {
                    if (existing.sentence_order >= sentences.length) {
                        sentencesToDelete.push(existing.id);
                    }
                }
            }

            // Identify sentences that need to be updated or added
            for (let i = 0; i < sentences.length; i++) {
                const newSentence = sentences[i];
                const existingSentence = existingSentenceMap.get(i);

                if (!newSentence.sentence) {
                    strapi.log.warn(`Skipping empty sentence at index ${i}`);
                    continue;
                }

                // Normalize sentence text for comparison
                const newSentenceText = typeof newSentence.sentence === 'string' ?
                    newSentence.sentence.trim() : String(newSentence.sentence).trim();

                if (existingSentence && existingSentence.sentence_text.trim() === newSentenceText) {
                    // Check if grammar rules need to be updated
                    const existingRules = await trx('sentence_grammar_rules')
                        .where('sentence_id', existingSentence.id)
                        .select('rule');

                    const existingRuleSet = new Set(existingRules.map(r => r.rule));
                    const newRuleSet = new Set(newSentence.rules || []);

                    // Check if rules have changed by comparing sets
                    let rulesChanged = existingRuleSet.size !== newRuleSet.size;
                    if (!rulesChanged) {
                        // If sizes match, check content
                        for (const rule of newRuleSet) {
                            if (!existingRuleSet.has(rule)) {
                                rulesChanged = true;
                                break;
                            }
                        }
                    }

                    if (rulesChanged) {
                        // Rules have changed, add to update list
                        sentencesToUpdate.push({
                            id: existingSentence.id,
                            rules: newSentence.rules || [],
                            translations: newSentence.translations || [],
                            translation: newSentence.translation // Legacy support
                        });
                    }
                } else if (existingSentence) {
                    // Sentence text has changed, add to update list
                    sentencesToUpdate.push({
                        id: existingSentence.id,
                        text: newSentenceText,
                        rules: newSentence.rules || [],
                        translations: newSentence.translations || [],
                        translation: newSentence.translation // Legacy support
                    });
                } else {
                    // This is a new sentence, add to add list
                    sentencesToAdd.push({
                        order: i,
                        text: newSentenceText,
                        rules: newSentence.rules || [],
                        translations: newSentence.translations || [],
                        translation: newSentence.translation // Legacy support
                    });
                }
            }

            strapi.log.info(`Changes detected: ${sentencesToDelete.length} to delete, ${sentencesToUpdate.length} to update, ${sentencesToAdd.length} to add`);

            // 3. Process deletions
            if (sentencesToDelete.length > 0) {
                // Delete translations for these sentences
                await trx('sentence_translations')
                    .whereIn('sentence_id', sentencesToDelete)
                    .delete();

                // Delete grammar rules for these sentences
                await trx('sentence_grammar_rules')
                    .whereIn('sentence_id', sentencesToDelete)
                    .delete();

                // Delete the sentences
                await trx('article_sentences')
                    .whereIn('id', sentencesToDelete)
                    .delete();
            }

            // 4. Process updates
            for (const sentence of sentencesToUpdate) {
                // Update sentence text if needed
                if (sentence.text) {
                    await trx('article_sentences')
                        .where('id', sentence.id)
                        .update({
                            sentence_text: sentence.text,
                            updated_at: trx.fn.now()
                        });
                }

                // Update grammar rules
                await trx('sentence_grammar_rules')
                    .where('sentence_id', sentence.id)
                    .delete();

                if (sentence.rules.length > 0) {
                    const rulesToInsert = sentence.rules.map(rule => ({
                        sentence_id: sentence.id,
                        rule: typeof rule === 'string' ? rule : String(rule),
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    }));

                    await trx('sentence_grammar_rules').insert(rulesToInsert);
                }

                // Update translations
                await trx('sentence_translations')
                    .where('sentence_id', sentence.id)
                    .delete();

                // Handle legacy translation field (as English)
                if (sentence.translation) {
                    const englishText = typeof sentence.translation === 'string' ?
                        sentence.translation : String(sentence.translation);

                    await trx('sentence_translations').insert({
                        sentence_id: sentence.id,
                        translation_language: 'en',
                        translation_text: englishText,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    });
                }

                // Handle new translations format if available
                if (sentence.translations && Array.isArray(sentence.translations)) {
                    // Filter out English translations that are already handled by legacy field
                    const translationsToProcess = sentence.translations.filter(
                        trans => !(trans.language === 'en' && sentence.translation)
                    );

                    if (translationsToProcess.length > 0) {
                        // Use the new helper method to handle translations with better error handling
                        await this.handleTranslationConflicts(sentence.id, translationsToProcess, trx);
                    }
                }
            }

            // 5. Process additions
            for (const sentence of sentencesToAdd) {
                try {
                    // Insert sentence
                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,
                            sentence_text: sentence.text,
                            sentence_order: sentence.order,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                    // Insert grammar rules
                    if (sentence.rules.length > 0) {
                        try {
                            const rulesToInsert = sentence.rules.map(rule => ({
                                sentence_id: sentenceId,
                                rule: typeof rule === 'string' ? rule : String(rule),
                                created_at: trx.fn.now(),
                                updated_at: trx.fn.now()
                            }));

                            await trx('sentence_grammar_rules').insert(rulesToInsert);
                        } catch (ruleError) {
                            // Register failed rules for recovery
                            const errorMessage = ruleError instanceof Error ? ruleError.message : 'Unknown error';

                            sentence.rules.forEach(rule => {
                                registerFailedOperation(
                                    'rule',
                                    {
                                        rule: typeof rule === 'string' ? rule : String(rule),
                                        originalOrder: sentence.order
                                    },
                                    errorMessage,
                                    articleId,
                                    sentenceId
                                );
                            });

                            strapi.log.error(`Error inserting grammar rules for sentence ${sentenceId}: ${errorMessage}`);
                        }
                    }

                    // Handle translations with error recovery
                    try {
                        // Handle legacy translation field (as English)
                        if (sentence.translation) {
                            const englishText = typeof sentence.translation === 'string' ?
                                sentence.translation : String(sentence.translation);

                            await trx('sentence_translations').insert({
                                sentence_id: sentenceId,
                                translation_language: 'en',
                                translation_text: englishText,
                                created_at: trx.fn.now(),
                                updated_at: trx.fn.now()
                            });
                        }

                        // Handle new translations format if available
                        if (sentence.translations && Array.isArray(sentence.translations)) {
                            // Filter out English translations that are already handled by legacy field
                            const translationsToProcess = sentence.translations.filter(
                                trans => !(trans.language === 'en' && sentence.translation)
                            );

                            if (translationsToProcess.length > 0) {
                                // Use the new helper method to handle translations with better error handling
                                await this.handleTranslationConflicts(sentenceId, translationsToProcess, trx);
                            }
                        }
                    } catch (translationError) {
                        // Register failed translations for recovery
                        const errorMessage = translationError instanceof Error ? translationError.message : 'Unknown error';

                        // Register legacy translation
                        if (sentence.translation) {
                            registerFailedOperation(
                                'translation',
                                {
                                    language: 'en',
                                    text: typeof sentence.translation === 'string' ?
                                        sentence.translation : String(sentence.translation),
                                    originalOrder: sentence.order
                                },
                                errorMessage,
                                articleId,
                                sentenceId
                            );
                        }

                        // Register new format translations
                        if (sentence.translations && Array.isArray(sentence.translations)) {
                            sentence.translations
                                .filter(trans => trans && trans.text && trans.language)
                                .forEach(trans => {
                                    registerFailedOperation(
                                        'translation',
                                        {
                                            language: trans.language,
                                            text: typeof trans.text === 'string' ? trans.text : String(trans.text),
                                            originalOrder: sentence.order
                                        },
                                        errorMessage,
                                        articleId,
                                        sentenceId
                                    );
                                });
                        }

                        strapi.log.error(`Error inserting translations for sentence ${sentenceId}: ${errorMessage}`);
                    }
                } catch (insertError) {
                    // Register the entire sentence as failed
                    const errorMessage = insertError instanceof Error ? insertError.message : 'Unknown error';

                    registerFailedOperation(
                        'sentence',
                        {
                            text: sentence.text,
                            order: sentence.order
                        },
                        errorMessage,
                        articleId
                    );

                    strapi.log.error(`Error inserting sentence at order ${sentence.order}: ${errorMessage}`);
                }
            }

            await trx.commit();
            strapi.log.info(`Successfully saved grammar data for article ID: ${articleId}`);

            return { success: true };
        } catch (error) {
            await trx.rollback();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            strapi.log.error(`Error saving article grammar: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Gets all failed operations for an article
     */
    async getFailedOperations(articleId: number): Promise<FailedOperation[]> {
        return failedOperationsStore.filter(op => op.articleId === articleId);
    },

    /**
     * Attempts to recover failed operations for an article
     */
    async recoverFailedOperations(articleId: number): Promise<RecoveryResult> {
        const operations = failedOperationsStore.filter(op => op.articleId === articleId);

        if (operations.length === 0) {
            return {
                success: true,
                recovered: 0,
                failed: 0,
                errors: []
            };
        }

        strapi.log.info(`Attempting to recover ${operations.length} failed operations for article ${articleId}`);

        if (!strapi.db || !strapi.db.connection) {
            return {
                success: false,
                recovered: 0,
                failed: operations.length,
                errors: ['Database connection not available']
            };
        }

        let recovered = 0;
        let failed = 0;
        const errors: string[] = [];

        // Group operations by type for efficient processing
        const sentenceOps = operations.filter(op => op.type === 'sentence');
        const ruleOps = operations.filter(op => op.type === 'rule');
        const translationOps = operations.filter(op => op.type === 'translation');

        // Process in transaction to ensure consistency
        const trx = await strapi.db.connection.transaction();

        try {
            // Recover sentences first
            for (const op of sentenceOps) {
                try {
                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,
                            sentence_text: op.data.text,
                            sentence_order: op.data.order,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                    // Update the operation with the new sentence ID for rules and translations
                    const sentenceOpsToUpdate = [...ruleOps, ...translationOps]
                        .filter(sOp => sOp.data.originalOrder === op.data.order);

                    sentenceOpsToUpdate.forEach(sOp => {
                        sOp.sentenceId = sentenceId;
                    });

                    // Remove this operation from the store
                    const index = failedOperationsStore.findIndex(fOp =>
                        fOp.type === op.type &&
                        fOp.articleId === op.articleId &&
                        fOp.data.order === op.data.order
                    );

                    if (index !== -1) {
                        failedOperationsStore.splice(index, 1);
                    }

                    recovered++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    strapi.log.error(`Failed to recover sentence: ${errorMessage}`);
                    errors.push(`Sentence recovery failed: ${errorMessage}`);
                    failed++;
                }
            }

            // Recover rules
            for (const op of ruleOps) {
                try {
                    // Skip if we don't have a valid sentence ID
                    if (!op.sentenceId) {
                        strapi.log.warn(`Skipping rule recovery due to missing sentence ID`);
                        continue;
                    }

                    await trx('sentence_grammar_rules').insert({
                        sentence_id: op.sentenceId,
                        rule: op.data.rule,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    });

                    // Remove this operation from the store
                    const index = failedOperationsStore.findIndex(fOp =>
                        fOp.type === op.type &&
                        fOp.articleId === op.articleId &&
                        fOp.sentenceId === op.sentenceId &&
                        fOp.data.rule === op.data.rule
                    );

                    if (index !== -1) {
                        failedOperationsStore.splice(index, 1);
                    }

                    recovered++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    strapi.log.error(`Failed to recover rule: ${errorMessage}`);
                    errors.push(`Rule recovery failed: ${errorMessage}`);
                    failed++;
                }
            }

            // Recover translations
            for (const op of translationOps) {
                try {
                    // Skip if we don't have a valid sentence ID
                    if (!op.sentenceId) {
                        strapi.log.warn(`Skipping translation recovery due to missing sentence ID`);
                        continue;
                    }

                    await trx('sentence_translations').insert({
                        sentence_id: op.sentenceId,
                        translation_language: op.data.language,
                        translation_text: op.data.text,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    });

                    // Remove this operation from the store
                    const index = failedOperationsStore.findIndex(fOp =>
                        fOp.type === op.type &&
                        fOp.articleId === op.articleId &&
                        fOp.sentenceId === op.sentenceId &&
                        fOp.data.language === op.data.language
                    );

                    if (index !== -1) {
                        failedOperationsStore.splice(index, 1);
                    }

                    recovered++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    strapi.log.error(`Failed to recover translation: ${errorMessage}`);
                    errors.push(`Translation recovery failed: ${errorMessage}`);
                    failed++;
                }
            }

            await trx.commit();

            strapi.log.info(`Recovery completed for article ${articleId}: ${recovered} recovered, ${failed} failed`);

            return {
                success: recovered > 0,
                recovered,
                failed,
                errors
            };
        } catch (error) {
            await trx.rollback();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            strapi.log.error(`Error during recovery process: ${errorMessage}`);

            return {
                success: false,
                recovered: 0,
                failed: operations.length,
                errors: [errorMessage]
            };
        }
    },
    // Add this function to the exported object in grammar-service.ts
    /**
     * Improves handling of duplicate translations for the translation limit issue
     */
    async handleTranslationConflicts(
        sentence_id: number,
        translations: Array<{ language: string, text: string }>,
        trx: any
    ): Promise<void> {
        try {
            // Get existing translations for this sentence
            const existingTranslations = await trx('sentence_translations')
                .where('sentence_id', sentence_id)
                .select('translation_language');

            const existingLanguages = new Set(existingTranslations.map((t: any) => t.translation_language));

            strapi.log.info(`Sentence ${sentence_id} has existing translations for: ${Array.from(existingLanguages).join(', ')}`);

            for (const trans of translations) {
                // Skip invalid translations
                if (!trans || !trans.text || !trans.language) continue;

                // Ensure text is a string
                const translationText = typeof trans.text === 'string' ?
                    trans.text : String(trans.text);

                try {
                    if (existingLanguages.has(trans.language)) {
                        // Update existing translation instead of inserting
                        strapi.log.info(`Updating existing ${trans.language} translation for sentence ${sentence_id}`);
                        await trx('sentence_translations')
                            .where('sentence_id', sentence_id)
                            .where('translation_language', trans.language)
                            .update({
                                translation_text: translationText,
                                updated_at: trx.fn.now()
                            });
                    } else {
                        // Insert new translation
                        strapi.log.info(`Inserting new ${trans.language} translation for sentence ${sentence_id}`);
                        await trx('sentence_translations').insert({
                            sentence_id: sentence_id,
                            translation_language: trans.language,
                            translation_text: translationText,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                        // Add to set of existing languages to prevent duplicates
                        existingLanguages.add(trans.language);
                    }
                } catch (transError) {
                    strapi.log.error(`Error handling translation for ${trans.language} (sentence ${sentence_id}): ${transError instanceof Error ? transError.message : 'Unknown error'
                        }`);
                    // Continue with next translation instead of failing the whole batch
                }
            }
        } catch (error) {
            strapi.log.error(`Error in handleTranslationConflicts: ${error instanceof Error ? error.message : 'Unknown error'
                }`);
            // Don't throw - we want to continue processing other translations
        }
    }
});