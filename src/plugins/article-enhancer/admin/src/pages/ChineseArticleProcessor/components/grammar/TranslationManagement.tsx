// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/TranslationManagement.tsx
import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Divider,
    Flex,
    Card,
    CardHeader,
    CardBody,
    CardCheckbox,
    CardAction,
    CardContent,
    CardBadge,
    Stack,
    Alert
} from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import LanguageSelector from './LanguageSelector';

interface TranslationManagementProps {
    activeLanguages: string[];
    supportedLanguages: { code: string, name: string }[];
    onAddLanguage: (language: string) => void;
    onBulkDeleteLanguage: (language: string) => void;
    isLoading: boolean;
}

/**
 * Component for managing translations at the language level
 */
const TranslationManagement: React.FC<TranslationManagementProps> = ({
    activeLanguages,
    supportedLanguages,
    onAddLanguage,
    onBulkDeleteLanguage,
    isLoading
}) => {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Get language name from code
    const getLanguageName = (code: string): string => {
        const language = supportedLanguages.find(lang => lang.code === code);
        return language ? language.name : code;
    };

    // Filter out already active languages from available options
    const getAvailableLanguages = () => {
        return supportedLanguages.filter(lang => !activeLanguages.includes(lang.code));
    };

    // Handle add language button click
    const handleAddLanguage = () => {
        if (selectedLanguage) {
            onAddLanguage(selectedLanguage);
            setSelectedLanguage('');
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (language: string) => {
        onBulkDeleteLanguage(language);
        setShowDeleteConfirm(null);
    };

    return (
        <Box padding={4} background="neutral100" hasRadius shadow="filterShadow">
            <Typography variant="delta">Manage Translations</Typography>
            <Divider />

            <Box paddingTop={4}>
                <Typography variant="omega">Active Languages</Typography>
                <Box paddingTop={2}>
                    <Stack spacing={2}>
                        {activeLanguages.map(language => (
                            <Card key={language}>
                                <CardHeader>
                                    <Typography fontWeight="bold">{getLanguageName(language)}</Typography>
                                    <CardAction position="end">
                                        {language !== 'en' && (
                                            <Button
                                                variant="danger-light"
                                                size="S"
                                                startIcon={<Trash />}
                                                onClick={() => setShowDeleteConfirm(language)}
                                                disabled={isLoading}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </CardAction>
                                </CardHeader>
                                <CardContent>
                                    <CardBadge>{language}</CardBadge>
                                </CardContent>
                            </Card>
                        ))}

                        {activeLanguages.length === 0 && (
                            <Typography>No active languages found.</Typography>
                        )}
                    </Stack>
                </Box>
            </Box>

            {/* Language deletion confirmation */}
            {showDeleteConfirm && (
                <Box paddingTop={4}>
                    <Alert
                        closeLabel="Cancel"
                        title={`Delete ${getLanguageName(showDeleteConfirm)} translations?`}
                        variant="danger"
                        onClose={() => setShowDeleteConfirm(null)}
                        action={
                            <Button
                                size="S"
                                variant="danger-light"
                                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                                disabled={isLoading}
                            >
                                Confirm
                            </Button>
                        }
                    >
                        This will delete all translations in {getLanguageName(showDeleteConfirm)} for all sentences in this article.
                        This action cannot be undone.
                    </Alert>
                </Box>
            )}

            {/* Add new language form */}
            <Box paddingTop={4}>
                <Typography variant="omega">Add New Language</Typography>
                <Box paddingTop={2}>
                    <Flex gap={2}>
                        <Box style={{ flexGrow: 1 }}>
                            <LanguageSelector
                                value={selectedLanguage}
                                onChange={(value: string) => setSelectedLanguage(value)}
                                disabled={isLoading || getAvailableLanguages().length === 0}
                                hint={getAvailableLanguages().length === 0 ? "No more languages available" : undefined}
                            />
                        </Box>
                        <Box style={{ alignSelf: 'flex-end' }}>
                            <Button
                                variant="default"
                                startIcon={<Plus />}
                                onClick={handleAddLanguage}
                                disabled={isLoading || !selectedLanguage}
                            >
                                Add Language
                            </Button>
                        </Box>
                    </Flex>
                </Box>
            </Box>
        </Box>
    );
};

export default TranslationManagement;