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
     * Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getCollectionAutoRetrieval(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;
            const { language } = ctx.query;

            console.log('[CollectionController] Getting auto-retrieval data:', {
                collectionId,
                language,
                idType: typeof collectionId
            });

            if (!collectionId || !language) {
                return ctx.badRequest('Collection ID and language are required');
            }

            // Proper documentId resolution
            let resolvedCollectionId: number;

            if (typeof collectionId === 'string' && isNaN(parseInt(collectionId))) {
                // This is a documentId (Strapi v5)
                console.log('[CollectionController] Using documentId to find collection:', collectionId);

                const collections = await strapi.documents('api::collection.collection').findMany({
                    filters: {
                        documentId: collectionId
                    }
                });

                if (!collections || collections.length === 0) {
                    return ctx.notFound('Collection not found');
                }

                const collection = collections[0];
                resolvedCollectionId = collection.id;
                console.log('[CollectionController] Resolved documentId to numeric ID:', resolvedCollectionId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedCollectionId = parseInt(collectionId);
                console.log('[CollectionController] Using numeric ID:', resolvedCollectionId);
            }

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const autoData = await collectionService.getAutoRetrievalData(
                resolvedCollectionId,
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
     * Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getCollectionStats(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;

            console.log('[CollectionController] Getting collection stats:', {
                collectionId,
                idType: typeof collectionId
            });

            if (!collectionId) {
                return ctx.badRequest('Collection ID is required');
            }

            // Proper documentId resolution
            let resolvedCollectionId: number;

            if (typeof collectionId === 'string' && isNaN(parseInt(collectionId))) {
                // This is a documentId (Strapi v5)
                console.log('[CollectionController] Using documentId to find collection:', collectionId);

                const collections = await strapi.documents('api::collection.collection').findMany({
                    filters: {
                        documentId: collectionId
                    }
                });

                if (!collections || collections.length === 0) {
                    return ctx.notFound('Collection not found');
                }

                const collection = collections[0];
                resolvedCollectionId = collection.id;
                console.log('[CollectionController] Resolved documentId to numeric ID:', resolvedCollectionId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedCollectionId = parseInt(collectionId);
                console.log('[CollectionController] Using numeric ID:', resolvedCollectionId);
            }

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const articles = await collectionService.getCollectionArticles(resolvedCollectionId);

            console.log('[CollectionController] ✅ Collection stats retrieved:', {
                articleCount: articles.length
            });

            ctx.body = {
                data: {
                    collectionId: resolvedCollectionId,
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
     * Support both documentId (v5) and numeric ID (v4 compatibility)
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
                useAutoRetrieval,
                idType: typeof collectionId
            });

            // Only require collectionId and language, description can be null/empty
            if (!collectionId || !language) {
                return ctx.badRequest('Collection ID and language are required');
            }

            // Proper documentId resolution
            let resolvedCollectionId: number;

            if (typeof collectionId === 'string' && isNaN(parseInt(collectionId))) {
                // This is a documentId (Strapi v5)
                console.log('[CollectionController] Using documentId to find collection:', collectionId);

                const collections = await strapi.documents('api::collection.collection').findMany({
                    filters: {
                        documentId: collectionId
                    }
                });

                if (!collections || collections.length === 0) {
                    return ctx.notFound('Collection not found');
                }

                const collection = collections[0];
                resolvedCollectionId = collection.id;
                console.log('[CollectionController] Resolved documentId to numeric ID:', resolvedCollectionId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedCollectionId = parseInt(collectionId);
                console.log('[CollectionController] Using numeric ID:', resolvedCollectionId);
            }

            // Allow description to be null, undefined, or empty string
            const finalDescription = description || null;

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const result = await collectionService.upsertCollectionContent(
                resolvedCollectionId,
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
                        resolvedCollectionId,
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
     * Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getCollectionContent(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;
            const { language } = ctx.query;

            console.log('[CollectionController] Getting collection content:', {
                collectionId,
                language,
                idType: typeof collectionId
            });

            if (!collectionId || !language) {
                return ctx.badRequest('Collection ID and language are required');
            }

            // Proper documentId resolution
            let resolvedCollectionId: number;

            if (typeof collectionId === 'string' && isNaN(parseInt(collectionId))) {
                // This is a documentId (Strapi v5) 
                console.log('[CollectionController] Using documentId to find collection:', collectionId);

                const collections = await strapi.documents('api::collection.collection').findMany({
                    filters: {
                        documentId: collectionId
                    }
                });

                if (!collections || collections.length === 0) {
                    return ctx.notFound('Collection not found');
                }

                const collection = collections[0];
                resolvedCollectionId = collection.id;
                console.log('[CollectionController] Resolved documentId to numeric ID:', resolvedCollectionId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedCollectionId = parseInt(collectionId);
            }

            const collectionService = strapi.plugin('per-language').service('collectionService');
            const content = await collectionService.getCollectionContent(
                resolvedCollectionId,
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
     * Support both documentId (v5) and numeric ID (v4 compatibility)
     */
    async getCollectionLanguages(ctx: Context) {
        try {
            const { id: collectionId } = ctx.params;

            console.log('[CollectionController] Getting collection languages:', {
                collectionId,
                idType: typeof collectionId
            });

            if (!collectionId) {
                return ctx.badRequest('Collection ID is required');
            }

            // Proper documentId resolution
            let resolvedCollectionId: number;

            if (typeof collectionId === 'string' && isNaN(parseInt(collectionId))) {
                // This is a documentId (Strapi v5)
                console.log('[CollectionController] Using documentId to find collection:', collectionId);

                const collections = await strapi.documents('api::collection.collection').findMany({
                    filters: {
                        documentId: collectionId
                    }
                });

                if (!collections || collections.length === 0) {
                    return ctx.notFound('Collection not found');
                }

                const collection = collections[0];
                resolvedCollectionId = collection.id;
                console.log('[CollectionController] Resolved documentId to numeric ID:', resolvedCollectionId);
            } else {
                // This is a numeric ID (v4 compatibility)
                resolvedCollectionId = parseInt(collectionId);
            }

            // Use Document Service API instead of Entity Service API
            const languageContent = await strapi.documents('plugin::per-language.collection-perlanguage').findMany({
                filters: {
                    collection_id: resolvedCollectionId
                }
            });

            const dataArray = Array.isArray(languageContent) ? languageContent : [];

            console.log('[CollectionController] ✅ Collection languages retrieved:', {
                count: dataArray.length,
                languages: dataArray.map(l => l.language)
            });

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
     * Use Document Service API instead of Entity Service API
     */
    async updateCollectionDisplaySkill(ctx: RequestWithBody) {
        try {
            const { id: languageId } = ctx.params;
            const { display_skill } = ctx.request.body || {};

            if (!languageId) {
                return ctx.badRequest('Language ID is required');
            }

            // Use Document Service API
            const existingContent = await strapi.documents('plugin::per-language.collection-perlanguage').findFirst({
                filters: { id: parseInt(languageId) }
            });

            if (!existingContent) {
                return ctx.notFound('Collection language content not found');
            }

            const result = await strapi.documents('plugin::per-language.collection-perlanguage').update({
                documentId: existingContent.documentId,
                data: {
                    display_skill,
                    updated_at: new Date()
                }
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
     * Use Document Service API instead of Entity Service API
     */
    async updateCollectionAccessTier(ctx: RequestWithBody) {
        try {
            const { id: languageId } = ctx.params;
            const { access_tier } = ctx.request.body || {};

            if (!languageId || !access_tier) {
                return ctx.badRequest('Language ID and access tier are required');
            }

            // Use Document Service API
            const existingContent = await strapi.documents('plugin::per-language.collection-perlanguage').findFirst({
                filters: { id: parseInt(languageId) }
            });

            if (!existingContent) {
                return ctx.notFound('Collection language content not found');
            }

            const result = await strapi.documents('plugin::per-language.collection-perlanguage').update({
                documentId: existingContent.documentId,
                data: {
                    access_tier,
                    updated_at: new Date()
                }
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
     * Use Document Service API instead of Entity Service API
     */
    async updateCollectionPublishStatus(ctx: RequestWithBody) {
        try {
            const { id: languageId } = ctx.params;
            const { published } = ctx.request.body || {};

            if (!languageId || published === undefined) {
                return ctx.badRequest('Language ID and published status are required');
            }

            // Use Document Service API
            const existingContent = await strapi.documents('plugin::per-language.collection-perlanguage').findFirst({
                filters: { id: parseInt(languageId) }
            });

            if (!existingContent) {
                return ctx.notFound('Collection language content not found');
            }

            const result = await strapi.documents('plugin::per-language.collection-perlanguage').update({
                documentId: existingContent.documentId,
                data: {
                    published: !!published,
                    updated_at: new Date()
                }
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
     * Use Document Service API instead of Entity Service API
     */
    async deleteCollectionLanguage(ctx: Context) {
        try {
            const { id: languageId } = ctx.params;

            if (!languageId) {
                return ctx.badRequest('Language ID is required');
            }

            // Use Document Service API
            const existingContent = await strapi.documents('plugin::per-language.collection-perlanguage').findFirst({
                filters: { id: parseInt(languageId) }
            });

            if (!existingContent) {
                return ctx.notFound('Collection language content not found');
            }

            await strapi.documents('plugin::per-language.collection-perlanguage').delete({
                documentId: existingContent.documentId
            });

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