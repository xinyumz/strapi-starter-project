// server/controllers/sentence-controller.ts
import { Strapi } from '@strapi/strapi';
import { Context } from 'koa';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface ExtendedContext extends Context {
    body: any;
    request: Context['request'] & {
        body: {
            data?: {
                content?: string;
                sentences?: string[];
                targetLanguages?: string[];
                targetLanguage?: string;
                articleId?: number;
            };
            content?: string;
            sentences?: string[];
            targetLanguages?: string[];
            targetLanguage?: string;
            articleId?: number;
        };
    };
}

export default ({ strapi }: { strapi: Strapi }) => ({
    // Process full article content
    async processArticle(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;
            const { content, targetLanguages = ['en'], articleId } = data;

            if (!content) {
                return ctx.badRequest('Article content is required');
            }

            const processedArticle = await strapi
                .plugin('article-enhancer')
                .service('sentenceService')
                .processArticle(content, targetLanguages);

            // If articleId is provided, save the processed article to the database
            if (articleId) {
                await strapi
                    .plugin('article-enhancer')
                    .service('sentenceService')
                    .saveProcessedArticle(articleId, processedArticle);
            }

            ctx.body = {
                data: processedArticle
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Article processing failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Article processing failed');
            }
        }
    },

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
                    .service('sentenceService')
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

    // Get article sentences with translations
    async getArticleSentences(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            const sentences = await strapi
                .plugin('article-enhancer')
                .service('sentenceService')
                .getArticleSentences(Number(id));

            ctx.body = {
                data: sentences
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Failed to fetch article sentences: ${error.message}`);
            } else {
                ctx.throw(500, 'Failed to fetch article sentences');
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

            // Call the translation service to get supported languages
            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService || !translationService.listLanguages) {
                return ctx.notFound('Translation service not found or does not support language listing');
            }

            try {
                // Get all languages
                const allLanguages = await translationService.listLanguages();

                // Define the languages you want to support
                const supportedCodes = ['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'ru', 'pt', 'ar'];

                // Filter to just the languages you want to support
                // Add proper type annotation for the lang parameter
                const filteredLanguages = allLanguages.filter((lang: { code: string; name: string }) =>
                    supportedCodes.includes(lang.code)
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
    }
});