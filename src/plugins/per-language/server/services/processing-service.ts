// src/plugins/per-language/server/services/processing-service.ts

import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: any) => ({
    /**
     * Process article with single save to sentence tables
     * The article_perlanguages table gets updated automatically via the grammar service
     */
    async processArticle(articleId: number, targetLanguage: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`[PerLanguage] Processing article ${articleId} in ${targetLanguage}`);

            // 1. Get the language processor for the target language
            const languageService = strapi.plugin('per-language').service('languageService');
            const processor = languageService.getProcessorForLanguage(targetLanguage);

            if (!processor) {
                return {
                    success: false,
                    message: `No processor found for language: ${targetLanguage}`
                };
            }

            // 2. Get content from article_perlanguages table using articleService
            const articleService = strapi.plugin('per-language').service('articleService');
            const content = await articleService.getLanguageContent(articleId, targetLanguage);

            if (!content?.per_language_text) {
                return {
                    success: false,
                    message: `No content found for article ${articleId} in language ${targetLanguage}. Please translate the article first.`
                };
            }

            // 3. Process using the appropriate processor plugin
            console.log(`[PerLanguage] Using ${processor.name} processor`);

            // Try registry interface first, fallback to direct plugin access for compatibility
            try {
                // Check if processor has registry interface methods
                const registry = strapi.plugin('per-language').service('languageProcessorRegistry');
                const registryProcessor = registry?.getProcessorForLanguage(targetLanguage);

                if (registryProcessor && typeof registryProcessor.processContent === 'function') {
                    // Use the modern registry interface
                    const processedData = await registryProcessor.processContent(
                        content.per_language_text,
                        { targetLanguages: ['en'] } // Default target languages for sentence translation
                    );

                    // Save processed data through processor interface
                    await registryProcessor.saveProcessedData(articleId, targetLanguage, processedData);

                    console.log(`[PerLanguage] Processing completed using registry interface`);
                    return {
                        success: true,
                        message: `Article processed with ${registryProcessor.displayName} processor`
                    };
                }
            } catch (registryError) {
                console.warn(`[PerLanguage] Registry interface failed, using direct plugin access:`, registryError);
            }

            // Fallback to direct plugin access (current working method)
            if (processor.pluginName === 'chinese-article-processor') {
                // Use the complete processing workflow from chinese-article-processor
                const processService = strapi.plugin('chinese-article-processor').service('processService');

                const processedData = await processService.processArticleComplete(
                    articleId,
                    targetLanguage,
                    ['en'] // Default target languages for translation
                );

                console.log(`[PerLanguage] Processing completed using direct plugin access`);
                return {
                    success: true,
                    message: `Article processed with ${processor.name} processor`
                };
            } else {
                return {
                    success: false,
                    message: `Processor ${processor.pluginName} implementation not found`
                };
            }

        } catch (error) {
            console.error('[PerLanguage] Error processing article:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to process article: ${errorMessage}`);
        }
    },

    /**
     * Translate and process workflow
     */
    async translateAndProcess(articleId: number, targetLanguage: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`[PerLanguage] Starting translate and process workflow for article ${articleId}`);

            // 1. Translate the article
            const translationService = strapi.plugin('per-language').service('translationService');
            const translationResult = await translationService.translateArticle(articleId, targetLanguage);

            if (!translationResult.success) {
                throw new ApplicationError('Translation failed');
            }

            // 2. Process the article
            const processingResult = await this.processArticle(articleId, targetLanguage);

            const success = processingResult.success;
            console.log(`[PerLanguage] Translate and process workflow ${success ? 'completed' : 'failed'}`);

            return {
                success,
                message: success
                    ? `Article translated and processed successfully`
                    : processingResult.message
            };

        } catch (error) {
            console.error('[PerLanguage] Error in translate and process workflow:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Translate and process workflow failed: ${errorMessage}`);
        }
    }
});