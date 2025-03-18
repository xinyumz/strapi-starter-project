// src/plugins/article-enhancer/admin/src/utils/apiHelpers.ts
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule } from './types';

/**
 * Standardizes response data from grammar endpoints
 * @param sentences Raw sentences data from API
 * @returns Normalized grammar rules array
 */
export const normalizeSentences = (sentences: any[]): GrammarRule[] => {
  return sentences.map(sentence => ({
    sentence: sentence.sentence || '',
    rules: Array.isArray(sentence.rules) ? sentence.rules : [],
    translation: sentence.translation || ''
  }));
};

/**
 * Creates a reusable fetch function with standard options
 * @param options Default fetch options
 * @returns Configured fetch function
 */
export const createFetchWithOptions = (options: RequestInit = {}) => {
  return async (url: string, customOptions: RequestInit = {}): Promise<Response> => {
    const mergedOptions = {
      ...options,
      ...customOptions,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...customOptions.headers,
      },
    };

    return fetch(url, mergedOptions);
  };
};

/**
 * Hook to create API wrapper functions for common operations
 */
export const useApiHelpers = () => {
  const { get, post } = useFetchClient();

  /**
   * Wrapper for GET requests
   */
  const getRequest = async <T>(endpoint: string): Promise<T> => {
    const response = await get(endpoint);
    return response.data;
  };

  /**
   * Wrapper for POST requests
   */
  const postRequest = async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await post(endpoint, { data });
    return response.data;
  };

  /**
   * Direct fetch with JSON parsing for Strapi's public API
   */
  const fetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  };

  return { getRequest, postRequest, fetchJson };
};
