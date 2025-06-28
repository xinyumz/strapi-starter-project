// server/services/translation-service.ts

import { errors } from '@strapi/utils';
import { BatchTranslationOptions } from './types';

const { ApplicationError } = errors;

export default ({ strapi }: any) => ({
    /**
     * Helper method to translate sentences in batches for better performance
     */
    async translateSentencesBatch(
        sentences: string[],
        targetLanguage: string,
        options: BatchTranslationOptions = {}
    ): Promise<string[]> {
        const {
            batchSize = 10,
            maxRetries = 3,
            retryDelay = 1000
        } = options;

        if (!strapi.plugin('translator')) {
            throw new Error('Translator plugin not found');
        }

        const translationService = strapi.plugin('translator').service('translationService');

        if (!translationService || !translationService.translate) {
            throw new Error('Translation service not available');
        }

        // Process in batches for better performance
        const translations: string[] = [];
        let errorCount = 0;

        for (let i = 0; i < sentences.length; i += batchSize) {
            const batch = sentences.slice(i, i + batchSize);
            console.log(`Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sentences.length / batchSize)}`);

            // Process each batch of sentences
            const batchTranslations = await Promise.all(
                batch.map(async (sentence) => {
                    if (typeof sentence !== 'string' || sentence.trim() === '') {
                        return '';
                    }

                    // Retry mechanism for more robust translations
                    let retryCount = 0;
                    while (retryCount < maxRetries) {
                        try {
                            const translation = await translationService.translate(sentence, targetLanguage);
                            if (translation && typeof translation === 'string') {
                                return translation;
                            } else {
                                throw new Error('Invalid translation result');
                            }
                        } catch (error) {
                            retryCount++;
                            if (retryCount >= maxRetries) {
                                console.error(`Failed to translate after ${maxRetries} attempts: "${sentence.substring(0, 50)}..."`, error);
                                errorCount++;
                                return `[Translation error]`;
                            }

                            // Wait before retrying
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            console.log(`Retrying translation (${retryCount}/${maxRetries})`);
                        }
                    }

                    return `[Translation error]`; // Fallback
                })
            );

            translations.push(...batchTranslations);
        }

        if (errorCount > 0) {
            console.warn(`Completed with ${errorCount} errors out of ${sentences.length} translations`);
        } else {
            console.log(`All ${sentences.length} translations to ${targetLanguage} completed successfully`);
        }

        return translations;
    },

    /**
     * Translate a list of sentences to the target language
     */
    async translateSentences(sentences: string[], targetLanguage: string = 'en'): Promise<string[]> {
        if (!Array.isArray(sentences)) {
            throw new ApplicationError('Input must be an array of sentences');
        }

        if (sentences.length === 0) {
            return [];
        }

        try {
            console.log(`Attempting to translate ${sentences.length} sentences to ${targetLanguage}`);

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

            // Use the batch translation method for better performance
            return await this.translateSentencesBatch(sentences, targetLanguage, {
                batchSize: 10, // Number of sentences to translate at once
                maxRetries: 3,  // Number of retry attempts per sentence
                retryDelay: 1000 // Delay between retries in ms
            });

        } catch (error: unknown) {
            console.error('Sentence translation error:', error);

            if (error instanceof ApplicationError) {
                throw error;
            }

            // Provide more specific error messages based on the error type
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (errorMessage.includes('Translator plugin not found')) {
                throw new ApplicationError('Translation service is not properly configured');
            } else if (errorMessage.includes('quota')) {
                throw new ApplicationError('Translation quota exceeded. Please try again later.');
            } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
                throw new ApplicationError('Network error during translation. Please check your connection and try again.');
            } else {
                throw new ApplicationError(`Failed to translate sentences: ${errorMessage}`);
            }
        }
    },

    /**
     * Get supported languages for translation
     */
    async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
        try {
            if (!strapi.plugin('translator')) {
                throw new Error('Translator plugin not found');
            }

            const translationService = strapi.plugin('translator').service('translationService');

            if (!translationService || !translationService.listLanguages) {
                throw new Error('Language listing not supported by translation service');
            }

            const languages = await translationService.listLanguages();
            return languages;
        } catch (error) {
            console.error('Error fetching supported languages:', error);

            // Return default languages as fallback
            return [
                { code: 'en', name: 'English' },
                { code: 'fr', name: 'French' },
                { code: 'es', name: 'Spanish' },
                { code: 'de', name: 'German' },
                { code: 'it', name: 'Italian' },
                { code: 'ja', name: 'Japanese' },
                { code: 'ko', name: 'Korean' },
                { code: 'ru', name: 'Russian' },
                { code: 'pt', name: 'Portuguese' },
                { code: 'ar', name: 'Arabic' }
            ];
        }
    }
});