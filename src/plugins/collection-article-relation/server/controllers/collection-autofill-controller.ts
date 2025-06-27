// src/plugins/collection-article-relation/server/controllers/collection-autofill-controller.ts

import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
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

            console.log(`[CollectionController] Creating collection from article ${articleId}`);

            // Get auto-fill service
            const autoFillService = strapi.plugin('collection-article-relation').service('collectionAutofill');

            // Create or find existing collection
            const result = await autoFillService.createQuickCollectionFromArticle(articleId);

            ctx.body = {
                success: true,
                data: result,
                message: result.message
            };

        } catch (error) {
            console.error('[CollectionController] Error in quickCreateCollection:', error);
            ctx.internalServerError(`Collection creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            version: '2.0.0',
            message: 'Plugin is healthy and ready for single-article collections',
            timestamp: new Date().toISOString()
        };
    }
});