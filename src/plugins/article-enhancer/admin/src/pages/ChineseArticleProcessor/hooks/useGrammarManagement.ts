// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/hooks/useGrammarManagement.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../utils/types';
import {
  ERROR_MESSAGES,
  STATUS_MESSAGES,
  GRAMMAR_ENGINE_OPTIONS
} from '../../../utils/constants';
import { normalizeSentences } from '../../../utils/apiHelpers';
import { useLoadingState, useStateWithHistory } from '../../../hooks';

interface UseGrammarManagementProps {
  articleId: string | null;
  pluginId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Custom hook for managing grammar rules and translations
 */
const useGrammarManagement = ({
  articleId,
  pluginId,
  onSuccess,
  onError
}: UseGrammarManagementProps) => {
  // Grammar engine choice - Fixed type for the grammar engine
  const [engineChoice, setEngineChoice] = useState<GrammarEngineChoice>(GRAMMAR_ENGINE_OPTIONS.BOTH as GrammarEngineChoice);

  // Loading states
  const {
    isLoading: isTranslating,
    setLoading: startTranslating,
    setSuccess: finishTranslating,
    setError: setTranslationError
  } = useLoadingState();

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
    hasChanges: hasTranslationChanges,
    reset: resetSentences
  } = useStateWithHistory<GrammarRule[]>([]);

  // Direct management of selected rules within this hook
  const [selectedRules, setSelectedRules] = useState<SelectedRule[]>([]);
  const selectedRulesRef = useRef<SelectedRule[]>([]);

  // Update the ref whenever selectedRules changes
  useEffect(() => {
    selectedRulesRef.current = selectedRules;
    console.log('Selected rules updated (in effect):', selectedRules);
  }, [selectedRules]);

  // Modal states
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<{ sentenceIndex: number, ruleIndex: number } | null>(null);

  // Get Strapi's fetch client
  const { get, post } = useFetchClient();

  // Selection management functions
  const toggleRuleSelection = useCallback((sentenceIndex: number, ruleIndex: number) => {
    console.log(`Toggling rule selection for sentence ${sentenceIndex}, rule ${ruleIndex}`);

    setSelectedRules(prev => {
      // Check if this rule is already selected
      const isSelected = prev.some(
        rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
      );

      if (isSelected) {
        // Remove from selection
        const newSelection = prev.filter(
          rule => !(rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex)
        );
        console.log('New selection after toggle:', newSelection);
        return newSelection;
      } else {
        // Add to selection
        const newSelection = [...prev, { sentenceIndex, ruleIndex }];
        console.log('New selection after toggle:', newSelection);
        return newSelection;
      }
    });
  }, []);

  const isRuleSelected = useCallback((sentenceIndex: number, ruleIndex: number) => {
    return selectedRules.some(
      rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
    );
  }, [selectedRules]);

  const clearSelections = useCallback(() => {
    console.log('Clearing all selections');
    setSelectedRules([]);
  }, []);

  const validateSelections = useCallback(() => {
    console.log('Validating all selections against current sentences');

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
        console.log(`Removed ${prev.length - validSelections.length} invalid selections`);
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
   * This ensures that selections are correctly maintained after rules are removed
   */
  const updateSelectionsAfterDelete = useCallback((sentenceIndex: number, ruleIndex: number) => {
    console.log(`Updating selections after deleting sentence ${sentenceIndex}, rule ${ruleIndex}`);

    setSelectedRules(prev => {
      // Deep clone the previous selections to avoid reference issues
      const allSelections = JSON.parse(JSON.stringify(prev));

      // Track which selections we're modifying for debugging
      const removed: SelectedRule[] = [];
      const updated: SelectedRule[] = [];
      const preserved: SelectedRule[] = [];
      const updatedSelections: SelectedRule[] = [];

      // Process each selection
      for (let i = 0; i < allSelections.length; i++) {
        const selection = allSelections[i];

        // If this selection points to the exact rule being deleted, remove it
        if (selection.sentenceIndex === sentenceIndex && selection.ruleIndex === ruleIndex) {
          removed.push({ ...selection });
          // Skip adding it to updatedSelections (effectively removing it)
          continue;
        }

        // If selection is in the same sentence as the deleted rule
        if (selection.sentenceIndex === sentenceIndex) {
          if (selection.ruleIndex > ruleIndex) {
            // If the selection is after the deleted rule, adjust its index down by 1
            const updatedSelection = {
              sentenceIndex: selection.sentenceIndex,
              ruleIndex: selection.ruleIndex - 1
            };
            updated.push({ ...updatedSelection });
            updatedSelections.push(updatedSelection);
          } else {
            // If the selection is before the deleted rule, preserve it as is
            preserved.push({ ...selection });
            updatedSelections.push(selection);
          }
        } else {
          // For selections in other sentences, preserve as is
          preserved.push({ ...selection });
          updatedSelections.push(selection);
        }
      }

      console.log('Selections removed:', removed);
      console.log('Selections updated:', updated);
      console.log('Selections preserved:', preserved);
      console.log('Updated selections array:', updatedSelections);

      return updatedSelections;
    });
  }, []);

  /**
   * Load saved grammar data for an article
   */
  const loadGrammarData = useCallback(async (id: string) => {
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
   * Generate grammar rules for an article
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

      // FIX: First get the current translations map to preserve them
      const currentTranslations = new Map<string, string>();
      sentences.forEach(sentence => {
        if (sentence.sentence && sentence.translation) {
          currentTranslations.set(sentence.sentence, sentence.translation);
        }
      });

      // Generate grammar rules
      console.log(`Generating grammar rules for article ID: ${articleId}`);
      const genResponse = await post(`/${pluginId}/grammar/generate`, {
        data: {
          text: translationText,
          engineChoice
        }
      });

      if (!genResponse.data) {
        throw new Error(ERROR_MESSAGES.GRAMMAR_GENERATION_FAILED);
      }

      // FIX: Preserve translations from previous sentences when possible
      const newSentences = normalizeSentences(genResponse.data.data.sentences);

      // Apply previous translations where the sentence text matches
      const updatedSentences = newSentences.map(sentence => {
        const existingTranslation = currentTranslations.get(sentence.sentence);
        if (existingTranslation) {
          return { ...sentence, translation: existingTranslation };
        }
        return sentence;
      });

      // Save to database
      console.log("Saving grammar data...");
      const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
        data: {
          sentences: updatedSentences
        }
      });

      if (!saveResponse.data) {
        throw new Error(ERROR_MESSAGES.GRAMMAR_SAVE_FAILED);
      }

      setSentences(updatedSentences);
      saveOriginalSentences();

      console.log("Grammar rules generated and saved successfully");
      finishProcessing();
      onSuccess(STATUS_MESSAGES.GRAMMAR_GENERATED);
    } catch (err) {
      console.error("Error in grammar rule generation:", err);
      setProcessingError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.GRAMMAR_GENERATION_FAILED);
    }
  }, [articleId, pluginId, engineChoice, sentences, get, post, setSentences, saveOriginalSentences, clearSelections, startProcessing, finishProcessing, setProcessingError, onSuccess, onError]);

  /**
   * Translate all sentences in bulk
   */
  const translateAllSentences = useCallback(async () => {
    if (!sentences || sentences.length === 0) {
      onError(ERROR_MESSAGES.NO_SENTENCES);
      return;
    }

    startTranslating();

    try {
      console.log('Starting bulk translation...');
      // Prepare sentences array
      const sentenceTexts = sentences.map(s => s.sentence).filter(Boolean);

      if (sentenceTexts.length === 0) {
        throw new Error(ERROR_MESSAGES.NO_VALID_SENTENCES);
      }

      // Call the sentences processing endpoint
      const response = await post(`/${pluginId}/process-sentences`, {
        data: {
          sentences: sentenceTexts
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
      const updatedSentences = sentences.map((sentence, index) => ({
        ...sentence,
        translation: translations[index] || sentence.translation
      }));

      // Save to database
      if (articleId) {
        console.log("Saving translations...");
        const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
          data: {
            sentences: updatedSentences
          }
        });

        if (!saveResponse.data) {
          throw new Error(ERROR_MESSAGES.TRANSLATION_SAVE_FAILED);
        }
      }

      console.log('Translations completed successfully');
      setSentences(updatedSentences);
      saveOriginalSentences();

      finishTranslating();
      onSuccess(STATUS_MESSAGES.SENTENCES_TRANSLATED);
    } catch (err) {
      console.error('Translation error:', err);
      setTranslationError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.TRANSLATION_FAILED);
    }
  }, [sentences, articleId, pluginId, post, setSentences, saveOriginalSentences, startTranslating, finishTranslating, setTranslationError, onSuccess, onError]);

  /**
   * Handle direct translation change for a single sentence
   */
  const handleTranslationChange = useCallback((index: number, newTranslation: string) => {
    const updatedSentences = [...sentences];
    if (updatedSentences[index]) {
      updatedSentences[index].translation = newTranslation;
      setSentences(updatedSentences);
    }
  }, [sentences, setSentences]);

  /**
   * Save all translation changes
   */
  const saveAllTranslations = useCallback(async () => {
    if (!articleId || !hasTranslationChanges) return;

    startProcessing();

    try {
      console.log("Saving all translation changes...");
      const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
        data: {
          sentences: sentences
        }
      });

      if (!saveResponse.data) {
        throw new Error(ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);
      }

      saveOriginalSentences();

      finishProcessing();
      onSuccess(STATUS_MESSAGES.TRANSLATIONS_SAVED);

      // FIX: Return void instead of boolean
      return;
    } catch (err) {
      console.error("Error saving translations:", err);
      setProcessingError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);

      // FIX: Return void instead of boolean
      return;
    }
  }, [articleId, hasTranslationChanges, sentences, pluginId, post, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onSuccess, onError]);

  /**
   * Show delete confirmation for a single rule
   */
  const handleShowDeleteConfirm = useCallback((sentenceIndex: number, ruleIndex: number) => {
    console.log(`Showing delete confirmation for sentence ${sentenceIndex}, rule ${ruleIndex}`);
    setRuleToDelete({ sentenceIndex, ruleIndex });
    setIsDeleteModalVisible(true);
  }, []);

  /**
   * Delete a single rule after confirmation
   */
  const handleDeleteRuleConfirmed = useCallback(async () => {
    if (!ruleToDelete) return;

    const { sentenceIndex, ruleIndex } = ruleToDelete;
    startProcessing();

    try {
      console.log(`Confirmed deletion of rule at sentence ${sentenceIndex}, rule ${ruleIndex}`);

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
          console.log(`Deleting rule ${ruleIndex} from sentence ${sentenceIndex}...`);
          const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
            data: {
              sentences: updatedSentences
            }
          });

          if (!saveResponse.data) {
            throw new Error(ERROR_MESSAGES.UPDATE_GRAMMAR_FAILED);
          }

          saveOriginalSentences();

          finishProcessing();
          onSuccess(STATUS_MESSAGES.RULE_DELETED);
        }
      }
    } catch (err) {
      console.error("Error deleting rule:", err);
      setProcessingError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.DELETE_RULE_FAILED);
    } finally {
      setIsDeleteModalVisible(false);
      setRuleToDelete(null);
    }
  }, [ruleToDelete, sentences, articleId, pluginId, post, setSentences, saveOriginalSentences, updateSelectionsAfterDelete, startProcessing, finishProcessing, setProcessingError, onSuccess, onError]);

  /**
   * Show confirmation for bulk deletion
   */
  const handleShowBulkDeleteConfirm = useCallback(() => {
    console.log("Show bulk delete confirmation called");
    // Use the ref to get the most current selection
    const currentSelection = selectedRulesRef.current;
    console.log("Selected rules count from ref:", currentSelection.length);

    if (currentSelection.length === 0) {
      onError(ERROR_MESSAGES.NO_RULES_SELECTED);
      return;
    }

    console.log("Opening bulk delete modal");
    setIsBulkDeleteModalVisible(true);
  }, [onError]);

  /**
   * Bulk delete selected rules after confirmation
   */
  const handleBulkDeleteConfirmed = useCallback(async () => {
    // Use the ref to get the most current selection
    const currentSelection = selectedRulesRef.current;
    console.log("Starting bulk delete operation...");
    console.log("Selected rules from ref:", currentSelection);

    if (currentSelection.length === 0 || !articleId) {
      console.log("No rules selected or no article ID - exiting.");
      return;
    }

    startProcessing();

    try {
      console.log(`Bulk deleting ${currentSelection.length} rules...`);

      // Create a deep copy of the sentences array
      const updatedSentences = JSON.parse(JSON.stringify(sentences));
      console.log("Original sentences structure:", updatedSentences.map((s: any) => ({
        id: s.sentence.substring(0, 10) + "...",
        ruleCount: s.rules.length
      })));

      // Sort selected rules in reverse order (by sentence and rule index)
      // This ensures we delete from the end first to avoid index shifting problems
      const sortedRules = [...currentSelection].sort((a, b) => {
        if (a.sentenceIndex !== b.sentenceIndex) {
          return b.sentenceIndex - a.sentenceIndex;
        }
        return b.ruleIndex - a.ruleIndex;
      });
      console.log("Sorted rules for deletion:", sortedRules);

      // Remove each rule in reverse order
      for (const { sentenceIndex, ruleIndex } of sortedRules) {
        console.log(`Attempting to delete rule at sentence ${sentenceIndex}, rule ${ruleIndex}`);

        if (updatedSentences[sentenceIndex] &&
          updatedSentences[sentenceIndex].rules &&
          updatedSentences[sentenceIndex].rules.length > ruleIndex) {

          console.log(`Deleting rule: "${updatedSentences[sentenceIndex].rules[ruleIndex].substring(0, 20)}..."`);
          updatedSentences[sentenceIndex].rules.splice(ruleIndex, 1);
        } else {
          console.warn(`Could not find rule at sentence ${sentenceIndex}, rule ${ruleIndex}`);
        }
      }

      console.log("Updated sentences after deletion:", updatedSentences.map((s: any) => ({
        id: s.sentence.substring(0, 10) + "...",
        ruleCount: s.rules.length
      })));

      // Save the updated data to the server
      console.log("Saving updated sentences to server...");
      const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
        data: {
          sentences: updatedSentences
        }
      });

      if (!saveResponse.data) {
        throw new Error(ERROR_MESSAGES.UPDATE_GRAMMAR_FAILED);
      }

      console.log("Server save successful, updating UI state...");
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
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.BULK_DELETE_FAILED);
    } finally {
      console.log("Closing bulk delete modal");
      setIsBulkDeleteModalVisible(false);
    }
  }, [articleId, sentences, clearSelections, pluginId, post, setSentences, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onSuccess, onError]);

  /**
   * Handle engine choice change
   */
  const handleEngineChange = useCallback((engine: GrammarEngineChoice) => {
    setEngineChoice(engine);
  }, []);

  return {
    // State
    sentences,
    engineChoice,
    hasTranslationChanges,
    isProcessing,
    isTranslating,
    selectedRules,
    isDeleteModalVisible,
    isBulkDeleteModalVisible,
    ruleToDelete,

    // Grammar/translation actions
    loadGrammarData,
    generateGrammarRules,
    handleEngineChange,
    translateAllSentences,
    handleTranslationChange,
    saveAllTranslations,

    // Selection/deletion actions
    toggleRuleSelection,
    isRuleSelected,
    handleShowDeleteConfirm,
    handleDeleteRuleConfirmed,
    handleShowBulkDeleteConfirm,
    handleBulkDeleteConfirmed,
    setIsDeleteModalVisible,
    setIsBulkDeleteModalVisible,

    // Utility properties
    hasSentences: sentences.length > 0,
    selectedRulesCount: selectedRules.length
  };
};

export default useGrammarManagement;