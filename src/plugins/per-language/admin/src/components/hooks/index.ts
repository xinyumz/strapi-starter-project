// src/plugins/per-language/admin/src/components/hooks/index.ts

export { useAlertMessages } from './useAlertMessages';
export { useLanguageState } from './useLanguageState';
export { useCollectionLanguages } from './useCollectionLanguages';

// Re-export types for convenience
export type {
    PendingChanges,
    CollectionLanguageData
} from './useLanguageState';