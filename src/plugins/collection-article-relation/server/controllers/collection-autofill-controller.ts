// src/plugins/collection-article-relation/server/controllers/collection-autofill-controller.ts

import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Analyze articles for collection auto-fill
     * POST /collection-article-relation/analyze-articles
     * Body: { articleIds: number[] }
     */
    async analyzeArticles(ctx: any) {
        try {
            const { articleIds } = ctx.request.body;

            // Validate input
            if (!articleIds || !Array.isArray(articleIds)) {
                return ctx.badRequest('articleIds array is required');
            }

            if (articleIds.length === 0) {
                return ctx.badRequest('At least one article ID is required');
            }

            // Validate article IDs are numbers
            const validIds = articleIds.filter(id => Number.isInteger(id) && id > 0);
            if (validIds.length !== articleIds.length) {
                return ctx.badRequest('All article IDs must be positive integers');
            }

            console.log(`[CollectionAutoFillController] Analyzing articles: ${validIds.join(', ')}`);

            // Get auto-fill service
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            // Analyze articles
            const result = await autoFillService.analyzeArticlesForAutoFill(validIds);

            ctx.body = {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('[CollectionAutoFillController] Error in analyzeArticles:', error);
            ctx.internalServerError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Create quick collection from single article
     * POST /collection-article-relation/quick-create
     * Body: { articleId: number }
     */
    async quickCreateCollection(ctx: any) {
        try {
            const { articleId } = ctx.request.body;

            // Validate input
            if (!articleId || !Number.isInteger(articleId) || articleId <= 0) {
                return ctx.badRequest('Valid article ID is required');
            }

            console.log(`[CollectionAutoFillController] Quick creating collection from article ${articleId}`);

            // Get auto-fill service
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            // Create quick collection
            const result = await autoFillService.createQuickCollectionFromArticle(articleId);

            ctx.body = {
                success: true,
                data: result,
                message: 'Collection created successfully'
            };

        } catch (error) {
            console.error('[CollectionAutoFillController] Error in quickCreateCollection:', error);
            ctx.internalServerError(`Quick creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get article data for analysis
     * GET /collection-article-relation/articles?ids=1,2,3
     */
    async getArticleData(ctx: any) {
        try {
            const { ids } = ctx.query;

            if (!ids) {
                return ctx.badRequest('Article IDs are required in query parameter "ids"');
            }

            // Parse IDs from comma-separated string
            const articleIds = ids.split(',')
                .map((id: string) => parseInt(id.trim()))
                .filter((id: number) => !isNaN(id) && id > 0);

            if (articleIds.length === 0) {
                return ctx.badRequest('No valid article IDs provided');
            }

            console.log(`[CollectionAutoFillController] Getting article data: ${articleIds.join(', ')}`);

            // Get auto-fill service
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            // Get article data
            const articles = await autoFillService.getArticleData(articleIds);

            ctx.body = {
                success: true,
                data: {
                    articles,
                    count: articles.length
                }
            };

        } catch (error) {
            console.error('[CollectionAutoFillController] Error in getArticleData:', error);
            ctx.internalServerError(`Failed to get article data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Health check endpoint
     * GET /collection-article-relation/health
     */
    async health(ctx: any) {
        ctx.body = {
            success: true,
            plugin: 'collection-article-relation',
            version: '1.0.0',
            message: 'Plugin is healthy and ready',
            timestamp: new Date().toISOString()
        };
    }
});