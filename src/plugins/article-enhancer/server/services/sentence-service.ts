// Updated server/services/sentence-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface EnhancedSentence {
    chinese: string;
    translations: {
        [language: string]: string;
    };
    grammarRules: string[];
}

interface BatchTranslationOptions {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
}

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Helper method to translate sentences in batches for better performance
     */
    async translateSentencesBatch(
        sentences: string[],
        targetLanguage: string,
        options: BatchTranslationOptions = {}
    ): Promise<string[]> {
        const {
            batchSize = 10,
            maxRetries = 3,
            retryDelay = 1000
        } = options;

        if (!strapi.plugin('translator')) {
            throw new Error('Translator plugin not found');
        }

        const translationService = strapi.plugin('translator').service('translationService');

        if (!translationService || !translationService.translate) {
            throw new Error('Translation service not available');
        }

        // Process in batches for better performance
        const translations: string[] = [];
        let errorCount = 0;

        for (let i = 0; i < sentences.length; i += batchSize) {
            const batch = sentences.slice(i, i + batchSize);
            console.log(`Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sentences.length / batchSize)}`);

            // Process each batch of sentences
            const batchTranslations = await Promise.all(
                batch.map(async (sentence) => {
                    if (typeof sentence !== 'string' || sentence.trim() === '') {
                        return '';
                    }

                    // Retry mechanism for more robust translations
                    let retryCount = 0;
                    while (retryCount < maxRetries) {
                        try {
                            const translation = await translationService.translate(sentence, targetLanguage);
                            if (translation && typeof translation === 'string') {
                                return translation;
                            } else {
                                throw new Error('Invalid translation result');
                            }
                        } catch (error) {
                            retryCount++;
                            if (retryCount >= maxRetries) {
                                console.error(`Failed to translate after ${maxRetries} attempts: "${sentence.substring(0, 50)}..."`, error);
                                errorCount++;
                                return `[Translation error]`;
                            }

                            // Wait before retrying
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            console.log(`Retrying translation (${retryCount}/${maxRetries})`);
                        }
                    }

                    return `[Translation error]`; // Fallback
                })
            );

            translations.push(...batchTranslations);
        }

        if (errorCount > 0) {
            console.warn(`Completed with ${errorCount} errors out of ${sentences.length} translations`);
        } else {
            console.log(`All ${sentences.length} translations to ${targetLanguage} completed successfully`);
        }

        return translations;
    },

    /**
     * Translate a list of sentences to the target language
     */
    async translateSentences(sentences: string[], targetLanguage: string = 'en'): Promise<string[]> {
        if (!Array.isArray(sentences)) {
            throw new ApplicationError('Input must be an array of sentences');
        }

        if (sentences.length === 0) {
            return [];
        }

        try {
            console.log(`Attempting to translate ${sentences.length} sentences to ${targetLanguage}`);

            // Check if translator plugin and translation service exist
            if (!strapi.plugin('translator')) {
                throw new Error('Translator plugin not found');
            }

            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService) {
                throw new Error('Translation service not found in translator plugin');
            }

            if (!translationService.translate) {
                throw new Error('Translate method not found in translation service');
            }

            // Use the batch translation method for better performance
            return await this.translateSentencesBatch(sentences, targetLanguage, {
                batchSize: 10, // Number of sentences to translate at once
                maxRetries: 3,  // Number of retry attempts per sentence
                retryDelay: 1000 // Delay between retries in ms
            });

        } catch (error: unknown) {
            console.error('Sentence translation error:', error);

            if (error instanceof ApplicationError) {
                throw error;
            }

            // Provide more specific error messages based on the error type
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (errorMessage.includes('Translator plugin not found')) {
                throw new ApplicationError('Translation service is not properly configured');
            } else if (errorMessage.includes('quota')) {
                throw new ApplicationError('Translation quota exceeded. Please try again later.');
            } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
                throw new ApplicationError('Network error during translation. Please check your connection and try again.');
            } else {
                throw new ApplicationError(`Failed to translate sentences: ${errorMessage}`);
            }
        }
    },

    async processArticle(content: string, targetLanguages: string[] = ['en']): Promise<EnhancedSentence[]> {
        if (typeof content !== 'string') {
            throw new ApplicationError('Content must be a string');
        }

        try {
            const sentences = content.split('|').filter(s => s.trim());

            if (sentences.length === 0) {
                throw new ApplicationError('No valid sentences found in content');
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');

            // Get grammar rules first
            const grammarRules = await grammarService.generateRules(content);

            // Then get translations for each target language
            const translationsByLanguage: { [language: string]: string[] } = {};

            for (const language of targetLanguages) {
                translationsByLanguage[language] = await this.translateSentences(sentences, language);
            }

            // Combine everything
            return sentences.map((chinese, index) => {
                // Create translations object with all target languages
                const translations: { [language: string]: string } = {};
                for (const language of targetLanguages) {
                    translations[language] = translationsByLanguage[language][index];
                }

                return {
                    chinese: chinese.trim(),
                    translations,
                    grammarRules: grammarRules[index]?.rules || []
                };
            });
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.error('Article processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to process article: ${errorMessage}`);
        }
    },

    async saveProcessedArticle(articleId: number, processedSentences: EnhancedSentence[]): Promise<void> {
        if (!strapi.db) {
            throw new ApplicationError('Database connection is not available');
        }
        const knex = strapi.db.connection;

        try {
            // Start a transaction
            await knex.transaction(async (trx: any) => {
                // Delete existing sentences and related data for this article
                const existingSentenceIds = await trx('article_sentences')
                    .where('article_id', articleId)
                    .pluck('id');

                // Delete translations for existing sentences
                if (existingSentenceIds.length > 0) {
                    await trx('sentence_translations')
                        .whereIn('sentence_id', existingSentenceIds)
                        .delete();
                }

                // Delete existing sentences
                await trx('article_sentences')
                    .where('article_id', articleId)
                    .delete();

                // Insert new sentences
                for (let i = 0; i < processedSentences.length; i++) {
                    const sentence = processedSentences[i];

                    // Insert the sentence
                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,
                            sentence_text: sentence.chinese,
                            sentence_order: i + 1,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                    // Insert grammar rules if any
                    if (sentence.grammarRules && Array.isArray(sentence.grammarRules) && sentence.grammarRules.length > 0) {
                        const rulesToInsert = sentence.grammarRules.map(rule => ({
                            sentence_id: sentenceId,
                            rule: typeof rule === 'string' ? rule : String(rule),
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        }));

                        await trx('sentence_grammar_rules').insert(rulesToInsert);
                    }

                    // Insert translations for each language
                    const translationsToInsert = Object.entries(sentence.translations).map(
                        ([language, text]) => ({
                            sentence_id: sentenceId,
                            translation_language: language,
                            translation_text: text,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        })
                    );

                    if (translationsToInsert.length > 0) {
                        await trx('sentence_translations').insert(translationsToInsert);
                    }
                }
            });

            console.log(`Successfully saved processed article ${articleId} with ${processedSentences.length} sentences`);
        } catch (error) {
            console.error('Error saving processed article:', error);
            throw new ApplicationError('Failed to save processed article');
        }
    },

    async getArticleSentences(articleId: number): Promise<EnhancedSentence[]> {
        if (!strapi.db) {
            throw new ApplicationError('Database connection is not available');
        }
        const knex = strapi.db.connection;

        try {
            // Get sentences for the article
            const sentences = await knex('article_sentences')
                .where('article_id', articleId)
                .orderBy('sentence_order')
                .select('id', 'sentence_text', 'grammar_rules');

            // Get translations for all sentences
            const sentenceIds = sentences.map((s: any) => s.id);
            const translations = await knex('sentence_translations')
                .whereIn('sentence_id', sentenceIds)
                .select('sentence_id', 'translation_language', 'translation_text');

            // Group translations by sentence_id
            const translationsBySentenceId: { [key: number]: { [language: string]: string } } = {};
            for (const translation of translations) {
                if (!translationsBySentenceId[translation.sentence_id]) {
                    translationsBySentenceId[translation.sentence_id] = {};
                }
                translationsBySentenceId[translation.sentence_id][translation.translation_language] =
                    translation.translation_text;
            }

            // Combine data into the expected format
            return sentences.map((sentence: any) => ({
                chinese: sentence.sentence_text,
                translations: translationsBySentenceId[sentence.id] || {},
                grammarRules: JSON.parse(sentence.grammar_rules || '[]')
            }));
        } catch (error) {
            console.error('Error fetching article sentences:', error);
            throw new ApplicationError('Failed to fetch article sentences');
        }
    }
});