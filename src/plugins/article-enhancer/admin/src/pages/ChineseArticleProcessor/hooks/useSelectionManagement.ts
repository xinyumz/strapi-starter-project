// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/hooks/useSelectionManagement.ts
import { useState, useCallback } from 'react';
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
  
  // Toggle selection state of a rule
  const toggleRuleSelection = useCallback((sentenceIndex: number, ruleIndex: number) => {
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

  return {
    selectedRules,
    toggleRuleSelection,
    isRuleSelected,
    clearSelections,
    getSortedSelections,
    hasSelections: selectedRules.length > 0,
    selectedRulesCount: selectedRules.length
  };
};

export default useSelectionManagement;