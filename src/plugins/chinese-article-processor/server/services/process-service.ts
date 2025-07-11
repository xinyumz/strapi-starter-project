// src/plugins/chinese-article-processor/server/services/process-service.ts

import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: any) => ({
    /**
     * Get article content from article_perlanguages table
     */
    async getArticleContent(articleId: number, language: string = 'zh'): Promise<string> {
        try {
            if (!strapi.plugin('per-language')?.service('articleService')) {
                throw new ApplicationError('per-language articleService not available');
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('articleService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent && perLanguageContent.per_language_text) {
                return perLanguageContent.per_language_text;
            }

            throw new ApplicationError(
                `No content found for article ${articleId} in language ${language}. ` +
                `Please ensure the content is translated and saved in the article_perlanguages table first.`
            );
        } catch (error) {
            console.error('[ChineseProcessor] Error getting article content:', error);
            throw error;
        }
    },

    /**
     * Get processed data from article_perlanguages table
     */
    async getProcessedData(articleId: number, language: string = 'zh'): Promise<any> {
        try {
            if (!strapi.plugin('per-language')?.service('articleService')) {
                throw new ApplicationError('per-language articleService not available');
            }

            const perLanguageContent = await strapi.plugin('per-language')
                .service('articleService')
                .getLanguageContent(articleId, language);

            if (perLanguageContent && perLanguageContent.processed_data) {
                return perLanguageContent.processed_data;
            }

            return null;
        } catch (error) {
            console.error('[ChineseProcessor] Error getting processed data:', error);
            throw error;
        }
    },

    /**
     * Save processed data to article_perlanguages table
     * Complete data preservation
     */
    async saveProcessedData(
        articleId: number,
        language: string,
        processedData: any,
        displaySkill?: string
    ): Promise<void> {
        try {
            if (!strapi.plugin('per-language')?.service('articleService')) {
                throw new ApplicationError('per-language articleService not available');
            }

            const articleService = strapi.plugin('per-language').service('articleService');

            // Get existing per_language entry
            let existingContent = await articleService.getLanguageContent(articleId, language);

            if (!existingContent) {
                throw new ApplicationError(
                    `No article_perlanguages entry found for article ${articleId} in language ${language}. ` +
                    `Please ensure the content is translated and saved first.`
                );
            }

            // Extract difficulty data for performance optimization
            const difficultyData = this.extractDifficultyData(processedData);

            // Save using complete data preservation method
            if (articleService.updateCompleteProcessedData) {
                await articleService.updateCompleteProcessedData(
                    existingContent.id,
                    processedData,      // processed_data: Complete metadata
                    difficultyData,     // difficulty_data: Extracted difficulty  
                    displaySkill       // display_skill: UI display
                );
                console.log(`[ChineseProcessor] Processed data saved for article ${articleId}`);
            } else {
                // Fallback method
                await articleService.updateProcessedData(existingContent.id, processedData, displaySkill);
                console.log(`[ChineseProcessor] Processed data saved (fallback method) for article ${articleId}`);
            }
        } catch (error) {
            console.error('[ChineseProcessor] Error saving processed data:', error);
            throw error;
        }
    },

    /**
     * Complete article processing workflow using article_perlanguages table
     */
    async processArticleComplete(
        articleId: number,
        language: string = 'zh',
        targetLanguages: string[] = ['en']
    ): Promise<any> {
        try {
            console.log(`[ChineseProcessor] Processing article ${articleId} in ${language}`);

            // 1. Get content from article_perlanguages table
            const content = await this.getArticleContent(articleId, language);

            // 2. Validate content before processing
            if (!content || content.trim().length === 0) {
                throw new ApplicationError('Translation text is required for processing');
            }

            // 3. Process using existing article service
            const articleService = strapi.plugin('chinese-article-processor').service('articleService');
            const processedArticle = await articleService.processArticle(
                content,
                targetLanguages
            );

            // 4. Save processed data (article_perlanguages)
            await this.saveProcessedData(articleId, language, processedArticle);

            // 5. Save to sentence tables as well
            await articleService.saveProcessedArticle(articleId, processedArticle);

            console.log(`[ChineseProcessor] Processing completed for article ${articleId}`);
            return processedArticle;

        } catch (error) {
            console.error('[ChineseProcessor] Error in complete processing:', error);
            throw error;
        }
    },

    /**
     * Compatibility method for Chinese processor UI
     */
    async getDataForChineseProcessor(articleId: number, language: string = 'zh') {
        try {
            const content = await this.getArticleContent(articleId, language);
            const processedData = await this.getProcessedData(articleId, language);

            return {
                articleId,
                language,
                content: {
                    text: content,
                    source: 'article_perlanguages'
                },
                processedData: {
                    data: processedData,
                    hasData: !!processedData
                },
                compatibility: {
                    canProcess: !!content && content.trim().length > 0,
                    dataSource: 'article_perlanguages',
                    isModern: true
                }
            };
        } catch (error) {
            console.error('[ChineseProcessor] Error getting data for Chinese processor:', error);
            throw error;
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