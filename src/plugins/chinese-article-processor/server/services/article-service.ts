// server/services/article-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { EnhancedSentence } from './types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Process an article by splitting it into sentences, generating grammar rules,
     * and translating to the target languages
     */
    async processArticle(
        content: string,
        targetLanguages: string[] = ['en']
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

            // SIMPLIFIED: Always use single request method (faster than batch)
            strapi.log.info(`Processing ${sentences.length} sentences with standard grammar generation`);
            const grammarRules = await grammarService.generateRules(content);

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
     * ENHANCED: Save processed article data using proper foreign key relationships
     */
    async saveProcessedArticle(articleId: number, processedSentences: EnhancedSentence[]): Promise<void> {
        if (!strapi.db) {
            throw new ApplicationError('Database connection is not available');
        }
        const knex = strapi.db.connection;

        try {
            console.log(`[ChineseProcessor] save: Article ${articleId}, ${processedSentences.length} sentences`);

            // STEP 1: Get the Chinese per_language_id for this article
            const perLanguageId = await this.getPerLanguageId(articleId, 'zh');
            if (!perLanguageId) {
                throw new ApplicationError(
                    `Chinese per_language entry not found for article ${articleId}. ` +
                    `Please ensure the article is translated to Chinese first.`
                );
            }

            console.log(`[ChineseProcessor] Using per_language_id: ${perLanguageId}`);

            // STEP 2: Start transaction for data consistency
            await knex.transaction(async (trx: any) => {
                // STEP 3: Clean up existing sentences (CASCADE will handle grammar rules and translations)
                console.log(`[ChineseProcessor] Cleaning up existing sentences for per_language_id: ${perLanguageId}`);

                const deletedCount = await trx('article_sentences')
                    .where('per_language_id', perLanguageId)
                    .delete();

                console.log(`[ChineseProcessor] Deleted ${deletedCount} existing sentences (with cascading)`);

                // STEP 4: Insert new sentences with proper foreign key relationships
                console.log(`[ChineseProcessor] Inserting ${processedSentences.length} new sentences`);

                for (let i = 0; i < processedSentences.length; i++) {
                    const sentence = processedSentences[i];

                    // Insert sentence with proper foreign keys
                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,           // Keep for compatibility
                            per_language_id: perLanguageId,  // NEW: Proper foreign key
                            language: 'zh',                  // NEW: Language identifier
                            sentence_text: sentence.chinese,
                            sentence_order: i + 1,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                    console.log(`[ChineseProcessor] Created sentence ${i + 1} with ID: ${sentenceId}`);

                    // Insert grammar rules if any
                    if (sentence.grammarRules && Array.isArray(sentence.grammarRules) && sentence.grammarRules.length > 0) {
                        const rulesToInsert = sentence.grammarRules.map(rule => ({
                            sentence_id: sentenceId,
                            rule: typeof rule === 'string' ? rule : String(rule),
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        }));

                        await trx('sentence_grammar_rules').insert(rulesToInsert);
                        console.log(`[ChineseProcessor] Added ${rulesToInsert.length} grammar rules for sentence ${i + 1}`);
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
                        console.log(`[ChineseProcessor] Added translations in ${Object.keys(sentence.translations).join(', ')} for sentence ${i + 1}`);
                    }
                }
            });

            console.log(`[ChineseProcessor] ✅ Successfully saved processed article ${articleId} with proper foreign keys`);

        } catch (error) {
            console.error('[ChineseProcessor] Error saving processed article:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to save processed article: ${errorMessage}`);
        }
    },

    /**
     * Helper method to get per_language_id for a specific language
     */
    async getPerLanguageId(articleId: number, language: string): Promise<number | null> {
        try {
            const entityService = strapi.entityService;
            if (!entityService) {
                throw new ApplicationError('Entity service is not available');
            }

            const perLanguageEntries = await entityService.findMany('plugin::per-language.article-perlanguage', {
                filters: {
                    article_id: articleId,
                    language: language
                }
            });

            if (Array.isArray(perLanguageEntries) && perLanguageEntries.length > 0) {
                return parseInt(String(perLanguageEntries[0].id));
            }

            return null;
        } catch (error) {
            console.error(`[ChineseProcessor] Error getting per_language_id for article ${articleId}, language ${language}:`, error);
            return null;
        }
    },

    /**
     * Get sentences using proper foreign key relationships
     */
    async getArticleSentences(articleId: number, language: string = 'zh'): Promise<EnhancedSentence[]> {
        if (!strapi.db) {
            throw new ApplicationError('Database connection is not available');
        }
        const knex = strapi.db.connection;

        try {
            console.log(`[ChineseProcessor] Getting sentences for article ${articleId}, language ${language}`);

            // Get the per_language_id first
            const perLanguageId = await this.getPerLanguageId(articleId, language);
            if (!perLanguageId) {
                console.log(`[ChineseProcessor] No per_language entry found for article ${articleId}, language ${language}`);
                return [];
            }

            // Get sentences using the proper foreign key relationship
            const sentences = await knex('article_sentences')
                .where('per_language_id', perLanguageId)
                .orderBy('sentence_order')
                .select('id', 'sentence_text');

            console.log(`[ChineseProcessor] Found ${sentences.length} sentences for per_language_id ${perLanguageId}`);

            if (sentences.length === 0) {
                return [];
            }

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
            const result = sentences.map((sentence: any) => ({
                chinese: sentence.sentence_text,
                translations: translationsBySentenceId[sentence.id] || {},
                grammarRules: rulesBySentenceId[sentence.id] || []
            }));

            console.log(`[ChineseProcessor] ✅ Successfully retrieved ${result.length} sentences`);
            return result;

        } catch (error) {
            console.error('[ChineseProcessor] Error fetching article sentences:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to fetch article sentences: ${errorMessage}`);
        }
    },
});