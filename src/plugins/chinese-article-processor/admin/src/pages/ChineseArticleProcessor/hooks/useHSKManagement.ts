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
 * Custom hook for managing HSK data operations
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
   * Load HSK data from the article
   */
  const loadHSKData = useCallback(async (id: string) => {
    try {
      console.log(`Loading saved HSK data for article ID: ${id}`);

      // Try to get the article data from the public API
      const response = await fetch(`/api/articles/${id}?populate=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Error fetching article data: ${response.status} ${response.statusText}`);
        setHskData(DEFAULT_HSK_DATA);
        return;
      }

      const articleData = await response.json();
      console.log('Article data from API:', articleData);

      // Look for ChineseProcessor field in the response structure
      const processorData = articleData.data?.attributes?.ChineseProcessor;
      console.log('ChineseProcessor field found in API response:', processorData);

      if (processorData && processorData !== "") {
        let processorValue;

        try {
          // Parse if it's a string
          if (typeof processorData === 'string') {
            processorValue = JSON.parse(processorData);
          } else {
            processorValue = processorData;
          }

          // Extract HSK data from processor data
          const hskValue = processorValue?.hsk;

          // Validate structure
          if (hskValue &&
            typeof hskValue === 'object' &&
            'distribution' in hskValue &&
            Array.isArray(hskValue.distribution)) {
            console.log('Successfully loaded HSK data:', hskValue);
            setHskData(hskValue);
            saveHSKAsOriginal();
            return;
          } else {
            console.log('HSK data has invalid structure:', hskValue);
          }
        } catch (parseError) {
          console.error('Error parsing ChineseProcessor data:', parseError);
        }
      } else {
        console.log('No ChineseProcessor field found in response or field is empty');
      }

      // Default if no valid data found
      setHskData(DEFAULT_HSK_DATA);
    } catch (err) {
      console.error('Error loading HSK data:', err);
      setHskData(DEFAULT_HSK_DATA);
    }
  }, [setHskData, saveHSKAsOriginal]);

  /**
   * Calculate HSK level for an article
   */
  const calculateHSK = useCallback(async () => {
    if (!articleId) {
      onError(ERROR_MESSAGES.ARTICLE_ID_MISSING);
      return;
    }

    startHSKCalculation();

    try {
      // First, get the translation text from the article
      const articleResponse = await get(
        `/content-manager/collection-types/api::article.article/${articleId}`
      );

      if (!articleResponse.data) {
        throw new Error(ERROR_MESSAGES.RETRIEVE_ARTICLE_FAILED);
      }

      const translationText = articleResponse.data.Translation;

      if (!translationText) {
        throw new Error(ERROR_MESSAGES.TRANSLATION_REQUIRED);
      }

      console.log('Calculating HSK level...');

      // Use fetch directly with the correct format
      const response = await fetch(`/${pluginId}/hsk/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: translationText
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HSK calculation API error:', errorText);
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

      // Auto-save after calculation
      await updateHSKLevel(newHSKData);

      // Since we saved to server, update original
      saveHSKAsOriginal();

      console.log('HSK level calculation completed successfully');
      finishHSKCalculation();
      onSuccess(STATUS_MESSAGES.HSK_CALCULATED);
    } catch (err) {
      console.error('HSK calculation error:', err);
      setHSKCalculationError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.HSK_SAVE_FAILED);
    }
  }, [articleId, pluginId, get, setHskData, saveHSKAsOriginal, startHSKCalculation, finishHSKCalculation, setHSKCalculationError, onSuccess, onError]);

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
   * Save HSK level to the server
   */
  const saveHSKLevel = useCallback(async () => {
    if (!articleId || !hasHskChanges) return;

    try {
      await updateHSKLevel(hskData);

      // Since we saved to server, update original
      saveHSKAsOriginal();

      onSuccess(STATUS_MESSAGES.HSK_SAVED);
      // FIX: Return void instead of boolean to match Promise<void> return type
      return;
    } catch (err) {
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.HSK_SAVE_FAILED);
      // FIX: Return void instead of boolean to match Promise<void> return type
      return;
    }
  }, [articleId, hasHskChanges, hskData, saveHSKAsOriginal, onSuccess, onError]);

  /**
   * Update HSK level in the article
   */
  const updateHSKLevel = useCallback(async (data: HSKData) => {
    if (!articleId) return;

    try {
      console.log('Saving HSK data to article:', data);

      // Format HSK data for ChineseProcessor field
      const processorData = {
        hsk: data,
        // We could include grammar data here as well if needed
        grammar: {}
      };

      // Use direct API endpoint to update the article
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            // Use the new field name
            ChineseProcessor: processorData
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error saving HSK data: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to save HSK data: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('HSK data saved successfully:', result);
      return result;
    } catch (err) {
      console.error('Error saving HSK data:', err);
      throw err;
    }
  }, [articleId]);

  return {
    hskData,
    isCalculatingHSK,
    hasHskChanges,
    loadHSKData,
    calculateHSK,
    handleHSKLevelChange,
    saveHSKLevel
  };
};

export default useHSKManagement;