// server/services/grammar-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
    GrammarRule,
    RulesResponse,
    BatchGrammarOptions
} from './types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Processes sentences in batches for more efficient grammar rule generation
     */
    async generateRulesBatch(
        sentences: string[],
        engineChoice: 'stanford' | 'jieba' | 'both' = 'both',
        options: BatchGrammarOptions = {}
    ): Promise<GrammarRule[]> {
        const {
            batchSize = 5,
            maxRetries = 3,
            retryDelay = 1000,
            concurrentRequests = 1
        } = options;

        strapi.log.info(`Generating grammar rules in batches: ${sentences.length} sentences with engine: ${engineChoice}`);

        if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
            strapi.log.warn('No sentences provided for grammar rule generation');
            return [];
        }

        const allRules: GrammarRule[] = [];
        const batches: string[][] = [];

        // Split sentences into batches
        for (let i = 0; i < sentences.length; i += batchSize) {
            batches.push(sentences.slice(i, i + batchSize));
        }

        strapi.log.info(`Split ${sentences.length} sentences into ${batches.length} batches of max ${batchSize} sentences`);

        // Process each batch sequentially
        for (let i = 0; i < batches.length; i++) {
            const batchSentences = batches[i];
            const batchNumber = i + 1;

            strapi.log.info(`Processing batch ${batchNumber}/${batches.length} with ${batchSentences.length} sentences`);

            const batchResults: GrammarRule[] = [];

            for (let j = 0; j < batchSentences.length; j++) {
                const sentence = batchSentences[j];
                strapi.log.info(`Processing sentence ${j + 1}/${batchSentences.length} in batch ${batchNumber}`);

                let retryCount = 0;
                let success = false;
                let sentenceRules: GrammarRule[] = [];

                while (retryCount < maxRetries && !success) {
                    try {
                        sentenceRules = await this.generateRules(sentence, engineChoice);
                        success = true;
                    } catch (error) {
                        retryCount++;
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        strapi.log.error(`Error processing sentence ${j + 1} (attempt ${retryCount}/${maxRetries}): ${errorMessage}`);

                        if (retryCount >= maxRetries) {
                            strapi.log.error(`Failed to process sentence ${j + 1} after ${maxRetries} attempts`);
                            sentenceRules = [{
                                sentence,
                                rules: [],
                                translations: []
                            }];
                        } else {
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                        }
                    }
                }

                batchResults.push(...sentenceRules);

                if (j < batchSentences.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            allRules.push(...batchResults);

            if (i < batches.length - 1) {
                strapi.log.info(`Waiting ${retryDelay}ms before processing next batch`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        strapi.log.info(`Grammar rule generation completed for all ${sentences.length} sentences with ${allRules.length} results`);
        return allRules;
    },

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
                const rules = rulesBySentence[sentence.sentence_id] || [];
                const translations = translationsBySentence[sentence.sentence_id] || {};
                const englishTranslation = translations['en'] || '';

                const translationsArray = Object.entries(translations).map(([language, text]) => ({
                    language,
                    text
                }));

                return {
                    sentence: sentence.sentence_text,
                    rules: rules,
                    translation: englishTranslation,
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

    /**
     * CORRECTED: Save grammar data with complete HSK data preservation
     * REQUIREMENTS:
     * 1. Gets existing processed data from per_languages table ONLY
     * 2. Merges grammar with existing HSK data (or works without HSK data)
     * 3. Saves complete merged data to per_languages table ONLY
     * 4. HSK and grammar operations are completely separate
     */
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
            // Save to sentence tables (existing logic)
            const existingSentences = await trx
                .select('id')
                .from('article_sentences')
                .where('article_id', articleId);

            const sentenceIds = existingSentences.map(s => s.id);
            strapi.log.info(`Found ${sentenceIds.length} existing sentences to delete`);

            if (sentenceIds.length > 0) {
                await trx('sentence_translations')
                    .whereIn('sentence_id', sentenceIds)
                    .delete();

                await trx('sentence_grammar_rules')
                    .whereIn('sentence_id', sentenceIds)
                    .delete();
            }

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
                    const sentenceText = typeof sentence.sentence === 'string' ?
                        sentence.sentence : String(sentence.sentence);

                    const [sentenceId] = await trx('article_sentences')
                        .insert({
                            article_id: articleId,
                            sentence_text: sentenceText,
                            sentence_order: i,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        });

                    if (sentence.rules && Array.isArray(sentence.rules) && sentence.rules.length > 0) {
                        const rulesToInsert = sentence.rules.map(rule => ({
                            sentence_id: sentenceId,
                            rule: typeof rule === 'string' ? rule : String(rule),
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        }));

                        await trx('sentence_grammar_rules').insert(rulesToInsert);
                    }

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

                    if (sentence.translations && Array.isArray(sentence.translations)) {
                        const translationsToInsert = sentence.translations
                            .filter(trans => {
                                if (!trans || !trans.text || !trans.language) return false;
                                if (trans.language === 'en' && sentence.translation) return false;
                                return true;
                            })
                            .map(trans => {
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
                    const errorMessage = insertError instanceof Error ? insertError.message : 'Unknown error';
                    strapi.log.error(`Error inserting sentence ${i}: ${errorMessage}`);
                }
            }

            await trx.commit();
            strapi.log.info(`Successfully saved grammar data for article ID: ${articleId}`);

            // **CORRECTED: Update per_languages table ONLY with HSK preservation**
            try {
                console.log(`[Grammar Service] 🎯 Updating per_languages table with HSK preservation...`);

                // STEP 1: Get existing processed data from per_languages table ONLY
                const perLanguagePlugin = strapi.plugin('per-language');
                const contentService = perLanguagePlugin?.service('contentService');

                if (!contentService) {
                    console.log(`[Grammar Service] ⚠️ per-language service not available`);
                    return { success: true }; // Still return success since sentence tables were saved
                }

                const existingContent = await contentService.getLanguageContent(articleId, 'zh');

                if (!existingContent) {
                    console.log(`[Grammar Service] ⚠️ No per_language entry found for article ${articleId}`);
                    return { success: true }; // Still return success since sentence tables were saved
                }

                // STEP 2: Get existing processed data (including HSK data if it exists)
                const existingProcessedData = existingContent.processed_data || {};
                console.log(`[Grammar Service] 📋 Existing processed data keys:`, Object.keys(existingProcessedData));

                // STEP 3: Create new grammar data structure
                const newGrammarData = {
                    sentences: sentences.map(sentence => ({
                        sentence: sentence.sentence,
                        rules: sentence.rules || [],
                        translation: sentence.translation || '',
                        translations: sentence.translations || []
                    }))
                };

                // STEP 4: Merge grammar with existing data (preserve HSK if it exists)
                const completeData = {
                    ...existingProcessedData,  // Preserve existing HSK and other data (if any)
                    grammar: newGrammarData    // Update only grammar data
                };

                console.log(`[Grammar Service] 📊 Complete merged data structure:`, {
                    hasHSK: !!completeData.hsk,
                    hasGrammar: !!completeData.grammar,
                    grammarSentencesCount: completeData.grammar?.sentences?.length || 0,
                    hskData: completeData.hsk ? {
                        calculatedLevel: completeData.hsk.calculatedLevel,
                        selectedLevel: completeData.hsk.selectedLevel,
                        hasDistribution: !!completeData.hsk.distribution
                    } : 'No HSK data found (this is fine)'
                });

                // STEP 5: Extract difficulty data for performance optimization (only if HSK exists)
                const difficultyData = completeData.hsk ? {
                    hsk: {
                        distribution: completeData.hsk.distribution,
                        selectedLevel: completeData.hsk.selectedLevel,
                        calculatedLevel: completeData.hsk.calculatedLevel
                    }
                } : null;

                // STEP 6: Extract display skill for UI (only if HSK exists)
                const displaySkill = completeData.hsk?.selectedLevel ?
                    `HSK ${completeData.hsk.selectedLevel}` :
                    (completeData.hsk?.calculatedLevel ? `HSK ${completeData.hsk.calculatedLevel}` : null);

                console.log(`[Grammar Service] 🚀 Updating per_languages table with preserved HSK data...`);
                console.log(`[Grammar Service] 📊 Difficulty data:`, difficultyData || 'No HSK data to preserve');
                console.log(`[Grammar Service] 🏷️ Display skill:`, displaySkill || 'No HSK display skill');

                // STEP 7: Update per_languages table ONLY
                if (contentService.updateCompleteProcessedData) {
                    await contentService.updateCompleteProcessedData(
                        existingContent.id,
                        completeData,       // processed_data: Complete metadata with preserved HSK
                        difficultyData,     // difficulty_data: Extracted difficulty (null if no HSK)
                        displaySkill       // display_skill: UI display (null if no HSK)
                    );
                    console.log(`[Grammar Service] ✅ Successfully updated per_languages table with complete data preservation`);
                } else {
                    console.log(`[Grammar Service] ⚠️ updateCompleteProcessedData method not available, using fallback`);
                    await contentService.updateProcessedData(existingContent.id, completeData, displaySkill);
                    console.log(`[Grammar Service] ✅ Updated per_languages table using fallback method`);
                }

                console.log(`[Grammar Service] ✅ Grammar update with HSK preservation completed`);
            } catch (updateError) {
                // Log error but don't fail the entire operation since sentence tables were saved successfully
                const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
                console.error(`[Grammar Service] ❌ Error updating per_languages table: ${errorMessage}`);
                console.log(`[Grammar Service] ℹ️ Sentence tables were saved successfully despite update error`);
            }

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