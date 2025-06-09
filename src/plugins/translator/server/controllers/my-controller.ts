// src/plugins/translator/server/controllers/my-controller.ts

import { Strapi } from '@strapi/strapi';


console.log('[My Controller] Loading my-controller...');

export default ({ strapi }: { strapi: Strapi }) => {

  console.log('[My Controller] Controller function called');

  /**
   * Original index method - keep this
   */
  return {
    index(ctx) {
      console.log('[My Controller] index method called');
      ctx.body = strapi
        .plugin('translator')
        .service('myService')
        .getWelcomeMessage();
    },
    /**
     * Test sync functionality directly
     */
    async testSync(ctx) {
      console.log('[My Controller] testSync method called');
      try {
        const { articleId, language, text } = ctx.request.query;

        if (!articleId || !language || !text) {
          return ctx.badRequest('articleId, language, and text are required query parameters');
        }

        console.log(`[testSync] Testing sync with:`, { articleId, language, text });

        // Try to use the per-language service directly
        const perLanguagePlugin = strapi.plugin('per-language');
        if (!perLanguagePlugin) {
          return ctx.badRequest('per-language plugin not found');
        }

        const contentService = perLanguagePlugin.service('contentService');
        if (!contentService) {
          return ctx.badRequest('contentService not found in per-language plugin');
        }

        // Call the service method directly
        const result = await contentService.upsertLanguageContent(
          parseInt(articleId as string),
          language as string,
          text as string
        );

        ctx.body = {
          success: true,
          message: `Successfully synced article ${articleId} to per_language table`,
          result
        };
      } catch (error) {
        console.error('[testSync] Error:', error);
        ctx.throw(500, `Error: ${error.message}`);
      }
    },

    /**
     * Get article data and try to sync it
     */
    async syncExistingArticle(ctx) {
      console.log('[My Controller] syncExistingArticle method called');
      try {
        const { articleId } = ctx.request.query;

        if (!articleId) {
          return ctx.badRequest('articleId is required');
        }

        console.log(`[syncExistingArticle] Syncing article ${articleId}`);

        // Fetch the article data
        const article = await strapi.entityService?.findOne('api::article.article', parseInt(articleId as string), {});

        if (!article) {
          return ctx.notFound(`Article ${articleId} not found`);
        }

        if (!(article as any).Translation || (article as any).translation) {
          return ctx.badRequest(`Article ${articleId} has no translation`);
        }

        console.log(`[syncExistingArticle] Article found:`, {
          id: article.id,
          hasTranslation: !!(article as any).Translation || (article as any).translation,
          translationLength: (article as any).Translation || (article as any).translation.length
        });

        // Try to use the per-language service directly
        const perLanguagePlugin = strapi.plugin('per-language');
        if (!perLanguagePlugin) {
          return ctx.badRequest('per-language plugin not found');
        }

        const contentService = perLanguagePlugin.service('contentService');
        if (!contentService) {
          return ctx.badRequest('contentService not found in per-language plugin');
        }

        // Call the service method directly with zh as the language
        const result = await contentService.upsertLanguageContent(
          article.id,
          'zh',
          (article as any).Translation || (article as any).translation
        );

        ctx.body = {
          success: true,
          message: `Successfully synced article ${articleId} to per_language table`,
          result
        };
      } catch (error) {
        console.error('[syncExistingArticle] Error:', error);
        ctx.throw(500, `Error: ${error.message}`);
      }
    }
  }
};

console.log('[My Controller] Controller exported');