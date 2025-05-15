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

                if (existingContent && existingContent.length > 0) {
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
        async getLanguageContent(articleId: number, languageCode: string): Promise<PerLanguageContentType | null> {
            try {
                const entityService = getEntityService();
                const content = await entityService.findMany('plugin::per-language.per-language', {
                    filters: {
                        article: articleId,
                        language: languageCode
                    }
                });

                if (!content || content.length === 0) {
                    return null;
                }

                return content[0] as PerLanguageContentType;
            } catch (error) {
                console.error('Error fetching language content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to fetch language content: ${errorMessage}`);
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
        }
    };
};