// server/controllers/grammar-controller.ts

import { errors } from '@strapi/utils';
import { ExtendedContext } from '../services/types';

const { ApplicationError } = errors;

export default ({ strapi }: any) => ({
    // Generate grammar rules
    async generateRules(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;

            // Extract data with type safety
            const text = data.text;
            const engineChoice = data.engineChoice || 'both';

            if (!text) {
                return ctx.badRequest('Text content is required');
            }

            if (!['stanford', 'jieba', 'both'].includes(engineChoice)) {
                return ctx.badRequest('Invalid engine choice');
            }

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');

            const rules = await grammarService.generateRules(text, engineChoice);

            ctx.body = {
                data: {
                    sentences: rules
                }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                strapi.log.error(`Grammar rules generation failed: ${error.message}`);
                ctx.throw(500, `Grammar rules generation failed: ${error.message}`);
            } else {
                strapi.log.error('Grammar rules generation failed with unknown error');
                ctx.throw(500, 'Grammar rules generation failed');
            }
        }
    },

    // Get grammar data for an article
    async getArticleGrammar(ctx: ExtendedContext) {
        try {
            const articleId = ctx.params.id;

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // Helper function to resolve documentId to numeric ID
            const resolveArticleId = async (id: string): Promise<number> => {
                // If it's already a number, use it directly
                const numericId = parseInt(id, 10);
                if (!isNaN(numericId)) {
                    return numericId;
                }

                // Otherwise, it's a documentId - resolve it to numeric ID
                try {
                    const article = await strapi.documents('api::article.article').findOne({
                        documentId: id
                    });

                    if (!article) {
                        throw new Error(`Article not found with documentId: ${id}`);
                    }

                    return article.id;
                } catch (error) {
                    throw new Error(`Failed to resolve article ID: ${error}`);
                }
            };

            const numericId = await resolveArticleId(articleId);

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');
            const result = await grammarService.getArticleGrammar(numericId);

            if (!result.success) {
                strapi.log.error(`Failed to get grammar data: ${result.error}`);
                return ctx.throw(500, result.error || 'Failed to get grammar data');
            }

            ctx.body = {
                data: result
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                strapi.log.error(`Failed to get grammar data: ${error.message}`);
                ctx.throw(500, `Failed to get grammar data: ${error.message}`);
            } else {
                strapi.log.error('Failed to get grammar data with unknown error');
                ctx.throw(500, 'Failed to get grammar data');
            }
        }
    },

    // Save grammar data for an article
    async saveArticleGrammar(ctx: ExtendedContext) {
        try {
            const articleId = ctx.params.id;

            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;
            const { sentences } = data;

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // Helper function to resolve documentId to numeric ID
            const resolveArticleId = async (id: string): Promise<number> => {
                // If it's already a number, use it directly
                const numericId = parseInt(id, 10);
                if (!isNaN(numericId)) {
                    return numericId;
                }

                // Otherwise, it's a documentId - resolve it to numeric ID
                try {
                    const article = await strapi.documents('api::article.article').findOne({
                        documentId: id
                    });

                    if (!article) {
                        throw new Error(`Article not found with documentId: ${id}`);
                    }

                    return article.id;
                } catch (error) {
                    throw new Error(`Failed to resolve article ID: ${error}`);
                }
            };

            const numericId = await resolveArticleId(articleId);

            if (!sentences || !Array.isArray(sentences)) {
                return ctx.badRequest('Valid sentences array is required');
            }

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');
            const result = await grammarService.saveArticleGrammar(numericId, sentences);

            if (!result.success) {
                strapi.log.error(`Failed to save grammar data: ${result.error}`);
                return ctx.throw(500, result.error || 'Failed to save grammar data');
            }

            ctx.body = {
                data: { success: true }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                strapi.log.error(`Failed to save grammar data: ${error.message}`);
                ctx.throw(500, `Failed to save grammar data: ${error.message}`);
            } else {
                strapi.log.error('Failed to save grammar data with unknown error');
                ctx.throw(500, 'Failed to save grammar data');
            }
        }
    }
});