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
            // 1. Get the language processor for the target language
            const languageService = strapi.plugin('per-language').service('languageService');
            const processor = languageService.getProcessorForLanguage(targetLanguage);

            if (!processor) {
                throw new ApplicationError(`No processor found for language: ${targetLanguage}`);
            }

            // 2. Get the content for this language
            const contentService = strapi.plugin('per-language').service('contentService');
            const content = await contentService.getLanguageContent(articleId, targetLanguage);

            if (!content) {
                throw new ApplicationError(`No content found for article ${articleId} in language ${targetLanguage}`);
            }

            // 3. Process the content using the appropriate processor plugin
            switch (processor.pluginName) {
                case 'chinese-article-processor': {
                    // Process with Chinese processor
                    const processorService = strapi.plugin('chinese-article-processor').service('articleService');
                    const processedSentences = await processorService.processArticle(content.per_language_text, ['en']);

                    // Save to both systems:

                    // a. Save to the per_language table with the processed data
                    let displaySkill = '';
                    if (processedSentences.length > 0 && processedSentences[0].hskLevel) {
                        displaySkill = `HSK ${processedSentences[0].hskLevel}`;
                    }

                    await contentService.updateProcessedData(
                        content.id,
                        processedSentences,
                        displaySkill
                    );

                    // b. For backward compatibility, also save to the existing sentence tables
                    await processorService.saveProcessedArticle(articleId, processedSentences);
                    break;
                }
                // Add cases for other language processors as they are implemented
                default:
                    throw new ApplicationError(`Processor ${processor.pluginName} implementation not found`);
            }

            return {
                success: true,
                message: `Article processed with ${processor.name} processor`
            };
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