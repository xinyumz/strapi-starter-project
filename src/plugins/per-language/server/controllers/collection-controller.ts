// src/plugins/per-language/server/controllers/collection-controller.ts

import { Context } from 'koa';

// Add proper typing for the request body
interface RequestWithBody extends Context {
    request: Context['request'] & {
        body?: any;
    };
}

export default ({ strapi }: any) => ({
    /**
     * Get auto-retrieval data for collection language creation
     */
    async getCollectionAutoRetrieval(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;
            const { language } = ctx.query;

            console.log('[CollectionController] Getting auto-retrieval data:', {
                collectionId,
                language
            });

            if (!collectionId || !language) {
                return ctx.badRequest('Collection ID and language are required');
            }

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const autoData = await collectionService.getAutoRetrievalData(
                parseInt(collectionId),
                language as string
            );

            ctx.body = {
                data: autoData,
                message: 'Auto-retrieval data generated successfully'
            };

        } catch (error: any) {
            console.error('[CollectionController] Error getting auto-retrieval data:', error);
            ctx.throw(500, `Failed to get auto-retrieval data: ${error.message}`);
        }
    },

    /**
     * Get collection statistics (article count, language data count)
     */
    async getCollectionStats(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;

            if (!collectionId) {
                return ctx.badRequest('Collection ID is required');
            }

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const articles = await collectionService.getCollectionArticles(parseInt(collectionId));

            ctx.body = {
                data: {
                    collectionId: parseInt(collectionId),
                    articleCount: articles.length,
                    articles: articles.map(article => ({
                        id: article.id,
                        title: article.title
                    }))
                }
            };

        } catch (error: any) {
            console.error('[CollectionController] Error getting collection stats:', error);
            ctx.throw(500, `Failed to get collection stats: ${error.message}`);
        }
    },

    /**
     * Update collection content with auto-retrieval support
     */
    async updateCollectionContent(ctx: RequestWithBody) {
        try {
            const { id: collectionId } = ctx.params;
            const { language, description, useAutoRetrieval = false } = ctx.request.body || {};

            console.log('[CollectionController] Updating collection content:', {
                collectionId,
                language,
                descriptionLength: description?.length || 0,
                descriptionIsNull: description === null,
                descriptionIsUndefined: description === undefined,
                useAutoRetrieval
            });

            // Only require collectionId and language, description can be null/empty
            if (!collectionId || !language) {
                return ctx.badRequest('Collection ID and language are required');
            }

            // Allow description to be null, undefined, or empty string
            const finalDescription = description || null;

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const result = await collectionService.upsertCollectionContent(
                parseInt(collectionId),
                language,
                finalDescription,
                useAutoRetrieval
            );

            console.log('[CollectionController] ✅ Collection content updated successfully');

            // If auto-retrieval was used, get the auto-retrieval data for response
            let autoRetrievalInfo = null;
            if (useAutoRetrieval) {
                try {
                    autoRetrievalInfo = await collectionService.getAutoRetrievalData(
                        parseInt(collectionId),
                        language
                    );
                } catch (error) {
                    console.warn('[CollectionController] Could not get auto-retrieval info for response:', error);
                }
            }

            ctx.body = {
                data: result,
                autoRetrievalInfo,
                message: useAutoRetrieval
                    ? 'Collection content created with auto-retrieval'
                    : 'Collection content updated successfully'
            };
        } catch (error: any) {
            console.error('[CollectionController] Error updating collection content:', error);
            ctx.throw(500, `Failed to update collection content: ${error.message}`);
        }
    },

    /**
     * Get collection content for a specific language
     */
    async getCollectionContent(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;
            const { language } = ctx.query;

            if (!collectionId || !language) {
                return ctx.badRequest('Collection ID and language are required');
            }

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const content = await collectionService.getCollectionContent(
                parseInt(collectionId),
                language as string
            );

            ctx.body = {
                data: content,
                source: 'collection_perlanguages'
            };
        } catch (error: any) {
            console.error('[CollectionController] Error getting collection content:', error);
            ctx.throw(500, `Failed to get collection content: ${error.message}`);
        }
    },

    /**
     * Get all languages for a collection
     */
    async getCollectionLanguages(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;

            if (!collectionId) {
                return ctx.badRequest('Collection ID is required');
            }

            const entityService = strapi.entityService;
            if (!entityService) {
                throw new Error('Entity service is not available');
            }

            const languageContent = await entityService.findMany('plugin::per-language.collection-perlanguage', {
                filters: {
                    collection_id: parseInt(collectionId)
                }
            });

            // Fix the type checking issue
            const dataArray = Array.isArray(languageContent) ? languageContent : [];

            ctx.body = {
                data: dataArray,
                count: dataArray.length
            };
        } catch (error: any) {
            console.error('[CollectionController] Error getting collection languages:', error);
            ctx.throw(500, `Failed to get collection languages: ${error.message}`);
        }
    },

    /**
     * Update collection display skill
     */
    async updateCollectionDisplaySkill(ctx: RequestWithBody) {
        try {
            const { id: languageId } = ctx.params;
            const { display_skill } = ctx.request.body || {};

            if (!languageId) {
                return ctx.badRequest('Language ID is required');
            }

            const entityService = strapi.entityService;
            if (!entityService) {
                throw new Error('Entity service is not available');
            }

            const result = await entityService.update('plugin::per-language.collection-perlanguage', parseInt(languageId), {
                data: {
                    display_skill,
                    updated_at: new Date()
                } as any
            });

            ctx.body = {
                data: result,
                message: 'Collection display skill updated successfully'
            };
        } catch (error: any) {
            console.error('[CollectionController] Error updating collection display skill:', error);
            ctx.throw(500, `Failed to update display skill: ${error.message}`);
        }
    },

    /**
     * Update collection language access tier
     */
    async updateCollectionAccessTier(ctx: RequestWithBody) {
        try {
            const { id: languageId } = ctx.params;
            const { access_tier } = ctx.request.body || {};

            if (!languageId || !access_tier) {
                return ctx.badRequest('Language ID and access tier are required');
            }

            const entityService = strapi.entityService;
            if (!entityService) {
                throw new Error('Entity service is not available');
            }

            const result = await entityService.update('plugin::per-language.collection-perlanguage', parseInt(languageId), {
                data: {
                    access_tier,
                    updated_at: new Date()
                } as any
            });

            ctx.body = {
                data: result,
                message: 'Collection access tier updated successfully'
            };
        } catch (error: any) {
            console.error('[CollectionController] Error updating collection access tier:', error);
            ctx.throw(500, `Failed to update access tier: ${error.message}`);
        }
    },

    /**
     * Update collection language publish status
     */
    async updateCollectionPublishStatus(ctx: RequestWithBody) {
        try {
            const { id: languageId } = ctx.params;
            const { published } = ctx.request.body || {};

            if (!languageId || published === undefined) {
                return ctx.badRequest('Language ID and published status are required');
            }

            const entityService = strapi.entityService;
            if (!entityService) {
                throw new Error('Entity service is not available');
            }

            const result = await entityService.update('plugin::per-language.collection-perlanguage', parseInt(languageId), {
                data: {
                    published: !!published,
                    updated_at: new Date()
                } as any
            });

            ctx.body = {
                data: result,
                message: 'Collection publish status updated successfully'
            };
        } catch (error: any) {
            console.error('[CollectionController] Error updating collection publish status:', error);
            ctx.throw(500, `Failed to update publish status: ${error.message}`);
        }
    },

    /**
     * Delete collection language
     */
    async deleteCollectionLanguage(ctx: Context) {
        try {
            const { id: languageId } = ctx.params;

            if (!languageId) {
                return ctx.badRequest('Language ID is required');
            }

            const entityService = strapi.entityService;
            if (!entityService) {
                throw new Error('Entity service is not available');
            }

            await entityService.delete('plugin::per-language.collection-perlanguage', parseInt(languageId));

            ctx.body = {
                success: true,
                message: 'Collection language deleted successfully'
            };
        } catch (error: any) {
            console.error('[CollectionController] Error deleting collection language:', error);
            ctx.throw(500, `Failed to delete collection language: ${error.message}`);
        }
    }
});