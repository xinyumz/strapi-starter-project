// src/plugins/per-language/admin/src/components/hooks/useLanguageState.ts

import { useState, useCallback } from 'react';

export interface PendingChanges {
    [languageId: number]: {
        description?: string;
        published?: boolean;
        access_tier?: string;
        display_skill?: string;
        hasChanges: boolean;
    };
}

export interface CollectionLanguageData {
    id: number;
    language: string;
    description: string;
    display_skill?: string;
    published: boolean;
    access_tier: string;
    created_at: string;
    updated_at: string;
}

interface UseLanguageStateReturn {
    pendingChanges: PendingChanges;
    updatePendingChange: (languageId: number, field: string, value: any) => void;
    getCurrentValue: <T extends CollectionLanguageData>(lang: T, field: keyof T) => any;
    hasChanges: (languageId: number) => boolean;
    clearPendingChanges: (languageId?: number) => void;
    applyPendingChanges: (languageId: number, languageData: CollectionLanguageData[]) => CollectionLanguageData[];
}

/**
 * Custom hook for managing language field state and pending changes
 * 
 * Handles:
 * - Tracking pending changes for each language
 * - Getting current values (pending or original)
 * - Checking if languages have unsaved changes
 * - Clearing and applying changes
 */
export const useLanguageState = (): UseLanguageStateReturn => {
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

    /**
     * Update pending changes for a language field
     */
    const updatePendingChange = useCallback((languageId: number, field: string, value: any) => {
        setPendingChanges(prev => ({
            ...prev,
            [languageId]: {
                ...prev[languageId],
                [field]: value,
                hasChanges: true
            }
        }));
    }, []);

    /**
     * Get current value for a field (pending change or original value)
     */
    const getCurrentValue = useCallback(<T extends CollectionLanguageData>(
        lang: T,
        field: keyof T
    ): any => {
        if (!lang) return '';

        const pending = pendingChanges[lang.id];
        if (pending && pending.hasChanges && field in pending) {
            return pending[field as keyof typeof pending];
        }
        return lang[field];
    }, [pendingChanges]);

    /**
     * Check if language has pending changes
     */
    const hasChanges = useCallback((languageId: number): boolean => {
        return pendingChanges[languageId]?.hasChanges || false;
    }, [pendingChanges]);

    /**
     * Clear pending changes for specific language or all languages
     */
    const clearPendingChanges = useCallback((languageId?: number) => {
        if (languageId !== undefined) {
            // Clear specific language
            setPendingChanges(prev => {
                const newPending = { ...prev };
                delete newPending[languageId];
                return newPending;
            });
        } else {
            // Clear all pending changes
            setPendingChanges({});
        }
    }, []);

    /**
     * Apply pending changes to language data array
     */
    const applyPendingChanges = useCallback((
        languageId: number,
        languageData: CollectionLanguageData[]
    ): CollectionLanguageData[] => {
        const pending = pendingChanges[languageId];
        if (!pending?.hasChanges) return languageData;

        return languageData.map(lang => {
            if (lang.id === languageId) {
                return {
                    ...lang,
                    ...pending
                };
            }
            return lang;
        });
    }, [pendingChanges]);

    return {
        pendingChanges,
        updatePendingChange,
        getCurrentValue,
        hasChanges,
        clearPendingChanges,
        applyPendingChanges
    };
};