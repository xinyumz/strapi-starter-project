// server/services/article-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { EnhancedSentence, BatchGrammarOptions, BatchTranslationOptions } from './types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Process an article by splitting it into sentences, generating grammar rules,
     * and translating to the target languages
     */
    async processArticle(
        content: string,
        targetLanguages: string[] = ['en'],
        useBatchGrammar: boolean = true,
        batchOptions: BatchGrammarOptions = {}
    ): Promise<EnhancedSentence[]> {
        if (typeof content !== 'string') {
            throw new ApplicationError('Content must be a string');
        }

        try {
            const sentences = content.split('|').filter(s => s.trim());

            if (sentences.length === 0) {
                throw new ApplicationError('No valid sentences found in content');
            }

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');
            const translationService = strapi.plugin('chinese-article-processor').service('translationService');

            // Get grammar rules based on batch preference
            let grammarRules;
            if (useBatchGrammar && sentences.length > 1) {
                // Configure default batch options if not provided
                const options: BatchGrammarOptions = {
                    batchSize: batchOptions.batchSize || 5,
                    maxRetries: batchOptions.maxRetries || 3,
                    retryDelay: batchOptions.retryDelay || 1000,
                    concurrentRequests: batchOptions.concurrentRequests || 2
                };

                strapi.log.info(`Processing ${sentences.length} sentences with batch grammar generation`);
                grammarRules = await grammarService.generateRulesBatch(sentences, 'both', options);
            } else {
                strapi.log.info(`Processing article with standard grammar generation`);
                grammarRules = await grammarService.generateRules(content);
            }

            // Then get translations for each target language
            const translationsByLanguage: { [language: string]: string[] } = {};

            for (const language of targetLanguages) {
                translationsByLanguage[language] = await translationService.translateSentences(sentences, language);
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

    /**
     * Save processed article data to the database
     */
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

                    // Delete grammar rules for existing sentences
                    await trx('sentence_grammar_rules')
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

    /**
     * Get all sentences with translations for an article
     */
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
                .select('id', 'sentence_text');

            // Get all grammar rules for these sentences
            const sentenceIds = sentences.map((s: any) => s.id);

            // Get grammar rules
            const grammarRules = await knex('sentence_grammar_rules')
                .whereIn('sentence_id', sentenceIds)
                .select('sentence_id', 'rule');

            // Group grammar rules by sentence_id
            const rulesBySentenceId: { [key: number]: string[] } = {};
            for (const rule of grammarRules) {
                if (!rulesBySentenceId[rule.sentence_id]) {
                    rulesBySentenceId[rule.sentence_id] = [];
                }
                rulesBySentenceId[rule.sentence_id].push(rule.rule);
            }

            // Get translations for all sentences
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
                grammarRules: rulesBySentenceId[sentence.id] || []
            }));
        } catch (error) {
            console.error('Error fetching article sentences:', error);
            throw new ApplicationError('Failed to fetch article sentences');
        }
    }
});