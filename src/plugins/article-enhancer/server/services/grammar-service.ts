// server/services/grammar-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

interface GrammarRule {
    sentence: string;
    rules: string[];
    translation?: string;
    translations?: { language: string; text: string }[];
}

interface RulesResponse {
    rules: GrammarRule[];
}

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Generate grammar rules from external API (no changes needed)
    async generateRules(text: string, engineChoice: 'stanford' | 'jieba' | 'both' = 'both'): Promise<GrammarRule[]> {
        try {
            strapi.log.info(`Generating grammar rules with engine: ${engineChoice}`);

            const response = await fetch('https://api.pandaist.com/api/v1/rulesgen/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    rule_choice: engineChoice
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                strapi.log.error(`Grammar rules API error: ${response.status} ${response.statusText} - ${errorText}`);
                throw new Error(`Grammar rules generation failed: ${response.statusText}`);
            }

            const data = (await response.json()) as RulesResponse;

            if (!data.rules || !Array.isArray(data.rules)) {
                throw new Error('Invalid response format from grammar rules API');
            }

            return data.rules;
        } catch (error) {
            console.error('Grammar rules generation error:', error);
            throw error;
        }
    },

    // Get all grammar data for an article from the normalized database
    async getArticleGrammar(articleId: number): Promise<{ sentences: GrammarRule[], success: boolean, error?: string }> {
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

    // Save grammar data for an article to the normalized database
    async saveArticleGrammar(articleId: number, sentences: GrammarRule[]): Promise<{ success: boolean, error?: string }> {
        if (!strapi.db || !strapi.db.connection) {
            return {
                success: false,
                error: 'Database connection not available'
            };
        }

        strapi.log.info(`Saving grammar data for article ID: ${articleId} with ${sentences.length} sentences`);

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
            // First delete existing data
            // Get all sentence IDs for this article
            const existingSentences = await trx
                .select('id')
                .from('article_sentences')
                .where('article_id', articleId);

            const sentenceIds = existingSentences.map(s => s.id);

            strapi.log.info(`Found ${sentenceIds.length} existing sentences to delete`);

            // Delete translations and grammar rules for these sentences
            if (sentenceIds.length > 0) {
                await trx('sentence_translations')
                    .whereIn('sentence_id', sentenceIds)
                    .delete();

                // Delete grammar rules for these sentences
                await trx('sentence_grammar_rules')
                    .whereIn('sentence_id', sentenceIds)
                    .delete();
            }

            // Delete sentences
            await trx('article_sentences')
                .where('article_id', articleId)
                .delete();

            // Insert new sentences and rules
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i];

                if (!sentence.sentence) {
                    strapi.log.warn(`Skipping empty sentence at index ${i}`);
                    continue;
                }

                try {
                    // Safely get sentence text, ensuring it's a string
                    const sentenceText = typeof sentence.sentence === 'string' ?
                        sentence.sentence : String(sentence.sentence);

                    // Insert sentence
                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,
                            sentence_text: sentenceText,
                            sentence_order: i,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                    // Insert grammar rules
                    if (sentence.rules && Array.isArray(sentence.rules) && sentence.rules.length > 0) {
                        const rulesToInsert = sentence.rules.map(rule => ({
                            sentence_id: sentenceId,
                            rule: typeof rule === 'string' ? rule : String(rule),
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        }));

                        await trx('sentence_grammar_rules').insert(rulesToInsert);
                    }

                    // Insert translations
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
                        const translationsToInsert = sentence.translations
                            .filter(trans => {
                                // Skip empty translations or those already handled by legacy field
                                if (!trans || !trans.text || !trans.language) return false;
                                if (trans.language === 'en' && sentence.translation) return false;
                                return true;
                            })
                            .map(trans => {
                                // Ensure text is a string
                                const translationText = typeof trans.text === 'string' ?
                                    trans.text : String(trans.text);

                                return {
                                    sentence_id: sentenceId,
                                    translation_language: trans.language,
                                    translation_text: translationText,
                                    created_at: trx.fn.now(),
                                    updated_at: trx.fn.now()
                                };
                            });

                        if (translationsToInsert.length > 0) {
                            await trx('sentence_translations').insert(translationsToInsert);
                        }
                    }
                } catch (insertError) {
                    // Log the specific error for this sentence but continue with others
                    const errorMessage = insertError instanceof Error ? insertError.message : 'Unknown error';
                    strapi.log.error(`Error inserting sentence ${i}: ${errorMessage}`);
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
    }
});