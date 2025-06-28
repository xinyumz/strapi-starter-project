// src/plugins/per-language/server/services/article-service.ts


import { errors } from '@strapi/utils';
import { PerLanguageContentType } from '../types';

const { ApplicationError } = errors;

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
                console.error(`[ArticleService] Error getting language content:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to get language content: ${errorMessage}`);
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
                console.log(`[ArticleService] Starting delete for content ID: ${contentId}`);

                const entityService = getEntityService();

                // Get the language content first for logging and verification
                const languageContent = await entityService.findOne('plugin::per-language.article-perlanguage', contentId);

                if (!languageContent) {
                    throw new ApplicationError(`Language content with ID ${contentId} not found`);
                }

                const { article_id: articleId, language } = languageContent as any;
                console.log(`[ArticleService] About to delete: Article ${articleId}, Language ${language}`);

                // Get statistics before deletion for logging
                const stats = await this.getLanguageContentStatistics(contentId);
                console.log(`[ArticleService] Pre-deletion stats:`, stats);

                // MANUAL CASCADING DELETE - Since foreign keys aren't working properly
                await this.performManualCascadingDelete(contentId);

                // Finally, delete the article_perlanguages record
                await entityService.delete('plugin::per-language.article-perlanguage', contentId);

                console.log(`[ArticleService] ✅ Successfully completed manual cascading delete:`, {
                    contentId,
                    language: stats.language,
                    deletedSentences: stats.sentenceCount,
                    deletedGrammarRules: stats.grammarRuleCount,
                    deletedTranslations: stats.translationCount,
                    message: 'All related data manually deleted'
                });

            } catch (error) {
                console.error('[ArticleService] Error deleting language content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to delete language content: ${errorMessage}`);
            }
        },

        /**
         * Manual cascading delete implementation (works with database directly)
         */
        async performManualCascadingDelete(perLanguageId: number): Promise<void> {
            try {
                console.log(`[ArticleService] Starting manual cascading delete for per_language_id: ${perLanguageId}`);

                // Get access to the database for raw queries
                if (!strapi.db) {
                    console.warn('[ArticleService] Database connection not available');
                    return;
                }

                const db = strapi.db;

                // Step 1: Find all sentences linked to this per_language_id
                console.log(`[ArticleService] Finding sentences for per_language_id: ${perLanguageId}`);

                // Use raw query to find sentences
                const sentences = await db.connection.raw(`
                    SELECT id FROM article_sentences WHERE per_language_id = ?
                `, [perLanguageId]);

                // Handle different MySQL result formats
                const sentenceRows = sentences[0] || sentences;
                const sentenceIds = sentenceRows.map((row: any) => row.id);

                console.log(`[ArticleService] Found ${sentenceIds.length} sentences to delete: [${sentenceIds.join(', ')}]`);

                if (sentenceIds.length === 0) {
                    console.log(`[ArticleService] No sentences found, skipping sentence cleanup`);
                    return;
                }

                // Step 2: Delete sentence translations
                console.log(`[ArticleService] Deleting sentence translations...`);
                const deletedTranslations = await db.connection.raw(`
                    DELETE FROM sentence_translations WHERE sentence_id IN (${sentenceIds.map(() => '?').join(',')})
                `, sentenceIds);
                console.log(`[ArticleService] Deleted translations:`, deletedTranslations[0]?.affectedRows || 0);

                // Step 3: Delete sentence grammar rules
                console.log(`[ArticleService] Deleting sentence grammar rules...`);
                const deletedRules = await db.connection.raw(`
                    DELETE FROM sentence_grammar_rules WHERE sentence_id IN (${sentenceIds.map(() => '?').join(',')})
                `, sentenceIds);
                console.log(`[ArticleService] Deleted grammar rules:`, deletedRules[0]?.affectedRows || 0);

                // Step 4: Delete sentences themselves
                console.log(`[ArticleService] Deleting sentences...`);
                const deletedSentences = await db.connection.raw(`
                    DELETE FROM article_sentences WHERE per_language_id = ?
                `, [perLanguageId]);
                console.log(`[ArticleService] Deleted sentences:`, deletedSentences[0]?.affectedRows || 0);

                console.log(`[ArticleService] ✅ Manual cascading delete completed successfully`);

            } catch (error) {
                console.error('[ArticleService] Error in manual cascading delete:', error);
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
                console.error('[ArticleService] Error getting language content statistics:', error);
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
         * Update access tier for language content
         */
        async updateAccessTier(contentId: number, accessTier: string): Promise<PerLanguageContentType> {
            try {
                const entityService = getEntityService();
                const updated = await entityService.update(
                    'plugin::per-language.article-perlanguage',
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