// src/plugins/per-language/server/controllers/migration-controller.ts

import { Strapi } from '@strapi/strapi';

interface ProcessService {
    getArticleContent?: (articleId: number, language: string) => Promise<string>;
    getProcessedData?: (articleId: number, language: string) => Promise<any>;
    getDataSourceInfo?: (articleId: number, language: string) => Promise<any>;
}

interface TestResults {
    articlesTable: { available: boolean; error: string | null };
    perLanguagesTable: { available: boolean; error: string | null };
    processService: { available: boolean; error: string | null };
    contentService: { available: boolean; error: string | null };
}

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Get article data for processing interface
     * Shows which data source is being used
     */
    async getArticleForProcessing(ctx: any) {
        const { articleId } = ctx.params;
        const { language = 'zh' } = ctx.query;

        if (!articleId) {
            return ctx.badRequest('Article ID is required');
        }

        try {
            console.log(`[Migration API] Getting article ${articleId} for processing in ${language}`);

            // Get process service with proper typing
            const processService = strapi.plugin('chinese-article-processor')?.service('processService') as ProcessService | undefined;

            if (!processService) {
                return ctx.badRequest('Process service not available');
            }

            // Get basic article info - REMOVED AccessTier field reference
            const article = await strapi.entityService?.findOne('api::article.article', parseInt(articleId), {
                fields: ['id', 'Title', 'Date']
            }) as any;

            if (!article) {
                return ctx.notFound(`Article ${articleId} not found`);
            }

            // Get content and data with proper error handling
            let content = '';
            let processedData = null;
            let dataSourceInfo = null;

            try {
                if (processService.getArticleContent) {
                    content = await processService.getArticleContent(parseInt(articleId), language);
                }
            } catch (error) {
                console.error('Error getting article content:', error);
            }

            try {
                if (processService.getProcessedData) {
                    processedData = await processService.getProcessedData(parseInt(articleId), language);
                }
            } catch (error) {
                console.error('Error getting processed data:', error);
            }

            // Get data source information if method exists
            try {
                if (processService.getDataSourceInfo) {
                    dataSourceInfo = await processService.getDataSourceInfo(parseInt(articleId), language);
                }
            } catch (error) {
                console.error('Error getting data source info:', error);
            }

            // Get access tier from per_languages table instead
            let accessTier = 'Free'; // default
            try {
                const contentService = strapi.plugin('per-language')?.service('contentService');
                if (contentService) {
                    const perLanguageContent = await contentService.getLanguageContent(parseInt(articleId), language);
                    if (perLanguageContent && perLanguageContent.access_tier) {
                        accessTier = perLanguageContent.access_tier;
                    }
                }
            } catch (error) {
                console.error('Error getting access tier from per_languages:', error);
            }

            const response = {
                articleInfo: {
                    id: parseInt(articleId),
                    title: article.Title || `Article #${articleId}`,
                    date: article.Date,
                    accessTier: accessTier // Now from per_languages table
                },
                content: {
                    text: content,
                    language: language
                },
                processedData: {
                    data: processedData,
                    hasData: !!processedData
                },
                dataSource: dataSourceInfo || {
                    content: { source: 'unknown', isModern: false },
                    processedData: { source: 'unknown', isModern: false },
                    overallStatus: 'unknown'
                },
                _meta: {
                    timestamp: new Date().toISOString(),
                    apiVersion: 'v2-post-cleanup'
                }
            };

            ctx.body = { data: response };
        } catch (error) {
            console.error('[Migration API] Error getting article for processing:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to get article for processing: ${errorMessage}`);
        }
    },

    /**
     * Get data source information for an article
     */
    async getDataSourceInfo(ctx: any) {
        const { articleId } = ctx.params;
        const { language = 'zh' } = ctx.query;

        if (!articleId) {
            return ctx.badRequest('Article ID is required');
        }

        try {
            console.log(`[Migration API] Getting data source info for article ${articleId}`);

            const processService = strapi.plugin('chinese-article-processor')?.service('processService') as ProcessService | undefined;

            if (!processService || !processService.getDataSourceInfo) {
                return ctx.badRequest('Data source info not available');
            }

            const dataSourceInfo = await processService.getDataSourceInfo(parseInt(articleId), language);

            ctx.body = { data: dataSourceInfo };
        } catch (error) {
            console.error('[Migration API] Error getting data source info:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to get data source info: ${errorMessage}`);
        }
    },

    /**
     * Create per_language entry for an article
     * Useful for transitioning articles to the new structure
     */
    async createPerLanguageEntry(ctx: any) {
        const { articleId } = ctx.params;
        const { language = 'zh', accessTier = 'Free' } = ctx.request.body;

        if (!articleId) {
            return ctx.badRequest('Article ID is required');
        }

        try {
            console.log(`[Migration API] Creating per_language entry for article ${articleId}`);

            const contentService = strapi.plugin('per-language')?.service('contentService');
            if (!contentService) {
                return ctx.badRequest('Per-language content service not available');
            }

            // Check if entry already exists
            const existing = await contentService.getLanguageContent(parseInt(articleId), language);
            if (existing) {
                return ctx.badRequest('Per-language entry already exists');
            }

            // Get content from articles table with type assertion
            const article = await strapi.entityService?.findOne('api::article.article', parseInt(articleId), {}) as any;
            if (!article) {
                return ctx.notFound(`Article ${articleId} not found`);
            }

            // Handle both field name variations (legacy support)
            const content = article.Translation || article.translation;
            if (!content) {
                return ctx.badRequest('No content found in articles table to use');
            }

            // Create per_language entry with specified access tier
            const result = await contentService.upsertLanguageContent(
                parseInt(articleId),
                language,
                content
            );

            // Set access tier
            try {
                await strapi.entityService?.update(
                    'plugin::per-language.per-language',
                    result.id,
                    {
                        data: {
                            access_tier: accessTier
                        } as any
                    }
                );
            } catch (updateError) {
                console.warn('Could not update access_tier, but entry was created successfully:', updateError);
            }

            const response = {
                success: true,
                articleId: parseInt(articleId),
                language: language,
                perLanguageId: result.id,
                contentLength: content.length,
                accessTier: accessTier,
                timestamp: new Date().toISOString()
            };

            console.log(`[Migration API] ✅ Created per_language entry for article ${articleId}`);
            ctx.body = { data: response };
        } catch (error) {
            console.error('[Migration API] Error creating per_language entry:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to create per_language entry: ${errorMessage}`);
        }
    },

    /**
     * Get overview of data sources across articles
     * Useful for understanding the current state
     */
    async getSystemOverview(ctx: any) {
        const { language = 'zh', limit = 50 } = ctx.query;

        try {
            console.log(`[Migration API] Getting system overview`);

            // Get articles - no AccessTier field
            const articles = await strapi.entityService?.findMany('api::article.article', {
                fields: ['id', 'Title'],
                limit: parseInt(limit as string)
            }) as any[];

            if (!articles || articles.length === 0) {
                return ctx.body = {
                    data: {
                        articles: [],
                        summary: { total: 0, modernSystem: 0, transitionState: 0, unknownState: 0 }
                    }
                };
            }

            const processService = strapi.plugin('chinese-article-processor')?.service('processService') as ProcessService | undefined;

            if (!processService || !processService.getDataSourceInfo) {
                return ctx.badRequest('Data source info not available for system overview');
            }

            // Get data source info for each article
            const articleInfoPromises = articles.map(async (article: any) => {
                try {
                    const sourceInfo = await processService.getDataSourceInfo!(article.id, language);
                    return {
                        id: article.id,
                        title: article.Title,
                        ...sourceInfo
                    };
                } catch (error) {
                    return {
                        id: article.id,
                        title: article.Title,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });

            const articleInfos = await Promise.all(articleInfoPromises);

            // Calculate summary
            const summary = {
                total: articleInfos.length,
                modernSystem: articleInfos.filter(a => a.overallStatus === 'modern').length,
                transitionState: articleInfos.filter(a => a.overallStatus === 'transition').length,
                unknownState: articleInfos.filter(a => a.overallStatus === 'unknown' || a.error).length,
                contentInPerLanguages: articleInfos.filter(a => a.content?.isModern).length,
                processedDataInPerLanguages: articleInfos.filter(a => a.processedData?.isModern).length
            };

            const response = {
                articles: articleInfos,
                summary,
                meta: {
                    language,
                    timestamp: new Date().toISOString(),
                    totalArticlesInSystem: articles.length
                }
            };

            ctx.body = { data: response };
        } catch (error) {
            console.error('[Migration API] Error getting system overview:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to get system overview: ${errorMessage}`);
        }
    },

    /**
     * Test connectivity to both data sources
     */
    async testDataSources(ctx: any) {
        try {
            console.log(`[Migration API] Testing data source connectivity`);

            const results: TestResults = {
                articlesTable: { available: false, error: null },
                perLanguagesTable: { available: false, error: null },
                processService: { available: false, error: null },
                contentService: { available: false, error: null }
            };

            // Test articles table
            try {
                const testArticle = await strapi.entityService?.findMany('api::article.article', { limit: 1 });
                results.articlesTable.available = !!testArticle;
            } catch (error) {
                results.articlesTable.error = error instanceof Error ? error.message : 'Unknown error';
            }

            // Test per_languages table
            try {
                const contentService = strapi.plugin('per-language')?.service('contentService');
                if (contentService) {
                    results.contentService.available = true;
                    // Try a simple query
                    const testQuery = await strapi.entityService?.findMany('plugin::per-language.per-language', { limit: 1 });
                    results.perLanguagesTable.available = !!testQuery;
                } else {
                    results.contentService.error = 'Content service not found';
                }
            } catch (error) {
                results.perLanguagesTable.error = error instanceof Error ? error.message : 'Unknown error';
            }

            // Test process service
            try {
                const processService = strapi.plugin('chinese-article-processor')?.service('processService');
                results.processService.available = !!processService;
                if (!processService) {
                    results.processService.error = 'Process service not found';
                }
            } catch (error) {
                results.processService.error = error instanceof Error ? error.message : 'Unknown error';
            }

            const allHealthy = results.articlesTable.available &&
                results.perLanguagesTable.available &&
                results.processService.available &&
                results.contentService.available;

            const response = {
                healthy: allHealthy,
                results,
                timestamp: new Date().toISOString()
            };

            ctx.body = { data: response };
        } catch (error) {
            console.error('[Migration API] Error testing data sources:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ctx.throw(500, `Failed to test data sources: ${errorMessage}`);
        }
    }
});