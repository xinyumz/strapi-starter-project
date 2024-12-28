// server/controllers/grammar-controller.ts
import { Strapi } from '@strapi/strapi';
import { Context } from 'koa';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface ExtendedContext extends Context {
    body: any;
    request: Context['request'] & {
        body: {
            text?: string;
            engineChoice?: 'stanford' | 'jieba' | 'both';
            sentences?: string[];
            sentenceIndex?: number;
            ruleIndex?: number;
            rules?: Array<{
                sentence: string;
                rules: string[];
            }>;
        };
    };
}

export default ({ strapi }: { strapi: Strapi }) => ({
    async generateRules(ctx: ExtendedContext) {
        try {
            const { text, engineChoice = 'both' } = ctx.request.body;

            if (!text) {
                return ctx.badRequest('Text content is required');
            }

            if (!['stanford', 'jieba', 'both'].includes(engineChoice)) {
                return ctx.badRequest('Invalid engine choice');
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');
            const rules = await grammarService.generateRules(text, engineChoice);

            ctx.body = {
                data: {
                    sentences: rules
                }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                ctx.throw(500, `Grammar rules generation failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Grammar rules generation failed');
            }
        }
    },

    async translateSentences(ctx: ExtendedContext) {
        try {
            const { sentences } = ctx.request.body;

            if (!Array.isArray(sentences)) {
                return ctx.badRequest('Sentences must be an array');
            }

            const translatorService = strapi.plugin('translator').service('translator');
            const translations = await translatorService.translate(sentences);

            ctx.body = {
                data: {
                    translations
                }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                ctx.throw(500, `Translation failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Translation failed');
            }
        }
    },

    async deleteRule(ctx: ExtendedContext) {
        try {
            const { sentenceIndex, ruleIndex, rules } = ctx.request.body;

            if (
                typeof sentenceIndex !== 'number' ||
                typeof ruleIndex !== 'number' ||
                !Array.isArray(rules)
            ) {
                return ctx.badRequest('Invalid request body');
            }

            const updatedRules = await strapi
                .plugin('article-enhancer')
                .service('grammarService')
                .deleteRule(sentenceIndex, ruleIndex, rules);

            ctx.body = {
                data: updatedRules
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                ctx.throw(500, `Grammar rule deletion failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Grammar rule deletion failed');
            }
        }
    }
});