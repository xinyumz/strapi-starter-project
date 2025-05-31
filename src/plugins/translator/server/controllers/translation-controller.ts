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
        console.log('[Translation Controller] Request body:', JSON.stringify(ctx.request.body, null, 2));
        const { text, targetLanguage, articleId } = ctx.request.body;

        console.log('[Translation Controller] Extracted values:', {
            hasText: !!text,
            targetLanguage,
            articleId,
            articleIdType: typeof articleId
        });

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

            // NEW: Also sync to per_language table if we can determine the article ID
            // Check if there's article context in the request
            const { articleId } = ctx.request.body;

            console.log('[Translation Controller] Checking sync conditions:', {
                hasArticleId: !!articleId,
                targetLanguage,
                shouldSync: !!(articleId && targetLanguage === 'zh')
            });

            if (articleId && targetLanguage === 'zh') {
                try {
                    console.log(`[Translation Controller] Attempting to sync article ${articleId} to per_language table`);

                    // Check if per-language plugin service is available
                    const perLanguagePlugin = strapi.plugin('per-language');
                    if (perLanguagePlugin?.service('contentService')) {
                        const contentService = perLanguagePlugin.service('contentService');

                        // Sync the translation to per_language table
                        const result = await contentService.upsertLanguageContent(
                            parseInt(articleId),
                            targetLanguage,
                            translation
                        );

                        console.log(`[Translation Controller] Successfully synced article ${articleId}:`, result);
                    } else {
                        console.error('[Translation Controller] per-language plugin or service not available');
                    }
                } catch (syncError) {
                    console.error('[Translation Controller] Sync error:', syncError);
                    // Don't fail the translation if sync fails
                }
            } else {
                console.log('[Translation Controller] Sync skipped - conditions not met');
            }

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