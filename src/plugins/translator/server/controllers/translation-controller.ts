//server/controllers/translation-controller.ts

import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Core translation method - used by per-language plugin
     */
    async translate(ctx) {
        const { text, targetLanguage } = ctx.request.body;

        if (!text || !targetLanguage) {
            return ctx.badRequest('Text and target language are required');
        }

        try {
            // Call the translation service
            const translationService = strapi.plugin('translator').service('translationService');
            const translation = await translationService.translate(text, targetLanguage);

            ctx.body = { translatedText: translation };
        } catch (err) {
            console.error('Translation error:', err);
            ctx.throw(500, `Translation failed: ${err.message}`);
        }
    },

    /**
     * List supported languages - used by language selection
     */
    async listLanguages(ctx) {
        try {
            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService || !translationService.listLanguages) {
                throw new Error('Translation service or listLanguages method not available');
            }

            const languages = await translationService.listLanguages();

            ctx.body = {
                data: languages
            };
        } catch (err) {
            console.error('Error fetching languages:', err);
            ctx.throw(500, `Failed to fetch languages: ${err.message}`);
        }
    }
});