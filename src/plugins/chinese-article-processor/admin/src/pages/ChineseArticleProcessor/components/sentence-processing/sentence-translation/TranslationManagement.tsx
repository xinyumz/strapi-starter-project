// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/sentence-translation/TranslationManagement.tsx
import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Flex,
    Divider
} from '@strapi/design-system';
import ConfirmationDialog from '../../../../../components/common/ConfirmationDialog';

interface TranslationManagementProps {
    activeLanguages: string[];
    supportedLanguages: { code: string, name: string }[];
    onBulkDeleteLanguage: (language: string) => void;
    isLoading: boolean;
}

/**
 * Component for managing translations at the language level
 * Only shows delete options for existing languages
 */
const TranslationManagement: React.FC<TranslationManagementProps> = ({
    activeLanguages,
    supportedLanguages,
    onBulkDeleteLanguage,
    isLoading
}) => {
    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [languageToDelete, setLanguageToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get language name from code
    const getLanguageName = (code: string): string => {
        const language = supportedLanguages.find(lang => lang.code === code);
        return language ? language.name : code;
    };

    // Filter out English (default language that can't be deleted)
    const deletableLanguages = activeLanguages.filter(lang => lang !== 'en');

    // Handle delete button click - show confirmation modal
    const handleDeleteClick = (language: string) => {
        setLanguageToDelete(language);
        setShowDeleteModal(true);
    };

    // Handle confirmed deletion
    const handleConfirmDelete = async () => {
        if (!languageToDelete) return;

        setIsDeleting(true);
        try {
            await onBulkDeleteLanguage(languageToDelete);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setLanguageToDelete(null);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        if (isDeleting) return; // Prevent closing while deleting
        setShowDeleteModal(false);
        setLanguageToDelete(null);
    };

    if (deletableLanguages.length === 0) {
        return null; // Don't show anything if there are no languages to delete
    }

    const languageName = languageToDelete ? getLanguageName(languageToDelete) : '';

    return (
        <>
            <Box padding={4} background="neutral100" hasRadius>
                <Box marginBottom={3} marginLeft={3}>
                    <Typography variant="delta">Translation Languages</Typography>
                </Box>
                <Divider />

                <Box marginTop={3} marginBottom={1} marginLeft={2}>
                    <Flex gap={3} wrap="wrap">
                        {deletableLanguages.map(language => (
                            <Button
                                key={language}
                                variant="danger-light"
                                size="S"
                                onClick={() => handleDeleteClick(language)}
                                disabled={isLoading || isDeleting}
                            >
                                Delete {getLanguageName(language)}
                            </Button>
                        ))}
                    </Flex>
                </Box>
            </Box>

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                isVisible={showDeleteModal}
                title="Delete Translation Language"
                message={`Are you sure you want to delete all ${languageName} translations for this article? This will permanently remove all sentence translations in ${languageName}. This action cannot be undone.`}
                confirmText={isDeleting ? 'Deleting...' : `Delete ${languageName} Translations`}
                cancelText="Cancel"
                confirmButtonVariant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCloseModal}
            />
        </>
    );
};

export default TranslationManagement;