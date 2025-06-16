// src/plugins/chinese-article-processor/server/controllers/article-controller.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ExtendedContext } from '../services/types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Main article processing endpoint
    // This method gets content from per_languages table and processes it
    async processArticle(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;
            const { targetLanguages = ['en'] } = ctx.request.body.data || ctx.request.body;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            const processService = strapi.plugin('chinese-article-processor').service('processService');
            const result = await processService.processArticleComplete(
                parseInt(id),
                'zh',
                targetLanguages
            );

            ctx.body = { data: result };
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

    // LEGACY: Process article with direct content input (keep for backward compatibility)
    // This method takes content directly in the request body
    async processArticleWithContent(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;

            // Extract data with type safety and defaults
            const content = data.content;
            const targetLanguages = data.targetLanguages || ['en'];
            const articleId = data.articleId;

            if (!content) {
                return ctx.badRequest('Article content is required');
            }

            const processedArticle = await strapi
                .plugin('chinese-article-processor')
                .service('articleService')
                .processArticle(content, targetLanguages);

            // If articleId is provided, save the processed article to the database
            if (articleId) {
                const processService = strapi.plugin('chinese-article-processor').service('processService');

                if (processService) {
                    await processService.saveProcessedData(
                        Number(articleId),
                        'zh',
                        processedArticle
                    );
                    console.log(`[Article Processing] Saved to per_languages table for article ${articleId}`);
                } else {
                    console.error(`[Article Processing] Process service not available`);
                    return ctx.badRequest('Processing service not available');
                }

                // Save to sentence tables as well
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
    },

    // Update processed data in per_languages table only
    async updateArticleProcessedData(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;
            const data = ctx.request.body.data || ctx.request.body;

            // Use type assertion to access the properties
            const processedData = (data as any).processedData;
            const displaySkill = (data as any).displaySkill;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            if (!processedData) {
                return ctx.badRequest('Processed data is required');
            }

            console.log(`[Article Processing] Updating processed data for article ${id}`);

            // Use the process service to save to per_languages table only
            const processService = strapi.plugin('chinese-article-processor').service('processService');

            if (!processService) {
                return ctx.badRequest('Process service not available');
            }

            await processService.saveProcessedData(
                Number(id),
                'zh',
                processedData,
                displaySkill
            );

            console.log(`[Article Processing] Successfully saved to per_languages table`);

            ctx.body = {
                data: { success: true, message: 'Processed data updated successfully' }
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Failed to update processed data: ${error.message}`);
            } else {
                ctx.throw(500, 'Failed to update processed data');
            }
        }
    }
});