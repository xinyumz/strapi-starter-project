// server/controllers/grammar-controller.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ExtendedContext, GrammarRule, BatchGrammarOptions } from '../services/types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Generate grammar rules
    async generateRules(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;

            // Extract data with type safety
            const text = data.text;
            const engineChoice = data.engineChoice || 'both';

            // Use type assertion or check for properties that might not be defined in interface
            const useBatch = 'useBatch' in data ? Boolean(data.useBatch) : false;
            const batchOptions = data.batchOptions || {};

            if (!text) {
                return ctx.badRequest('Text content is required');
            }

            if (!['stanford', 'jieba', 'both'].includes(engineChoice)) {
                return ctx.badRequest('Invalid engine choice');
            }

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');

            let rules: GrammarRule[] = [];

            if (useBatch) {
                // Split text into sentences using your preferred delimiter
                const sentences = text.split('|').filter(s => s.trim());

                if (sentences.length === 0) {
                    return ctx.badRequest('No valid sentences found in content');
                }

                // Configure batch options with defaults if not provided
                const options: BatchGrammarOptions = {
                    batchSize: batchOptions.batchSize || 5,
                    maxRetries: batchOptions.maxRetries || 3,
                    retryDelay: batchOptions.retryDelay || 1000,
                    concurrentRequests: batchOptions.concurrentRequests || 2
                };

                // Use batch processing method
                rules = await grammarService.generateRulesBatch(sentences, engineChoice, options);

                strapi.log.info(`Generated grammar rules for ${rules.length} sentences using batch processing`);
            } else {
                // Use traditional single request method
                rules = await grammarService.generateRules(text, engineChoice);

                strapi.log.info(`Generated grammar rules using single request processing`);
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

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');
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

            const grammarService = strapi.plugin('chinese-article-processor').service('grammarService');
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
    }
});