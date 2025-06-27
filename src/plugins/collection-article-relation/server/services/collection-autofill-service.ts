// src/plugins/collection-article-relation/server/services/collection-autofill-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

// Interface for article data
interface ArticleData {
    id: number;
    Title: string | null;
    Date: string | null;
    Cover: any | null;
    Category: any | null;
}

export default ({ strapi }: { strapi: Strapi }) => {
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    return {
        /**
         * Get article data by ID
         */
        async getArticleData(articleId: number): Promise<ArticleData | null> {
            try {
                const entityService = getEntityService();

                const article = await entityService.findOne('api::article.article', articleId, {
                    populate: {
                        Cover: true,
                        Category: true
                    }
                });

                if (!article) {
                    console.warn(`[CollectionAutoFill] Article ${articleId} not found`);
                    return null;
                }

                return {
                    id: parseInt(article.id.toString()),
                    Title: (article as any).Title || null,
                    Date: (article as any).Date || null,
                    Cover: (article as any).Cover || null,
                    Category: (article as any).Category || null
                };

            } catch (error) {
                console.error('[CollectionAutoFill] Error getting article data:', error);
                throw new ApplicationError(`Failed to get article data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Check if a collection already exists for this single article
         */
        async checkExistingCollection(articleId: number): Promise<any | null> {
            try {
                const entityService = getEntityService();

                // Find collections that have exactly this one article
                const collections = await entityService.findMany('api::collection.collection', {
                    populate: {
                        articles: true
                    }
                });

                // Find collection with exactly one article that matches this ID
                const existingCollection = collections.find((collection: any) => {
                    const articles = collection.articles || [];
                    return articles.length === 1 && articles[0].id === articleId;
                });

                return existingCollection || null;

            } catch (error) {
                console.error('[CollectionAutoFill] Error checking existing collection:', error);
                return null;
            }
        },

        /**
         * Create quick collection from single article
         */
        async createQuickCollectionFromArticle(articleId: number): Promise<any> {
            try {
                console.log(`[CollectionAutoFill] Creating quick collection from article ${articleId}`);

                // Check for existing single-article collection
                const existingCollection = await this.checkExistingCollection(articleId);
                if (existingCollection) {
                    console.log(`[CollectionAutoFill] Collection already exists for article ${articleId}`);
                    return {
                        collection: existingCollection,
                        isExisting: true,
                        message: `Collection "${existingCollection.Title}" already exists for this article`,
                        redirectUrl: `/admin/content-manager/collectionType/api::collection.collection/${existingCollection.id}`
                    };
                }

                // Get article data
                const article = await this.getArticleData(articleId);
                if (!article) {
                    throw new ApplicationError('Article not found');
                }

                const entityService = getEntityService();

                // Create new collection with auto-filled data
                const collection = await entityService.create('api::collection.collection', {
                    data: {
                        Title: article.Title || `Collection - Article ${articleId}`,
                        Date: article.Date || new Date().toISOString().split('T')[0],
                        Cover: article.Cover || null,
                        Category: article.Category || null,
                        articles: [articleId], // Pre-link the article
                        publishedAt: null // Start as draft
                    }
                });

                console.log(`[CollectionAutoFill] Quick collection created with ID: ${collection.id}`);

                return {
                    collection,
                    isExisting: false,
                    article,
                    message: `Collection "${collection.Title}" created successfully`,
                    redirectUrl: `/admin/content-manager/collectionType/api::collection.collection/${collection.id}`
                };

            } catch (error) {
                console.error('[CollectionAutoFill] Error creating quick collection:', error);
                throw new ApplicationError(`Failed to create quick collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
};