// src/plugins/chinese-article-processor/server/services/process-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * CORRECTED: Get article content from per_languages table ONLY
     */
    async getArticleContent(articleId: number, language: string = 'zh'): Promise<string> {
        try {
            console.log(`[ProcessService] Getting content for article ${articleId} in ${language}`);

            if (!strapi.plugin('per-language')?.service('contentService')) {
                throw new ApplicationError('per-language service not available');
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('contentService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent && perLanguageContent.per_language_text) {
                console.log(`[ProcessService] ✅ Using content from per_languages table`);
                return perLanguageContent.per_language_text;
            }

            throw new ApplicationError(
                `No content found for article ${articleId} in language ${language}. ` +
                `Please ensure the content is translated and saved in the per_languages table first.`
            );
        } catch (error) {
            console.error('[ProcessService] Error getting article content:', error);
            throw error;
        }
    },

    /**
     * CORRECTED: Get content from per_languages table ONLY
     */
    async getContentFromAnySource(articleId: number, language: string = 'zh'): Promise<{ content: string, source: string }> {
        try {
            console.log(`[ProcessService] Getting content from per_languages table for article ${articleId}`);

            if (!strapi.plugin('per-language')?.service('contentService')) {
                throw new ApplicationError('per-language service not available');
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('contentService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent?.per_language_text) {
                return {
                    content: perLanguageContent.per_language_text,
                    source: 'per_languages'
                };
            }

            throw new ApplicationError(
                `No content found for article ${articleId} in language ${language}. ` +
                `Please ensure the content is translated and saved in the per_languages table first.`
            );
        } catch (error) {
            console.error('[ProcessService] Error getting content from per_languages table:', error);
            throw error;
        }
    },

    /**
     * CORRECTED: Get processed data from per_languages table ONLY
     */
    async getProcessedData(articleId: number, language: string = 'zh'): Promise<any> {
        try {
            console.log(`[ProcessService] Getting processed data for article ${articleId} in ${language}`);

            if (!strapi.plugin('per-language')?.service('contentService')) {
                throw new ApplicationError('per-language service not available');
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('contentService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent && perLanguageContent.processed_data) {
                console.log(`[ProcessService] ✅ Using processed data from per_languages table`);
                return perLanguageContent.processed_data;
            }

            console.log(`[ProcessService] No processed data found in per_languages table`);
            return null;
        } catch (error) {
            console.error('[ProcessService] Error getting processed data:', error);
            throw error;
        }
    },

    /**
     * CORRECTED: Save processed data to per_languages table ONLY
     * Enhanced with complete data preservation
     */
    async saveProcessedData(
        articleId: number,
        language: string,
        processedData: any,
        displaySkill?: string
    ): Promise<void> {
        try {
            console.log(`[ProcessService] Saving processed data for article ${articleId}`);

            if (!strapi.plugin('per-language')?.service('contentService')) {
                throw new ApplicationError('per-language service not available');
            }

            const contentService = strapi.plugin('per-language').service('contentService');

            // Get existing per_language entry
            let existingContent = await contentService.getLanguageContent(articleId, language);

            if (!existingContent) {
                throw new ApplicationError(
                    `No per_language entry found for article ${articleId} in language ${language}. ` +
                    `Please ensure the content is translated and saved first.`
                );
            }

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
        } catch (error) {
            console.error('[ProcessService] Error saving processed data:', error);
            throw error;
        }
    },

    /**
     * CORRECTED: Complete article processing workflow using per_languages table ONLY
     * This is used by the complete processing endpoint (process-v2)
     */
    async processArticleComplete(
        articleId: number,
        language: string = 'zh',
        targetLanguages: string[] = ['en']
    ): Promise<any> {
        try {
            console.log(`[ProcessService] Complete processing for article ${articleId}`);

            // 1. Get content from per_languages table ONLY
            const { content, source } = await this.getContentFromAnySource(articleId, language);
            console.log(`[ProcessService] Found content from source: ${source}`);

            // 2. Validate content before processing
            if (!content || content.trim().length === 0) {
                throw new ApplicationError('Translation text is required for processing');
            }

            // 3. Process using existing article service
            const articleService = strapi.plugin('chinese-article-processor').service('articleService');
            const processedArticle = await articleService.processArticle(
                content,
                targetLanguages,
                true, // Use batch processing
                {} // Default batch options
            );

            // 4. Save processed data (per_languages ONLY)
            await this.saveProcessedData(articleId, language, processedArticle);

            // 5. Save to sentence tables as well
            await articleService.saveProcessedArticle(articleId, processedArticle);

            console.log(`[ProcessService] ✅ Complete processing finished for article ${articleId}`);
            return processedArticle;

        } catch (error) {
            console.error('[ProcessService] Error in complete processing:', error);
            throw error;
        }
    },

    /**
     * CORRECTED: Enhanced compatibility method for Chinese processor UI
     */
    async getDataForChineseProcessor(articleId: number, language: string = 'zh') {
        try {
            const { content, source } = await this.getContentFromAnySource(articleId, language);
            const processedData = await this.getProcessedData(articleId, language);

            return {
                articleId,
                language,
                content: {
                    text: content,
                    source: source
                },
                processedData: {
                    data: processedData,
                    hasData: !!processedData
                },
                compatibility: {
                    canProcess: !!content && content.trim().length > 0,
                    dataSource: source,
                    isModern: source === 'per_languages'
                }
            };
        } catch (error) {
            console.error('[ProcessService] Error getting data for Chinese processor:', error);
            throw error;
        }
    },

    /**
     * CORRECTED: Get data source information for transparency
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
                    ? 'modern' : (contentSource === 'none' || processedSource === 'none')
                        ? 'missing' : 'unknown'
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
     * CORRECTED: Check where content is coming from - per_languages ONLY
     */
    async checkContentSource(articleId: number, language: string): Promise<'per_languages' | 'none'> {
        try {
            if (!strapi.plugin('per-language')?.service('contentService')) {
                return 'none';
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('contentService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent?.per_language_text) {
                return 'per_languages';
            }

            return 'none';
        } catch (error) {
            return 'none';
        }
    },

    /**
     * CORRECTED: Check where processed data is coming from - per_languages ONLY
     */
    async checkProcessedDataSource(articleId: number, language: string): Promise<'per_languages' | 'none'> {
        try {
            if (!strapi.plugin('per-language')?.service('contentService')) {
                return 'none';
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('contentService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent?.processed_data) {
                return 'per_languages';
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
    }
});