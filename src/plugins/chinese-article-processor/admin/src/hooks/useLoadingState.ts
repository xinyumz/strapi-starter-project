// src/plugins/chinese-article-processor/admin/src/hooks/useLoadingState.ts
import { useState, useCallback } from 'react';

// Loading state type
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Custom hook for managing loading states with associated messages.
 * Provides convenient methods for handling loading, success and error states.
 * 
 * @param initialState The initial loading state
 * @returns Object with state values and setter functions
 */
const useLoadingState = (initialState: LoadingState = 'idle') => {
  const [state, setState] = useState<LoadingState>(initialState);
  const [message, setMessage] = useState<string>('');

  // Set loading state with optional message
  const setLoading = useCallback((loadingMessage = '') => {
    setState('loading');
    setMessage(loadingMessage);
  }, []);

  // Set success state with optional message
  const setSuccess = useCallback((successMessage = 'Operation completed successfully') => {
    setState('success');
    setMessage(successMessage);
  }, []);

  // Set error state with optional message
  const setError = useCallback((errorMessage = 'An error occurred') => {
    setState('error');
    setMessage(errorMessage);
  }, []);

  // Reset to idle state
  const reset = useCallback(() => {
    setState('idle');
    setMessage('');
  }, []);

  return {
    state,
    message,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    setLoading,
    setSuccess,
    setError,
    reset
  };
};

export default useLoadingState;
