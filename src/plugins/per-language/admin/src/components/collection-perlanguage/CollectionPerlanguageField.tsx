// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionPerlanguageField.tsx

import React, { useCallback, useEffect } from 'react';
import { Flex, Typography, Box } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { SUPPORTED_LANGUAGES } from '../shared';

// Import custom hooks
import {
    useAlertMessages,
    useLanguageState,
    useCollectionLanguages,
} from '../hooks';

// Import extracted components
import { AlertMessages } from '../shared/AlertMessages';
import { CollectionLanguageCreator } from './CollectionLanguageCreator';
import { CollectionLanguageCard } from './CollectionLanguageCard';

interface CollectionPerlanguageFieldProps {
    document?: any;
    documentId?: string | number;
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
}

/**
 * Main collection per-language field component
 * 
 * Now simplified to focus on orchestration and layout:
 * - Manages overall state via custom hooks
 * - Renders child components for specific functionality
 * - Handles communication between components
 */
const CollectionPerlanguageField: React.FC<CollectionPerlanguageFieldProps> = ({
    name,
    value,
    onChange,
    intlLabel,
    required,
    document,
    documentId,
    ...Props
}) => {
    if (!name || !onChange) {
        return null;
    }

    const { formatMessage } = useIntl();
    const modifiedData = document || Props || {};
    const collectionId = documentId || modifiedData.id || modifiedData.documentId;

    // Custom hooks for state management
    const { error, success, setError, setSuccess } = useAlertMessages();

    const {
        collectionLanguages,
        isCreatingRecord,
        isSaving,
        isLoadingAutoRetrieval,
        autoRetrievalData,
        collectionStats,
        createLanguageRecord,
        getAutoRetrievalData,
        loadCollectionStats,
        saveLanguageChanges,
        deleteLanguage
    } = useCollectionLanguages({
        collectionId,
        onError: setError,
        onSuccess: setSuccess
    });

    const {
        updatePendingChange,
        getCurrentValue,
        hasChanges,
        clearPendingChanges,
        pendingChanges
    } = useLanguageState();


    useEffect(() => {
        if (collectionId) {
            loadCollectionStats();
        }
    }, [collectionId, loadCollectionStats]);

    /**
     * Handle saving changes for a specific language
     */
    const handleSaveChanges = useCallback(async (languageId: number) => {
        if (!collectionId) return;

        try {
            await saveLanguageChanges(languageId, pendingChanges, collectionId);
            clearPendingChanges(languageId);
        } catch (error) {
            // Error handled by hook
        }
    }, [collectionId, saveLanguageChanges, pendingChanges, clearPendingChanges]);

    /**
     * Handle deleting a language with confirmation
     */
    const handleDeleteLanguage = useCallback(async (language: any) => {
        const langName = language.language?.toUpperCase() || 'Unknown';

        if (!confirm(`Are you sure you want to delete the ${langName} collection language?`)) {
            return;
        }

        try {
            await deleteLanguage(language.id);
            clearPendingChanges(language.id);
        } catch (error) {
            // Error handled by hook
        }
    }, [deleteLanguage, clearPendingChanges]);

    return (
        <Flex gap={6}>
            {/* Alert Messages */}
            <AlertMessages
                error={error}
                success={success}
                onErrorClose={() => setError(null)}
                onSuccessClose={() => setSuccess(null)}
            />

            {/* Language Creation Section */}
            <CollectionLanguageCreator
                collectionId={collectionId}
                collectionLanguages={collectionLanguages}
                isCreatingRecord={isCreatingRecord}
                onLanguageCreate={createLanguageRecord}
                onError={setError}
                // Add enhanced props to enable auto-retrieval features
                availableLanguages={SUPPORTED_LANGUAGES.map(lang => ({
                    code: lang.code,
                    name: lang.name,
                    nativeName: lang.name,
                    processorAvailable: lang.hasProcessor
                }))}
                usedLanguages={collectionLanguages.map(lang => lang.language)}
                collectionStats={collectionStats}
                isLoadingAutoRetrieval={isLoadingAutoRetrieval}
                autoRetrievalData={autoRetrievalData}
                onGetAutoRetrieval={getAutoRetrievalData}
            />

            {/* Existing Languages Section */}
            {collectionLanguages.length > 0 && (
                <Box>
                    <Box paddingBottom={3}>
                        <Typography variant="delta">
                            Existing Collection Languages ({collectionLanguages.length})
                        </Typography>
                    </Box>
                    <Flex gap={4}>
                        {collectionLanguages.map((language) => (
                            <CollectionLanguageCard
                                key={language.id}
                                language={language}
                                isSaving={isSaving[language.id] || false}
                                hasChanges={hasChanges(language.id)}
                                getCurrentValue={getCurrentValue}
                                onFieldChange={(field: string, value: any) =>
                                    updatePendingChange(language.id, field, value)
                                }
                                onSave={() => handleSaveChanges(language.id)}
                                onDelete={() => handleDeleteLanguage(language)}
                            />
                        ))}
                    </Flex>
                </Box>
            )}
        </Flex>
    );
};

export default CollectionPerlanguageField;