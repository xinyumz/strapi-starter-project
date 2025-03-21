// src/plugins/article-enhancer/admin/src/utils/apiHelpers.ts
import { useFetchClient } from '@strapi/helper-plugin';
import { GrammarRule, Translation } from './types';

/**
 * Standardizes response data from grammar endpoints
 * @param sentences Raw sentences data from API
 * @returns Normalized grammar rules array
 */
export const normalizeSentences = (sentences: any[]): GrammarRule[] => {
  return sentences.map(sentence => {
    // Initialize translations array
    let translations: Translation[] = [];

    // Handle different translation formats

    // 1. If we have a translations array in the response, use it
    if (Array.isArray(sentence.translations)) {
      translations = sentence.translations.filter(
        (t: any) => t && typeof t === 'object' && t.language && typeof t.text === 'string'
      );
    }

    // 2. If we don't have translations but have a legacy translation, add it as English
    if (!translations.some(t => t.language === 'en') && sentence.translation) {
      translations.push({
        language: 'en',
        text: typeof sentence.translation === 'string' ? sentence.translation : String(sentence.translation)
      });
    }

    // 3. Handle grammar rules
    let rules: string[] = [];
    if (Array.isArray(sentence.rules)) {
      rules = sentence.rules;
    } else if (sentence.grammar_rules) {
      // If we have grammar_rules from the database
      try {
        if (typeof sentence.grammar_rules === 'string') {
          rules = JSON.parse(sentence.grammar_rules);
        } else if (Array.isArray(sentence.grammar_rules)) {
          rules = sentence.grammar_rules;
        }
      } catch (e) {
        console.error('Error parsing grammar rules:', e);
      }
    }

    return {
      sentence: sentence.sentence || sentence.sentence_text || '',
      rules: rules,
      translation: sentence.translation || translations.find(t => t.language === 'en')?.text || '',
      translations: translations
    };
  });
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