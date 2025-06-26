// src/plugins/collection-article-relation/server/services/collection-autofill-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

// Interface for article data used in auto-fill analysis
interface ArticleData {
    id: number;
    Title: string | null;
    Date: string | null;
    Cover: any | null;
    Category: any | null;
}

// Interface for auto-fill result
interface AutoFillResult {
    scenario: 'no_articles' | 'single_article' | 'multiple_articles';
    message: string;
    suggestedData?: {
        title?: string;
        date?: string;
        cover?: any;
        category?: any;
    };
    conflicts?: {
        categories?: boolean;
        dates?: boolean;
        covers?: boolean;
    };
    articleDetails?: {
        count: number;
        articles: ArticleData[];
    };
}

export default ({ strapi }: { strapi: Strapi }) => {
    // Type guard helper function
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    return {
        /**
         * Analyze articles for collection auto-fill
         */
        async analyzeArticlesForAutoFill(articleIds: number[]): Promise<AutoFillResult> {
            try {
                console.log(`[CollectionAutoFill] Analyzing ${articleIds.length} articles for auto-fill`);

                if (!articleIds || articleIds.length === 0) {
                    return {
                        scenario: 'no_articles',
                        message: 'No articles selected. Please select articles first.',
                        articleDetails: {
                            count: 0,
                            articles: []
                        }
                    };
                }

                // Fetch article data
                const articles = await this.getArticleData(articleIds);

                if (articles.length === 0) {
                    return {
                        scenario: 'no_articles',
                        message: 'Selected articles not found.',
                        articleDetails: {
                            count: 0,
                            articles: []
                        }
                    };
                }

                // Single article scenario
                if (articles.length === 1) {
                    const article = articles[0];
                    return {
                        scenario: 'single_article',
                        message: `Auto-filled from "${article.Title || 'Untitled Article'}". All fields copied exactly.`,
                        suggestedData: {
                            title: article.Title || '',
                            date: article.Date || '',
                            cover: article.Cover || null,
                            category: article.Category || null
                        },
                        conflicts: {
                            categories: false,
                            dates: false,
                            covers: false
                        },
                        articleDetails: {
                            count: articles.length,
                            articles: articles
                        }
                    };
                }

                // Multiple articles scenario
                return this.analyzeMultipleArticles(articles);

            } catch (error) {
                console.error('[CollectionAutoFill] Error analyzing articles:', error);
                throw new ApplicationError(`Failed to analyze articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Get article data by IDs
         */
        async getArticleData(articleIds: number[]): Promise<ArticleData[]> {
            try {
                const entityService = getEntityService();

                const articles = await Promise.all(
                    articleIds.map(async (id) => {
                        try {
                            const article = await entityService.findOne('api::article.article', id, {
                                populate: {
                                    Cover: true,
                                    Category: true
                                }
                            });

                            if (!article) {
                                console.warn(`[CollectionAutoFill] Article ${id} not found`);
                                return null;
                            }

                            return {
                                id: parseInt(article.id.toString()),
                                Title: (article as any).Title || null,
                                Date: (article as any).Date || null,
                                Cover: (article as any).Cover || null,
                                Category: (article as any).Category || null
                            } as ArticleData;
                        } catch (error) {
                            console.warn(`[CollectionAutoFill] Error fetching article ${id}:`, error);
                            return null;
                        }
                    })
                );

                // Filter out null results - now with proper type assertion
                return articles.filter((article): article is ArticleData => article !== null);

            } catch (error) {
                console.error('[CollectionAutoFill] Error getting article data:', error);
                throw new ApplicationError(`Failed to get article data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Analyze multiple articles for auto-fill
         */
        analyzeMultipleArticles(articles: ArticleData[]): AutoFillResult {
            try {
                // Analyze conflicts
                const categories = articles.map(a => a.Category).filter(Boolean);
                const dates = articles.map(a => a.Date).filter(Boolean);
                const covers = articles.map(a => a.Cover).filter(Boolean);

                const hasConflicts = {
                    categories: !this.allSame(categories),
                    dates: dates.length > 1, // Always conflict if multiple dates
                    covers: covers.length > 1  // Always conflict if multiple covers
                };

                // Determine suggested data
                const suggestedData = {
                    title: articles[0].Title || `Collection from ${articles.length} articles`,
                    date: dates.length > 0 ? this.getEarliestDate(dates) : '',
                    cover: covers.length === 1 ? covers[0] : null, // Only if all same
                    category: !hasConflicts.categories && categories.length > 0 ? categories[0] : null
                };

                // Generate message
                let message = `Auto-filled from ${articles.length} articles. `;
                const conflictMessages = [];

                if (hasConflicts.categories) {
                    conflictMessages.push('categories conflict');
                }
                if (hasConflicts.covers) {
                    conflictMessages.push('covers conflict');
                }
                if (hasConflicts.dates) {
                    conflictMessages.push('using earliest date');
                }

                if (conflictMessages.length > 0) {
                    message += `Note: ${conflictMessages.join(', ')}.`;
                } else {
                    message += 'All fields auto-filled successfully.';
                }

                return {
                    scenario: 'multiple_articles',
                    message,
                    suggestedData,
                    conflicts: hasConflicts,
                    articleDetails: {
                        count: articles.length,
                        articles: articles
                    }
                };

            } catch (error) {
                console.error('[CollectionAutoFill] Error analyzing multiple articles:', error);
                throw new ApplicationError(`Failed to analyze multiple articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Helper: Check if all values in array are the same
         */
        allSame(array: any[]): boolean {
            if (array.length <= 1) return true;

            // For objects, compare JSON representation (simple comparison)
            const firstValue = JSON.stringify(array[0]);
            return array.every(value => JSON.stringify(value) === firstValue);
        },

        /**
         * Helper: Get earliest date from array of date strings
         */
        getEarliestDate(dates: string[]): string {
            try {
                const validDates = dates
                    .map(date => new Date(date))
                    .filter(date => !isNaN(date.getTime()));

                if (validDates.length === 0) return '';

                const earliest = new Date(Math.min(...validDates.map(d => d.getTime())));
                return earliest.toISOString().split('T')[0]; // Return YYYY-MM-DD format
            } catch (error) {
                console.warn('[CollectionAutoFill] Error finding earliest date:', error);
                return dates[0] || '';
            }
        },

        /**
         * Quick collection creation from article
         */
        async createQuickCollectionFromArticle(articleId: number): Promise<any> {
            try {
                console.log(`[CollectionAutoFill] Creating quick collection from article ${articleId}`);

                const autoFillResult = await this.analyzeArticlesForAutoFill([articleId]);

                if (autoFillResult.scenario === 'no_articles' || !autoFillResult.suggestedData) {
                    throw new ApplicationError('Article not found or no data available for auto-fill');
                }

                const entityService = getEntityService();

                // Create collection with auto-filled data
                const collection = await entityService.create('api::collection.collection', {
                    data: {
                        Title: autoFillResult.suggestedData.title,
                        Date: autoFillResult.suggestedData.date,
                        Cover: autoFillResult.suggestedData.cover,
                        Category: autoFillResult.suggestedData.category,
                        articles: [articleId], // Pre-link the article
                        publishedAt: null // Start as draft
                    }
                });

                console.log(`[CollectionAutoFill] Quick collection created with ID: ${collection.id}`);

                return {
                    collection,
                    autoFillResult,
                    redirectUrl: `/admin/content-manager/collectionType/api::collection.collection/${collection.id}`
                };

            } catch (error) {
                console.error('[CollectionAutoFill] Error creating quick collection:', error);
                throw new ApplicationError(`Failed to create quick collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
};