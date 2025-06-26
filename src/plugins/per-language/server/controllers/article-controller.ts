// src/plugins/per-language/server/controllers/article-controller.ts

import { Strapi } from '@strapi/strapi';
import { Context } from 'koa';

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Create or update content for a specific language
     */
    async updateArticleContent(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language, content } = ctx.request.body;

            console.log('[ArticleController] Updating article content:', {
                articleId,
                language,
                contentLength: content?.length || 0
            });

            if (!articleId || !language || !content) {
                return ctx.badRequest('Article ID, language, and content are required');
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const result = await articleService.upsertLanguageContent(
                parseInt(articleId),
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
     */
    async getArticleContent(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language = 'zh' } = ctx.query;

            console.log('[ArticleController] Getting article content:', {
                articleId,
                language
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            const articleService = strapi.plugin('per-language').service('articleService');
            const content = await articleService.getLanguageContent(
                parseInt(articleId),
                language as string
            );

            if (!content) {
                // Try to get from articles table as fallback
                console.log('[ArticleController] No per_language content found, checking articles table');

                const article = await strapi.entityService?.findOne('api::article.article', parseInt(articleId));
                const legacyContent = (article as any)?.translation || (article as any)?.Translation;

                if (legacyContent) {
                    // Create per_language entry from legacy data
                    const newContent = await articleService.upsertLanguageContent(
                        parseInt(articleId),
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
                source: 'per_languages'
            };
        } catch (error: any) {
            console.error('[ArticleController] Error getting content:', error);
            ctx.throw(500, `Failed to get content: ${error.message}`);
        }
    },

    /**
     * Get processing data for Chinese processor
     */
    async getProcessingData(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language = 'zh' } = ctx.query;

            console.log('[ArticleController] Getting processing data:', {
                articleId,
                language
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            const articleService = strapi.plugin('per-language').service('articleService');

            // Get both content and processed data
            const perLanguageData = await articleService.getLanguageContent(
                parseInt(articleId),
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
                        source: 'per_languages'
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
     */
    async translateContent(ctx: Context) {
        try {
            const { articleId, targetLanguage, text, isManualContent = false } = ctx.request.body;

            console.log('[ArticleController] Translate request:', {
                articleId,
                targetLanguage,
                textLength: text?.length || 0,
                isManualContent
            });

            if (!articleId || !targetLanguage || !text) {
                return ctx.badRequest('Article ID, target language, and text are required');
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
                parseInt(articleId),
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
     */
    async getCompatibleArticleData(ctx: Context) {
        try {
            const { id: articleId } = ctx.params;
            const { language = 'zh' } = ctx.query;

            console.log('[ArticleController] Getting compatible article data:', {
                articleId,
                language
            });

            if (!articleId) {
                return ctx.badRequest('Article ID is required');
            }

            // Get article base data
            const article = await strapi.entityService?.findOne('api::article.article', parseInt(articleId), {
                populate: '*'
            });

            if (!article) {
                return ctx.notFound('Article not found');
            }

            // Get article_perlanguage data
            const articleService = strapi.plugin('per-language').service('articleService');
            const perLanguageData = await articleService.getLanguageContent(
                parseInt(articleId),
                language as string
            );

            // Build response compatible with Chinese processor expectations
            const response = {
                data: {
                    id: article.id,
                    attributes: {
                        // Base article data
                        Title: (article as any).Title || (article as any).title,
                        Base: (article as any).Base || (article as any).base,
                        Date: (article as any).Date || (article as any).date,

                        // Language-specific data
                        LanguageProcessor: perLanguageData?.per_language_text || '',

                        // Legacy fields for backward compatibility
                        Translation: perLanguageData?.per_language_text || (article as any).translation || (article as any).Translation || '',
                        ChineseProcessor: perLanguageData?.processed_data || (article as any).chinese_processor || (article as any).ChineseProcessor
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
    async updateProcessedData(ctx: Context) {
        try {
            const { contentId, processedData, difficultyData, displaySkill } = ctx.request.body;

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
    async updateAccessTier(ctx: Context) {
        try {
            const { contentId } = ctx.params;
            const { access_tier } = ctx.request.body;

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