// server/services/sentence-service.ts
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
            const translationService = strapi.plugin('translator').service('translationService');

            const translations = await Promise.all(
                sentences.map(async (sentence) => {
                    if (typeof sentence !== 'string') {
                        throw new ApplicationError('Each sentence must be a string');
                    }
                    return translationService.translate(sentence, 'en');
                })
            );

            return translations;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.error('Sentence translation error:', error);
            throw new ApplicationError('Failed to translate sentences');
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
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.error('Article processing error:', error);
            throw new ApplicationError('Failed to process article');
        }
    }
});