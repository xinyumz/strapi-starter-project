// hooks/useTranslationManagement.ts - Extracted from useGrammarManagement.ts to focus on translations

import { useState, useCallback, useEffect } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule, Translation } from '../../../utils/types';
import { ERROR_MESSAGES } from '../../../utils/constants';
import { useLoadingState } from '../../../hooks';

interface UseTranslationManagementProps {
    articleId: string | null;
    pluginId: string;
    sentences: GrammarRule[];
    setSentences: (sentences: GrammarRule[]) => void;
    saveOriginalSentences: () => void;
    updateArticleWithProcessorData: (articleId: string, grammarSentences: GrammarRule[]) => Promise<any>;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

interface SupportedLanguage {
    code: string;
    name: string;
}

/**
 * Custom hook for managing sentence translations with multi-language support
 */
const useTranslationManagement = ({
    articleId,
    pluginId,
    sentences,
    setSentences,
    saveOriginalSentences,
    updateArticleWithProcessorData,
    onSuccess,
    onError
}: UseTranslationManagementProps) => {
    // Active translation language
    const [activeLanguage, setActiveLanguage] = useState<string>('en');

    // Supported languages
    const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([
        { code: 'en', name: 'English' }
    ]);

    const [hasSupportedLanguages, setHasSupportedLanguages] = useState<boolean>(true);

    // Translation loading state
    const {
        isLoading: isTranslating,
        setLoading: startTranslating,
        setSuccess: finishTranslating,
        setError: setTranslationError
    } = useLoadingState();

    // Get Strapi's fetch client
    const { get, post } = useFetchClient();

    // Load supported languages
    useEffect(() => {
        const controller = new AbortController();

        const fetchLanguages = async () => {
            try {
                const response = await get('/translator/languages', {
                    signal: controller.signal
                });

                if (response.data && Array.isArray(response.data.data)) {
                    setSupportedLanguages(response.data.data);
                    setHasSupportedLanguages(true);
                }
            } catch (error: unknown) {
                // Only log and handle errors if the request wasn't canceled
                if (
                    error &&
                    typeof error === 'object' &&
                    'name' in error &&
                    'code' in error &&
                    !(error.name === 'CanceledError' || error.code === 'ERR_CANCELED')
                ) {
                    console.error('Failed to fetch languages:', error);
                    // When languages endpoint fails, still show some default options
                    setSupportedLanguages([
                        { code: 'en', name: 'English' },
                        { code: 'fr', name: 'French' },
                        { code: 'es', name: 'Spanish' },
                        { code: 'de', name: 'German' },
                        { code: 'ja', name: 'Japanese' }
                    ]);
                    // We still set this to true so the dropdown isn't disabled
                    setHasSupportedLanguages(true);
                }
            }
        };

        fetchLanguages();

        // Clean up the controller when the component unmounts
        return () => {
            controller.abort();
        };
    }, [get]);

    /**
     * Translate all sentences in bulk for the active language
     */
    const translateAllSentences = useCallback(async () => {
        if (!sentences || sentences.length === 0) {
            onError(ERROR_MESSAGES.NO_SENTENCES);
            return;
        }

        startTranslating();

        try {
            console.log(`Starting bulk translation for language: ${activeLanguage}...`);
            // Prepare sentences array
            const sentenceTexts = sentences.map(s => s.sentence).filter(Boolean);

            if (sentenceTexts.length === 0) {
                throw new Error(ERROR_MESSAGES.NO_VALID_SENTENCES);
            }

            // Call the sentences processing endpoint with the specified language
            const response = await post(`/${pluginId}/process-sentences`, {
                data: {
                    sentences: sentenceTexts,
                    targetLanguage: activeLanguage
                }
            });

            if (!response.data || !response.data.data) {
                throw new Error(ERROR_MESSAGES.TRANSLATION_RESPONSE_INVALID);
            }

            // Get translations from the response
            const translations = response.data.data;

            if (!Array.isArray(translations)) {
                throw new Error(ERROR_MESSAGES.TRANSLATION_RESPONSE_INVALID);
            }

            // Update sentences with translations
            const updatedSentences = sentences.map((sentence, index) => {
                // Get the new translation for the active language
                const newTranslationText = translations[index] || '';

                // Create a copy of the sentence
                const updatedSentence = { ...sentence };

                // Initialize translations array if it doesn't exist
                if (!Array.isArray(updatedSentence.translations)) {
                    updatedSentence.translations = [];
                }

                // Create a clean translations array by filtering out invalid entries
                const cleanTranslations = updatedSentence.translations.filter(
                    t => t && typeof t === 'object' && t.language && typeof t.text === 'string'
                );

                // Check if we already have a translation for this language
                const existingIndex = cleanTranslations.findIndex(
                    t => t.language === activeLanguage
                );

                if (existingIndex >= 0) {
                    // Update existing translation
                    cleanTranslations[existingIndex] = {
                        language: activeLanguage,
                        text: newTranslationText
                    };
                } else {
                    // Add new translation
                    cleanTranslations.push({
                        language: activeLanguage,
                        text: newTranslationText
                    });
                }

                updatedSentence.translations = cleanTranslations;

                // If this is English, also update the legacy translation field for backward compatibility
                if (activeLanguage === 'en') {
                    updatedSentence.translation = newTranslationText;
                }

                return updatedSentence;
            });

            // Save to plugin database
            if (articleId) {
                console.log("Saving translations to plugin database...");
                const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                    data: {
                        sentences: updatedSentences
                    }
                });

                if (!saveResponse.data) {
                    throw new Error(ERROR_MESSAGES.TRANSLATION_SAVE_FAILED);
                }

                // Also save to the article's ChineseProcessor field
                console.log("Saving translations to article's ChineseProcessor field...");
                await updateArticleWithProcessorData(articleId, updatedSentences);
            }

            console.log(`Translations for ${activeLanguage} completed successfully`);
            setSentences(updatedSentences);
            saveOriginalSentences();

            finishTranslating();
            onSuccess(`Sentences translated to ${activeLanguage} successfully`);
        } catch (err) {
            console.error('Translation error:', err);
            setTranslationError();
            onError(err instanceof Error ? err.message : ERROR_MESSAGES.TRANSLATION_FAILED);
        }
    }, [
        sentences,
        articleId,
        pluginId,
        activeLanguage,
        post,
        setSentences,
        saveOriginalSentences,
        startTranslating,
        finishTranslating,
        setTranslationError,
        onSuccess,
        onError,
        updateArticleWithProcessorData
    ]);

    /**
     * Handle direct translation change for a single sentence and language
     */
    const handleTranslationChange = useCallback((sentenceIndex: number, language: string, newTranslation: string) => {
        const updatedSentences = [...sentences];
        if (!updatedSentences[sentenceIndex]) return;

        const sentence = { ...updatedSentences[sentenceIndex] };

        // Initialize translations array if it doesn't exist
        if (!Array.isArray(sentence.translations)) {
            sentence.translations = [];
        }

        // Check if we already have a translation for this language
        const existingTranslationIndex = sentence.translations.findIndex(
            t => t.language === language
        );

        if (existingTranslationIndex >= 0) {
            // Update existing translation
            const updatedTranslations = [...sentence.translations];
            updatedTranslations[existingTranslationIndex] = {
                ...updatedTranslations[existingTranslationIndex],
                text: newTranslation
            };
            sentence.translations = updatedTranslations;
        } else {
            // Add new translation
            sentence.translations = [
                ...sentence.translations,
                { language, text: newTranslation }
            ];
        }

        // If this is English, also update the legacy translation field for backward compatibility
        if (language === 'en') {
            sentence.translation = newTranslation;
        }

        updatedSentences[sentenceIndex] = sentence;
        setSentences(updatedSentences);
    }, [sentences, setSentences]);

    /**
     * Add a new language translation to a sentence
     */
    const addTranslation = useCallback((sentenceIndex: number, language: string) => {
        const updatedSentences = [...sentences];
        if (!updatedSentences[sentenceIndex]) return;

        const sentence = { ...updatedSentences[sentenceIndex] };

        // Initialize translations array if it doesn't exist
        if (!Array.isArray(sentence.translations)) {
            sentence.translations = [];
        }

        // Check if we already have a translation for this language
        const hasTranslation = sentence.translations.some(t => t.language === language);

        if (!hasTranslation) {
            // Add empty translation for the new language
            sentence.translations = [
                ...sentence.translations,
                { language, text: '' }
            ];
        }

        updatedSentences[sentenceIndex] = sentence;
        setSentences(updatedSentences);
    }, [sentences, setSentences]);

    /**
     * Remove a language translation from a sentence
     */
    const removeTranslation = useCallback((sentenceIndex: number, language: string) => {
        const updatedSentences = [...sentences];
        if (!updatedSentences[sentenceIndex]) return;

        const sentence = { ...updatedSentences[sentenceIndex] };

        // Skip if translations array doesn't exist
        if (!Array.isArray(sentence.translations)) {
            return;
        }

        // Filter out the specified language
        sentence.translations = sentence.translations.filter(t => t.language !== language);

        // If removing English translation, also clear the legacy translation field
        if (language === 'en') {
            sentence.translation = '';
        }

        updatedSentences[sentenceIndex] = sentence;
        setSentences(updatedSentences);
    }, [sentences, setSentences]);

    /**
     * Add a new language translation to all sentences
     */
    const addBulkTranslation = useCallback(async (language: string) => {
        if (!sentences.length) return;

        startTranslating();

        try {
            console.log(`Starting bulk translation for all sentences to ${language}...`);
            // Prepare sentences array
            const sentenceTexts = sentences.map(s => s.sentence).filter(Boolean);

            if (sentenceTexts.length === 0) {
                throw new Error(ERROR_MESSAGES.NO_VALID_SENTENCES);
            }

            // Call the sentences processing endpoint with the specified language
            const response = await post(`/${pluginId}/process-sentences`, {
                data: {
                    sentences: sentenceTexts,
                    targetLanguage: language
                }
            });

            if (!response.data || !response.data.data) {
                throw new Error(ERROR_MESSAGES.TRANSLATION_RESPONSE_INVALID);
            }

            // Get translations from the response
            const translations = response.data.data;

            if (!Array.isArray(translations)) {
                throw new Error(ERROR_MESSAGES.TRANSLATION_RESPONSE_INVALID);
            }

            // Update sentences with translations
            const updatedSentences = sentences.map((sentence, index) => {
                // Get the new translation for the new language
                const newTranslationText = translations[index] || '';

                // Create a copy of the sentence
                const updatedSentence = { ...sentence };

                // Initialize translations array if it doesn't exist
                if (!Array.isArray(updatedSentence.translations)) {
                    updatedSentence.translations = [];
                }

                // Check if we already have a translation for this language
                const existingTranslationIndex = updatedSentence.translations.findIndex(
                    t => t.language === language
                );

                if (existingTranslationIndex >= 0) {
                    // Update existing translation
                    const updatedTranslations = [...updatedSentence.translations];
                    updatedTranslations[existingTranslationIndex].text = newTranslationText;
                    updatedSentence.translations = updatedTranslations;
                } else {
                    // Add new translation
                    updatedSentence.translations = [
                        ...updatedSentence.translations,
                        { language, text: newTranslationText }
                    ];
                }

                // If this is English, also update the legacy translation field for backward compatibility
                if (language === 'en') {
                    updatedSentence.translation = newTranslationText;
                }

                return updatedSentence;
            });

            // Save to plugin database
            if (articleId) {
                console.log("Saving translations to plugin database...");
                const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                    data: {
                        sentences: updatedSentences
                    }
                });

                if (!saveResponse.data) {
                    throw new Error(ERROR_MESSAGES.TRANSLATION_SAVE_FAILED);
                }

                // Also save to the article's ChineseProcessor field
                console.log("Saving translations to article's ChineseProcessor field...");
                await updateArticleWithProcessorData(articleId, updatedSentences);
            }

            console.log(`Bulk translations for ${language} completed successfully`);
            setSentences(updatedSentences);
            saveOriginalSentences();

            finishTranslating();
            onSuccess(`Added ${language} translations to all sentences successfully`);

            // Set active language to the newly added language
            setActiveLanguage(language);

        } catch (err) {
            console.error('Translation error:', err);
            setTranslationError();
            onError(err instanceof Error ? err.message : ERROR_MESSAGES.TRANSLATION_FAILED);
        }
    }, [
        sentences,
        articleId,
        pluginId,
        post,
        setSentences,
        saveOriginalSentences,
        setActiveLanguage,
        startTranslating,
        finishTranslating,
        setTranslationError,
        onSuccess,
        onError,
        updateArticleWithProcessorData
    ]);

    /**
     * Remove a language translation from all sentences
     */
    // For removeBulkTranslation - Update to use the correct URL and ensure proper data saving:
    const removeBulkTranslation = useCallback(async (language: string) => {
        if (!sentences.length || !articleId || language === 'en') return;

        startTranslating();

        try {
            console.log(`Removing all translations for language: ${language}...`);

            // First, update the UI state by removing the translations
            const updatedSentences = sentences.map(sentence => {
                // Create a copy of the sentence
                const updatedSentence = { ...sentence };

                // Skip if translations array doesn't exist
                if (!Array.isArray(updatedSentence.translations)) {
                    return updatedSentence;
                }

                // Filter out the specified language
                updatedSentence.translations = updatedSentence.translations.filter(
                    t => t.language !== language
                );

                return updatedSentence;
            });

            // Call the dedicated endpoint to remove translations from the database
            console.log(`Calling API to remove ${language} translations from database...`);
            const response = await fetch(`/${pluginId}/article/${articleId}/translations/${language}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                // Try to parse the error response
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to remove ${language} translations`);
                } catch (parseError) {
                    // If parsing fails, use the status text
                    throw new Error(`Failed to remove ${language} translations: ${response.statusText}`);
                }
            }

            console.log(`Successfully removed all translations for language: ${language}`);

            // Save to plugin database
            console.log("Saving to plugin database...");
            const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                data: {
                    sentences: updatedSentences
                }
            });

            if (!saveResponse.data) {
                throw new Error(ERROR_MESSAGES.TRANSLATION_SAVE_FAILED);
            }

            // Also save to the article's ChineseProcessor field
            console.log("Saving to article's ChineseProcessor field...");
            await updateArticleWithProcessorData(articleId, updatedSentences);

            // Update the local state with the updated sentences
            setSentences(updatedSentences);
            saveOriginalSentences();

            // If active language was the removed one, switch to English
            if (activeLanguage === language) {
                setActiveLanguage('en');
            }

            finishTranslating();
            onSuccess(`Removed all ${language} translations successfully`);

        } catch (err) {
            console.error('Error removing translations:', err);
            setTranslationError();
            onError(err instanceof Error ? err.message : ERROR_MESSAGES.TRANSLATION_FAILED);
        }
    }, [
        sentences,
        articleId,
        activeLanguage,
        pluginId,
        post,
        setSentences,
        saveOriginalSentences,
        setActiveLanguage,
        startTranslating,
        finishTranslating,
        setTranslationError,
        onSuccess,
        onError,
        updateArticleWithProcessorData
    ]);

    /**
    * Handle active language change
    */
    const handleLanguageChange = useCallback((language: string) => {
        setActiveLanguage(language);
    }, []);

    return {
        // State
        activeLanguage,
        supportedLanguages,
        hasSupportedLanguages,
        isTranslating,

        // Translation actions
        translateAllSentences,
        handleLanguageChange,
        handleTranslationChange,
        addTranslation,
        removeTranslation,
        addBulkTranslation,
        removeBulkTranslation
    };
};

export default useTranslationManagement;