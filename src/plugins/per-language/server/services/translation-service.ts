// src/plugins/per-language/server/services/translation-service.ts

import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: any) => {
    return {
        /**
         * Translate using external translator plugin and save to article_perlanguages table
         * Proper Document Service API usage and Base field access
         */
        async translateArticle(
            articleId: number | string,
            targetLanguage: string
        ): Promise<{ success: boolean; message?: string; contentId?: number }> {
            try {
                console.log(`[TranslationService] Translating article ${articleId} to ${targetLanguage}`);

                // Use Document Service API for Strapi v5 with proper ID resolution
                let resolvedArticleId: number;
                let article: any;

                // Handle both documentId (v5) and numeric ID (v4 compatibility)
                if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                    // This is a documentId (Strapi v5)
                    console.log(`[TranslationService] Using documentId: ${articleId}`);

                    const articles = await strapi.documents('api::article.article').findMany({
                        filters: {
                            documentId: articleId
                        }
                    });

                    if (!articles || articles.length === 0) {
                        throw new ApplicationError(`Article with documentId ${articleId} not found`);
                    }

                    article = articles[0];
                    resolvedArticleId = article.id;
                    console.log(`[TranslationService] Resolved documentId to numeric ID: ${resolvedArticleId}`);
                } else {
                    // This is a numeric ID (v4 compatibility)
                    resolvedArticleId = parseInt(articleId.toString());
                    console.log(`[TranslationService] Using numeric ID: ${resolvedArticleId}`);

                    article = await strapi.documents('api::article.article').findFirst({
                        filters: { id: resolvedArticleId }
                    });

                    if (!article) {
                        throw new ApplicationError(`Article with ID ${resolvedArticleId} not found`);
                    }
                }

                // Robust Base field access with multiple fallbacks
                const sourceText = this.extractBaseContent(article);

                if (!sourceText) {
                    console.error('[TranslationService] Article data structure:', {
                        id: article.id,
                        documentId: article.documentId,
                        availableFields: Object.keys(article),
                        Base: article.Base,
                        base: article.base
                    });

                    throw new ApplicationError(
                        `Article ${resolvedArticleId} has no Base content. ` +
                        `Available fields: ${Object.keys(article).join(', ')}. ` +
                        `Please ensure the article has content in the Base field.`
                    );
                }

                console.log(`[TranslationService] Found Base content, length: ${sourceText.length}`);

                // Step 2: Translate using external translator plugin
                const translatorPlugin = strapi.plugin('translator');
                if (!translatorPlugin) {
                    throw new ApplicationError('Translator plugin not found');
                }

                const translationService = translatorPlugin.service('translationService');
                if (!translationService?.translate) {
                    throw new ApplicationError('Translation service not available');
                }

                console.log(`[TranslationService] Calling external translator for ${targetLanguage}`);
                const translatedText = await translationService.translate(sourceText, targetLanguage);

                if (!translatedText) {
                    throw new ApplicationError('Translation service returned empty result');
                }

                console.log(`[TranslationService] Translation completed, length: ${translatedText.length}`);

                // Step 3: Save to article_perlanguages table using articleService
                const articleService = strapi.plugin('per-language').service('articleService');
                const perLanguageContent = await articleService.upsertLanguageContent(
                    resolvedArticleId, // Always use numeric ID for database operations
                    targetLanguage,
                    translatedText
                );

                console.log(`[TranslationService] ✅ Saved to article_perlanguages table, ID: ${perLanguageContent.id}`);

                return {
                    success: true,
                    message: `Article translated to ${targetLanguage} and saved`,
                    contentId: perLanguageContent.id
                };

            } catch (error) {
                console.error('[TranslationService] Translation error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Translation failed: ${errorMessage}`);
            }
        },

        /**
         * Robust Base field extraction with multiple fallbacks
         */
        extractBaseContent(article: any): string | null {
            // Try different possible field names and structures
            const possibleFields = [
                'Base',           // Standard case
                'base',           // Lowercase
                'BASE',           // Uppercase
                'Base_content',   // Alternative naming
                'content',        // Generic fallback
                'body'            // Another common name
            ];

            for (const fieldName of possibleFields) {
                if (article[fieldName]) {
                    console.log(`[TranslationService] Found Base content in field: ${fieldName}`);
                    return article[fieldName];
                }
            }

            // Try nested structures (in case of populated data)
            if (article.attributes?.Base) {
                console.log(`[TranslationService] Found Base content in attributes.Base`);
                return article.attributes.Base;
            }

            if (article.data?.Base) {
                console.log(`[TranslationService] Found Base content in data.Base`);
                return article.data.Base;
            }

            console.log(`[TranslationService] No Base content found. Available fields:`, Object.keys(article));
            return null;
        },

        /**
         * Get translated content from article_perlanguages table
         * Proper ID resolution for v5 compatibility
         */
        async getTranslatedContent(articleId: number | string, languageCode: string): Promise<string> {
            try {
                console.log(`[TranslationService] Getting content for article ${articleId} in ${languageCode}`);

                // Resolve to numeric ID for database operations
                let resolvedArticleId: number;

                if (typeof articleId === 'string' && isNaN(parseInt(articleId))) {
                    // This is a documentId (Strapi v5)
                    const articles = await strapi.documents('api::article.article').findMany({
                        filters: {
                            documentId: articleId
                        }
                    });

                    if (!articles || articles.length === 0) {
                        throw new ApplicationError(`Article with documentId ${articleId} not found`);
                    }

                    resolvedArticleId = articles[0].id;
                } else {
                    resolvedArticleId = parseInt(articleId.toString());
                }

                const articleService = strapi.plugin('per-language').service('articleService');
                const content = await articleService.getLanguageContent(resolvedArticleId, languageCode);

                if (!content?.per_language_text) {
                    throw new ApplicationError(
                        `No content found for article ${resolvedArticleId} in language ${languageCode}. ` +
                        `Please translate the article first using the translation feature.`
                    );
                }

                console.log(`[TranslationService] ✅ Found content in article_perlanguages table`);
                return content.per_language_text;

            } catch (error) {
                console.error('[TranslationService] Error getting translated content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get translated content: ${errorMessage}`);
            }
        }
    };
};