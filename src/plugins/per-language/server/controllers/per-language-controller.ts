// src/plugins/per-language/server/controllers/per-language-controller.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Get all available languages with processor information
     */
    async getLanguages(ctx) {
        try {
            const languageService = strapi.plugin('per-language').service('languageService');
            const languages = await languageService.getFullySupportedLanguages();

            ctx.body = { data: languages };
        } catch (error) {
            console.error('Error fetching languages:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to fetch languages: ${errorMessage}`);
        }
    },

    /**
     * Get all languages for a specific article
     */
    async getArticleLanguages(ctx) {
        const { articleId } = ctx.params;

        if (!articleId) {
            return ctx.badRequest('Article ID is required');
        }

        try {
            const languageService = strapi.plugin('per-language').service('languageService');
            const languages = await languageService.getArticleLanguages(parseInt(articleId));

            ctx.body = { data: languages };
        } catch (error) {
            console.error('Error fetching article languages:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to fetch article languages: ${errorMessage}`);
        }
    },

    /**
     * Get content for a specific language
     */
    async getLanguageContent(ctx) {
        const { articleId, language } = ctx.params;

        if (!articleId || !language) {
            return ctx.badRequest('Article ID and language are required');
        }

        try {
            const contentService = strapi.plugin('per-language').service('contentService');
            const content = await contentService.getLanguageContent(parseInt(articleId), language);

            if (!content) {
                return ctx.notFound(`No content found for article ${articleId} in language ${language}`);
            }

            ctx.body = { data: content };
        } catch (error) {
            console.error('Error fetching language content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to fetch language content: ${errorMessage}`);
        }
    },

    /**
     * Translate an article to a target language
     */
    async translateArticle(ctx) {
        const { articleId, targetLanguage } = ctx.request.body;

        if (!articleId || !targetLanguage) {
            return ctx.badRequest('Article ID and target language are required');
        }

        try {
            const translationService = strapi.plugin('per-language').service('translationService');
            const result = await translationService.translateArticle(articleId, targetLanguage);

            ctx.body = result;
        } catch (error) {
            console.error('Error translating article:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return ctx.throw(500, `Failed to translate article: ${errorMessage}`);
        }
    },

    /**
     * Process an article with the appropriate language processor
     */
    async processArticle(ctx) {
        const { articleId, targetLanguage } = ctx.request.body;

        if (!articleId || !targetLanguage) {
            return ctx.badRequest('Article ID and target language are required');
        }

        try {
            const processingService = strapi.plugin('per-language').service('processingService');
            const result = await processingService.processArticle(articleId, targetLanguage);

            if (!result.success) {
                return ctx.badRequest(result.message);
            }

            ctx.body = result;
        } catch (error) {
            console.error('Error processing article:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return ctx.throw(500, `Failed to process article: ${errorMessage}`);
        }
    },

    /**
     * Complete workflow: translate and process in one step
     */
    async translateAndProcess(ctx) {
        const { articleId, targetLanguage } = ctx.request.body;

        if (!articleId || !targetLanguage) {
            return ctx.badRequest('Article ID and target language are required');
        }

        try {
            const processingService = strapi.plugin('per-language').service('processingService');
            const result = await processingService.translateAndProcess(parseInt(articleId), targetLanguage);

            ctx.body = result;
        } catch (error) {
            console.error('Error in translate and process workflow:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Translate and process workflow failed: ${errorMessage}`);
        }
    },

    /**
     * Set the publish status for language content
     */
    async setPublishStatus(ctx) {
        const { contentId } = ctx.params;
        const { published } = ctx.request.body;

        if (contentId === undefined || published === undefined) {
            return ctx.badRequest('Content ID and published status are required');
        }

        try {
            const contentService = strapi.plugin('per-language').service('contentService');
            const result = await contentService.setPublishStatus(parseInt(contentId), !!published);

            ctx.body = { data: result };
        } catch (error) {
            console.error('Error setting publish status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to set publish status: ${errorMessage}`);
        }
    },

    /**
     * Delete language content
     */
    async deleteLanguageContent(ctx) {
        const { contentId } = ctx.params;

        if (!contentId) {
            return ctx.badRequest('Content ID is required');
        }

        try {
            const contentService = strapi.plugin('per-language').service('contentService');
            await contentService.deleteLanguageContent(parseInt(contentId));

            ctx.body = { success: true };
        } catch (error) {
            console.error('Error deleting language content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to delete language content: ${errorMessage}`);
        }
    },

    //langauge-specific refresh
    async refreshLanguageData(ctx) {
        const { articleId, language } = ctx.params;

        if (!articleId || !language) {
            return ctx.badRequest('Article ID and language are required');
        }

        try {
            console.log(`[Refresh] Refreshing data for article ${articleId}, language ${language}`);

            // Use contentService instead of languageService
            const contentService = strapi.plugin('per-language').service('contentService');
            const refreshedData = await contentService.getLanguageContent(parseInt(articleId), language);

            if (!refreshedData) {
                return ctx.notFound(`No content found for article ${articleId} in language ${language}`);
            }

            console.log(`[Refresh] Successfully refreshed data for article ${articleId}, language ${language}`);
            ctx.body = { data: refreshedData };
        } catch (error) {
            console.error(`[Refresh] Error refreshing language data:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to refresh language data: ${errorMessage}`);
        }
    }

});