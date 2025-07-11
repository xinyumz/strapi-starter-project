// src/plugins/per-language/server/controllers/per-language-controller.ts

export default ({ strapi }: any) => ({
    /**
     * Get all available languages with processor information
     */
    async getLanguages(ctx) {
        try {
            const languageService = strapi.plugin('per-language').service('languageService');
            const languages = await languageService.getFullySupportedLanguages();

            ctx.body = { data: languages };
        } catch (error) {
            console.error('[PerLanguage] Error fetching languages:', error);
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
            // Handle both documentId (Strapi v5) and numeric ID
            let resolvedArticleId: number;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // DocumentId resolution for Strapi v5
                const articles = await strapi.documents('api::article.article').findMany({
                    filters: {
                        documentId: articleId
                    }
                });

                if (!articles || articles.length === 0) {
                    return ctx.notFound('Article not found');
                }

                const article = articles[0];
                resolvedArticleId = article.id;
            } else {
                // Numeric ID
                resolvedArticleId = parseInt(articleId);
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const languages = await articleService.getAllLanguagesForArticle(resolvedArticleId);

            ctx.body = {
                data: languages || [],
                message: 'Languages retrieved successfully'
            };
        } catch (error) {
            console.error('[PerLanguage] Error fetching article languages:', error);
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
            const articleService = strapi.plugin('per-language').service('articleService');
            const content = await articleService.getLanguageContent(parseInt(articleId), language);

            if (!content) {
                return ctx.notFound(`No content found for article ${articleId} in language ${language}`);
            }

            ctx.body = { data: content };
        } catch (error) {
            console.error('[PerLanguage] Error fetching language content:', error);
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
            console.error('[PerLanguage] Error translating article:', error);
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
            console.error('[PerLanguage] Error processing article:', error);
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
            console.error('[PerLanguage] Error in translate and process workflow:', error);
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
            const articleService = strapi.plugin('per-language').service('articleService');
            const result = await articleService.setPublishStatus(parseInt(contentId), !!published);

            ctx.body = { data: result };
        } catch (error) {
            console.error('[PerLanguage] Error setting publish status:', error);
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
            const articleService = strapi.plugin('per-language').service('articleService');
            await articleService.deleteLanguageContent(parseInt(contentId));

            ctx.body = { success: true };
        } catch (error) {
            console.error('[PerLanguage] Error deleting language content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to delete language content: ${errorMessage}`);
        }
    },

    /**
     * Refresh language data for a specific article and language
     */
    async refreshLanguageData(ctx) {
        const { articleId, language } = ctx.params;

        if (!articleId || !language) {
            return ctx.badRequest('Article ID and language are required');
        }

        try {
            // Handle both documentId (Strapi v5) and numeric ID
            let resolvedArticleId: number;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // DocumentId resolution for Strapi v5
                const articles = await strapi.documents('api::article.article').findMany({
                    filters: {
                        documentId: articleId
                    }
                });

                if (!articles || articles.length === 0) {
                    return ctx.notFound('Article not found');
                }

                const article = articles[0];
                resolvedArticleId = article.id;
            } else {
                // Numeric ID
                resolvedArticleId = parseInt(articleId);
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const refreshedData = await articleService.getLanguageContent(resolvedArticleId, language);

            if (!refreshedData) {
                return ctx.notFound(`No content found for article ${resolvedArticleId} in language ${language}`);
            }

            ctx.body = { data: refreshedData };
        } catch (error) {
            console.error(`[PerLanguage] Error refreshing language data:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to refresh language data: ${errorMessage}`);
        }
    }
});