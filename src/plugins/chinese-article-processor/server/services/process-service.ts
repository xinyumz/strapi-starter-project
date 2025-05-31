// src/plugins/chinese-article-processor/server/services/process-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Get article content from either per_language table or articles table
     */
    async getArticleContent(articleId: number, language: string = 'zh'): Promise<string> {
        try {
            console.log(`[ProcessService] Getting content for article ${articleId} in ${language}`);

            // First, try to get content from per_language table
            if (strapi.plugin('per-language')?.service('contentService')) {
                try {
                    const perLanguageContent = await strapi.plugin('per-language')
                        .service('contentService')
                        .getLanguageContent(articleId, language);

                    if (perLanguageContent && perLanguageContent.per_language_text) {
                        console.log(`[ProcessService] Found content in per_language table`);
                        return perLanguageContent.per_language_text;
                    }
                } catch (err) {
                    console.log('[ProcessService] Error accessing per_language table, falling back:', err);
                    // Continue to fallback
                }
            }

            // Fallback to original article table
            console.log(`[ProcessService] Falling back to articles table`);
            const article = await strapi.entityService?.findOne('api::article.article', articleId, {});

            if (!article || !article.translation) {
                throw new ApplicationError(`No content found for article ${articleId}`);
            }

            return article.translation;
        } catch (error) {
            console.error('[ProcessService] Error getting article content:', error);
            throw error;
        }
    },

    /**
     * Save processed data to both the article table and per_language table
     */
    async saveProcessedData(
        articleId: number,
        language: string,
        processedData: any,
        displaySkill?: string
    ): Promise<void> {
        try {
            console.log(`[ProcessService] Saving processed data for article ${articleId}`);

            // 1. Save to the original article table with type assertion
            const articleData = {
                // Use type assertion to bypass TypeScript checks during transition
                chinese_processor: processedData
            } as any; // This is safe during the migration period

            await strapi.entityService?.update('api::article.article', articleId, {
                data: articleData
            });

            // 2. If per_language plugin is available, also save there
            if (strapi.plugin('per-language')?.service('contentService')) {
                // First, check if a per_language entry exists
                const contentService = strapi.plugin('per-language').service('contentService');
                const existingContent = await contentService.getLanguageContent(articleId, language);

                if (existingContent) {
                    // Update the existing entry
                    await strapi.plugin('per-language')
                        .service('contentService')
                        .updateProcessedData(existingContent.id, processedData, displaySkill);

                    console.log(`[ProcessService] Updated processed data in per_language table`);
                } else {
                    // Create a new entry with the processed data
                    // First we need to get the content
                    const article = await strapi.entityService?.findOne('api::article.article', articleId, {});
                    if (article && article.translation) {
                        await contentService.upsertLanguageContent(
                            articleId,
                            language,
                            article.translation
                        );

                        // Then update it with processed data
                        const newContent = await contentService.getLanguageContent(articleId, language);
                        if (newContent) {
                            await strapi.plugin('per-language')
                                .service('contentService')
                                .updateProcessedData(newContent.id, processedData, displaySkill);

                            console.log(`[ProcessService] Created new entry in per_language table with processed data`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[ProcessService] Error saving processed data:', error);
            throw error;
        }
    }
});