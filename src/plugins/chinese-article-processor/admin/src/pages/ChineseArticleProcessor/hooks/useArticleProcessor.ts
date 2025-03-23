// hooks/useArticleProcessor.ts - With the infinite loop fix

import { useState, useCallback, useEffect } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule } from '../../../utils/types';
import { ERROR_MESSAGES, STATUS_MESSAGES } from '../../../utils/constants';
import { normalizeSentences } from '../../../utils/apiHelpers';
import { useStateWithHistory, useLoadingState } from '../../../hooks';

interface UseArticleProcessorProps {
    articleId: string | null;
    pluginId: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

/**
 * Base hook for managing article processor data
 * Handles the shared functionality between grammar and translation
 */
const useArticleProcessor = ({
    articleId,
    pluginId,
    onSuccess,
    onError
}: UseArticleProcessorProps) => {
    // Get Strapi's fetch client
    const { get, post } = useFetchClient();

    // Loading state
    const {
        isLoading: isProcessing,
        setLoading: startProcessing,
        setSuccess: finishProcessing,
        setError: setProcessingError
    } = useLoadingState();

    // Grammar rules state with history
    const {
        current: sentences,
        updateCurrent: setSentences,
        saveAsOriginal: saveOriginalSentences,
        hasChanges: hasDataChanges,
        reset: resetSentences
    } = useStateWithHistory<GrammarRule[]>([]);

    /**
     * Update the article with processor data
     */
    const updateArticleWithProcessorData = useCallback(async (articleId: string, grammarSentences: GrammarRule[]) => {
        try {
            // First fetch the current article data to get the existing ChineseProcessor content
            const articleResponse = await fetch(`/api/articles/${articleId}?populate=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!articleResponse.ok) {
                throw new Error(`Failed to fetch article data: ${articleResponse.status}`);
            }

            const articleData = await articleResponse.json();
            const chineseProcessor = articleData.data?.attributes?.ChineseProcessor;

            // Parse or initialize the processor data
            let processorData: any = {};
            if (chineseProcessor && chineseProcessor !== "") {
                try {
                    if (typeof chineseProcessor === 'string') {
                        processorData = JSON.parse(chineseProcessor);
                    } else {
                        processorData = chineseProcessor;
                    }
                } catch (error) {
                    console.error('Error parsing existing ChineseProcessor data:', error);
                }
            }

            // Prepare grammar sentences for storage
            // We need to ensure translations is properly formatted and handles null values
            const cleanedSentences = grammarSentences.map(sentence => {
                // Initialize a clean sentence object
                const cleanSentence = { ...sentence };

                // Clean up translations array
                if (Array.isArray(cleanSentence.translations)) {
                    cleanSentence.translations = cleanSentence.translations.filter(
                        t => t && typeof t === 'object' && t.language && t.text
                    );
                } else {
                    cleanSentence.translations = [];
                }

                // Ensure English translation exists in translations array if we have a legacy translation
                if (cleanSentence.translation && !cleanSentence.translations.some(t => t.language === 'en')) {
                    cleanSentence.translations.push({
                        language: 'en',
                        text: cleanSentence.translation
                    });
                }

                return cleanSentence;
            });

            // Update the grammar data while preserving other fields like HSK
            processorData = {
                ...processorData,
                grammar: {
                    sentences: cleanedSentences
                }
            };

            // Save back to the article
            const updateResponse = await fetch(`/api/articles/${articleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        ChineseProcessor: processorData
                    }
                }),
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Error updating article with processor data:', errorText);
                throw new Error(`Failed to update article: ${updateResponse.status}`);
            }

            return await updateResponse.json();
        } catch (error) {
            console.error('Error in updateArticleWithProcessorData:', error);
            throw error;
        }
    }, []);

    /**
     * Load saved grammar data for an article
     */
    const loadArticleData = useCallback(async (id: string) => {
        if (!id) return [];

        startProcessing();
        try {
            console.log(`Loading saved grammar data for article ID: ${id}`);
            const response = await get(`/${pluginId}/grammar/article/${id}`);

            if (response.data && response.data.data && response.data.data.sentences) {
                console.log(`Loaded ${response.data.data.sentences.length} sentences`);

                // Normalize data to ensure proper structure
                const loadedSentences = normalizeSentences(response.data.data.sentences);

                setSentences(loadedSentences);
                saveOriginalSentences();
                finishProcessing();
                return loadedSentences;
            } else {
                console.log('No grammar data found');
                setSentences([]);
                saveOriginalSentences();
                finishProcessing();
                return [];
            }
        } catch (err) {
            console.error('Error loading grammar data:', err);
            setProcessingError();
            onError(ERROR_MESSAGES.GRAMMAR_LOAD_FAILED);
            return [];
        }
    }, [pluginId, get, setSentences, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onError]);

    /**
     * Save all changes to the article's processor data
     */
    const saveArticleData = useCallback(async () => {
        if (!articleId || !hasDataChanges) return;

        startProcessing();

        try {
            console.log("Saving all article processor changes...");

            // Save to grammar plugin database
            const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                data: {
                    sentences: sentences
                }
            });

            if (!saveResponse.data) {
                throw new Error(ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);
            }

            // Also save to the article's ChineseProcessor field
            console.log("Saving data to article's ChineseProcessor field...");
            await updateArticleWithProcessorData(articleId, sentences);

            saveOriginalSentences();

            finishProcessing();
            onSuccess(STATUS_MESSAGES.TRANSLATIONS_SAVED);

            return;
        } catch (err) {
            console.error("Error saving article data:", err);
            setProcessingError();
            onError(err instanceof Error ? err.message : ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);

            return;
        }
    }, [articleId, hasDataChanges, sentences, pluginId, post, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithProcessorData]);

    // IMPORTANT: Removed the automatic data loading useEffect that was causing the infinite loop
    // Instead, we'll call loadArticleData explicitly from the parent component when needed

    return {
        // State
        sentences,
        setSentences,
        hasDataChanges,
        isProcessing,

        // Actions
        loadArticleData,
        saveArticleData,
        updateArticleWithProcessorData,
        startProcessing,
        finishProcessing,
        setProcessingError,
        saveOriginalSentences,
        resetSentences,

        // Utility properties
        hasSentences: sentences.length > 0
    };
};

export default useArticleProcessor;