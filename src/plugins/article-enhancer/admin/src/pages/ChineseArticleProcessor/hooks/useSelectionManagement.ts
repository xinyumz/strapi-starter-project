// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/hooks/useSelectionManagement.ts
import { useState, useCallback, useEffect } from 'react';
import { SelectedRule } from '../../../utils/types';

/**
 * Custom hook for managing the selection of grammar rules.
 * Provides methods for selecting, deselecting, and checking the selection status of rules.
 * 
 * @returns Object with selection state and management functions
 */
const useSelectionManagement = () => {
  // State to track selected rules
  const [selectedRules, setSelectedRules] = useState<SelectedRule[]>([]);

  // Debug logging for selectedRules
  useEffect(() => {
    console.log('Selected rules updated:', selectedRules);
  }, [selectedRules]);

  // Toggle selection state of a rule
  const toggleRuleSelection = useCallback((sentenceIndex: number, ruleIndex: number) => {
    console.log(`Toggling rule selection for sentence ${sentenceIndex}, rule ${ruleIndex}`);

    // Check if this rule is already selected
    const isSelected = selectedRules.some(
      rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
    );

    if (isSelected) {
      // Remove from selection
      setSelectedRules(prev => prev.filter(
        rule => !(rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex)
      ));
    } else {
      // Add to selection
      setSelectedRules(prev => [...prev, { sentenceIndex, ruleIndex }]);
    }
  }, [selectedRules]);

  // Check if a rule is selected
  const isRuleSelected = useCallback((sentenceIndex: number, ruleIndex: number) => {
    return selectedRules.some(
      rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
    );
  }, [selectedRules]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    console.log('Clearing all selections');
    setSelectedRules([]);
  }, []);

  // Get selected rules sorted in reverse order (for safe deletion)
  const getSortedSelections = useCallback(() => {
    return [...selectedRules].sort((a, b) => {
      if (a.sentenceIndex !== b.sentenceIndex) {
        return b.sentenceIndex - a.sentenceIndex;
      }
      return b.ruleIndex - a.ruleIndex;
    });
  }, [selectedRules]);

  /**
   * Update selections when rules are deleted
   * This ensures that selections are correctly maintained after rules are removed
   */
  const updateSelectionsAfterDelete = useCallback((sentenceIndex: number, ruleIndex: number, sentences: any[]) => {
    console.log(`Updating selections after deleting sentence ${sentenceIndex}, rule ${ruleIndex}`);

    // Create an updated selection list
    const updatedSelections = selectedRules.map(selection => {
      // Rule in same sentence, after the deleted rule
      if (selection.sentenceIndex === sentenceIndex && selection.ruleIndex > ruleIndex) {
        // Shift selection up by one
        return { ...selection, ruleIndex: selection.ruleIndex - 1 };
      }
      // Leave all other selections unchanged
      return selection;
    }).filter(selection => {
      // Remove invalid selections (outside array bounds)
      const sentenceExists = selection.sentenceIndex < sentences.length;
      const ruleExists = sentenceExists &&
        sentences[selection.sentenceIndex]?.rules &&
        selection.ruleIndex < sentences[selection.sentenceIndex].rules.length;

      return sentenceExists && ruleExists;
    });

    console.log('Updated selections:', updatedSelections);
    setSelectedRules(updatedSelections);
  }, [selectedRules]);

  /**
   * Validate all selections against current sentences
   * Removes any selections that point to non-existent rules
   */
  const validateSelections = useCallback((sentences: any[]) => {
    console.log('Validating all selections against current sentences');

    const validSelections = selectedRules.filter(selection => {
      const sentenceExists = selection.sentenceIndex < sentences.length;
      const ruleExists = sentenceExists &&
        sentences[selection.sentenceIndex]?.rules &&
        selection.ruleIndex < sentences[selection.sentenceIndex].rules.length;

      return sentenceExists && ruleExists;
    });

    // Only update state if selections actually changed
    if (validSelections.length !== selectedRules.length) {
      console.log(`Removed ${selectedRules.length - validSelections.length} invalid selections`);
      setSelectedRules(validSelections);
    }
  }, [selectedRules]);

  return {
    selectedRules,
    toggleRuleSelection,
    isRuleSelected,
    clearSelections,
    getSortedSelections,
    updateSelectionsAfterDelete,
    validateSelections,
    hasSelections: selectedRules.length > 0,
    selectedRulesCount: selectedRules.length
  };
};

export default useSelectionManagement;