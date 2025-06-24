// src/plugins/per-language/server/services/language-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface LanguageProcessor {
    code: string;
    name: string;
    pluginName: string;
}

export default ({ strapi }: { strapi: Strapi }) => {
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    return {
        // Store for registered language processors
        languageProcessors: [] as LanguageProcessor[],

        /**
         * Initialize available languages by checking for language processor plugins
         */
        initializeLanguageProcessors(): LanguageProcessor[] {
            this.languageProcessors = [];

            // Check for Chinese processor
            if (strapi.plugins['chinese-article-processor']) {
                this.languageProcessors.push({
                    code: 'zh',
                    name: 'Chinese',
                    pluginName: 'chinese-article-processor'
                });
            }

            // In the future, check for other language processors here
            // Example: if (strapi.plugins['french-article-processor']) { ... }

            return this.languageProcessors;
        },

        /**
         * Register a new language processor plugin
         */
        registerLanguageProcessor(processor: LanguageProcessor): void {
            // Check if processor is already registered
            const exists = this.languageProcessors.some(p => p.code === processor.code);
            if (!exists) {
                this.languageProcessors.push(processor);
            }
        },

        /**
         * Get all available language processors
         */
        getLanguageProcessors(): LanguageProcessor[] {
            return this.languageProcessors;
        },

        /**
         * Get a language processor for a specific language code
         */
        getProcessorForLanguage(languageCode: string): LanguageProcessor | null {
            return this.languageProcessors.find(p => p.code === languageCode) || null;
        },

        /**
         * Get supported languages from translator plugin
         */
        async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
            try {
                const translationService = strapi.plugin('translator').service('translationService');
                return await translationService.listLanguages();
            } catch (error) {
                console.error('Error fetching supported languages:', error);
                return [];
            }
        },

        /**
         * Get languages that have both translation support and processor plugins
         */
        async getFullySupportedLanguages(): Promise<Array<{ code: string; name: string; hasProcessor: boolean }>> {
            try {
                const supportedLanguages = await this.getSupportedLanguages();
                const processors = this.getLanguageProcessors();

                return supportedLanguages.map(lang => ({
                    ...lang,
                    hasProcessor: processors.some(p => p.code === lang.code)
                }));
            } catch (error) {
                console.error('Error fetching fully supported languages:', error);
                return [];
            }
        },

        /**
         * Get language content for a specific article
         */
        async getArticleLanguages(articleId: number): Promise<any[]> {
            try {
                const entityService = getEntityService();
                const result = await entityService.findMany('plugin::per-language.article-perlanguage', {  // UPDATED
                    filters: { article_id: articleId },
                });

                return Array.isArray(result) ? result : [];
            } catch (error) {
                console.error('Error fetching article languages:', error);
                throw new ApplicationError('Failed to fetch article languages');
            }
        },

        /**
         * Check if an article has content for a specific language
         */
        async hasLanguageContent(articleId: number, languageCode: string): Promise<boolean> {
            try {
                const entityService = getEntityService();
                const count = await entityService.count('plugin::per-language.article-perlanguage', {  // UPDATED
                    filters: {
                        article_id: articleId,
                        language: languageCode
                    }
                });

                return count > 0;
            } catch (error) {
                console.error('Error checking language content:', error);
                return false;
            }
        }
    }
};