// src/plugins/chinese-article-processor/server/services/process-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Get article content with per_languages as primary source
     * Simple fallback to articles table during transition
     */
    async getArticleContent(articleId: number, language: string = 'zh'): Promise<string> {
        try {
            console.log(`[ProcessService] Getting content for article ${articleId} in ${language}`);

            // PRIMARY SOURCE: per_languages table
            if (strapi.plugin('per-language')?.service('contentService')) {
                try {
                    const perLanguageContent = await strapi.plugin('per-language')
                        .service('contentService')
                        .getLanguageContent(articleId, language);

                    if (perLanguageContent && perLanguageContent.per_language_text) {
                        console.log(`[ProcessService] ✅ Using content from per_languages table`);
                        return perLanguageContent.per_language_text;
                    }
                } catch (err) {
                    console.log('[ProcessService] per_language table access failed, using fallback:', err);
                }
            }

            // FALLBACK: articles table (during transition period)
            console.log(`[ProcessService] 🔄 Using fallback content from articles table`);
            const article = await this.getArticleFromLegacyTable(articleId);
            const content = article?.translation || article?.Translation;

            if (!content) {
                throw new ApplicationError(`No content found for article ${articleId}`);
            }

            return content;
        } catch (error) {
            console.error('[ProcessService] Error getting article content:', error);
            throw error;
        }
    },

    /**
     * Get processed data with per_languages as primary source
     */
    async getProcessedData(articleId: number, language: string = 'zh'): Promise<any> {
        try {
            console.log(`[ProcessService] Getting processed data for article ${articleId} in ${language}`);

            // PRIMARY SOURCE: per_languages table
            if (strapi.plugin('per-language')?.service('contentService')) {
                try {
                    const perLanguageContent = await strapi.plugin('per-language')
                        .service('contentService')
                        .getLanguageContent(articleId, language);

                    if (perLanguageContent && perLanguageContent.processed_data) {
                        console.log(`[ProcessService] ✅ Using processed data from per_languages table`);
                        return perLanguageContent.processed_data;
                    }
                } catch (err) {
                    console.log('[ProcessService] per_language processed data access failed, using fallback:', err);
                }
            }

            // FALLBACK: articles table
            console.log(`[ProcessService] 🔄 Using fallback processed data from articles table`);
            const article = await this.getArticleFromLegacyTable(articleId);
            const processedData = article?.chinese_processor || article?.ChineseProcessor;

            return processedData || null;
        } catch (error) {
            console.error('[ProcessService] Error getting processed data:', error);
            throw error;
        }
    },

    /**
     * Save processed data - Always save to per_languages as primary target
     * Keep articles table sync during transition for safety
     */
    async saveProcessedData(
        articleId: number,
        language: string,
        processedData: any,
        displaySkill?: string
    ): Promise<void> {
        try {
            console.log(`[ProcessService] Saving processed data for article ${articleId}`);

            // PRIMARY TARGET: per_languages table
            if (strapi.plugin('per-language')?.service('contentService')) {
                const contentService = strapi.plugin('per-language').service('contentService');

                // Get or create per_language entry
                let existingContent = await contentService.getLanguageContent(articleId, language);

                // If no per_language entry exists, create one with content from articles table
                if (!existingContent) {
                    console.log(`[ProcessService] Creating per_language entry for article ${articleId}`);
                    const article = await this.getArticleFromLegacyTable(articleId);
                    const legacyContent = article?.translation || article?.Translation;

                    if (legacyContent) {
                        await contentService.upsertLanguageContent(articleId, language, legacyContent);
                        existingContent = await contentService.getLanguageContent(articleId, language);
                    }
                }

                if (existingContent) {
                    // Extract difficulty data for performance optimization
                    const difficultyData = this.extractDifficultyData(processedData);

                    // Save using complete data preservation method
                    if (contentService.updateCompleteProcessedData) {
                        await contentService.updateCompleteProcessedData(
                            existingContent.id,
                            processedData,      // processed_data: Complete metadata
                            difficultyData,     // difficulty_data: Extracted difficulty  
                            displaySkill       // display_skill: UI display
                        );
                        console.log(`[ProcessService] ✅ Saved to per_languages table`);
                    } else {
                        // Fallback method
                        await contentService.updateProcessedData(existingContent.id, processedData, displaySkill);
                        console.log(`[ProcessService] ✅ Saved to per_languages table (fallback method)`);
                    }
                } else {
                    console.log(`[ProcessService] ⚠️ Could not create per_language entry`);
                }
            }

            // TRANSITION SAFETY: Also save to articles table during transition period
            const articleData = { chinese_processor: processedData } as any;
            await strapi.entityService?.update('api::article.article', articleId, {
                data: articleData
            });
            console.log(`[ProcessService] ✅ Also saved to articles table for transition safety`);

        } catch (error) {
            console.error('[ProcessService] Error saving processed data:', error);
            throw error;
        }
    },

    /**
     * Complete article processing workflow
     */
    async processArticleComplete(
        articleId: number,
        language: string = 'zh',
        targetLanguages: string[] = ['en']
    ): Promise<any> {
        try {
            console.log(`[ProcessService] Complete processing for article ${articleId}`);

            // 1. Get content (per_languages first)
            const content = await this.getArticleContent(articleId, language);

            // 2. Process using existing article service
            const articleService = strapi.plugin('chinese-article-processor').service('articleService');
            const processedArticle = await articleService.processArticle(
                content,
                targetLanguages,
                true, // Use batch processing
                {} // Default batch options
            );

            // 3. Save processed data (per_languages primary)
            await this.saveProcessedData(articleId, language, processedArticle);

            // 4. Save to sentence tables as well
            await articleService.saveProcessedArticle(articleId, processedArticle);

            console.log(`[ProcessService] ✅ Complete processing finished for article ${articleId}`);
            return processedArticle;

        } catch (error) {
            console.error('[ProcessService] Error in complete processing:', error);
            throw error;
        }
    },

    /**
     * Get data source information for transparency
     */
    async getDataSourceInfo(articleId: number, language: string = 'zh') {
        try {
            const contentSource = await this.checkContentSource(articleId, language);
            const processedSource = await this.checkProcessedDataSource(articleId, language);

            return {
                articleId,
                language,
                content: {
                    source: contentSource,
                    isModern: contentSource === 'per_languages'
                },
                processedData: {
                    source: processedSource,
                    isModern: processedSource === 'per_languages'
                },
                overallStatus: (contentSource === 'per_languages' && processedSource === 'per_languages')
                    ? 'modern' : 'transition'
            };
        } catch (error) {
            console.error('[ProcessService] Error getting data source info:', error);
            return {
                articleId,
                language,
                content: { source: 'unknown', isModern: false },
                processedData: { source: 'unknown', isModern: false },
                overallStatus: 'unknown'
            };
        }
    },

    /**
     * Helper: Get article from legacy table with error handling
     */
    async getArticleFromLegacyTable(articleId: number) {
        try {
            return await strapi.entityService?.findOne('api::article.article', articleId, {
                populate: '*'
            });
        } catch (entityError) {
            console.log('[ProcessService] EntityService failed, trying direct query:', entityError);
            if (strapi.db) {
                return await strapi.db.query('api::article.article').findOne({
                    where: { id: articleId }
                });
            }
            throw entityError;
        }
    },

    /**
     * Helper: Check where content is coming from
     */
    async checkContentSource(articleId: number, language: string): Promise<'per_languages' | 'articles' | 'none'> {
        try {
            // Check per_languages first
            if (strapi.plugin('per-language')?.service('contentService')) {
                const perLanguageContent = await strapi.plugin('per-language')
                    .service('contentService')
                    .getLanguageContent(articleId, language);

                if (perLanguageContent?.per_language_text) {
                    return 'per_languages';
                }
            }

            // Check articles table
            const article = await this.getArticleFromLegacyTable(articleId);
            if (article?.translation || article?.Translation) {
                return 'articles';
            }

            return 'none';
        } catch (error) {
            return 'none';
        }
    },

    /**
     * Helper: Check where processed data is coming from
     */
    async checkProcessedDataSource(articleId: number, language: string): Promise<'per_languages' | 'articles' | 'none'> {
        try {
            // Check per_languages first
            if (strapi.plugin('per-language')?.service('contentService')) {
                const perLanguageContent = await strapi.plugin('per-language')
                    .service('contentService')
                    .getLanguageContent(articleId, language);

                if (perLanguageContent?.processed_data) {
                    return 'per_languages';
                }
            }

            // Check articles table
            const article = await this.getArticleFromLegacyTable(articleId);
            if (article?.chinese_processor || article?.ChineseProcessor) {
                return 'articles';
            }

            return 'none';
        } catch (error) {
            return 'none';
        }
    },

    /**
     * Helper: Extract difficulty data for performance optimization
     */
    extractDifficultyData(processedData: any) {
        if (!processedData || !processedData.hsk) {
            return null;
        }

        return {
            hsk: {
                distribution: processedData.hsk.distribution,
                selectedLevel: processedData.hsk.selectedLevel,
                calculatedLevel: processedData.hsk.calculatedLevel
            }
        };
    },

    /**
     * Legacy compatibility: Keep existing method signatures
     */
    async getProcessedDataWithFallback(
        articleId: number,
        language: string = 'zh'
    ): Promise<{ data: any, source: 'per_languages' | 'articles' }> {
        const data = await this.getProcessedData(articleId, language);
        const source = await this.checkProcessedDataSource(articleId, language);

        return {
            data,
            source: source === 'none' ? 'articles' : source
        };
    }
});