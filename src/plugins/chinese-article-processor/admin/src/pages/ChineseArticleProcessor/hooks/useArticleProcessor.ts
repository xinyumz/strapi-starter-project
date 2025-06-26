// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/hooks/useArticleProcessor.ts

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
     * Get per_language content entry (with proper ID)
     */
    const getPerLanguageContent = useCallback(async (articleId: string): Promise<{ contentId: number, processedData: any }> => {
        try {
            console.log(`Getting article_perlanguages content for article ${articleId}`);

            // Use the /content endpoint which has both ID and processed data
            const contentResponse = await fetch(`/per-language/article/${articleId}/content?language=zh`);
            if (!contentResponse.ok) {
                throw new Error('Could not access article_perlanguages content');
            }

            const contentData = await contentResponse.json();
            const contentId = contentData.data?.id;
            const processedData = contentData.data?.processed_data || {};

            if (contentId) {
                console.log(`✅ Found article_perlanguages content ID: ${contentId}`);
                return { contentId, processedData };
            } else {
                console.log(`❌ No content ID found in response:`, contentData);
                throw new Error('No article_perlanguages content ID found');
            }
        } catch (error) {
            console.error(`Error getting article_perlanguages content:`, error);
            throw error;
        }
    }, []);

    /**
     * Update the article with processor data - preserves ALL existing data
     */
    const updateArticleWithProcessorData = useCallback(async (articleId: string, grammarSentences: GrammarRule[]) => {
        try {
            console.log(`[ArticleProcessor] Starting updateArticleWithProcessorData for article ${articleId}`);

            // STEP 1: Get article_perlanguages content and existing processed data
            const { contentId, processedData: existingProcessedData } = await getPerLanguageContent(articleId);
            console.log(`[ArticleProcessor] Using content ID: ${contentId}`);
            console.log(`[ArticleProcessor] Existing data keys:`, Object.keys(existingProcessedData));

            // STEP 2: Prepare grammar sentences for storage
            const cleanedSentences = grammarSentences.map(sentence => {
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

            // STEP 3: Merge grammar data with existing data (preserving HSK if it exists)
            const mergedProcessorData = {
                ...existingProcessedData,  // Preserve existing HSK data and other fields (if any)
                grammar: {
                    sentences: cleanedSentences  // Update only grammar data
                }
            };

            console.log(`[ArticleProcessor] Merged data structure:`, {
                hasHSK: !!mergedProcessorData.hsk,
                hasGrammar: !!mergedProcessorData.grammar,
                grammarSentencesCount: mergedProcessorData.grammar?.sentences?.length || 0,
                hskData: mergedProcessorData.hsk ? {
                    calculatedLevel: mergedProcessorData.hsk.calculatedLevel,
                    selectedLevel: mergedProcessorData.hsk.selectedLevel,
                    hasDistribution: !!mergedProcessorData.hsk.distribution
                } : 'No HSK data found (this is fine)'
            });

            // STEP 4: Prepare difficulty data for performance optimization (only if HSK exists)
            const difficultyData = mergedProcessorData.hsk ? {
                hsk: {
                    distribution: mergedProcessorData.hsk.distribution,
                    selectedLevel: mergedProcessorData.hsk.selectedLevel,
                    calculatedLevel: mergedProcessorData.hsk.calculatedLevel
                }
            } : null;

            // STEP 5: Prepare display skill for UI (only if HSK exists)
            const displaySkill = mergedProcessorData.hsk?.selectedLevel ?
                `HSK ${mergedProcessorData.hsk.selectedLevel}` :
                (mergedProcessorData.hsk?.calculatedLevel ? `HSK ${mergedProcessorData.hsk.calculatedLevel}` : null);

            // STEP 6: Update article_perlanguages table using the correct content ID
            const updateResponse = await fetch(`/per-language/update-processed-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId: contentId,
                    processedData: mergedProcessorData,
                    difficultyData: difficultyData,
                    displaySkill: displaySkill
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('[ArticleProcessor] Error updating article_perlanguages table:', errorText);
                throw new Error(`Failed to update article_perlanguages table: ${updateResponse.status}`);
            }

            console.log(`[ArticleProcessor] ✅ Successfully updated article_perlanguages table with merged data`);
            return await updateResponse.json();

        } catch (error) {
            console.error('[ArticleProcessor] Error in updateArticleWithProcessorData:', error);
            throw error;
        }
    }, [getPerLanguageContent]);

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

            // Enhanced error message for missing article_perlanguages data
            if (err instanceof Error && err.message.includes('per_language')) {
                onError('No translated content found. Please translate the content first using the Language Processor field.');
            } else {
                onError(ERROR_MESSAGES.GRAMMAR_LOAD_FAILED);
            }
            return [];
        }
    }, [pluginId, get, setSentences, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onError]);

    /**
     * Save all changes to article_perlanguages table ONLY
     */
    const saveArticleData = useCallback(async () => {
        if (!articleId || !hasDataChanges) return;

        startProcessing();

        try {
            console.log("Saving all article processor changes to article_perlanguages table...");

            // STEP 1: Save to grammar plugin database (sentence tables)
            const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                data: {
                    sentences: sentences
                }
            });

            if (!saveResponse.data) {
                throw new Error(ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);
            }

            // STEP 2: The grammar service should have already updated article_perlanguages table
            // But we can also update it here to ensure consistency
            console.log("Ensuring article_perlanguages table is updated with preserved HSK data...");
            await updateArticleWithProcessorData(articleId, sentences);

            saveOriginalSentences();
            finishProcessing();
            onSuccess(STATUS_MESSAGES.TRANSLATIONS_SAVED);

            return;
        } catch (err) {
            console.error("Error saving article data:", err);
            setProcessingError();

            if (err instanceof Error && err.message.includes('per_language')) {
                onError('Failed to save to article_perlanguages table. Please ensure the content is translated first.');
            } else {
                onError(err instanceof Error ? err.message : ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);
            }

            return;
        }
    }, [articleId, hasDataChanges, sentences, pluginId, post, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithProcessorData]);

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