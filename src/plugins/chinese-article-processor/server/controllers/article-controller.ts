// server/controllers/article-controller.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ExtendedContext, BatchGrammarOptions } from '../services/types';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    // Process full article content
    async processArticle(ctx: ExtendedContext) {
        try {
            // Handle both structured and flat request formats
            const data = ctx.request.body.data || ctx.request.body;

            // Extract data with type safety and defaults
            const content = data.content;
            const targetLanguages = data.targetLanguages || ['en'];
            const articleId = data.articleId;

            // Use type assertion for optional properties that might not be defined in the interface
            const useBatchGrammar = 'useBatchGrammar' in data ? data.useBatchGrammar : true;
            const batchOptions = data.batchOptions || {};

            if (!content) {
                return ctx.badRequest('Article content is required');
            }

            // Configure batch options with defaults if not provided
            const grammarBatchOptions: BatchGrammarOptions = {
                batchSize: batchOptions.batchSize || 5,
                maxRetries: batchOptions.maxRetries || 3,
                retryDelay: batchOptions.retryDelay || 1000,
                concurrentRequests: batchOptions.concurrentRequests || 2
            };

            const processedArticle = await strapi
                .plugin('chinese-article-processor')
                .service('articleService')
                .processArticle(content, targetLanguages, useBatchGrammar, grammarBatchOptions);

            // If articleId is provided, save the processed article to the database
            if (articleId) {
                // *** NEW: Use dual-write process service ***
                const processService = strapi.plugin('chinese-article-processor').service('processService');

                if (processService) {
                    // Save to both articles.chinese_processor AND per_languages.processed_data
                    await processService.saveProcessedData(
                        Number(articleId),
                        'zh',
                        processedArticle
                    );
                    console.log(`[Admin Processing] Saved to both articles and per_languages tables for article ${articleId}`);
                } else {
                    // Fallback to old method if process service not available
                    console.log(`[Admin Processing] Process service not available, using legacy save`);
                }

                // Still save to sentence tables as before
                await strapi
                    .plugin('chinese-article-processor')
                    .service('articleService')
                    .saveProcessedArticle(articleId, processedArticle);
            }

            ctx.body = {
                data: processedArticle
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Article processing failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Article processing failed');
            }
        }
    },

    // Get article sentences with translations
    async getArticleSentences(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            const sentences = await strapi
                .plugin('chinese-article-processor')
                .service('articleService')
                .getArticleSentences(Number(id));

            ctx.body = {
                data: sentences
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Failed to fetch article sentences: ${error.message}`);
            } else {
                ctx.throw(500, 'Failed to fetch article sentences');
            }
        }
    },

    // Process article using the new dual-source approach
    async processArticleFromAnySource(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;
            const { targetLanguages = ['en'] } = ctx.request.body.data || ctx.request.body;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            // Call the process service
            const processService = strapi.plugin('chinese-article-processor').service('processService');

            if (!processService) {
                return ctx.badRequest('Process service not available');
            }

            // Get content from either source
            const content = await processService.getArticleContent(Number(id), 'zh');

            // Process the content using existing article service
            const articleService = strapi.plugin('chinese-article-processor').service('articleService');
            const processedArticle = await articleService.processArticle(
                content,
                targetLanguages,
                true, // Default to batch processing
                {} // Use default batch options
            );

            // Save processed data to both places
            await processService.saveProcessedData(
                Number(id),
                'zh',
                processedArticle
            );

            // Also save to the sentence tables
            await articleService.saveProcessedArticle(Number(id), processedArticle);

            ctx.body = {
                data: processedArticle
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Article processing failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Article processing failed');
            }
        }
    },

    async processArticleV2(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;
            const { targetLanguages = ['en'] } = ctx.request.body.data || ctx.request.body;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            const processService = strapi.plugin('chinese-article-processor').service('processService');
            const result = await processService.processArticleComplete(
                parseInt(id),
                'zh',
                targetLanguages
            );

            ctx.body = { data: result };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Article processing failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Article processing failed');
            }
        }
    },
    async updateArticleProcessedData(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;
            const data = ctx.request.body.data || ctx.request.body;

            // Use type assertion to access the properties
            const processedData = (data as any).processedData;
            const displaySkill = (data as any).displaySkill;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            if (!processedData) {
                return ctx.badRequest('Processed data is required');
            }

            console.log(`[Admin Processing] Updating processed data for article ${id}`);

            // Use the process service to save to both locations
            const processService = strapi.plugin('chinese-article-processor').service('processService');

            if (processService) {
                await processService.saveProcessedData(
                    Number(id),
                    'zh',
                    processedData,
                    displaySkill
                );
                console.log(`[Admin Processing] Successfully saved to both articles and per_languages tables`);
            } else {
                console.log(`[Admin Processing] Process service not available, saving to articles table only`);
                // Fallback: save only to articles table
                await strapi.entityService?.update('api::article.article', Number(id), {
                    data: { chinese_processor: processedData } as any
                });
            }

            ctx.body = {
                data: { success: true, message: 'Processed data updated successfully' }
            };
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                ctx.throw(400, error.message);
            } else if (error instanceof Error) {
                ctx.throw(500, `Failed to update processed data: ${error.message}`);
            } else {
                ctx.throw(500, 'Failed to update processed data');
            }
        }
    },
    async syncProcessedDataManually(ctx: ExtendedContext) {
        try {
            const { id } = ctx.params;

            if (!id) {
                return ctx.badRequest('Article ID is required');
            }

            console.log(`[Manual Sync] Syncing processed data for article ${id}`);

            // Get the article with its processed data
            const article = await strapi.entityService?.findOne('api::article.article', Number(id), {});

            if (!article) {
                return ctx.badRequest('Article not found');
            }

            const chineseProcessor = article.chinese_processor || article.ChineseProcessor;

            if (!chineseProcessor) {
                return ctx.badRequest('No processed data found in article');
            }

            // Use the process service to sync
            const processService = strapi.plugin('chinese-article-processor').service('processService');

            if (processService && processService.saveProcessedData) {
                // For admin format, convert to API format first
                let dataToSync = chineseProcessor;

                if (chineseProcessor.grammar && chineseProcessor.grammar.sentences) {
                    dataToSync = chineseProcessor.grammar.sentences.map((sentence: any) => ({
                        chinese: sentence.sentence,
                        grammarRules: sentence.rules || [],
                        translations: sentence.translations ?
                            sentence.translations.reduce((acc: any, trans: any) => {
                                acc[trans.language] = trans.text;
                                return acc;
                            }, {}) :
                            { en: sentence.translation }
                    }));
                }

                // Extract display skill
                let displaySkill = null;
                if (chineseProcessor.hsk) {
                    if (chineseProcessor.hsk.selectedLevel) {
                        displaySkill = `HSK ${chineseProcessor.hsk.selectedLevel}`;
                    } else if (chineseProcessor.hsk.calculatedLevel) {
                        displaySkill = `HSK ${chineseProcessor.hsk.calculatedLevel}`;
                    }
                }

                await processService.saveProcessedData(Number(id), 'zh', dataToSync, displaySkill);

                ctx.body = {
                    data: {
                        success: true,
                        message: 'Processed data manually synced successfully',
                        displaySkill: displaySkill
                    }
                };
            } else {
                return ctx.badRequest('Process service not available');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                ctx.throw(500, `Manual sync failed: ${error.message}`);
            } else {
                ctx.throw(500, 'Manual sync failed');
            }
        }
    }
});