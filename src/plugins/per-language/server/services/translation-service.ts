// src/plugins/per-language/server/services/translation-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => {
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    return {
        /**
         * Translate using external translator plugin and save to article_perlanguages table
         */
        async translateArticle(
            articleId: number,
            targetLanguage: string
        ): Promise<{ success: boolean; message?: string; contentId?: number }> {
            try {
                console.log(`[TranslationService] Translating article ${articleId} to ${targetLanguage}`);

                // Step 1: Get source content from articles.Base field only
                const entityService = getEntityService();
                const article = await entityService.findOne('api::article.article', articleId);

                if (!article || !(article as any).Base) {
                    throw new ApplicationError(
                        `Article ${articleId} not found or has no Base content. ` +
                        `Please ensure the article exists and has content in the Base field.`
                    );
                }

                const sourceText = (article as any).Base;
                console.log(`[TranslationService] Source text length: ${sourceText.length}`);

                // Step 2: Translate using external translator plugin
                const translatorPlugin = strapi.plugin('translator');
                if (!translatorPlugin) {
                    throw new ApplicationError('Translator plugin not found');
                }

                const translationService = translatorPlugin.service('translationService');
                if (!translationService?.translate) {
                    throw new ApplicationError('Translation service not available');
                }

                console.log(`[TranslationService] Calling external translator for ${targetLanguage}`);
                const translatedText = await translationService.translate(sourceText, targetLanguage);

                if (!translatedText) {
                    throw new ApplicationError('Translation service returned empty result');
                }

                console.log(`[TranslationService] Translation completed, length: ${translatedText.length}`);

                // Step 3: Save to article_perlanguages table only
                const contentService = strapi.plugin('per-language').service('contentService');
                const perLanguageContent = await contentService.upsertLanguageContent(
                    articleId,
                    targetLanguage,
                    translatedText
                );

                console.log(`[TranslationService] ✅ Saved to article_perlanguages table, ID: ${perLanguageContent.id}`);

                return {
                    success: true,
                    message: `Article translated to ${targetLanguage} and saved`,
                    contentId: perLanguageContent.id
                };

            } catch (error) {
                console.error('[TranslationService] Translation error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Translation failed: ${errorMessage}`);
            }
        },

        /**
         * Get translated content from article_perlanguages table
         */
        async getTranslatedContent(articleId: number, languageCode: string): Promise<string> {
            try {
                console.log(`[TranslationService] Getting content for article ${articleId} in ${languageCode}`);

                const contentService = strapi.plugin('per-language').service('contentService');
                const content = await contentService.getLanguageContent(articleId, languageCode);

                if (!content?.per_language_text) {
                    throw new ApplicationError(
                        `No content found for article ${articleId} in language ${languageCode}. ` +
                        `Please translate the article first using the translation feature.`
                    );
                }

                console.log(`[TranslationService] ✅ Found content in article_perlanguages table`);
                return content.per_language_text;

            } catch (error) {
                console.error('[TranslationService] Error getting translated content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get translated content: ${errorMessage}`);
            }
        }
    };
};