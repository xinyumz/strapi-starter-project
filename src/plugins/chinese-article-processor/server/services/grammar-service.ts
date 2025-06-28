// server/services/grammar-service.ts

import { errors } from '@strapi/utils';
import {
    GrammarRule,
    RulesResponse,
} from './types';

const { ApplicationError } = errors;


interface SentenceRow {
    sentence_id: number;
    sentence_text: string;
    sentence_order: number;
}

interface GrammarRuleRow {
    sentence_id: number;
    rule: string;
}

interface TranslationRow {
    sentence_id: number;
    translation_language: string;
    translation_text: string;
}

interface ExistingSentenceRow {
    id: number;
    sentence_text: string;
    sentence_order: number;
}

interface ExistingRuleRow {
    rule: string;
}

interface ExistingTranslationRow {
    translation_language: string;
    translation_text: string;
}

export default ({ strapi }: any) => ({
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
            grammarRules.forEach((rule: GrammarRuleRow) => {
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
            translations.forEach((translation: TranslationRow) => {
                if (!translationsBySentence[translation.sentence_id]) {
                    translationsBySentence[translation.sentence_id] = {};
                }
                translationsBySentence[translation.sentence_id][translation.translation_language] = translation.translation_text;
            });

            // Format sentences with their rules and translations
            const formattedSentences: GrammarRule[] = sentences.map((sentence: SentenceRow) => {
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
     * Save grammar data
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

        // Get per_language_id for Chinese content using new service structure
        let perLanguageId = null;
        try {
            const perLanguagePlugin = strapi.plugin('per-language');
            const articleService = perLanguagePlugin?.service('articleService');

            if (articleService) {
                const chineseContent = await articleService.getLanguageContent(articleId, 'zh');
                if (chineseContent && chineseContent.id) {
                    perLanguageId = chineseContent.id;
                    strapi.log.info(`Found Chinese per_language_id: ${perLanguageId}`);
                } else {
                    strapi.log.warn(`No Chinese per_language content found for article ${articleId}`);
                }
            } else {
                strapi.log.warn(`Per-language articleService not available`);
            }
        } catch (error) {
            strapi.log.error(`Error getting per_language_id:`, error);
        }

        const trx = await strapi.db.connection.transaction();

        try {
            // 🎯 STEP 1: Get existing sentences with their current order
            const existingSentences = await trx
                .select('id', 'sentence_text', 'sentence_order')
                .from('article_sentences')
                .where('article_id', articleId)
                .orderBy('sentence_order');

            strapi.log.info(`Found ${existingSentences.length} existing sentences`);

            // 🎯 STEP 2: Create mappings for intelligent UPSERT
            const existingSentenceMap = new Map();
            existingSentences.forEach((sentence: ExistingSentenceRow) => {
                existingSentenceMap.set(sentence.sentence_order, {
                    id: sentence.id,
                    text: sentence.sentence_text
                });
            });

            // Track which sentences we've processed to identify deletions
            const processedSentenceIds = new Set();

            // 🎯 STEP 3: UPSERT sentences (update existing, insert new)
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i];

                if (!sentence.sentence) {
                    strapi.log.warn(`Skipping empty sentence at index ${i}`);
                    continue;
                }

                const sentenceText = typeof sentence.sentence === 'string' ?
                    sentence.sentence : String(sentence.sentence);

                const existingSentence = existingSentenceMap.get(i);
                let sentenceId;

                if (existingSentence) {
                    // ✅ UPDATE existing sentence (preserves ID)
                    sentenceId = existingSentence.id;
                    processedSentenceIds.add(sentenceId);

                    // Only update if text actually changed
                    if (existingSentence.text !== sentenceText) {
                        await trx('article_sentences')
                            .where('id', sentenceId)
                            .update({
                                sentence_text: sentenceText,
                                sentence_order: i,
                                updated_at: trx.fn.now()
                            });

                        strapi.log.info(`Updated sentence ID ${sentenceId} at order ${i}`);
                    } else {
                        strapi.log.info(`Sentence ID ${sentenceId} unchanged at order ${i}`);
                    }
                } else {
                    // ✅ INSERT new sentence
                    const insertData: any = {
                        article_id: articleId,
                        sentence_text: sentenceText,
                        sentence_order: i,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    };

                    // Add foreign key fields if we have the per_language_id
                    if (perLanguageId) {
                        insertData.per_language_id = perLanguageId;
                        insertData.language = 'zh';
                    }

                    const [newSentenceId] = await trx('article_sentences').insert(insertData);
                    sentenceId = newSentenceId;
                    processedSentenceIds.add(sentenceId);

                    strapi.log.info(`Created new sentence ID ${sentenceId} at order ${i} with per_language_id ${perLanguageId}`);
                }

                // 🎯 STEP 4: Update grammar rules for this sentence
                await this.updateSentenceGrammarRules(trx, sentenceId, sentence.rules || []);

                // 🎯 STEP 5: Update translations for this sentence  
                await this.updateSentenceTranslations(
                    trx,
                    sentenceId,
                    sentence.translation || '',
                    sentence.translations || []
                );
            }

            // 🎯 STEP 6: Delete sentences that are no longer needed
            const sentencesToDelete = existingSentences.filter((sentence: ExistingSentenceRow) =>
                !processedSentenceIds.has(sentence.id)
            );

            if (sentencesToDelete.length > 0) {
                const deleteIds = sentencesToDelete.map((s: ExistingSentenceRow) => s.id);
                strapi.log.info(`Deleting ${deleteIds.length} unused sentences: ${deleteIds.join(', ')}`);

                // Delete related data first (cascade delete)
                await trx('sentence_translations')
                    .whereIn('sentence_id', deleteIds)
                    .delete();

                await trx('sentence_grammar_rules')
                    .whereIn('sentence_id', deleteIds)
                    .delete();

                await trx('article_sentences')
                    .whereIn('id', deleteIds)
                    .delete();
            }

            await trx.commit();
            strapi.log.info(`✅ Successfully saved grammar data for article ID: ${articleId} with stable sentence IDs`);

            // Update article_perlanguages table with HSK preservation using new service structure
            try {
                console.log(`[Grammar Service] 🎯 Updating article_perlanguages table with HSK preservation...`);

                const perLanguagePlugin = strapi.plugin('per-language');
                const articleService = perLanguagePlugin?.service('articleService');

                if (!articleService) {
                    console.log(`[Grammar Service] ⚠️ per-language articleService not available`);
                    return { success: true };
                }

                const existingContent = await articleService.getLanguageContent(articleId, 'zh');

                if (!existingContent) {
                    console.log(`[Grammar Service] ⚠️ No article_perlanguages entry found for article ${articleId}`);
                    return { success: true };
                }

                const existingProcessedData = existingContent.processed_data || {};
                console.log(`[Grammar Service] 📋 Existing processed data keys:`, Object.keys(existingProcessedData));

                const newGrammarData = {
                    sentences: sentences.map(sentence => ({
                        sentence: sentence.sentence,
                        rules: sentence.rules || [],
                        translation: sentence.translation || '',
                        translations: sentence.translations || []
                    }))
                };

                const completeData = {
                    ...existingProcessedData,
                    grammar: newGrammarData
                };

                const difficultyData = completeData.hsk ? {
                    hsk: {
                        distribution: completeData.hsk.distribution,
                        selectedLevel: completeData.hsk.selectedLevel,
                        calculatedLevel: completeData.hsk.calculatedLevel
                    }
                } : null;

                const displaySkill = completeData.hsk?.selectedLevel ?
                    `HSK ${completeData.hsk.selectedLevel}` :
                    (completeData.hsk?.calculatedLevel ? `HSK ${completeData.hsk.calculatedLevel}` : null);

                // Use articleService methods
                if (articleService.updateCompleteProcessedData) {
                    await articleService.updateCompleteProcessedData(
                        existingContent.id,
                        completeData,
                        difficultyData,
                        displaySkill
                    );
                    console.log(`[Grammar Service] ✅ Successfully updated article_perlanguages table with complete data preservation`);
                } else {
                    await articleService.updateProcessedData(existingContent.id, completeData, displaySkill);
                    console.log(`[Grammar Service] ✅ Updated article_perlanguages table using fallback method`);
                }

            } catch (updateError) {
                const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
                console.error(`[Grammar Service] ❌ Error updating article_perlanguages table: ${errorMessage}`);
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
    },

    /**
     * HELPER: Update grammar rules for a specific sentence
     */
    async updateSentenceGrammarRules(trx: any, sentenceId: number, newRules: string[]): Promise<void> {
        // Get existing rules
        const existingRules = await trx('sentence_grammar_rules')
            .where('sentence_id', sentenceId)
            .select('rule');

        const existingRuleTexts = existingRules.map((r: any) => r.rule);
        const newRuleTexts = newRules.filter(rule => rule && rule.trim());

        // Find rules to delete and add
        const rulesToDelete = existingRuleTexts.filter((rule: string) => !newRuleTexts.includes(rule));
        const rulesToAdd = newRuleTexts.filter((rule: string) => !existingRuleTexts.includes(rule));

        // Delete removed rules
        if (rulesToDelete.length > 0) {
            await trx('sentence_grammar_rules')
                .where('sentence_id', sentenceId)
                .whereIn('rule', rulesToDelete)
                .delete();
        }

        // Add new rules
        if (rulesToAdd.length > 0) {
            const rulesToInsert = rulesToAdd.map(rule => ({
                sentence_id: sentenceId,
                rule: rule,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now()
            }));

            await trx('sentence_grammar_rules').insert(rulesToInsert);
        }
    },

    /**
     * HELPER: Update translations for a specific sentence
     */
    async updateSentenceTranslations(trx: any, sentenceId: number, englishTranslation: string, otherTranslations: any[]): Promise<void> {
        // Get existing translations
        const existingTranslations = await trx('sentence_translations')
            .where('sentence_id', sentenceId)
            .select('translation_language', 'translation_text');

        const existingTransMap = new Map();
        existingTranslations.forEach((t: any) => {
            existingTransMap.set(t.translation_language, t.translation_text);
        });

        // Prepare new translations map
        const newTransMap = new Map();

        // Add English translation if provided
        if (englishTranslation && englishTranslation.trim()) {
            newTransMap.set('en', englishTranslation.trim());
        }

        // Add other translations
        if (otherTranslations && Array.isArray(otherTranslations)) {
            otherTranslations.forEach(trans => {
                if (trans && trans.language && trans.text && trans.text.trim()) {
                    newTransMap.set(trans.language, trans.text.trim());
                }
            });
        }

        // Find translations to delete, update, and add
        const languagesToDelete = Array.from(existingTransMap.keys()).filter(lang => !newTransMap.has(lang));
        const languagesToAdd: string[] = [];
        const languagesToUpdate: string[] = [];

        newTransMap.forEach((text, language) => {
            if (existingTransMap.has(language)) {
                if (existingTransMap.get(language) !== text) {
                    languagesToUpdate.push(language);
                }
            } else {
                languagesToAdd.push(language);
            }
        });

        // Delete removed translations
        if (languagesToDelete.length > 0) {
            await trx('sentence_translations')
                .where('sentence_id', sentenceId)
                .whereIn('translation_language', languagesToDelete)
                .delete();
        }

        // Update changed translations
        for (const language of languagesToUpdate) {
            await trx('sentence_translations')
                .where('sentence_id', sentenceId)
                .where('translation_language', language)
                .update({
                    translation_text: newTransMap.get(language),
                    updated_at: trx.fn.now()
                });
        }

        // Add new translations
        if (languagesToAdd.length > 0) {
            const translationsToInsert = languagesToAdd.map(language => ({
                sentence_id: sentenceId,
                translation_language: language,
                translation_text: newTransMap.get(language),
                created_at: trx.fn.now(),
                updated_at: trx.fn.now()
            }));

            await trx('sentence_translations').insert(translationsToInsert);
        }
    }
});