// server/controllers/translation-controller.ts
import { Strapi } from '@strapi/strapi';
import { Context } from 'koa';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface ExtendedContext extends Context {
    body: any;
    request: Context['request'] & {
        body: {
            data?: {
                sentences?: string[];
                targetLanguage?: string;
                language?: string;
            };
            sentences?: string[];
            targetLanguage?: string;
            language?: string;
        };
    };
    params: {
        id?: string;
        language?: string;
    };
}

export default ({ strapi }: { strapi: Strapi }) => ({
    // Translate a list of sentences
    async translateSentences(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;
            const { sentences, targetLanguage = 'en' } = data;

            if (!Array.isArray(sentences)) {
                return ctx.badRequest('Sentences must be provided as an array');
            }

            if (sentences.length === 0) {
                return ctx.badRequest('At least one sentence is required');
            }

            try {
                // Log what we're trying to translate for debugging
                console.log(`Translating sentences to ${targetLanguage}:`, sentences);

                // Call the service to translate the sentences
                const translations = await strapi
                    .plugin('article-enhancer')
                    .service('translationService')
                    .translateSentences(sentences, targetLanguage);

                // Format the response appropriately
                ctx.body = {
                    data: translations
                };
            } catch (serviceError: unknown) {
                console.error('Translation service error:', serviceError);
                const errorMessage = serviceError instanceof Error
                    ? serviceError.message
                    : 'Unknown translation service error';
                throw new Error(`Translation service error: ${errorMessage}`);
            }
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Translation failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Translation failed');
            }
        }
    },

    // Get supported languages for translation
    async getSupportedLanguages(ctx: ExtendedContext) {
        try {
            // Check if translator plugin is available
            if (!strapi.plugin('translator')) {
                return ctx.notFound('Translator plugin not found');
            }

            try {
                // Get languages from the translation service
                const languages = await strapi
                    .plugin('article-enhancer')
                    .service('translationService')
                    .getSupportedLanguages();

                // Define the languages you want to support
                const supportedCodes = ['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'ru', 'pt', 'ar'];

                // Filter to just the languages you want to support
                const filteredLanguages = languages.filter(
                    (lang: { code: string; name: string }) => supportedCodes.includes(lang.code)
                );

                ctx.body = {
                    data: filteredLanguages
                };
            } catch (serviceError) {
                console.error('Error fetching languages from translation service:', serviceError);

                // Fallback to hardcoded default languages if the service call fails
                const defaultLanguages = [
                    { code: 'en', name: 'English' },
                    { code: 'fr', name: 'French' },
                    { code: 'es', name: 'Spanish' },
                    { code: 'de', name: 'German' },
                    { code: 'it', name: 'Italian' },
                    { code: 'ja', name: 'Japanese' },
                    { code: 'ko', name: 'Korean' },
                    { code: 'ru', name: 'Russian' },
                    { code: 'pt', name: 'Portuguese' },
                    { code: 'ar', name: 'Arabic' }
                ];

                ctx.body = {
                    data: defaultLanguages
                };
            }
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Failed to fetch supported languages: ${error.message}`);
            } else {
                ctx.throw(500, 'Failed to fetch supported languages');
            }
        }
    },

    async removeLanguageTranslations(ctx: ExtendedContext) {
        try {
            // Get language from params instead of body
            const { id: articleId, language } = ctx.params;

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            if (!language) {
                return ctx.badRequest('Language code is required');
            }

            // Call the service to delete the translations
            const result = await strapi
                .plugin('article-enhancer')
                .service('translationService')
                .removeLanguageTranslations(parseInt(articleId, 10), language);

            if (!result.success) {
                return ctx.throw(500, result.error || 'Failed to remove translations');
            }

            ctx.body = {
                data: { success: true }
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Failed to remove translations: ${error.message}`);
            } else {
                ctx.throw(500, 'Failed to remove translations');
            }
        }
    },
    async diagnosticInfo(ctx: ExtendedContext) {
        try {
            const { id: articleId } = ctx.params;

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            if (!strapi.db) {
                return ctx.throw(500, 'Database connection not available');
            }

            // Get sentences for this article
            const sentences = await strapi.db.connection('article_sentences')
                .where('article_id', parseInt(articleId, 10))
                .select('id', 'sentence_text', 'sentence_order');

            // Get translations for these sentences
            const sentenceIds = sentences.map(s => s.id);
            const translations = await strapi.db.connection('sentence_translations')
                .whereIn('sentence_id', sentenceIds)
                .select('id', 'sentence_id', 'translation_language', 'translation_text');

            // Group translations by language
            const languageCounts: { [key: string]: number } = {};
            translations.forEach(t => {
                if (!languageCounts[t.translation_language]) {
                    languageCounts[t.translation_language] = 0;
                }
                languageCounts[t.translation_language]++;
            });

            // Count sentences with each language
            const sentencesWithLanguage: { [key: string]: number } = {};
            const languages = Object.keys(languageCounts);

            for (const lang of languages) {
                const countResult = await strapi.db.connection('sentence_translations')
                    .whereIn('sentence_id', sentenceIds)
                    .where('translation_language', lang)
                    .countDistinct('sentence_id as count')
                    .first();

                // Properly handle the count result
                const count = countResult && typeof countResult === 'object' && 'count' in countResult
                    ? Number(countResult.count)
                    : 0;

                sentencesWithLanguage[lang] = count;
            }

            ctx.body = {
                data: {
                    articleId,
                    sentenceCount: sentences.length,
                    translationCount: translations.length,
                    languageCounts,
                    sentencesWithLanguage,
                    // Handle database-specific differences
                    translationTableInfo: await strapi.db.connection.raw('SHOW COLUMNS FROM sentence_translations')
                }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                ctx.throw(500, `Diagnostic failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Diagnostic failed');
            }
        }
    }
});