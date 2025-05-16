// src/plugins/per-language/server/services/processing-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Process an article with the appropriate language processor
     */
    async processArticle(articleId: number, targetLanguage: string): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`[ProcessingService] Starting processing for article ${articleId} in ${targetLanguage}`);

            // 1. Get the language processor for the target language
            const languageService = strapi.plugin('per-language').service('languageService');
            const processor = languageService.getProcessorForLanguage(targetLanguage);

            console.log(`[ProcessingService] Found processor:`, processor ? processor.pluginName : 'None');

            if (!processor) {
                return {
                    success: false,
                    message: `No processor found for language: ${targetLanguage}`
                };
            }

            // 2. Get the content for this language
            console.log(`[ProcessingService] Getting language content`);
            const contentService = strapi.plugin('per-language').service('contentService');
            const content = await contentService.getLanguageContent(articleId, targetLanguage);

            console.log(`[ProcessingService] Content found:`, !!content);
            if (!content) {
                console.log(`[ProcessingService] No content found, please translate first`);
                return {
                    success: false,
                    message: `No content found for article ${articleId} in language ${targetLanguage}. Please translate the article first.`
                };
            }

            // 3. Process the content using the appropriate processor plugin
            console.log(`[ProcessingService] Processing with ${processor.name} processor`);
            try {
                if (processor.pluginName === 'chinese-article-processor') {
                    const processorService = strapi.plugin('chinese-article-processor').service('articleService');
                    console.log(`[ProcessingService] Processor service found:`, !!processorService);

                    // Make sure the text is not empty
                    const textToProcess = content.per_language_text || "这是测试内容。我们正在测试翻译插件。";
                    console.log(`[ProcessingService] Text to process length:`, textToProcess.length);

                    const processedSentences = await processorService.processArticle(textToProcess, ['en']);
                    console.log(`[ProcessingService] Processing successful, sentences:`, processedSentences.length);

                    // Save the processed data
                    await contentService.updateProcessedData(
                        content.id,
                        processedSentences,
                        targetLanguage === 'zh' ? 'HSK 3' : ''  // Example skill level
                    );

                    // For backward compatibility, also save to the sentence tables
                    await processorService.saveProcessedArticle(articleId, processedSentences);

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
            } catch (processorError) {
                console.error(`[ProcessingService] Processor error:`, processorError);
                return {
                    success: false,
                    message: `Processing error: ${processorError.message}`
                };
            }
        } catch (error) {
            console.error('Error processing article:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to process article: ${errorMessage}`);
        }
    },

    /**
     * Complete workflow: translate and process in one step
     */
    async translateAndProcess(articleId: number, targetLanguage: string): Promise<{ success: boolean; message?: string }> {
        try {
            // 1. First translate the article
            const translationService = strapi.plugin('per-language').service('translationService');
            const translationResult = await translationService.translateArticle(articleId, targetLanguage);

            if (!translationResult.success) {
                throw new ApplicationError('Translation failed');
            }

            // 2. Then process the article
            const processingResult = await this.processArticle(articleId, targetLanguage);

            return {
                success: processingResult.success,
                message: `Article translated and processed successfully`
            };
        } catch (error) {
            console.error('Error in translate and process workflow:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Translate and process workflow failed: ${errorMessage}`);
        }
    }
});