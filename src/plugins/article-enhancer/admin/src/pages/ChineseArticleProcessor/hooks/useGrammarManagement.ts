// hooks/useGrammarManagement.ts - Refactored to focus only on grammar rules

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../utils/types';
import { ERROR_MESSAGES, STATUS_MESSAGES, GRAMMAR_ENGINE_OPTIONS } from '../../../utils/constants';
import { useLoadingState } from '../../../hooks';

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
 * Custom hook for managing grammar rules
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

      // Save to grammar plugin database
      console.log("Saving grammar data to plugin database...");
      const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
        data: {
          sentences: updatedSentences
        }
      });

      if (!saveResponse.data) {
        throw new Error(ERROR_MESSAGES.GRAMMAR_SAVE_FAILED);
      }

      // Also save to the article's ChineseProcessor field
      console.log("Saving grammar data to article's ChineseProcessor field...");
      await updateArticleWithProcessorData(articleId, updatedSentences);

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
  }, [
    articleId,
    pluginId,
    engineChoice,
    sentences,
    get,
    post,
    setSentences,
    saveOriginalSentences,
    clearSelections,
    startProcessing,
    finishProcessing,
    setProcessingError,
    onSuccess,
    onError,
    updateArticleWithProcessorData
  ]);

  /**
   * Show delete confirmation for a single rule
   */
  const handleShowDeleteConfirm = useCallback((sentenceIndex: number, ruleIndex: number) => {
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

          // Also save to the article's ChineseProcessor field
          await updateArticleWithProcessorData(articleId, updatedSentences);

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
  * Bulk delete selected rules after confirmation
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

      // Also save to the article's ChineseProcessor field
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
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.BULK_DELETE_FAILED);
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

  return {
    // State
    engineChoice,
    selectedRules,
    isDeleteModalVisible,
    ruleToDelete,

    // Grammar rule actions
    generateGrammarRules,
    handleEngineChange,

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