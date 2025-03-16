// server/services/grammar-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

interface GrammarRule {
    sentence: string;
    rules: string[];
    translation?: string;
}

interface RulesResponse {
    rules: GrammarRule[];
}

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Generate grammar rules from external API
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

            // Use Knex query builder for more complex joins
            const sentencesQuery = strapi.db.connection
                .select(
                    'article_sentences.id as sentence_id',
                    'article_sentences.sentence_text',
                    'article_sentences.sentence_order',
                    'article_sentences.translation'
                )
                .from('article_sentences')
                .where('article_sentences.article_id', articleId)
                .orderBy('article_sentences.sentence_order');

            const sentences = await sentencesQuery;

            strapi.log.info(`Found ${sentences.length} sentences for article ID: ${articleId}`);

            // Get rules for all sentences in this article
            const rulesQuery = strapi.db.connection
                .select(
                    'sentence_grammar_rules.id',
                    'sentence_grammar_rules.sentence_id',
                    'sentence_grammar_rules.rule_text'
                )
                .from('sentence_grammar_rules')
                .join('article_sentences', 'article_sentences.id', 'sentence_grammar_rules.sentence_id')
                .where('article_sentences.article_id', articleId);

            const rules = await rulesQuery;

            strapi.log.info(`Found ${rules.length} rules for article ID: ${articleId}`);

            // Organize rules by sentence
            const rulesBySentence: Record<number, string[]> = {};
            rules.forEach(rule => {
                if (!rulesBySentence[rule.sentence_id]) {
                    rulesBySentence[rule.sentence_id] = [];
                }
                rulesBySentence[rule.sentence_id].push(rule.rule_text);
            });

            // Format sentences with their rules
            const formattedSentences: GrammarRule[] = sentences.map(sentence => ({
                sentence: sentence.sentence_text,
                rules: rulesBySentence[sentence.sentence_id] || [],
                translation: sentence.translation
            }));

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

            // Delete rules for these sentences
            if (sentenceIds.length > 0) {
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
                    // Insert sentence
                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,
                            sentence_text: sentence.sentence,
                            sentence_order: i,
                            translation: sentence.translation || null
                        });

                    // Insert rules
                    if (sentence.rules && sentence.rules.length > 0) {
                        const rulesToInsert = sentence.rules
                            .filter(rule => rule && rule.trim() !== '')
                            .map(rule => ({
                                sentence_id: sentenceId,
                                rule_text: rule
                            }));

                        if (rulesToInsert.length > 0) {
                            await trx('sentence_grammar_rules').insert(rulesToInsert);
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
    },

    // Delete a rule directly from the database
    async deleteRule(ruleId: number): Promise<{ success: boolean, error?: string }> {
        try {
            strapi.log.info(`Deleting grammar rule with ID: ${ruleId}`);

            if (!strapi.db || !strapi.db.connection) {
                throw new Error('Database connection not available');
            }

            const deleted = await strapi.db.connection('sentence_grammar_rules')
                .where('id', ruleId)
                .delete();

            if (deleted === 0) {
                return {
                    success: false,
                    error: `Rule with ID ${ruleId} not found`
                };
            }

            strapi.log.info(`Successfully deleted grammar rule with ID: ${ruleId}`);
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            strapi.log.error(`Grammar rule deletion error: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
});