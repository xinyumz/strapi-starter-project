// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/sentence-translation/SimplifiedTranslationManagement.tsx
import React from 'react';
import {
    Box,
    Button,
    Typography,
    Flex,
    Divider
} from '@strapi/design-system';
import { Trash } from '@strapi/icons';

interface SimplifiedTranslationManagementProps {
    activeLanguages: string[];
    supportedLanguages: { code: string, name: string }[];
    onBulkDeleteLanguage: (language: string) => void;
    isLoading: boolean;
}

/**
 * Simplified component for managing translations at the language level
 * Only shows delete options for existing languages
 */
const SimplifiedTranslationManagement: React.FC<SimplifiedTranslationManagementProps> = ({
    activeLanguages,
    supportedLanguages,
    onBulkDeleteLanguage,
    isLoading
}) => {
    // Get language name from code
    const getLanguageName = (code: string): string => {
        const language = supportedLanguages.find(lang => lang.code === code);
        return language ? language.name : code;
    };

    // Filter out English (default language that can't be deleted)
    const deletableLanguages = activeLanguages.filter(lang => lang !== 'en');

    if (deletableLanguages.length === 0) {
        return null; // Don't show anything if there are no languages to delete
    }

    return (
        <Box padding={4} background="neutral100" hasRadius>
            <Typography variant="delta">Translation Languages</Typography>
            <Divider />

            <Box paddingTop={2}>
                <Flex gap={2} wrap="wrap">
                    {deletableLanguages.map(language => (
                        <Button
                            key={language}
                            variant="danger-light"
                            size="S"
                            startIcon={<Trash />}
                            onClick={() => onBulkDeleteLanguage(language)}
                            disabled={isLoading}
                        >
                            Delete {getLanguageName(language)}
                        </Button>
                    ))}
                </Flex>
            </Box>
        </Box>
    );
};

export default SimplifiedTranslationManagement;