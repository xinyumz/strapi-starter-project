// src/plugins/per-language/server/services/translation-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { PerLanguageContentType } from '../types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => {
    // Type guard helper function
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    return {
        /**
         * Translate an article to a target language and save to per_language table
         * TEMPORARY WORKAROUND: This uses the existing translation field instead of calling the translator plugin
         */
        async translateArticle(articleId: number, targetLanguage: string): Promise<{ success: boolean; message?: string; contentId?: number }> {
            try {
                console.log(`[TranslationService] Starting translation for article ${articleId} to ${targetLanguage}`);

                // 1. Get the article
                const entityService = getEntityService();
                console.log(`[TranslationService] Fetching article ${articleId}`);
                const article = await entityService.findOne('api::article.article', articleId, {
                    populate: ['*']
                });

                if (!article) {
                    console.log(`[TranslationService] Article ${articleId} not found`);
                    return {
                        success: false,
                        message: `Article with ID ${articleId} not found`
                    };
                }

                console.log(`[TranslationService] Article found: ${JSON.stringify({
                    id: article.id,
                    title: article.title,
                    hasBase: !!article.base,
                    baseLength: article.base ? article.base.length : 0,
                    hasTranslation: !!article.translation,
                    translationLength: article.translation ? article.translation.length : 0
                })}`);

                // 2. Check if the base content exists
                if (!article.base || article.base.trim() === '') {
                    console.log(`[TranslationService] Article base content is empty`);
                    return {
                        success: false,
                        message: 'Article base content is empty. Please add content to the article before translating.'
                    };
                }

                // TEMPORARY WORKAROUND: Instead of using the translator plugin,
                // we'll directly use the existing translation field from the article
                // This allows us to test the rest of the workflow
                let translatedContent = article.translation;

                if (!translatedContent || translatedContent.trim() === '') {
                    console.log(`[TranslationService] No translation found, using base content as fallback`);
                    translatedContent = article.base; // Fallback to base content if no translation exists
                } else {
                    console.log(`[TranslationService] Using existing translation, length: ${translatedContent.length}`);
                }

                // 3. Save the translated content to the per_language table
                console.log(`[TranslationService] Saving to per_language table`);
                const contentService = strapi.plugin('per-language').service('contentService');
                const perLanguageContent = await contentService.upsertLanguageContent(
                    articleId,
                    targetLanguage,
                    translatedContent
                );
                console.log(`[TranslationService] Saved to per_language table, id: ${perLanguageContent.id}`);

                return {
                    success: true,
                    message: `Article content saved for ${targetLanguage}`,
                    contentId: perLanguageContent.id
                };
            } catch (error) {
                console.error('[TranslationService] General error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to translate article: ${errorMessage}`);
            }
        },

        /**
         * Get the translated content of an article for a specific language
         */
        async getTranslatedContent(articleId: number, languageCode: string): Promise<string> {
            try {
                console.log(`[TranslationService] Getting translated content for article ${articleId} in ${languageCode}`);
                const contentService = strapi.plugin('per-language').service('contentService');
                const content = await contentService.getLanguageContent(articleId, languageCode);

                if (!content) {
                    console.log(`[TranslationService] No content found in per_language table`);

                    // Fallback to the article's translation field
                    const entityService = getEntityService();
                    const article = await entityService.findOne('api::article.article', articleId, {
                        populate: ['*']
                    });

                    if (!article || !article.translation) {
                        console.log(`[TranslationService] No fallback translation found in article`);
                        throw new ApplicationError(`No content found for article ${articleId} in language ${languageCode}`);
                    }

                    console.log(`[TranslationService] Using fallback translation from article`);
                    return article.translation;
                }

                console.log(`[TranslationService] Found content in per_language table`);
                return content.per_language_text;
            } catch (error) {
                console.error('[TranslationService] Error getting translated content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get translated content: ${errorMessage}`);
            }
        }
    };
};