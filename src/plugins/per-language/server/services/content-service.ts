// src/plugins/per-language/server/services/content-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { PerLanguageContentType } from '../types';

const { ApplicationError } = errors;

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
                // Check if content already exists for this article and language
                const existingContent = await entityService.findMany('plugin::per-language.per-language', {
                    filters: {
                        article_id: articleId,
                        language: languageCode
                    }
                });

                if (existingContent && Array.isArray(existingContent) && existingContent.length > 0) {
                    // Update existing content
                    const updated = await entityService.update(
                        'plugin::per-language.per-language',
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
                    const created = await entityService.create('plugin::per-language.per-language', {
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
                console.log(`[ContentService] Getting language content for article ${articleId} in ${languageCode}`);
                const entityService = getEntityService();
                const existingContent = await entityService.findMany('plugin::per-language.per-language', {
                    filters: {
                        article_id: articleId,
                        language: languageCode
                    }
                });

                if (!existingContent || (Array.isArray(existingContent) && existingContent.length === 0)) {
                    console.log(`[ContentService] No content found in per_language table`);
                    return null;
                }

                console.log(`[ContentService] Found content in per_language table:`, existingContent[0].id);
                return existingContent[0];
            } catch (error) {
                console.error(`[ContentService] Error getting language content:`, error);
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
                    'plugin::per-language.per-language',
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
                    'plugin::per-language.per-language',
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
         * Delete language content
         */
        async deleteLanguageContent(contentId: number): Promise<void> {
            try {
                const entityService = getEntityService();
                await entityService.delete('plugin::per-language.per-language', contentId);
            } catch (error) {
                console.error('Error deleting language content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to delete language content: ${errorMessage}`);
            }
        },

        /**
 * Update complete processed data with all three fields for complete preservation
 */
        async updateCompleteProcessedData(
            contentId: number,
            processedData: any,
            difficultyData: any,
            displaySkill?: string
        ): Promise<PerLanguageContentType> {
            try {
                console.log(`\n🔍 === DEBUGGING updateCompleteProcessedData ===`);
                console.log(`🔍 Content ID: ${contentId}`);
                console.log(`🔍 Processed data: ${processedData ? 'PRESENT' : 'NULL'}`);
                console.log(`🔍 Difficulty data: ${difficultyData ? 'PRESENT' : 'NULL'}`);
                console.log(`🔍 Difficulty data value:`, JSON.stringify(difficultyData, null, 2));
                console.log(`🔍 Display skill: ${displaySkill}`);

                const entityService = getEntityService();

                // Check current state
                console.log(`🔍 Fetching current content...`);
                const currentContent = await entityService.findOne('plugin::per-language.per-language', contentId);
                console.log(`🔍 Current difficulty_data in DB:`, currentContent?.difficulty_data);

                const updateData: any = {
                    processed_data: processedData,
                    difficulty_data: difficultyData,
                    updated_at: new Date()
                };

                if (displaySkill) {
                    updateData.display_skill = displaySkill;
                }

                console.log(`🔍 About to update with data:`, {
                    has_processed_data: !!updateData.processed_data,
                    has_difficulty_data: !!updateData.difficulty_data,
                    difficulty_data_value: updateData.difficulty_data,
                    display_skill: updateData.display_skill
                });

                console.log(`🔍 Calling entityService.update...`);
                const updated = await entityService.update(
                    'plugin::per-language.per-language',
                    contentId,
                    { data: updateData }
                );

                console.log(`🔍 Update result:`, {
                    id: updated?.id,
                    has_difficulty_data: !!updated?.difficulty_data,
                    difficulty_data_value: updated?.difficulty_data,
                    display_skill: updated?.display_skill
                });

                // Double-check with fresh fetch
                console.log(`🔍 Double-checking with fresh fetch...`);
                const verification = await entityService.findOne('plugin::per-language.per-language', contentId);
                console.log(`🔍 Fresh fetch result:`, {
                    id: verification?.id,
                    has_difficulty_data: !!verification?.difficulty_data,
                    difficulty_data_value: verification?.difficulty_data,
                    display_skill: verification?.display_skill
                });

                console.log(`🔍 === END DEBUGGING ===\n`);
                return updated as PerLanguageContentType;
            } catch (error) {
                console.error('❌ [DEBUG] Error in updateCompleteProcessedData:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to update complete processed data: ${errorMessage}`);
            }
        },
        /**
         * Get processed data with fallback logic for backward compatibility
         */
        async getProcessedDataWithFallback(
            articleId: number,
            language: string = 'zh'
        ): Promise<{ data: any, source: 'per_language' | 'articles' }> {
            try {
                // First, try per_language table
                const perLanguageContent = await this.getLanguageContent(articleId, language);

                if (perLanguageContent && perLanguageContent.processed_data) {
                    console.log(`[ContentService] Found processed data in per_language table`);
                    return {
                        data: perLanguageContent.processed_data,
                        source: 'per_language'
                    };
                }

                // Fallback to articles table
                console.log(`[ContentService] Falling back to articles table for processed data`);
                const article = await strapi.entityService?.findOne('api::article.article', articleId, {});

                if (article && ((article as any).chinese_processor || (article as any).ChineseProcessor)) {
                    const processedData = (article as any).chinese_processor || (article as any).ChineseProcessor;
                    return {
                        data: processedData,
                        source: 'articles'
                    };
                }

                throw new ApplicationError(`No processed data found for article ${articleId}`);
            } catch (error) {
                console.error('Error getting processed data with fallback:', error);
                throw error;
            }
        }
    };
};