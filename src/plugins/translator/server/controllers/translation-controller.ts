//server/controllers/translation-controller.ts

export default ({ strapi }: any) => ({
    /**
     * General-purpose translation method
     * Handles direct text translation for all plugins (per-language, chinese-processor, etc.)
     * Optional Base field extraction as fallback for per-language plugin
     */
    async translate(ctx) {
        const { text, targetLanguage, articleId } = ctx.request.body;

        if (!targetLanguage) {
            return ctx.badRequest('Target language is required');
        }

        try {
            let sourceText = text;

            // OPTIONAL: If no text provided but articleId exists, 
            // try to extract Base field (mainly for per-language plugin compatibility)
            if ((!sourceText || sourceText.trim() === '') && articleId) {
                console.log('[TranslationController] No text provided, attempting Base field extraction for articleId:', articleId);

                try {
                    sourceText = await this.extractBaseFieldFromArticle(articleId);
                    console.log('[TranslationController] Successfully extracted Base field, length:', sourceText.length);
                } catch (extractError) {
                    console.log('[TranslationController] Could not extract Base field:', extractError.message);
                    return ctx.badRequest(
                        'No text provided. Please provide text directly or ensure the article has content in the Base field.'
                    );
                }
            }

            if (!sourceText || sourceText.trim() === '') {
                return ctx.badRequest('Text is required for translation');
            }

            console.log('[TranslationController] Translation request:', {
                textLength: sourceText.length,
                targetLanguage,
                hasArticleId: !!articleId,
                extractedFromBase: !!articleId && text !== sourceText
            });

            // Core translation logic (unchanged - works for all plugins)
            const translationService = strapi.plugin('translator').service('translationService');
            const translation = await translationService.translate(sourceText, targetLanguage);

            console.log('[TranslationController] Translation completed:', {
                originalLength: sourceText.length,
                translatedLength: translation.length,
                targetLanguage
            });

            ctx.body = { translatedText: translation };

        } catch (err) {
            console.error('[TranslationController] Translation error:', err);
            ctx.throw(500, `Translation failed: ${err.message}`);
        }
    },

    /**
     * HELPER: Extract Base field from article (for per-language plugin compatibility)
     * This is a fallback method and doesn't affect the general-purpose nature of the plugin
     */
    async extractBaseFieldFromArticle(articleId) {
        try {
            let article;

            // Handle both documentId (v5) and numeric ID (v4) for broad compatibility
            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // DocumentId (Strapi v5)
                const articles = await strapi.documents('api::article.article').findMany({
                    filters: { documentId: articleId }
                });

                if (!articles || articles.length === 0) {
                    throw new Error(`Article with documentId ${articleId} not found`);
                }
                article = articles[0];
            } else {
                // Numeric ID (v4 compatibility)
                const numericId = parseInt(articleId);
                article = await strapi.documents('api::article.article').findFirst({
                    filters: { id: numericId }
                });

                if (!article) {
                    throw new Error(`Article with ID ${numericId} not found`);
                }
            }

            // Try to find Base content in various possible field names
            const baseContent = article.Base || article.base || article.BASE ||
                article.attributes?.Base || article.data?.Base;

            if (!baseContent || baseContent.trim() === '') {
                throw new Error(`No Base content found in article. Available fields: ${Object.keys(article).join(', ')}`);
            }

            return baseContent;

        } catch (error) {
            console.error('[TranslationController] Base field extraction error:', error);
            throw error;
        }
    },

    /**
     * List supported languages - used by all plugins
     */
    async listLanguages(ctx) {
        try {
            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService || !translationService.listLanguages) {
                throw new Error('Translation service or listLanguages method not available');
            }

            const languages = await translationService.listLanguages();

            ctx.body = {
                data: languages
            };
        } catch (err) {
            console.error('Error fetching languages:', err);
            ctx.throw(500, `Failed to fetch languages: ${err.message}`);
        }
    }
});