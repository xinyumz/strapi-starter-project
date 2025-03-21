// Updated useGrammarManagement.ts with multi-language translation support
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule, GrammarEngineChoice, SelectedRule, Translation } from '../../../utils/types';
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

interface SupportedLanguage {
  code: string;
  name: string;
}

/**
 * Custom hook for managing grammar rules and translations with multi-language support
 */
const useGrammarManagement = ({
  articleId,
  pluginId,
  onSuccess,
  onError
}: UseGrammarManagementProps) => {
  // Grammar engine choice
  const [engineChoice, setEngineChoice] = useState<GrammarEngineChoice>(GRAMMAR_ENGINE_OPTIONS.BOTH as GrammarEngineChoice);

  // Active translation language
  const [activeLanguage, setActiveLanguage] = useState<string>('en');

  // Supported languages
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([
    { code: 'en', name: 'English' }
  ]);

  const [hasSupportedLanguages, setHasSupportedLanguages] = useState<boolean>(true);

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
  }, [selectedRules]);

  // Modal states
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<{ sentenceIndex: number, ruleIndex: number } | null>(null);

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
          // When languages endpoint fails, still show English as an option
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
   * Update the article with grammar data
   */
  const updateArticleWithGrammarData = useCallback(async (articleId: string, grammarSentences: GrammarRule[]) => {
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
        console.error('Error updating article with grammar data:', errorText);
        throw new Error(`Failed to update article: ${updateResponse.status}`);
      }

      return await updateResponse.json();
    } catch (error) {
      console.error('Error in updateArticleWithGrammarData:', error);
      throw error;
    }
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

      // First get the current translations to preserve them
      const currentTranslations = new Map<string, Translation[]>();
      sentences.forEach(sentence => {
        if (sentence.sentence) {
          // Collect all translations for each sentence
          const translations: Translation[] = [];

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

      // Preserve translations from previous sentences when possible
      const newSentences = normalizeSentences(genResponse.data.data.sentences);

      // Apply previous translations where the sentence text matches
      const updatedSentences = newSentences.map(sentence => {
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
      await updateArticleWithGrammarData(articleId, updatedSentences);

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
  }, [articleId, pluginId, engineChoice, sentences, get, post, setSentences, saveOriginalSentences, clearSelections, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithGrammarData]);

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
        await updateArticleWithGrammarData(articleId, updatedSentences);
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
  }, [sentences, articleId, pluginId, activeLanguage, post, setSentences, saveOriginalSentences, startTranslating, finishTranslating, setTranslationError, onSuccess, onError, updateArticleWithGrammarData]);

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
        await updateArticleWithGrammarData(articleId, updatedSentences);
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
  }, [sentences, articleId, pluginId, post, setSentences, saveOriginalSentences, setActiveLanguage, startTranslating, finishTranslating, setTranslationError, onSuccess, onError, updateArticleWithGrammarData]);

  /**
   * Remove a language translation from all sentences
   */
  const removeBulkTranslation = useCallback(async (language: string) => {
    if (!sentences.length || language === 'en') return;

    startProcessing();

    try {
      console.log(`Removing all translations for language: ${language}...`);

      // Update all sentences to remove the specified language
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

      // Save to plugin database
      if (articleId) {
        console.log("Saving updated translations to plugin database...");
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
        await updateArticleWithGrammarData(articleId, updatedSentences);
      }

      console.log(`Successfully removed all translations for language: ${language}`);
      setSentences(updatedSentences);
      saveOriginalSentences();

      // If active language was the removed one, switch to English
      if (activeLanguage === language) {
        setActiveLanguage('en');
      }

      finishProcessing();
      onSuccess(`Removed all ${language} translations successfully`);

    } catch (err) {
      console.error('Error removing translations:', err);
      setProcessingError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.TRANSLATION_FAILED);
    }
  }, [sentences, articleId, activeLanguage, pluginId, post, setSentences, saveOriginalSentences, setActiveLanguage, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithGrammarData]);

  /**
   * Save all translation changes
   */
  const saveAllTranslations = useCallback(async () => {
    if (!articleId || !hasTranslationChanges) return;

    startProcessing();

    try {
      console.log("Saving all translation changes...");

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
      console.log("Saving translations to article's ChineseProcessor field...");
      await updateArticleWithGrammarData(articleId, sentences);

      saveOriginalSentences();

      finishProcessing();
      onSuccess(STATUS_MESSAGES.TRANSLATIONS_SAVED);

      return;
    } catch (err) {
      console.error("Error saving translations:", err);
      setProcessingError();
      onError(err instanceof Error ? err.message : ERROR_MESSAGES.SAVE_TRANSLATIONS_FAILED);

      return;
    }
  }, [articleId, hasTranslationChanges, sentences, pluginId, post, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithGrammarData]);

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
          await updateArticleWithGrammarData(articleId, updatedSentences);

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
  }, [ruleToDelete, sentences, articleId, pluginId, post, setSentences, saveOriginalSentences, updateSelectionsAfterDelete, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithGrammarData]);

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
      await updateArticleWithGrammarData(articleId, updatedSentences);

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
  }, [articleId, sentences, clearSelections, pluginId, post, setSentences, saveOriginalSentences, startProcessing, finishProcessing, setProcessingError, onSuccess, onError, updateArticleWithGrammarData]);

  /**
  * Handle engine choice change
  */
  const handleEngineChange = useCallback((engine: GrammarEngineChoice) => {
    setEngineChoice(engine);
  }, []);

  /**
  * Handle active language change
  */
  const handleLanguageChange = useCallback((language: string) => {
    setActiveLanguage(language);
  }, []);

  return {
    // State
    sentences,
    engineChoice,
    activeLanguage,
    supportedLanguages,
    hasSupportedLanguages,
    hasTranslationChanges,
    isProcessing,
    isTranslating,
    selectedRules,
    isDeleteModalVisible,
    ruleToDelete,

    // Grammar/translation actions
    loadGrammarData,
    generateGrammarRules,
    handleEngineChange,
    handleLanguageChange,
    translateAllSentences,
    handleTranslationChange,
    addTranslation,
    removeTranslation,
    addBulkTranslation,
    removeBulkTranslation,
    saveAllTranslations,

    // Selection/deletion actions
    toggleRuleSelection,
    isRuleSelected,
    handleShowDeleteConfirm,
    handleDeleteRuleConfirmed,
    handleBulkDeleteConfirmed,
    setIsDeleteModalVisible,

    // Utility properties
    hasSentences: sentences.length > 0,
    selectedRulesCount: selectedRules.length
  };
};

export default useGrammarManagement;