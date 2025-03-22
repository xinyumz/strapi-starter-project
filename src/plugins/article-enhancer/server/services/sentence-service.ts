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

export default ({ strapi }: { strapi: Strapi }) => ({
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

            console.log("Translation service found, proceeding with translations");

            // Validate target language
            try {
                // If we have a listLanguages method, check if the target language is supported
                if (translationService.listLanguages) {
                    const languages = await translationService.listLanguages();
                    const isSupported = languages.some((lang: { code: string }) => lang.code === targetLanguage);

                    if (!isSupported) {
                        console.warn(`Language '${targetLanguage}' may not be supported, proceeding anyway`);
                    }
                }
            } catch (langError) {
                console.warn('Could not validate language support:', langError);
            }

            // Translate each sentence individually and handle errors
            const translations = [];
            let errorCount = 0;

            for (const sentence of sentences) {
                if (typeof sentence !== 'string' || sentence.trim() === '') {
                    console.warn('Skipping empty or non-string sentence');
                    translations.push('');
                    continue;
                }

                try {
                    const translation = await translationService.translate(sentence, targetLanguage);

                    if (!translation || typeof translation !== 'string') {
                        console.warn(`Received invalid translation for: "${sentence.substring(0, 50)}..."`);
                        translations.push(`[Invalid translation received]`);
                        errorCount++;
                    } else {
                        translations.push(translation);
                    }
                } catch (translationError: unknown) {
                    console.error(`Error translating sentence "${sentence.substring(0, 50)}..."`, translationError);
                    translations.push(`[Translation error]`);
                    errorCount++;
                }
            }

            if (errorCount > 0) {
                console.warn(`Completed with ${errorCount} errors out of ${sentences.length} translations`);
            } else {
                console.log(`All ${sentences.length} translations to ${targetLanguage} completed successfully`);
            }

            return translations;
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