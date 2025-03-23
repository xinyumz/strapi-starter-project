// server/controllers/article-controller.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ExtendedContext, BatchGrammarOptions } from '../services/types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Process full article content
    async processArticle(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;

            // Extract data with type safety and defaults
            const content = data.content;
            const targetLanguages = data.targetLanguages || ['en'];
            const articleId = data.articleId;

            // Use type assertion for optional properties that might not be defined in the interface
            const useBatchGrammar = 'useBatchGrammar' in data ? data.useBatchGrammar : true;
            const batchOptions = data.batchOptions || {};

            if (!content) {
                return ctx.badRequest('Article content is required');
            }

            // Configure batch options with defaults if not provided
            const grammarBatchOptions: BatchGrammarOptions = {
                batchSize: batchOptions.batchSize || 5,
                maxRetries: batchOptions.maxRetries || 3,
                retryDelay: batchOptions.retryDelay || 1000,
                concurrentRequests: batchOptions.concurrentRequests || 2
            };

            const processedArticle = await strapi
                .plugin('chinese-article-processor')
                .service('articleService')
                .processArticle(content, targetLanguages, useBatchGrammar, grammarBatchOptions);

            // If articleId is provided, save the processed article to the database
            if (articleId) {
                await strapi
                    .plugin('chinese-article-processor')
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
                .plugin('chinese-article-processor')
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