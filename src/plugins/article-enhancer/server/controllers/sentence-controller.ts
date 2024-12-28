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

    async translateSentences(ctx: ExtendedContext) {
        try {
            const { sentences } = ctx.request.body;

            if (!Array.isArray(sentences)) {
                return ctx.badRequest('Sentences must be provided as an array');
            }

            if (sentences.length === 0) {
                return ctx.badRequest('At least one sentence is required');
            }

            const translations = await strapi
                .plugin('article-enhancer')
                .service('sentenceService')
                .translateSentences(sentences);

            ctx.body = {
                data: translations
            };
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