// server/controllers/article-controller.ts
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
                targetLanguages?: string[];
                articleId?: number;
            };
            content?: string;
            targetLanguages?: string[];
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
                .service('articleService')
                .processArticle(content, targetLanguages);

            // If articleId is provided, save the processed article to the database
            if (articleId) {
                await strapi
                    .plugin('article-enhancer')
                    .service('articleService')
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

    // Get article sentences with translations
    async getArticleSentences(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            const sentences = await strapi
                .plugin('article-enhancer')
                .service('articleService')
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
    }
});