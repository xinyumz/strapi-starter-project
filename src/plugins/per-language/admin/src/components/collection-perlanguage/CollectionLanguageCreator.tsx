// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionLanguageCreator.tsx

import React, { useState, useCallback } from 'react';
import {
    Stack,
    Select,
    Option,
    Typography,
    Box
} from '@strapi/design-system';
import { SUPPORTED_LANGUAGES } from '../shared';
import { CollectionLanguageData } from '../hooks';

interface CollectionLanguageCreatorProps {
    collectionId?: string;
    collectionLanguages: CollectionLanguageData[];
    isCreatingRecord: boolean;
    onLanguageCreate: (languageCode: string) => Promise<void>;
    onError: (message: string) => void;
}

/**
 * Component for creating new collection language records
 * 
 * Features:
 * - Language selection dropdown (filtered to show only available languages)
 * - Validation for existing languages
 * - Loading state during creation
 * - Informational messages for various states
 */
export const CollectionLanguageCreator: React.FC<CollectionLanguageCreatorProps> = ({
    collectionId,
    collectionLanguages,
    isCreatingRecord,
    onLanguageCreate,
    onError
}) => {
    const [targetLanguage, setTargetLanguage] = useState('');

    /**
     * Handle language selection and creation
     */
    const handleLanguageSelect = useCallback(async (selectedLanguage: string) => {
        setTargetLanguage(selectedLanguage);

        if (!collectionId || !selectedLanguage) {
            return;
        }

        // Check if language already exists
        const existingLanguage = collectionLanguages.find(lang => lang.language === selectedLanguage);
        if (existingLanguage) {
            onError(`${selectedLanguage} collection language already exists`);
            return;
        }

        // Create the language record
        await onLanguageCreate(selectedLanguage);
        setTargetLanguage('');
    }, [collectionId, collectionLanguages, onLanguageCreate, onError]);

    // Filter out languages that already exist
    const availableLanguages = SUPPORTED_LANGUAGES.filter(
        lang => !collectionLanguages.some(cLang => cLang.language === lang.code)
    );

    return (
        <Box>
            <Box paddingBottom={3}>
                <Typography variant="delta">
                    Collection Per-Language Management
                </Typography>
            </Box>

            <Stack spacing={4}>
                <Select
                    label="Choose Collection Target Language"
                    placeholder="Select a language to create collection content"
                    value={targetLanguage}
                    onChange={handleLanguageSelect}
                    disabled={isCreatingRecord || !collectionId}
                >
                    {availableLanguages.map((lang) => (
                        <Option key={lang.code} value={lang.code}>
                            {lang.name}
                        </Option>
                    ))}
                </Select>

                {/* No collection ID warning */}
                {!collectionId && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" color="neutral600">
                            Please save the collection first to enable per-language management.
                        </Typography>
                    </Box>
                )}

                {/* Creating record loading state */}
                {isCreatingRecord && (
                    <Box padding={2} background="primary100" borderRadius="4px">
                        <Typography variant="pi" color="primary600">
                            Creating collection language record...
                        </Typography>
                    </Box>
                )}

                {/* No more languages available */}
                {collectionId && availableLanguages.length === 0 && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" color="neutral600">
                            All supported languages have been added to this collection.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};