// server/controllers/sentence-controller.ts
import { Strapi } from '@strapi/strapi';
import { Context } from 'koa';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface ExtendedContext extends Context {
    body: any;
    request: Context['request'] & {
        body: {
            content?: string;
            sentences?: string[];
        };
    };
}

export default ({ strapi }: { strapi: Strapi }) => ({
    // Process full article content
    async processArticle(ctx: ExtendedContext) {
        try {
            const { content } = ctx.request.body;

            if (!content) {
                return ctx.badRequest('Article content is required');
            }

            const processedArticle = await strapi
                .plugin('article-enhancer')
                .service('sentenceService')
                .processArticle(content);

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
            const { sentences } = ctx.request.body;

            if (!Array.isArray(sentences)) {
                return ctx.badRequest('Sentences must be provided as an array');
            }

            if (sentences.length === 0) {
                return ctx.badRequest('At least one sentence is required');
            }

            try {
                // Log what we're trying to translate for debugging
                console.log('Translating sentences:', sentences);

                // Call the service to translate the sentences
                const translations = await strapi
                    .plugin('article-enhancer')
                    .service('sentenceService')
                    .translateSentences(sentences);

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
    }
});