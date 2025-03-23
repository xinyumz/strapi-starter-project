// server/controllers/grammar-controller.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ExtendedContext, GrammarRule } from '../services/types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Generate grammar rules
    async generateRules(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;
            const { text, engineChoice = 'both' } = data;

            if (!text) {
                return ctx.badRequest('Text content is required');
            }

            if (!['stanford', 'jieba', 'both'].includes(engineChoice)) {
                return ctx.badRequest('Invalid engine choice');
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');

            // Use batch processing for large texts
            const sentences = text.split('|').filter((s: string) => s.trim());
            let rules;

            if (sentences.length > 20) {
                rules = await grammarService.batchProcessText(text, engineChoice);
            } else {
                rules = await grammarService.generateRules(text, engineChoice);
            }

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

            // Make sure it's a valid number
            const parsedId = parseInt(articleId, 10);

            if (isNaN(parsedId)) {
                strapi.log.error(`Invalid article ID: ${articleId}`);
                return ctx.badRequest(`Invalid article ID: ${articleId}`);
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');
            const result = await grammarService.getArticleGrammar(parsedId);

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

            // Make sure it's a valid number
            const parsedId = parseInt(articleId, 10);

            if (isNaN(parsedId)) {
                strapi.log.error(`Invalid article ID: ${articleId}`);
                return ctx.badRequest(`Invalid article ID: ${articleId}`);
            }

            if (!sentences || !Array.isArray(sentences)) {
                return ctx.badRequest('Valid sentences array is required');
            }

            // Validate sentence data
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i];

                if (!sentence.sentence) {
                    return ctx.badRequest(`Sentence at index ${i} is missing text content`);
                }

                if (!sentence.rules || !Array.isArray(sentence.rules)) {
                    // Initialize empty rules array if missing
                    sentence.rules = [];
                }

                // Validate translations format if present
                if (sentence.translations && !Array.isArray(sentence.translations)) {
                    return ctx.badRequest(`Invalid translations format at sentence index ${i}`);
                }
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');
            const result = await grammarService.saveArticleGrammar(parsedId, sentences);

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
    },

    // Recover failed operations for an article
    async recoverArticleOperations(ctx: ExtendedContext) {
        try {
            const articleId = ctx.params.id;

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // Make sure it's a valid number
            const parsedId = parseInt(articleId, 10);

            if (isNaN(parsedId)) {
                strapi.log.error(`Invalid article ID: ${articleId}`);
                return ctx.badRequest(`Invalid article ID: ${articleId}`);
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');

            // Get failed operations first
            const failedOps = await grammarService.getFailedOperations(parsedId);

            if (failedOps.length === 0) {
                return ctx.body = {
                    data: {
                        message: 'No failed operations to recover',
                        count: 0
                    }
                };
            }

            // Attempt recovery
            const result = await grammarService.recoverFailedOperations(parsedId);

            ctx.body = {
                data: {
                    success: result.success,
                    recovered: result.recovered,
                    failed: result.failed,
                    errors: result.errors
                }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                strapi.log.error(`Failed to recover operations: ${error.message}`);
                ctx.throw(500, `Failed to recover operations: ${error.message}`);
            } else {
                strapi.log.error('Failed to recover operations with unknown error');
                ctx.throw(500, 'Failed to recover operations');
            }
        }
    }
});