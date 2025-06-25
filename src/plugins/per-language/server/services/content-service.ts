// src/plugins/per-language/server/services/content-service.ts

import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { PerLanguageContentType } from '../types';

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
         * Create or update content for a specific language
         */
        async upsertLanguageContent(
            articleId: number,
            languageCode: string,
            content: string
        ): Promise<PerLanguageContentType> {
            try {
                const entityService = getEntityService();
                const existingContent = await entityService.findMany('plugin::per-language.article-perlanguage', {
                    filters: {
                        article_id: articleId,
                        language: languageCode
                    }
                });

                if (existingContent && Array.isArray(existingContent) && existingContent.length > 0) {
                    // Update existing content
                    const updated = await entityService.update(
                        'plugin::per-language.article-perlanguage',
                        existingContent[0].id,
                        {
                            data: {
                                per_language_text: content,
                                updated_at: new Date()
                            } as any
                        }
                    );

                    return updated as PerLanguageContentType;
                } else {
                    // Create new content
                    const created = await entityService.create('plugin::per-language.article-perlanguage', {
                        data: {
                            article_id: articleId,
                            language: languageCode,
                            per_language_text: content,
                            published: false
                        } as any
                    });

                    return created as PerLanguageContentType;
                }
            } catch (error) {
                console.error('Error upserting language content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to upsert language content: ${errorMessage}`);
            }
        },

        /**
         * Get content for a specific language
         */
        async getLanguageContent(articleId: number, languageCode: string): Promise<any> {
            try {
                const entityService = getEntityService();
                const existingContent = await entityService.findMany('plugin::per-language.article-perlanguage', {
                    filters: {
                        article_id: articleId,
                        language: languageCode
                    }
                });

                if (!existingContent || (Array.isArray(existingContent) && existingContent.length === 0)) {
                    return null;
                }

                return existingContent[0];
            } catch (error) {
                console.error(`[ContentService] Error getting language content:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get language content: ${errorMessage}`);
            }
        },

        /**
            Collection auto-retrieval functionality
        */
        async getAutoRetrievalData(collectionId: number, languageCode: string): Promise<AutoRetrievalData> {
            try {
                console.log(`[ContentService] Getting auto-retrieval data for collection ${collectionId}, language ${languageCode}`);

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
                console.error('[ContentService] Error in getAutoRetrievalData:', error);
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
                console.error('[ContentService] Error getting collection articles:', error);
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
                console.error('[ContentService] Error getting articles language data:', error);
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
                console.log('[ContentService] Error calculating lowest HSK level:', error);
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
                    console.log(`[ContentService] Applying auto-retrieval for collection ${collectionId}, language ${languageCode}`);

                    const autoData = await this.getAutoRetrievalData(collectionId, languageCode);

                    if (autoData.suggestedData) {
                        finalData = {
                            ...finalData,
                            access_tier: autoData.suggestedData.access_tier,
                            display_skill: autoData.suggestedData.display_skill
                        };

                        console.log(`[ContentService] Auto-retrieval applied:`, {
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
         * Original collection content upsert (backward compatibility)
         */
        async upsertCollectionContentLegacy(
            collectionId: number,
            languageCode: string,
            description: string | null
        ): Promise<any> {
            try {
                const entityService = getEntityService();
                const existingContent = await entityService.findMany('plugin::per-language.collection-perlanguage', {
                    filters: {
                        collection_id: collectionId,
                        language: languageCode
                    }
                });

                // Process description
                const finalDescription = description === '' ? null : description;

                if (existingContent && Array.isArray(existingContent) && existingContent.length > 0) {
                    // Update existing content
                    const updated = await entityService.update(
                        'plugin::per-language.collection-perlanguage',
                        existingContent[0].id,
                        {
                            data: {
                                description: finalDescription,
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
                            description: finalDescription,
                            published: false
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
         * Update processed data for a language content
         */
        async updateProcessedData(
            contentId: number,
            processedData: any,
            displaySkill?: string
        ): Promise<PerLanguageContentType> {
            try {
                const entityService = getEntityService();
                const updateData: any = {
                    processed_data: processedData,
                    updated_at: new Date()
                };

                if (displaySkill) {
                    updateData.display_skill = displaySkill;
                }

                const updated = await entityService.update(
                    'plugin::per-language.article-perlanguage',
                    contentId,
                    { data: updateData as any }
                );

                return updated as PerLanguageContentType;
            } catch (error) {
                console.error('Error updating processed data:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to update processed data: ${errorMessage}`);
            }
        },

        /**
         * Set the publish status of language content
         */
        async setPublishStatus(contentId: number, published: boolean): Promise<PerLanguageContentType> {
            try {
                const entityService = getEntityService();
                const updated = await entityService.update(
                    'plugin::per-language.article-perlanguage',
                    contentId,
                    {
                        data: {
                            published,
                            updated_at: new Date()
                        } as any
                    }
                );

                return updated as PerLanguageContentType;
            } catch (error) {
                console.error('Error setting publish status:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to set publish status: ${errorMessage}`);
            }
        },

        /**
         * Delete language content with manual cascading delete
         */
        async deleteLanguageContent(contentId: number): Promise<void> {
            try {
                console.log(`[ContentService] Starting enhanced delete for content ID: ${contentId}`);

                const entityService = getEntityService();

                // Get the language content first for logging and verification
                const languageContent = await entityService.findOne('plugin::per-language.article-perlanguage', contentId);

                if (!languageContent) {
                    throw new ApplicationError(`Language content with ID ${contentId} not found`);
                }

                const { article_id: articleId, language } = languageContent as any;
                console.log(`[ContentService] About to delete: Article ${articleId}, Language ${language}`);

                // Get statistics before deletion for logging
                const stats = await this.getLanguageContentStatistics(contentId);
                console.log(`[ContentService] Pre-deletion stats:`, stats);

                // MANUAL CASCADING DELETE - Since foreign keys aren't working properly
                await this.performManualCascadingDelete(contentId);

                // Finally, delete the article_perlanguages record
                await entityService.delete('plugin::per-language.article-perlanguage', contentId);  // UPDATED

                console.log(`[ContentService] ✅ Successfully completed manual cascading delete:`, {
                    contentId,
                    language: stats.language,
                    deletedSentences: stats.sentenceCount,
                    deletedGrammarRules: stats.grammarRuleCount,
                    deletedTranslations: stats.translationCount,
                    message: 'All related data manually deleted'
                });

            } catch (error) {
                console.error('[ContentService] Error deleting language content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to delete language content: ${errorMessage}`);
            }
        },

        /**
         * Manual cascading delete implementation (works with database directly)
         */
        async performManualCascadingDelete(perLanguageId: number): Promise<void> {
            try {
                console.log(`[ContentService] Starting manual cascading delete for per_language_id: ${perLanguageId}`);

                // Get access to the database for raw queries
                if (!strapi.db) {
                    console.warn('[ContentService] Database connection not available');
                    return;
                }

                const db = strapi.db;

                // Step 1: Find all sentences linked to this per_language_id
                console.log(`[ContentService] Finding sentences for per_language_id: ${perLanguageId}`);

                // Use raw query to find sentences
                const sentences = await db.connection.raw(`
                    SELECT id FROM article_sentences WHERE per_language_id = ?
                `, [perLanguageId]);

                // Handle different MySQL result formats
                const sentenceRows = sentences[0] || sentences;
                const sentenceIds = sentenceRows.map((row: any) => row.id);

                console.log(`[ContentService] Found ${sentenceIds.length} sentences to delete: [${sentenceIds.join(', ')}]`);

                if (sentenceIds.length === 0) {
                    console.log(`[ContentService] No sentences found, skipping sentence cleanup`);
                    return;
                }

                // Step 2: Delete sentence translations
                console.log(`[ContentService] Deleting sentence translations...`);
                const deletedTranslations = await db.connection.raw(`
                    DELETE FROM sentence_translations WHERE sentence_id IN (${sentenceIds.map(() => '?').join(',')})
                `, sentenceIds);
                console.log(`[ContentService] Deleted translations:`, deletedTranslations[0]?.affectedRows || 0);

                // Step 3: Delete sentence grammar rules
                console.log(`[ContentService] Deleting sentence grammar rules...`);
                const deletedRules = await db.connection.raw(`
                    DELETE FROM sentence_grammar_rules WHERE sentence_id IN (${sentenceIds.map(() => '?').join(',')})
                `, sentenceIds);
                console.log(`[ContentService] Deleted grammar rules:`, deletedRules[0]?.affectedRows || 0);

                // Step 4: Delete sentences themselves
                console.log(`[ContentService] Deleting sentences...`);
                const deletedSentences = await db.connection.raw(`
                    DELETE FROM article_sentences WHERE per_language_id = ?
                `, [perLanguageId]);
                console.log(`[ContentService] Deleted sentences:`, deletedSentences[0]?.affectedRows || 0);

                console.log(`[ContentService] ✅ Manual cascading delete completed successfully`);

            } catch (error) {
                console.error('[ContentService] Error in manual cascading delete:', error);
                throw new ApplicationError(`Manual cascading delete failed: ${error.message}`);
            }
        },

        /**
         * Get statistics about language content before deletion
         */
        async getLanguageContentStatistics(contentId: number): Promise<{
            articleId: number;
            language: string;
            contentLength: number;
            sentenceCount: number;
            grammarRuleCount: number;
            translationCount: number;
            uniqueTranslationLanguages: string[];
        }> {
            try {
                const entityService = getEntityService();

                // Get the article-perlanguage record
                const languageContent = await entityService.findOne('plugin::per-language.article-perlanguage', contentId);
                if (!languageContent) {
                    throw new ApplicationError(`Language content with ID ${contentId} not found`);
                }

                const { article_id: articleId, language, per_language_text } = languageContent as any;

                // Use raw database queries to get accurate counts
                const db = strapi.db;
                if (!db) {
                    return {
                        articleId,
                        language,
                        contentLength: per_language_text?.length || 0,
                        sentenceCount: 0,
                        grammarRuleCount: 0,
                        translationCount: 0,
                        uniqueTranslationLanguages: []
                    };
                }

                // Count sentences
                const sentenceResult = await db.connection.raw(`
                    SELECT COUNT(*) as count FROM article_sentences WHERE per_language_id = ?
                `, [contentId]);
                const sentenceCount = sentenceResult[0]?.[0]?.count || 0;

                // Count grammar rules
                const grammarResult = await db.connection.raw(`
                    SELECT COUNT(*) as count 
                    FROM sentence_grammar_rules sgr
                    JOIN article_sentences s ON sgr.sentence_id = s.id
                    WHERE s.per_language_id = ?
                `, [contentId]);
                const grammarRuleCount = grammarResult[0]?.[0]?.count || 0;

                // Count translations and get unique languages
                const translationResult = await db.connection.raw(`
                    SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT st.translation_language) as languages
                    FROM sentence_translations st
                    JOIN article_sentences s ON st.sentence_id = s.id  
                    WHERE s.per_language_id = ?
                `, [contentId]);

                const translationCount = translationResult[0]?.[0]?.count || 0;
                const languagesString = translationResult[0]?.[0]?.languages || '';
                const uniqueTranslationLanguages = languagesString ? languagesString.split(',') : [];

                return {
                    articleId,
                    language,
                    contentLength: per_language_text?.length || 0,
                    sentenceCount: parseInt(sentenceCount.toString()),
                    grammarRuleCount: parseInt(grammarRuleCount.toString()),
                    translationCount: parseInt(translationCount.toString()),
                    uniqueTranslationLanguages
                };

            } catch (error) {
                console.error('[ContentService] Error getting language content statistics:', error);
                throw error;
            }
        },

        /**
         * Update complete processed data
         */
        async updateCompleteProcessedData(
            contentId: number,
            processedData: any,
            difficultyData: any,
            displaySkill?: string
        ): Promise<PerLanguageContentType> {
            try {
                const entityService = getEntityService();

                const updateData: any = {
                    processed_data: processedData,
                    difficulty_data: difficultyData,
                    updated_at: new Date()
                };

                if (displaySkill) {
                    updateData.display_skill = displaySkill;
                }

                const updated = await entityService.update(
                    'plugin::per-language.article-perlanguage',
                    contentId,
                    { data: updateData }
                );

                return updated as PerLanguageContentType;
            } catch (error) {
                console.error('Error in updateCompleteProcessedData:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to update complete processed data: ${errorMessage}`);
            }
        },

        /**
         * Get processed data
         */
        async getProcessedData(
            articleId: number,
            language: string = 'zh'
        ): Promise<{ data: any, processedData: any, difficultyData: any, displaySkill: string }> {
            try {
                const perLanguageContent = await this.getLanguageContent(articleId, language);

                if (!perLanguageContent) {
                    throw new ApplicationError(`No content found for article ${articleId} in language ${language}`);
                }

                return {
                    data: perLanguageContent.processed_data || {},
                    processedData: perLanguageContent.processed_data || {},
                    difficultyData: perLanguageContent.difficulty_data || {},
                    displaySkill: perLanguageContent.display_skill || ''
                };
            } catch (error) {
                console.error('Error getting processed data:', error);
                throw error;
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
                console.error(`[ContentService] Error getting collection content:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get collection content: ${errorMessage}`);
            }
        },

        /**
         * Update access tier for language content
         */
        async updateAccessTier(contentId: number, accessTier: string): Promise<PerLanguageContentType> {
            try {
                const entityService = getEntityService();
                const updated = await entityService.update(
                    'plugin::per-language.article-perlanguage',  // UPDATED
                    contentId,
                    {
                        data: {
                            access_tier: accessTier,
                            updated_at: new Date()
                        } as any
                    }
                );

                return updated as PerLanguageContentType;
            } catch (error) {
                console.error('Error updating access tier:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to update access tier: ${errorMessage}`);
            }
        }
    };
};