// src/plugins/article-enhancer/admin/src/utils/errorHandler.ts

/**
 * Standardized error handling function that extracts appropriate error message
 * from different error types and logs it to the console.
 * 
 * @param error The error object from a catch block
 * @param defaultMessage Default message to use if error doesn't have a message
 * @returns Formatted error message string
 */
export const handleError = (error: unknown, defaultMessage: string): string => {
  // Log the error to console for debugging
  console.error(defaultMessage, error);
  
  // Extract appropriate message based on error type
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  } else {
    return defaultMessage;
  }
};

/**
 * Safe async function wrapper that handles potential errors in promises.
 * Returns a tuple with result and error.
 * 
 * @param promise The promise to be executed
 * @param errorMessage Default error message if the promise rejects
 * @returns Tuple containing [result, error]
 */
export const safeAsync = async <T,>(
  promise: Promise<T>, 
  errorMessage: string
): Promise<[T | null, string | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, handleError(error, errorMessage)];
  }
};
