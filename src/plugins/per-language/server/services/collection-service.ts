// src/plugins/per-language/server/services/collection-service.ts


import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

// Auto-retrieval interfaces
interface CollectionArticleData {
    id: number;
    title?: string;
    articlePerLanguageData?: {
        id: number;
        display_skill?: string;
        access_tier?: string;
        published?: boolean;
    };
}

interface AutoRetrievalData {
    scenario: 'no_articles' | 'no_language_data' | 'single_article' | 'multiple_articles';
    message: string;
    suggestedData?: {
        description?: string;
        display_skill?: string;
        access_tier?: string;
    };
    collectionStats?: {
        articleCount: number;
        hasLanguageData: boolean;
        languageDataCount: number;
    };
    articleDetails?: CollectionArticleData[];
}

export default ({ strapi }: any) => {
    // Type guard helper function
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    return {
        /**
         * Collection auto-retrieval functionality
         */
        async getAutoRetrievalData(collectionId: number, languageCode: string): Promise<AutoRetrievalData> {
            try {
                console.log(`[CollectionService] Getting auto-retrieval data for collection ${collectionId}, language ${languageCode}`);

                // Step 1: Get collection articles
                const articles = await this.getCollectionArticles(collectionId);

                if (!articles || articles.length === 0) {
                    return {
                        scenario: 'no_articles',
                        message: 'No articles found in this collection. Please add articles first.',
                        collectionStats: {
                            articleCount: 0,
                            hasLanguageData: false,
                            languageDataCount: 0
                        }
                    };
                }

                // Step 2: Get per-language data for these articles
                const articlesWithLanguageData = await this.getArticlesLanguageData(articles, languageCode);
                const articlesWithData = articlesWithLanguageData.filter(a => a.articlePerLanguageData);

                if (articlesWithData.length === 0) {
                    return {
                        scenario: 'no_language_data',
                        message: `No ${languageCode} translations found for articles in this collection. Please translate articles to ${languageCode} first.`,
                        collectionStats: {
                            articleCount: articles.length,
                            hasLanguageData: false,
                            languageDataCount: 0
                        },
                        articleDetails: articlesWithLanguageData
                    };
                }

                // Step 3: Single vs Multiple article logic
                if (articlesWithData.length === 1) {
                    const singleArticle = articlesWithData[0];
                    const languageData = singleArticle.articlePerLanguageData!;

                    return {
                        scenario: 'single_article',
                        message: `Auto-populated from "${singleArticle.title || 'Article ' + singleArticle.id}". You can modify these values as needed.`,
                        suggestedData: {
                            access_tier: languageData.access_tier || 'Free',
                            display_skill: languageData.display_skill || '',
                            description: null // Collections can have their own description
                        },
                        collectionStats: {
                            articleCount: articles.length,
                            hasLanguageData: true,
                            languageDataCount: articlesWithData.length
                        },
                        articleDetails: articlesWithLanguageData
                    };
                } else {
                    // Multiple articles - get lowest HSK level
                    const lowestHSK = this.getLowestHSKLevel(articlesWithData);

                    return {
                        scenario: 'multiple_articles',
                        message: `Auto-populated for ${articlesWithData.length} articles. Access tier set to "Free" and skill level to lowest found (${lowestHSK || 'none'}).`,
                        suggestedData: {
                            access_tier: 'Free',
                            display_skill: lowestHSK || '',
                            description: null
                        },
                        collectionStats: {
                            articleCount: articles.length,
                            hasLanguageData: true,
                            languageDataCount: articlesWithData.length
                        },
                        articleDetails: articlesWithLanguageData
                    };
                }

            } catch (error) {
                console.error('[CollectionService] Error in getAutoRetrievalData:', error);
                throw new ApplicationError(`Failed to get auto-retrieval data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Get all articles linked to a collection
         */
        async getCollectionArticles(collectionId: number): Promise<CollectionArticleData[]> {
            try {
                const entityService = getEntityService();

                // Get collection with populated articles
                const collection = await entityService.findOne('api::collection.collection', collectionId, {
                    populate: {
                        articles: true
                    }
                });

                if (!collection || !(collection as any).articles) {
                    return [];
                }

                const articles = (collection as any).articles;
                return articles.map((article: any) => ({
                    id: article.id,
                    title: article.Title || article.title || `Article ${article.id}`
                }));

            } catch (error) {
                console.error('[CollectionService] Error getting collection articles:', error);
                throw new ApplicationError(`Failed to get collection articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Get language data for multiple articles
         */
        async getArticlesLanguageData(articles: CollectionArticleData[], languageCode: string): Promise<CollectionArticleData[]> {
            try {
                const entityService = getEntityService();

                const articlesWithData = await Promise.all(
                    articles.map(async (article) => {
                        const languageData = await entityService.findMany('plugin::per-language.article-perlanguage', {
                            filters: {
                                article_id: article.id,
                                language: languageCode
                            }
                        });

                        return {
                            ...article,
                            articlePerLanguageData: Array.isArray(languageData) && languageData.length > 0
                                ? {
                                    id: parseInt(languageData[0].id.toString()),
                                    display_skill: (languageData[0] as any).display_skill,
                                    access_tier: (languageData[0] as any).access_tier,
                                    published: (languageData[0] as any).published
                                }
                                : undefined
                        };
                    })
                );

                return articlesWithData;
            } catch (error) {
                console.error('[CollectionService] Error getting articles language data:', error);
                throw new ApplicationError(`Failed to get articles language data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },

        /**
         * Calculate lowest HSK level from article data
         */
        getLowestHSKLevel(articlesWithData: CollectionArticleData[]): string | null {
            try {
                const hskLevels: number[] = [];

                for (const article of articlesWithData) {
                    const displaySkill = article.articlePerLanguageData?.display_skill;
                    if (displaySkill && displaySkill.startsWith('HSK ')) {
                        const hskMatch = displaySkill.match(/HSK (\d+)/);
                        if (hskMatch) {
                            const level = parseInt(hskMatch[1]);
                            if (level >= 1 && level <= 10) {
                                hskLevels.push(level);
                            }
                        }
                    }
                }

                if (hskLevels.length === 0) {
                    return null;
                }

                const lowestLevel = Math.min(...hskLevels);
                return `HSK ${lowestLevel}`;

            } catch (error) {
                console.log('[CollectionService] Error calculating lowest HSK level:', error);
                return null;
            }
        },

        /**
         * Collection content upsert with auto-retrieval support
         */
        async upsertCollectionContent(
            collectionId: number,
            languageCode: string,
            description: string | null,
            useAutoRetrieval: boolean = false
        ): Promise<any> {
            try {
                const entityService = getEntityService();

                let finalData: any = {
                    description: description === '' ? null : description
                };

                // Apply auto-retrieval if requested
                if (useAutoRetrieval) {
                    console.log(`[CollectionService] Applying auto-retrieval for collection ${collectionId}, language ${languageCode}`);

                    const autoData = await this.getAutoRetrievalData(collectionId, languageCode);

                    if (autoData.suggestedData) {
                        finalData = {
                            ...finalData,
                            access_tier: autoData.suggestedData.access_tier,
                            display_skill: autoData.suggestedData.display_skill
                        };

                        console.log(`[CollectionService] Auto-retrieval applied:`, {
                            scenario: autoData.scenario,
                            access_tier: autoData.suggestedData.access_tier,
                            display_skill: autoData.suggestedData.display_skill
                        });
                    }
                }

                // Check for existing content
                const existingContent = await entityService.findMany('plugin::per-language.collection-perlanguage', {
                    filters: {
                        collection_id: collectionId,
                        language: languageCode
                    }
                });

                if (existingContent && Array.isArray(existingContent) && existingContent.length > 0) {
                    // Update existing content
                    const updated = await entityService.update(
                        'plugin::per-language.collection-perlanguage',
                        existingContent[0].id,
                        {
                            data: {
                                ...finalData,
                                updated_at: new Date()
                            } as any
                        }
                    );
                    return updated;
                } else {
                    // Create new content
                    const created = await entityService.create('plugin::per-language.collection-perlanguage', {
                        data: {
                            collection_id: collectionId,
                            language: languageCode,
                            published: false,
                            ...finalData
                        } as any
                    });
                    return created;
                }
            } catch (error) {
                console.error('Error upserting collection content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to upsert collection content: ${errorMessage}`);
            }
        },

        /**
         * Get collection content for a specific language
         */
        async getCollectionContent(collectionId: number, languageCode: string): Promise<any> {
            try {
                const entityService = getEntityService();
                const existingContent = await entityService.findMany('plugin::per-language.collection-perlanguage', {
                    filters: {
                        collection_id: collectionId,
                        language: languageCode
                    }
                });

                if (!existingContent || (Array.isArray(existingContent) && existingContent.length === 0)) {
                    return null;
                }

                return existingContent[0];
            } catch (error) {
                console.error(`[CollectionService] Error getting collection content:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get collection content: ${errorMessage}`);
            }
        }
    };
};