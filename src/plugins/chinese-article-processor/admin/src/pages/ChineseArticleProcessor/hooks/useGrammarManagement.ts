// hooks/useGrammarManagement.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../utils/types';
import { ERROR_MESSAGES, STATUS_MESSAGES, GRAMMAR_ENGINE_OPTIONS } from '../../../utils/constants';
import { useLoadingState } from '../../../hooks';

// New interface for batch options
interface BatchOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  concurrentRequests?: number;
}

interface UseGrammarManagementProps {
  articleId: string | null;
  pluginId: string;
  sentences: GrammarRule[];
  setSentences: (sentences: GrammarRule[]) => void;
  startProcessing: () => void;
  finishProcessing: () => void;
  setProcessingError: () => void;
  saveOriginalSentences: () => void;
  updateArticleWithProcessorData: (articleId: string, grammarSentences: GrammarRule[]) => Promise<any>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * FIXED: Custom hook for managing grammar rules
 * CRITICAL FIX: Corrected per_languages content ID retrieval
 */
const useGrammarManagement = ({
  articleId,
  pluginId,
  sentences,
  setSentences,
  startProcessing,
  finishProcessing,
  setProcessingError,
  saveOriginalSentences,
  updateArticleWithProcessorData,
  onSuccess,
  onError
}: UseGrammarManagementProps) => {
  // Grammar engine choice
  const [engineChoice, setEngineChoice] = useState<GrammarEngineChoice>(GRAMMAR_ENGINE_OPTIONS.BOTH as GrammarEngineChoice);

  // Batch processing options
  const [useBatch, setUseBatch] = useState<boolean>(false); // Disable batch by default
  const [batchOptions, setBatchOptions] = useState<BatchOptions>({
    batchSize: 5,
    maxRetries: 3,
    retryDelay: 1000,
    concurrentRequests: 1
  });

  // Direct management of selected rules within this hook
  const [selectedRules, setSelectedRules] = useState<SelectedRule[]>([]);
  const selectedRulesRef = useRef<SelectedRule[]>([]);

  // Update the ref whenever selectedRules changes
  useEffect(() => {
    selectedRulesRef.current = selectedRules;
  }, [selectedRules]);

  // Modal states for rule deletion
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<{ sentenceIndex: number, ruleIndex: number } | null>(null);

  // Get Strapi's fetch client
  const { get, post } = useFetchClient();

  /**
   * Get translation content from per_languages table ONLY
   */
  const getTranslationContent = useCallback(async (articleId: string): Promise<string | null> => {
    try {
      console.log(`[GrammarManagement] Getting translation content for article ${articleId}`);

      const perLanguageResponse = await fetch(`/per-language/article/${articleId}/content?language=zh`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (perLanguageResponse.ok) {
        const perLanguageData = await perLanguageResponse.json();
        if (perLanguageData.data?.per_language_text) {
          console.log(`[GrammarManagement] ✅ Found content in per_languages table`);
          return perLanguageData.data.per_language_text;
        }
      }

      console.log(`[GrammarManagement] ❌ No translation content found in per_languages table`);
      throw new Error('No translated content found. Please translate the content first using the Language Processor field.');
    } catch (error) {
      console.error(`[GrammarManagement] Error getting translation content:`, error);
      throw error;
    }
  }, []);

  // Selection management functions
  const toggleRuleSelection = useCallback((sentenceIndex: number, ruleIndex: number) => {
    setSelectedRules(prev => {
      // Check if this rule is already selected
      const isSelected = prev.some(
        rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
      );

      if (isSelected) {
        // Remove from selection
        return prev.filter(
          rule => !(rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex)
        );
      } else {
        // Add to selection
        return [...prev, { sentenceIndex, ruleIndex }];
      }
    });
  }, []);

  const isRuleSelected = useCallback((sentenceIndex: number, ruleIndex: number) => {
    return selectedRules.some(
      rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
    );
  }, [selectedRules]);

  const clearSelections = useCallback(() => {
    setSelectedRules([]);
  }, []);

  const validateSelections = useCallback(() => {
    setSelectedRules(prev => {
      const validSelections = prev.filter(selection => {
        const sentenceExists = selection.sentenceIndex < sentences.length;
        const ruleExists = sentenceExists &&
          sentences[selection.sentenceIndex]?.rules &&
          selection.ruleIndex < sentences[selection.sentenceIndex].rules.length;

        return sentenceExists && ruleExists;
      });

      // Only update state if selections actually changed
      if (validSelections.length !== prev.length) {
        return validSelections;
      }
      return prev;
    });
  }, [sentences]);

  // Validate selections whenever sentences change
  useEffect(() => {
    validateSelections();
  }, [sentences, validateSelections]);

  /**
   * Update selections when rules are deleted
   */
  const updateSelectionsAfterDelete = useCallback((sentenceIndex: number, ruleIndex: number) => {
    setSelectedRules(prev => {
      const allSelections = JSON.parse(JSON.stringify(prev));
      const updatedSelections: SelectedRule[] = [];

      for (let i = 0; i < allSelections.length; i++) {
        const selection = allSelections[i];

        // If this selection points to the exact rule being deleted, remove it
        if (selection.sentenceIndex === sentenceIndex && selection.ruleIndex === ruleIndex) {
          continue;
        }

        // If selection is in the same sentence as the deleted rule
        if (selection.sentenceIndex === sentenceIndex) {
          if (selection.ruleIndex > ruleIndex) {
            // If the selection is after the deleted rule, adjust its index down by 1
            updatedSelections.push({
              sentenceIndex: selection.sentenceIndex,
              ruleIndex: selection.ruleIndex - 1
            });
          } else {
            // If the selection is before the deleted rule, preserve it as is
            updatedSelections.push(selection);
          }
        } else {
          // For selections in other sentences, preserve as is
          updatedSelections.push(selection);
        }
      }

      return updatedSelections;
    });
  }, []);

  /**
   * FIXED: Generate grammar rules for an article with correct error handling
   */
  const generateGrammarRules = useCallback(async () => {
    if (!articleId) {
      onError(ERROR_MESSAGES.ARTICLE_ID_MISSING);
      return;
    }

    startProcessing();
    clearSelections();

    try {
      console.log('Starting grammar rule generation...');

      // Get translation content from per_languages table ONLY
      const translationText = await getTranslationContent(articleId);

      console.log('Found translation content, preserving existing translations...');

      // First get the current translations to preserve them
      const currentTranslations = new Map<string, any[]>();
      sentences.forEach(sentence => {
        if (sentence.sentence) {
          // Collect all translations for each sentence
          const translations: any[] = [];

          // Add the legacy translation if it exists
          if (sentence.translation) {
            translations.push({ language: 'en', text: sentence.translation });
          }

          // Add new format translations if they exist
          if (Array.isArray(sentence.translations)) {
            // Add translations that aren't already in the list as English
            sentence.translations.forEach(trans => {
              if (!translations.some(t => t.language === trans.language)) {
                translations.push(trans);
              }
            });
          }

          if (translations.length > 0) {
            currentTranslations.set(sentence.sentence, translations);
          }
        }
      });

      // Generate grammar rules with batch processing options
      console.log(`Generating grammar rules for article ID: ${articleId} with batch processing: ${useBatch}`);

      // Include batch processing options in the request
      const requestData = {
        text: translationText,
        engineChoice,
        useBatch,
        batchOptions
      };

      const genResponse = await post(`/${pluginId}/grammar/generate`, {
        data: requestData
      });

      if (!genResponse.data) {
        throw new Error(ERROR_MESSAGES.GRAMMAR_GENERATION_FAILED);
      }

      // Get the new sentences array from the response
      const newSentences = genResponse.data.data.sentences || [];

      // Apply previous translations where the sentence text matches
      const updatedSentences = newSentences.map((sentence: GrammarRule) => {
        const existingTranslations = currentTranslations.get(sentence.sentence);
        if (existingTranslations) {
          // If we have existing translations, add them to the new sentence
          return {
            ...sentence,
            translation: existingTranslations.find(t => t.language === 'en')?.text || '',
            translations: existingTranslations
          };
        }
        return sentence;
      });

      // Save to grammar plugin database (this will preserve HSK data automatically)
      console.log("Saving grammar data to plugin database...");
      const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
        data: {
          sentences: updatedSentences
        }
      });

      if (!saveResponse.data) {
        throw new Error(ERROR_MESSAGES.GRAMMAR_SAVE_FAILED);
      }

      // Also save to per_languages table with HSK preservation
      console.log("Saving grammar data to per_languages table with HSK preservation...");
      await updateArticleWithProcessorData(articleId, updatedSentences);

      setSentences(updatedSentences);
      saveOriginalSentences();

      console.log("Grammar rules generated and saved successfully with HSK data preserved");
      finishProcessing();
      onSuccess('Grammar rules generated successfully');
    } catch (err) {
      console.error("Error in grammar rule generation:", err);
      setProcessingError();

      // Enhanced error messages for per_languages issues
      if (err instanceof Error && err.message.includes('per_language')) {
        onError('No translated content found. Please translate the content first using the Language Processor field.');
      } else if (err instanceof Error && err.message.includes('content ID')) {
        onError('Failed to access language data. Please ensure the content is properly translated.');
      } else {
        onError(err instanceof Error ? err.message : ERROR_MESSAGES.GRAMMAR_GENERATION_FAILED);
      }
    }
  }, [
    articleId,
    pluginId,
    engineChoice,
    useBatch,
    batchOptions,
    sentences,
    post,
    setSentences,
    saveOriginalSentences,
    clearSelections,
    startProcessing,
    finishProcessing,
    setProcessingError,
    onSuccess,
    onError,
    updateArticleWithProcessorData,
    getTranslationContent
  ]);

  /**
   * Show delete confirmation for a single rule
   */
  const handleShowDeleteConfirm = useCallback((sentenceIndex: number, ruleIndex: number) => {
    setRuleToDelete({ sentenceIndex, ruleIndex });
    setIsDeleteModalVisible(true);
  }, []);

  /**
   * FIXED: Delete a single rule after confirmation with proper error handling
   */
  const handleDeleteRuleConfirmed = useCallback(async () => {
    if (!ruleToDelete) return;

    const { sentenceIndex, ruleIndex } = ruleToDelete;
    startProcessing();

    try {
      // Create a copy of the sentences array
      const updatedSentences = [...sentences];

      // Remove the rule from the specific sentence
      if (updatedSentences[sentenceIndex] &&
        updatedSentences[sentenceIndex].rules &&
        updatedSentences[sentenceIndex].rules.length > ruleIndex) {

        // Remove the rule from the array
        updatedSentences[sentenceIndex].rules.splice(ruleIndex, 1);

        // Update the sentences state
        setSentences(updatedSentences);

        // Update selections after deletion
        updateSelectionsAfterDelete(sentenceIndex, ruleIndex);

        // Save the updated data to the server
        if (articleId) {
          // Save to grammar plugin database
          const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
            data: {
              sentences: updatedSentences
            }
          });

          if (!saveResponse.data) {
            throw new Error(ERROR_MESSAGES.UPDATE_GRAMMAR_FAILED);
          }

          // Also save to per_languages table with HSK preservation
          await updateArticleWithProcessorData(articleId, updatedSentences);

          saveOriginalSentences();

          finishProcessing();
          onSuccess('Grammar rule deleted successfully');
        }
      }
    } catch (err) {
      console.error("Error deleting rule:", err);
      setProcessingError();

      // Enhanced error messages for per_languages issues
      if (err instanceof Error && err.message.includes('per_language')) {
        onError('Failed to save changes. Please ensure the content is translated first.');
      } else if (err instanceof Error && err.message.includes('content ID')) {
        onError('Failed to access language data. Please ensure the content is properly translated.');
      } else {
        onError(err instanceof Error ? err.message : ERROR_MESSAGES.DELETE_RULE_FAILED);
      }
    } finally {
      setIsDeleteModalVisible(false);
      setRuleToDelete(null);
    }
  }, [
    ruleToDelete,
    sentences,
    articleId,
    pluginId,
    post,
    setSentences,
    saveOriginalSentences,
    updateSelectionsAfterDelete,
    startProcessing,
    finishProcessing,
    setProcessingError,
    onSuccess,
    onError,
    updateArticleWithProcessorData
  ]);

  /**
   * FIXED: Bulk delete selected rules after confirmation with proper error handling
   */
  const handleBulkDeleteConfirmed = useCallback(async () => {
    // Use the ref to get the most current selection
    const currentSelection = selectedRulesRef.current;

    if (currentSelection.length === 0 || !articleId) {
      return;
    }

    startProcessing();

    try {
      // Create a deep copy of the sentences array
      const updatedSentences = JSON.parse(JSON.stringify(sentences));

      // Sort selected rules in reverse order (by sentence and rule index)
      // This ensures we delete from the end first to avoid index shifting problems
      const sortedRules = [...currentSelection].sort((a, b) => {
        if (a.sentenceIndex !== b.sentenceIndex) {
          return b.sentenceIndex - a.sentenceIndex;
        }
        return b.ruleIndex - a.ruleIndex;
      });

      // Remove each rule in reverse order
      for (const { sentenceIndex, ruleIndex } of sortedRules) {
        if (updatedSentences[sentenceIndex] &&
          updatedSentences[sentenceIndex].rules &&
          updatedSentences[sentenceIndex].rules.length > ruleIndex) {

          updatedSentences[sentenceIndex].rules.splice(ruleIndex, 1);
        }
      }

      // Save to grammar plugin database
      const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
        data: {
          sentences: updatedSentences
        }
      });

      if (!saveResponse.data) {
        throw new Error(ERROR_MESSAGES.UPDATE_GRAMMAR_FAILED);
      }

      // Also save to per_languages table with HSK preservation
      await updateArticleWithProcessorData(articleId, updatedSentences);

      // Update the sentences state
      setSentences(updatedSentences);
      saveOriginalSentences();

      // Clear selection
      clearSelections();

      finishProcessing();
      onSuccess(STATUS_MESSAGES.BULK_DELETE_SUCCESS(sortedRules.length));
    } catch (err) {
      console.error("Error bulk deleting rules:", err);
      setProcessingError();

      // Enhanced error messages for per_languages issues
      if (err instanceof Error && err.message.includes('per_language')) {
        onError('Failed to save changes. Please ensure the content is translated first.');
      } else if (err instanceof Error && err.message.includes('content ID')) {
        onError('Failed to access language data. Please ensure the content is properly translated.');
      } else {
        onError(err instanceof Error ? err.message : ERROR_MESSAGES.BULK_DELETE_FAILED);
      }
    }
  }, [
    articleId,
    sentences,
    clearSelections,
    pluginId,
    post,
    setSentences,
    saveOriginalSentences,
    startProcessing,
    finishProcessing,
    setProcessingError,
    onSuccess,
    onError,
    updateArticleWithProcessorData
  ]);

  /**
   * Handle engine choice change
   */
  const handleEngineChange = useCallback((engine: GrammarEngineChoice) => {
    setEngineChoice(engine);
  }, []);

  /**
   * Toggle batch processing
   */
  const toggleBatchProcessing = useCallback((value: boolean) => {
    setUseBatch(value);
  }, []);

  /**
   * Update batch options
   */
  const updateBatchOptions = useCallback((options: BatchOptions) => {
    setBatchOptions(prev => ({
      ...prev,
      ...options
    }));
  }, []);

  return {
    // State
    engineChoice,
    selectedRules,
    isDeleteModalVisible,
    ruleToDelete,
    useBatch,
    batchOptions,

    // Grammar rule actions
    generateGrammarRules,
    handleEngineChange,
    toggleBatchProcessing,
    updateBatchOptions,

    // Selection/deletion actions
    toggleRuleSelection,
    isRuleSelected,
    clearSelections,
    handleShowDeleteConfirm,
    handleDeleteRuleConfirmed,
    handleBulkDeleteConfirmed,
    setIsDeleteModalVisible,

    // Utility properties
    selectedRulesCount: selectedRules.length
  };
};

export default useGrammarManagement;