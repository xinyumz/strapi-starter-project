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

export default {
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
};