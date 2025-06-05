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
                    console.log(`[ProcessService] No content found in per_language table`);
                } catch (err) {
                    console.log('[ProcessService] Error accessing per_language table, falling back:', err);
                }
            }

            // Fallback to original article table
            console.log(`[ProcessService] Falling back to articles table`);

            // Try different ways to fetch the article
            let article;
            try {
                article = await strapi.entityService?.findOne('api::article.article', articleId, {
                    populate: '*'  // Make sure we get all fields
                });
            } catch (entityError) {
                console.log('[ProcessService] EntityService failed, trying db.query:', entityError);
                // Fallback to direct database query
                if (strapi.db) {
                    article = await strapi.db.query('api::article.article').findOne({
                        where: { id: articleId }
                    });
                }
            }

            console.log(`[ProcessService] Article found:`, {
                id: article?.id,
                hasTranslation: !!article?.translation,
                hasTranslationCap: !!article?.Translation,
                translationLength: article?.translation?.length || article?.Translation?.length || 0,
                allKeys: article ? Object.keys(article) : []
            });

            // Check both 'translation' and 'Translation' (case sensitivity issue)
            const content = article?.translation || article?.Translation;

            if (!article || !content) {
                throw new ApplicationError(`No content found for article ${articleId}`);
            }

            console.log(`[ProcessService] Using fallback content from articles table, length: ${content.length}`);
            return content;
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
    },

    async processArticleComplete(
        articleId: number,
        language: string = 'zh',
        targetLanguages: string[] = ['en']
    ): Promise<any> {
        try {
            console.log(`[ProcessService] Complete processing for article ${articleId}`);

            // 1. Get content from either source
            const content = await this.getArticleContent(articleId, language);

            // 2. Process using existing article service
            const articleService = strapi.plugin('chinese-article-processor').service('articleService');
            const processedArticle = await articleService.processArticle(
                content,
                targetLanguages,
                true, // Use batch processing
                {} // Default batch options
            );

            // 3. Save processed data to both locations
            await this.saveProcessedData(articleId, language, processedArticle);

            // 4. Save to sentence tables as well
            await articleService.saveProcessedArticle(articleId, processedArticle);

            return processedArticle;
        } catch (error) {
            console.error('[ProcessService] Error in complete processing:', error);
            throw error;
        }
    }
});