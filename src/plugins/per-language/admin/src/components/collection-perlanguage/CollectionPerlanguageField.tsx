// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionPerlanguageField.tsx

import React, { useCallback, useEffect } from 'react';
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
 * Main collection per-language field component with debugging
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

    // ENHANCED DEBUGGING: Better document ID extraction for Strapi v5
    const collectionId = (() => {
        console.log('[COLLECTION DEBUG] All props passed to component:', {
            documentId,
            document,
            modifiedData,
            allPropsKeys: Object.keys(Props),
            url: window.location.pathname,
            search: window.location.search
        });

        // Try documentId first (Strapi v5)
        if (documentId) {
            console.log('[COLLECTION DEBUG] Using documentId prop:', documentId);
            return documentId.toString();
        }

        // Try document.documentId (Strapi v5)
        if (modifiedData.documentId) {
            console.log('[COLLECTION DEBUG] Using document.documentId:', modifiedData.documentId);
            return modifiedData.documentId.toString();
        }

        // Try document.id (fallback for v4 compatibility)
        if (modifiedData.id) {
            console.log('[COLLECTION DEBUG] Using document.id:', modifiedData.id);
            return modifiedData.id.toString();
        }

        // Try to extract from URL as last resort - multiple patterns for Strapi v5
        const urlPatterns = [
            /\/admin\/content-manager\/collection-types\/api::collection\.collection\/([^\/\?]+)/,
            /\/admin\/content-manager\/collectionType\/api::collection\.collection\/([^\/\?]+)/,
            /\/content-manager\/collection-types\/api::collection\.collection\/([^\/\?]+)/,
            /\/([a-zA-Z0-9]{20,})(?:\/|$|\?)/  // Generic documentId pattern
        ];

        for (const pattern of urlPatterns) {
            const urlMatch = window.location.pathname.match(pattern);
            if (urlMatch) {
                console.log('[COLLECTION DEBUG] Extracted from URL using pattern', pattern, ':', urlMatch[1]);
                return urlMatch[1];
            }
        }

        console.log('[COLLECTION DEBUG] No collection ID found anywhere');
        return null;
    })();

    console.log('[CollectionPerlanguageField] Final Document ID extraction result:', {
        documentId,
        documentDocumentId: modifiedData.documentId,
        documentId_prop: modifiedData.id,
        urlPath: window.location.pathname,
        finalCollectionId: collectionId
    });

    // Show debugging information in UI when no ID is found
    const debugInfo = !collectionId ? (
        <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            marginBottom: '16px'
        }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>🔍 Collection Debug Information</h4>
            <pre style={{
                fontSize: '12px',
                color: '#856404',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
            }}>
                {`Props received:
- documentId: ${documentId}
- document.documentId: ${modifiedData.documentId}
- document.id: ${modifiedData.id}
- URL: ${window.location.pathname}
- All props keys: ${Object.keys(Props).join(', ')}

Document object: ${JSON.stringify(modifiedData, null, 2)}`}
            </pre>
        </div>
    ) : null;

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
            console.log('[CollectionPerlanguageField] Loading collection stats for ID:', collectionId);
            loadCollectionStats();
        } else {
            console.log('[CollectionPerlanguageField] No collection ID available, skipping stats load');
        }
    }, [collectionId, loadCollectionStats]);

    /**
     * Handle saving changes for a specific language
     */
    const handleSaveChanges = useCallback(async (languageId: number) => {
        if (!collectionId) {
            console.log('[CollectionPerlanguageField] No collection ID for save changes');
            return;
        }

        try {
            console.log('[CollectionPerlanguageField] Saving changes for language:', languageId);
            await saveLanguageChanges(languageId, pendingChanges, collectionId);
            clearPendingChanges(languageId);
        } catch (error) {
            console.error('[CollectionPerlanguageField] Error saving changes:', error);
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
            console.log('[CollectionPerlanguageField] Deleting language:', language);
            await deleteLanguage(language.id);
            clearPendingChanges(language.id);
        } catch (error) {
            console.error('[CollectionPerlanguageField] Error deleting language:', error);
            // Error handled by hook
        }
    }, [deleteLanguage, clearPendingChanges]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            {/* Debug info when no ID found */}
            {debugInfo}

            {/* Collection ID Status */}
            {collectionId && (
                <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#2e7d32'
                }}>
                    ✅ Collection ID detected: {collectionId}
                </div>
            )}

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
                <div>
                    <div style={{ paddingBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#424242' }}>
                            Existing Collection Languages ({collectionLanguages.length})
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
                    </div>
                </div>
            )}

            {/* Debug State Information */}
            <details style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                    🔧 Debug State Information
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {`Collection Languages: ${collectionLanguages.length}
Is Creating Record: ${isCreatingRecord}
Collection Stats: ${JSON.stringify(collectionStats, null, 2)}
Pending Changes: ${JSON.stringify(pendingChanges, null, 2)}
Error: ${error}
Success: ${success}`}
                </pre>
            </details>
        </div>
    );
};

export default CollectionPerlanguageField;