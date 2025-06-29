// src/plugins/per-language/server/controllers/article-controller.ts

import { Context } from 'koa';

// Add proper typing for the request body
interface RequestWithBody extends Context {
    request: Context['request'] & {
        body?: any;
    };
}

export default ({ strapi }: any) => ({
    /**
     * Create or update content for a specific language
     * FIXED: Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async updateArticleContent(ctx: RequestWithBody) {
        try {
            const { id: articleId } = ctx.params;
            const { language, content } = ctx.request.body || {};

            console.log('[ArticleController] Updating article content:', {
                articleId,
                language,
                contentLength: content?.length || 0,
                idType: typeof articleId
            });

            if (!articleId || !language || !content) {
                return ctx.badRequest('Article ID, language, and content are required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;
            let article: any;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

                const articles = await strapi.documents('api::article.article').findMany({
                    filters: {
                        documentId: articleId
                    }
                });

                if (!articles || articles.length === 0) {
                    return ctx.notFound('Article not found');
                }

                article = articles[0];
                resolvedArticleId = article.id;
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);
                console.log('[ArticleController] Using numeric ID:', resolvedArticleId);
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const result = await articleService.upsertLanguageContent(
                resolvedArticleId,
                language,
                content
            );

            console.log('[ArticleController] ✅ Content updated successfully');

            ctx.body = {
                data: result,
                message: 'Content updated successfully'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error updating content:', error);
            ctx.throw(500, `Failed to update content: ${error.message}`);
        }
    },

    /**
     * Get content for a specific language
     * FIXED: Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getArticleContent(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language = 'zh' } = ctx.query;

            console.log('[ArticleController] Getting article content:', {
                articleId,
                language,
                idType: typeof articleId
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;
            let article: any;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

                const articles = await strapi.documents('api::article.article').findMany({
                    filters: {
                        documentId: articleId
                    }
                });

                if (!articles || articles.length === 0) {
                    return ctx.notFound('Article not found');
                }

                article = articles[0];
                resolvedArticleId = article.id;
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);

                // Still fetch the article to validate it exists
                article = await strapi.documents('api::article.article').findFirst({
                    filters: { id: resolvedArticleId }
                });

                if (!article) {
                    return ctx.notFound('Article not found');
                }
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const content = await articleService.getLanguageContent(
                resolvedArticleId,
                language as string
            );

            if (!content) {
                // Try to get from articles table as fallback
                console.log('[ArticleController] No per_language content found, checking articles table');

                const legacyContent = article?.translation || article?.Translation;

                if (legacyContent) {
                    // Create per_language entry from legacy data
                    const newContent = await articleService.upsertLanguageContent(
                        resolvedArticleId,
                        language as string,
                        legacyContent
                    );

                    ctx.body = {
                        data: newContent,
                        source: 'migrated_from_articles'
                    };
                    return;
                }

                return ctx.notFound('Content not found');
            }

            ctx.body = {
                data: content,
                source: 'article_perlanguages'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error getting content:', error);
            ctx.throw(500, `Failed to get content: ${error.message}`);
        }
    },

    /**
     * Get all languages for an article (for ProcessedDataDisplay)
     * FIXED: Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getArticleLanguages(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;

            console.log('[ArticleController] Getting article languages:', {
                articleId,
                idType: typeof articleId
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

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
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);
                console.log('[ArticleController] Using numeric ID:', resolvedArticleId);
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const languages = await articleService.getAllLanguagesForArticle(resolvedArticleId);

            console.log('[ArticleController] ✅ Retrieved languages:', {
                count: languages?.length || 0,
                languages: languages?.map(l => l.language) || []
            });

            ctx.body = {
                data: languages || [],
                message: 'Languages retrieved successfully'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error getting languages:', error);
            ctx.throw(500, `Failed to get languages: ${error.message}`);
        }
    },

    /**
     * Refresh language data (for Chinese processor integration)
     */
    async refreshLanguage(ctx: Context) {
        try {
            const { id: articleId, language } = ctx.params;

            console.log('[ArticleController] Refreshing language:', {
                articleId,
                language,
                idType: typeof articleId
            });

            if (!articleId || !language) {
                return ctx.badRequest('Article ID and language are required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

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
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const refreshedData = await articleService.refreshLanguageData(resolvedArticleId, language);

            console.log('[ArticleController] ✅ Language data refreshed');

            ctx.body = {
                data: refreshedData,
                message: 'Language data refreshed successfully'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error refreshing language:', error);
            ctx.throw(500, `Failed to refresh language data: ${error.message}`);
        }
    },

    /**
     * Get processing data for Chinese processor
     * FIXED: Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getProcessingData(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language = 'zh' } = ctx.query;

            console.log('[ArticleController] Getting processing data:', {
                articleId,
                language,
                idType: typeof articleId
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

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
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);
            }

            const articleService = strapi.plugin('per-language').service('articleService');

            // Get both content and processed data
            const perLanguageData = await articleService.getLanguageContent(
                resolvedArticleId,
                language as string
            );

            if (!perLanguageData) {
                return ctx.notFound('Processing data not found');
            }

            // Structure the response for Chinese processor compatibility
            const response = {
                data: {
                    content: perLanguageData.per_language_text,
                    processedData: {
                        data: perLanguageData.processed_data,
                        source: 'article_perlanguages'
                    },
                    difficultyData: perLanguageData.difficulty_data,
                    displaySkill: perLanguageData.display_skill,
                    published: perLanguageData.published,
                    accessTier: perLanguageData.access_tier
                }
            };

            console.log('[ArticleController] ✅ Processing data retrieved successfully');

            ctx.body = response;
        } catch (error: any) {
            console.error('[ArticleController] Error getting processing data:', error);
            ctx.throw(500, `Failed to get processing data: ${error.message}`);
        }
    },

    /**
     * Enhanced translate endpoint with manual content support
     * FIXED: Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async translateContent(ctx: RequestWithBody) {
        try {
            const { articleId, targetLanguage, text, isManualContent = false } = ctx.request.body || {};

            console.log('[ArticleController] Translate request:', {
                articleId,
                targetLanguage,
                textLength: text?.length || 0,
                isManualContent,
                idType: typeof articleId
            });

            if (!articleId || !targetLanguage || !text) {
                return ctx.badRequest('Article ID, target language, and text are required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

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
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);
            }

            let translatedText = text;

            // If it's not manual content, perform actual translation
            if (!isManualContent) {
                console.log('[ArticleController] Performing translation via translator plugin');

                // Call the translator plugin
                const translatorService = strapi.plugin('translator').service('translationService');
                if (translatorService) {
                    const translationResult = await translatorService.translateText(text, targetLanguage);
                    translatedText = translationResult.translatedText;
                } else {
                    console.warn('[ArticleController] Translator service not available, using original text');
                }
            } else {
                console.log('[ArticleController] Using manual content as provided');
            }

            // Save to article_perlanguages table
            const articleService = strapi.plugin('per-language').service('articleService');
            const result = await articleService.upsertLanguageContent(
                resolvedArticleId,
                targetLanguage,
                translatedText
            );

            console.log('[ArticleController] ✅ Translation saved to article_perlanguages table');

            ctx.body = {
                data: {
                    translatedText,
                    perLanguageEntry: result,
                    isManualContent
                },
                message: isManualContent ? 'Manual content saved' : 'Translation completed and saved'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error in translate:', error);
            ctx.throw(500, `Translation failed: ${error.message}`);
        }
    },

    /**
     * Get article data in format compatible with Chinese processor
     * FIXED: Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getCompatibleArticleData(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language = 'zh' } = ctx.query;

            console.log('[ArticleController] Getting compatible article data:', {
                articleId,
                language,
                idType: typeof articleId
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // FIXED: Proper documentId resolution
            let resolvedArticleId: number;
            let article: any;

            if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                // This is a documentId (Strapi v5) - FIXED: Use correct query syntax
                console.log('[ArticleController] Using documentId to find article:', articleId);

                const articles = await strapi.documents('api::article.article').findMany({
                    filters: {
                        documentId: articleId
                    }
                });

                if (!articles || articles.length === 0) {
                    return ctx.notFound('Article not found');
                }

                article = articles[0];
                resolvedArticleId = article.id;
                console.log('[ArticleController] Resolved documentId to numeric ID:', resolvedArticleId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedArticleId = parseInt(articleId);

                article = await strapi.documents('api::article.article').findFirst({
                    filters: { id: resolvedArticleId }
                });

                if (!article) {
                    return ctx.notFound('Article not found');
                }
            }

            // Get article_perlanguage data
            const articleService = strapi.plugin('per-language').service('articleService');
            const perLanguageData = await articleService.getLanguageContent(
                resolvedArticleId,
                language as string
            );

            // Build response compatible with Chinese processor expectations
            const response = {
                data: {
                    id: article.id,
                    attributes: {
                        // Base article data
                        Title: article.Title || article.title,
                        Base: article.Base || article.base,
                        Date: article.Date || article.date,

                        // Language-specific data
                        LanguageProcessor: perLanguageData?.per_language_text || '',

                        // Legacy fields for backward compatibility
                        Translation: perLanguageData?.per_language_text || article.translation || article.Translation || '',
                        ChineseProcessor: perLanguageData?.processed_data || article.chinese_processor || article.ChineseProcessor
                    }
                },
                perLanguageData: perLanguageData
            };

            console.log('[ArticleController] ✅ Compatible article data prepared');

            ctx.body = response;
        } catch (error: any) {
            console.error('[ArticleController] Error getting compatible article data:', error);
            ctx.throw(500, `Failed to get article data: ${error.message}`);
        }
    },

    /**
     * Update processed data using the service method
     */
    async updateProcessedData(ctx: RequestWithBody) {
        try {
            const { contentId, processedData, difficultyData, displaySkill } = ctx.request.body || {};

            if (!contentId || !processedData) {
                return ctx.badRequest('Content ID and processed data are required');
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const result = await articleService.updateCompleteProcessedData(
                contentId,
                processedData,
                difficultyData,
                displaySkill
            );

            ctx.body = {
                data: result,
                message: 'Processed data updated successfully'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error updating processed data:', error);
            ctx.throw(500, `Failed to update processed data: ${error.message}`);
        }
    },

    /**
     * Update access tier for language content
     */
    async updateAccessTier(ctx: RequestWithBody) {
        try {
            const { contentId } = ctx.params;
            const { access_tier } = ctx.request.body || {};

            console.log('[ArticleController] Updating access tier:', {
                contentId,
                access_tier
            });

            if (!contentId || !access_tier) {
                return ctx.badRequest('Content ID and access tier are required');
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const result = await articleService.updateAccessTier(parseInt(contentId), access_tier);

            console.log('[ArticleController] ✅ Access tier updated successfully');

            ctx.body = {
                data: result,
                message: 'Access tier updated successfully'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error updating access tier:', error);
            ctx.throw(500, `Failed to update access tier: ${error.message}`);
        }
    }
});