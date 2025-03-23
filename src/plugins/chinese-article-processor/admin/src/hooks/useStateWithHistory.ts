// src/plugins/chinese-article-processor/admin/src/hooks/useStateWithHistory.ts
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing state with history tracking.
 * Useful for forms and editors where you need to track changes and reset to original state.
 * 
 * @param initialState The initial state value
 * @returns Object with current state, update functions, and change tracking
 */
function useStateWithHistory<T>(initialState: T) {
  // Current working state
  const [current, setCurrent] = useState<T>(initialState);

  // Original state to track changes against
  const [original, setOriginal] = useState<T>(
    // Deep copy the initial state to avoid reference issues
    typeof initialState === 'object' && initialState !== null
      ? JSON.parse(JSON.stringify(initialState))
      : initialState
  );

  // Flag to track if current state differs from original
  const [hasChanges, setHasChanges] = useState(false);

  // Update current state and check for changes
  const updateCurrent = useCallback((newState: T) => {
    setCurrent(newState);

    // Compare current with original to detect changes
    const isChanged = JSON.stringify(newState) !== JSON.stringify(original);
    setHasChanges(isChanged);
  }, [original]);

  // Save current state as the new original (e.g., after saving to server)
  const saveAsOriginal = useCallback(() => {
    setOriginal(
      typeof current === 'object' && current !== null
        ? JSON.parse(JSON.stringify(current))
        : current
    );
    setHasChanges(false);
  }, [current]);

  // Reset current state back to original
  const reset = useCallback(() => {
    setCurrent(
      typeof original === 'object' && original !== null
        ? JSON.parse(JSON.stringify(original))
        : original
    );
    setHasChanges(false);
  }, [original]);

  return {
    current,
    updateCurrent,
    saveAsOriginal,
    reset,
    hasChanges
  };
}

export default useStateWithHistory;
