// Updated server/services/sentence-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface EnhancedSentence {
    chinese: string;
    english: string;
    grammarRules: string[];
}

export default ({ strapi }: { strapi: Strapi }) => ({
    async translateSentences(sentences: string[]): Promise<string[]> {
        if (!Array.isArray(sentences)) {
            throw new ApplicationError('Input must be an array of sentences');
        }

        try {
            console.log("Attempting to translate sentences:", sentences);

            // Check if translator plugin and translation service exist
            if (!strapi.plugin('translator')) {
                throw new Error('Translator plugin not found');
            }

            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService) {
                throw new Error('Translation service not found in translator plugin');
            }

            if (!translationService.translate) {
                throw new Error('Translate method not found in translation service');
            }

            console.log("Translation service found, proceeding with translations");

            // Translate each sentence individually and handle errors
            const translations = [];
            for (const sentence of sentences) {
                if (typeof sentence !== 'string') {
                    console.warn('Skipping non-string sentence:', sentence);
                    translations.push('');
                    continue;
                }

                try {
                    const translation = await translationService.translate(sentence, 'en');
                    translations.push(translation);
                } catch (translationError: unknown) {
                    console.error(`Error translating sentence "${sentence}":`, translationError);
                    translations.push(`[Translation error for: ${sentence}]`);
                }
            }

            console.log("All translations completed:", translations);
            return translations;
        } catch (error: unknown) {
            console.error('Sentence translation error:', error);
            if (error instanceof ApplicationError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to translate sentences: ${errorMessage}`);
        }
    },

    async processArticle(content: string): Promise<EnhancedSentence[]> {
        if (typeof content !== 'string') {
            throw new ApplicationError('Content must be a string');
        }

        try {
            const sentences = content.split('|').filter(s => s.trim());

            if (sentences.length === 0) {
                throw new ApplicationError('No valid sentences found in content');
            }

            const grammarService = strapi.plugin('article-enhancer').service('grammarService');

            // Get grammar rules first
            const grammarRules = await grammarService.generateRules(content);

            // Then get translations
            const translations = await this.translateSentences(sentences);

            // Combine everything
            return sentences.map((chinese, index) => ({
                chinese: chinese.trim(),
                english: translations[index],
                grammarRules: grammarRules[index]?.rules || []
            }));
        } catch (error: unknown) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.error('Article processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new ApplicationError(`Failed to process article: ${errorMessage}`);
        }
    }
});