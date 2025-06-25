// src/plugins/per-language/admin/src/components/hooks/useCollectionLanguages.ts

import { useState, useCallback, useEffect } from 'react';
import { CollectionLanguageData, PendingChanges } from './useLanguageState';

interface UseCollectionLanguagesReturn {
    collectionLanguages: CollectionLanguageData[];
    isLoading: boolean;
    isCreatingRecord: boolean;
    isSaving: Record<number, boolean>;
    isLoadingAutoRetrieval: boolean;
    autoRetrievalData: AutoRetrievalData | null;
    collectionStats: CollectionStats | null;
    loadCollectionLanguages: () => Promise<void>;
    createLanguageRecord: (languageCode: string, useAutoRetrieval?: boolean) => Promise<void>;
    getAutoRetrievalData: (languageCode: string) => Promise<AutoRetrievalData | null>;
    loadCollectionStats: () => Promise<void>;
    saveLanguageChanges: (
        languageId: number,
        pendingChanges: PendingChanges,
        collectionId: string
    ) => Promise<void>;
    deleteLanguage: (languageId: number) => Promise<void>;
    updateLocalLanguageData: (updatedLanguages: CollectionLanguageData[]) => void;
}

interface UseCollectionLanguagesProps {
    collectionId?: string;
    onError?: (message: string) => void;
    onSuccess?: (message: string) => void;
}

// Auto-retrieval types
interface AutoRetrievalData {
    scenario: 'no_articles' | 'no_language_data' | 'single_article' | 'multiple_articles';
    message: string;
    suggestedData?: {
        access_tier?: string;
        display_skill?: string;
        description?: string;
    };
    collectionStats?: {
        articleCount: number;
        hasLanguageData: boolean;
        languageDataCount: number;
    };
    articleDetails?: any[];
}

interface CollectionStats {
    collectionId: number;
    articleCount: number;
    articles: Array<{
        id: number;
        title: string;
    }>;
}

/**
 * Custom hook for managing collection language CRUD operations with auto-retrieval
 * 
 * Handles:
 * - Loading collection languages
 * - Creating new language records
 * - Saving language changes (description, display_skill, access_tier, published)
 * - Deleting language records
 * - Managing loading states
 * 
 * - Auto-retrieval data fetching
 * - Collection statistics
 * - Intelligent data population
 * - Enhanced error handling
 */
export const useCollectionLanguages = ({
    collectionId,
    onError,
    onSuccess
}: UseCollectionLanguagesProps): UseCollectionLanguagesReturn => {

    const [collectionLanguages, setCollectionLanguages] = useState<CollectionLanguageData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingRecord, setIsCreatingRecord] = useState(false);
    const [isSaving, setIsSaving] = useState<Record<number, boolean>>({});
    const [isLoadingAutoRetrieval, setIsLoadingAutoRetrieval] = useState(false);
    const [autoRetrievalData, setAutoRetrievalData] = useState<AutoRetrievalData | null>(null);
    const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);

    /**
     * Load all languages for this collection
     */
    const loadCollectionLanguages = useCallback(async () => {
        if (!collectionId) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/per-language/collection/${collectionId}/languages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                setCollectionLanguages(result.data || []);
            } else {
                throw new Error(`Failed to load languages: ${response.status}`);
            }
        } catch (error) {
            console.error('[useCollectionLanguages] Error loading languages:', error);
            onError?.(`Failed to load collection languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [collectionId, onError]);

    /**
    * Load collection statistics
    */
    const loadCollectionStats = useCallback(async () => {
        if (!collectionId) return;

        try {
            const response = await fetch(`/per-language/collection/${collectionId}/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                setCollectionStats(result.data);
            } else {
                console.warn('[useCollectionLanguages] Failed to load collection stats:', response.status);
            }
        } catch (error) {
            console.warn('[useCollectionLanguages] Error loading collection stats:', error);
        }
    }, [collectionId]);

    /**
     * NEW: Get auto-retrieval data for a specific language
     */
    const getAutoRetrievalData = useCallback(async (languageCode: string): Promise<AutoRetrievalData | null> => {
        if (!collectionId) {
            onError?.('Please save the collection first.');
            return null;
        }

        try {
            setIsLoadingAutoRetrieval(true);
            const response = await fetch(`/per-language/collection/${collectionId}/auto-retrieval?language=${languageCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.data as AutoRetrievalData;
                setAutoRetrievalData(data);
                return data;
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to get auto-retrieval data: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('[useCollectionLanguages] Error getting auto-retrieval data:', error);
            onError?.(`Failed to get auto-retrieval suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        } finally {
            setIsLoadingAutoRetrieval(false);
        }
    }, [collectionId, onError]);

    /**
     * Create new collection language record with auto-retrieval support
     */
    const createLanguageRecord = useCallback(async (languageCode: string, useAutoRetrieval: boolean = false) => {
        if (!collectionId) {
            onError?.('Please save the collection first.');
            return;
        }

        try {
            setIsCreatingRecord(true);

            // Get auto-retrieval data if requested
            let autoRetrievalInfo = null;
            if (useAutoRetrieval) {
                console.log(`[useCollectionLanguages] Getting auto-retrieval data for ${languageCode}`);
                autoRetrievalInfo = await getAutoRetrievalData(languageCode);

                if (!autoRetrievalInfo) {
                    console.warn('[useCollectionLanguages] No auto-retrieval data available, creating without');
                }
            }

            const response = await fetch(`/per-language/collection/${collectionId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: languageCode,
                    description: null,
                    useAutoRetrieval: useAutoRetrieval
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create language record: ${response.status} - ${errorData}`);
            }

            const result = await response.json();

            await loadCollectionLanguages();

            // Enhanced success message based on auto-retrieval
            if (useAutoRetrieval && result.autoRetrievalInfo) {
                const info = result.autoRetrievalInfo;
                onSuccess?.(`${languageCode} collection created with auto-retrieval. ${info.message}`);
            } else {
                onSuccess?.(`${languageCode} collection language created successfully`);
            }

        } catch (error: any) {
            console.error('[useCollectionLanguages] Error creating language record:', error);
            onError?.(`Failed to create ${languageCode}: ${error.message}`);
        } finally {
            setIsCreatingRecord(false);
        }
    }, [collectionId, loadCollectionLanguages, onError, onSuccess, getAutoRetrievalData]);

    /**
     * Save changes for a specific language
     */
    const saveLanguageChanges = useCallback(async (
        languageId: number,
        pendingChanges: PendingChanges,
        collectionIdParam: string
    ) => {
        const pending = pendingChanges[languageId];
        if (!pending?.hasChanges) return;

        try {
            setIsSaving(prev => ({ ...prev, [languageId]: true }));

            const language = collectionLanguages.find(lang => lang.id === languageId);
            if (!language) {
                throw new Error('Language not found');
            }

            const promises = [];

            // Description update
            if ('description' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${collectionIdParam}/content`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            language: language.language,
                            description: pending.description || null,
                        }),
                    })
                );
            }

            // Display skill update
            if ('display_skill' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${languageId}/display-skill`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            display_skill: pending.display_skill
                        })
                    })
                );
            }

            // Access tier update
            if ('access_tier' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${languageId}/access-tier`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            access_tier: pending.access_tier
                        })
                    })
                );
            }

            // Publish status update
            if ('published' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${languageId}/publish`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            published: pending.published
                        }),
                    })
                );
            }

            // Execute all updates
            const responses = await Promise.all(promises);
            const failedResponses = responses.filter(response => !response.ok);

            if (failedResponses.length > 0) {
                throw new Error(`${failedResponses.length} update(s) failed`);
            }

            // Update local state with pending changes
            setCollectionLanguages(prev =>
                prev.map(lang => {
                    if (lang.id === languageId) {
                        return {
                            ...lang,
                            ...pending
                        };
                    }
                    return lang;
                })
            );

            onSuccess?.(`${language.language} changes saved successfully`);

        } catch (error: any) {
            console.error('[useCollectionLanguages] Error saving changes:', error);
            onError?.(`Failed to save changes: ${error.message}`);
            throw error; // Re-throw so caller can handle if needed
        } finally {
            setIsSaving(prev => ({ ...prev, [languageId]: false }));
        }
    }, [collectionLanguages, onError, onSuccess]);

    /**
     * Delete collection language
     */
    const deleteLanguage = useCallback(async (languageId: number) => {
        try {
            const response = await fetch(`/per-language/collection/${languageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status}`);
            }

            // Remove from local state
            setCollectionLanguages(prev => prev.filter(lang => lang.id !== languageId));

            onSuccess?.('Collection language deleted successfully');

        } catch (error: any) {
            console.error('[useCollectionLanguages] Error deleting language:', error);
            onError?.(`Failed to delete language: ${error.message}`);
            throw error;
        }
    }, [onError, onSuccess]);

    /**
     * Update local language data (for external updates)
     */
    const updateLocalLanguageData = useCallback((updatedLanguages: CollectionLanguageData[]) => {
        setCollectionLanguages(updatedLanguages);
    }, []);

    // Auto-load languages when collectionId changes
    useEffect(() => {
        if (collectionId) {
            loadCollectionLanguages();
        }
    }, [collectionId, loadCollectionLanguages]);

    return {
        collectionLanguages,
        isLoading,
        isCreatingRecord,
        isSaving,
        isLoadingAutoRetrieval,
        autoRetrievalData,
        collectionStats,
        loadCollectionLanguages,
        createLanguageRecord,
        getAutoRetrievalData,
        loadCollectionStats,
        saveLanguageChanges,
        deleteLanguage,
        updateLocalLanguageData
    };
};