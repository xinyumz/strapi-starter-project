//server/controllers/translation-controller.ts

import { Strapi } from '@strapi/strapi';
import { Translate } from '@google-cloud/translate/build/src/v2';

let translateClient: Translate;

const initializeTranslateClient = () => {
    if (!translateClient) {
        translateClient = new Translate({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }
};

export default ({ strapi }: { strapi: Strapi }) => ({
    async translate(ctx) {
        const { text, targetLanguage } = ctx.request.body;

        if (!text || !targetLanguage) {
            return ctx.badRequest('Text and target language are required');
        }

        try {
            console.log('Initializing translate client...');
            initializeTranslateClient();
            console.log('Translate client initialized.');

            console.log(`Translating text: "${text}" to language: ${targetLanguage}`);
            const [translation] = await translateClient.translate(text, targetLanguage);
            console.log(`Translation result: "${translation}"`);

            ctx.body = { translatedText: translation };
        } catch (err) {
            console.error('Translation error:', err);
            ctx.throw(500, `Translation failed: ${err.message}`);
        }
    },

    async listLanguages(ctx) {
        try {
            console.log('Fetching supported languages...');
            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService) {
                throw new Error('Translation service not found');
            }

            if (!translationService.listLanguages) {
                throw new Error('listLanguages method not found in translation service');
            }

            const languages = await translationService.listLanguages();
            console.log(`Found ${languages.length} supported languages`);

            ctx.body = {
                data: languages
            };
        } catch (err) {
            console.error('Error fetching languages:', err);
            ctx.throw(500, `Failed to fetch languages: ${err.message}`);
        }
    }
});