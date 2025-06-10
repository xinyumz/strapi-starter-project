// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/hooks/useHSKManagement.ts

import { useCallback } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { HSKData } from '../../../utils/types';
import {
  DEFAULT_HSK_DATA,
  ERROR_MESSAGES,
  STATUS_MESSAGES
} from '../../../utils/constants';
import { useLoadingState, useStateWithHistory } from '../../../hooks';

interface UseHSKManagementParams {
  articleId: string | null;
  pluginId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * FIXED: Custom hook for managing HSK data operations
 * CRITICAL FIX: Corrected per_languages content ID retrieval
 */
const useHSKManagement = ({
  articleId,
  pluginId,
  onSuccess,
  onError
}: UseHSKManagementParams) => {
  // Use loadingState for HSK calculation
  const {
    isLoading: isCalculatingHSK,
    setLoading: startHSKCalculation,
    setSuccess: finishHSKCalculation,
    setError: setHSKCalculationError
  } = useLoadingState();

  // Use state with history for HSK data
  const {
    current: hskData,
    updateCurrent: setHskData,
    saveAsOriginal: saveHSKAsOriginal,
    hasChanges: hasHskChanges
  } = useStateWithHistory<HSKData>(DEFAULT_HSK_DATA);

  // Get Strapi fetch client
  const { get } = useFetchClient();

  /**
   * Get translation content from per_languages table ONLY
   */
  const getTranslationContent = useCallback(async (id: string): Promise<string | null> => {
    try {
      console.log(`[HSKManagement] Getting translation content for article ${id}`);

      const perLanguageResponse = await fetch(`/per-language/article/${id}/content?language=zh`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (perLanguageResponse.ok) {
        const perLanguageData = await perLanguageResponse.json();
        if (perLanguageData.data?.per_language_text) {
          console.log(`[HSKManagement] ✅ Found content in per_languages table`);
          return perLanguageData.data.per_language_text;
        }
      }

      console.log(`[HSKManagement] ❌ No translation content found in per_languages table for article ${id}`);
      throw new Error('No translated content found. Please translate the content first using the Language Processor field.');
    } catch (error) {
      console.error(`[HSKManagement] Error getting translation content:`, error);
      throw error;
    }
  }, []);

  /**
   * FIXED: Get per_languages content entry (with proper ID)
   */
  const getPerLanguageContent = useCallback(async (articleId: string): Promise<{ contentId: number, processedData: any }> => {
    try {
      console.log(`Getting per_languages content for article ${articleId}`);

      // Use the /content endpoint which has both ID and processed data
      const contentResponse = await fetch(`/per-language/article/${articleId}/content?language=zh`);
      if (!contentResponse.ok) {
        throw new Error('Could not access per_languages content');
      }

      const contentData = await contentResponse.json();
      const contentId = contentData.data?.id;
      const processedData = contentData.data?.processed_data || {};

      if (contentId) {
        console.log(`✅ Found per_languages content ID: ${contentId}`);
        return { contentId, processedData };
      } else {
        console.log(`❌ No content ID found in response:`, contentData);
        throw new Error('No per_languages content ID found');
      }
    } catch (error) {
      console.error(`Error getting per_languages content:`, error);
      throw error;
    }
  }, []);

  /**
   * Load HSK data from per_languages table ONLY
   */
  const loadHSKData = useCallback(async (id: string) => {
    try {
      console.log(`[HSKManagement] Loading HSK data for article ID: ${id}`);

      const { processedData } = await getPerLanguageContent(id);
      const hskValue = processedData?.hsk;

      if (hskValue && typeof hskValue === 'object' && Array.isArray(hskValue.distribution)) {
        console.log(`[HSKManagement] ✅ Loaded HSK data from per_languages table:`, hskValue);
        setHskData(hskValue);
        saveHSKAsOriginal();
        return;
      }

      console.log(`[HSKManagement] No HSK data found in per_languages table, using defaults`);
      setHskData(DEFAULT_HSK_DATA);
    } catch (err) {
      console.error(`[HSKManagement] Error loading HSK data:`, err);
      onError(`Failed to load HSK data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setHskData(DEFAULT_HSK_DATA);
    }
  }, [setHskData, saveHSKAsOriginal, onError, getPerLanguageContent]);

  /**
   * Calculate HSK level ONLY (no grammar generation)
   */
  const calculateHSK = useCallback(async () => {
    if (!articleId) {
      onError(ERROR_MESSAGES.ARTICLE_ID_MISSING);
      return;
    }

    startHSKCalculation();

    try {
      console.log(`[HSKManagement] Starting HSK calculation ONLY for article ${articleId}`);

      // Get translation content from per_languages table ONLY
      const translationText = await getTranslationContent(articleId);

      console.log(`[HSKManagement] Found translation content, calculating HSK level...`);

      // Use HSK calculation endpoint ONLY (not complete processing)
      const response = await fetch(`/${pluginId}/hsk/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translationText }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[HSKManagement] HSK calculation API error:`, errorText);
        throw new Error(`HSK calculation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const { skillLevel, skillDistribution } = result.data;

      const newHSKData = {
        calculatedLevel: skillLevel,
        selectedLevel: skillLevel,
        distribution: skillDistribution,
      };

      setHskData(newHSKData);

      // Auto-save the calculated HSK data (preserving existing grammar)
      await updateHSKLevelOnly(newHSKData);
      saveHSKAsOriginal();

      console.log(`[HSKManagement] ✅ HSK level calculation completed successfully`);
      finishHSKCalculation();
      onSuccess('HSK level calculated successfully');
    } catch (err) {
      console.error(`[HSKManagement] HSK calculation error:`, err);
      setHSKCalculationError();
      onError(err instanceof Error ? err.message : 'Failed to calculate HSK level');
    }
  }, [articleId, pluginId, getTranslationContent, setHskData, saveHSKAsOriginal, startHSKCalculation, finishHSKCalculation, setHSKCalculationError, onSuccess, onError]);

  /**
   * Handle HSK level selection change
   */
  const handleHSKLevelChange = useCallback((level: string) => {
    const updatedHSKData = {
      ...hskData,
      selectedLevel: parseInt(level, 10),
    };
    setHskData(updatedHSKData);
  }, [hskData, setHskData]);

  /**
   * Save HSK level ONLY (preserves existing grammar data)
   */
  const saveHSKLevel = useCallback(async () => {
    if (!articleId || !hasHskChanges) return;

    try {
      console.log(`[HSKManagement] Saving HSK level ONLY for article ${articleId}`);
      await updateHSKLevelOnly(hskData);
      saveHSKAsOriginal();
      onSuccess('HSK level saved successfully');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save HSK level');
    }
  }, [articleId, hasHskChanges, hskData, saveHSKAsOriginal, onSuccess, onError]);

  /**
   * FIXED: Update HSK level ONLY - preserves existing grammar data
   */
  const updateHSKLevelOnly = useCallback(async (data: HSKData) => {
    if (!articleId) return;

    try {
      console.log(`[HSKManagement] Saving HSK data ONLY (preserving existing grammar):`, data);

      // STEP 1: Get per_languages content and existing processed data
      const { contentId, processedData: existingProcessedData } = await getPerLanguageContent(articleId);
      console.log(`[HSKManagement] Using content ID: ${contentId}`);
      console.log(`[HSKManagement] Existing data keys:`, Object.keys(existingProcessedData));

      // STEP 2: Merge HSK data with existing data (preserve grammar)
      const mergedData = {
        ...existingProcessedData,  // Preserve existing grammar and other fields
        hsk: data                  // Update ONLY HSK data
      };

      console.log(`[HSKManagement] Merged data structure:`, {
        hasHSK: !!mergedData.hsk,
        hasGrammar: !!mergedData.grammar,
        hskLevel: mergedData.hsk?.selectedLevel,
        grammarSentencesCount: mergedData.grammar?.sentences?.length || 0
      });

      // STEP 3: Prepare data for per_languages table
      const difficultyData = {
        hsk: {
          distribution: data.distribution,
          selectedLevel: data.selectedLevel,
          calculatedLevel: data.calculatedLevel
        }
      };

      const displaySkill = `HSK ${data.selectedLevel}`;

      // STEP 4: Update per_languages table directly using the correct content ID
      const updateResponse = await fetch(`/per-language/update-processed-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId,
          processedData: mergedData,
          difficultyData: difficultyData,
          displaySkill: displaySkill
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`[HSKManagement] Error updating per_languages table:`, errorText);
        throw new Error(`Failed to save HSK data: ${updateResponse.statusText}`);
      }

      console.log(`[HSKManagement] ✅ HSK data saved successfully to per_languages table (grammar preserved)`);
      return await updateResponse.json();
    } catch (err) {
      console.error(`[HSKManagement] Error saving HSK data:`, err);
      throw err;
    }
  }, [articleId, getPerLanguageContent]);

  return {
    hskData,
    isCalculatingHSK,
    hasHskChanges,
    loadHSKData,
    calculateHSK,        // HSK calculation ONLY (no grammar)
    handleHSKLevelChange,
    saveHSKLevel        // HSK save ONLY (preserves grammar)
  };
};

export default useHSKManagement;