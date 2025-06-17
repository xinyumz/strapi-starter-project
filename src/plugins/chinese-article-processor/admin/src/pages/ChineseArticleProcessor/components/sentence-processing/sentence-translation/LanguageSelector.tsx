// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/grammar/LanguageSelector.tsx
import React, { useState, useEffect } from 'react';
import {
    Select,
    Option,
    Flex,
    Button,
    Box
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/helper-plugin';
import { Plus } from '@strapi/icons';

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
    hint?: string;
    error?: string;
    addNewLabel?: string;
    onAddNewLanguage?: () => void;
    // Optional array of languages to use instead of fetching
    customLanguages?: { code: string, name: string }[];
}

interface Language {
    code: string;
    name: string;
}

/**
 * Component for selecting translation language
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    value,
    onChange,
    label = 'Translation Language',
    disabled = false,
    hint,
    error,
    addNewLabel = 'Add Language',
    onAddNewLanguage,
    customLanguages
}) => {
    // Default languages to use if API fails or custom languages not provided
    const defaultLanguages: Language[] = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'ru', name: 'Russian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ar', name: 'Arabic' }
    ];

    // Initialize with either custom languages or defaults
    const [languages, setLanguages] = useState<Language[]>(
        customLanguages || defaultLanguages
    );

    const [isLoading, setIsLoading] = useState(false);
    const { get } = useFetchClient();

    // Load available languages from chinese-article-processor plugin endpoints
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchLanguages = async () => {
            if (customLanguages) {
                setLanguages(customLanguages);
                return;
            }

            try {
                setIsLoading(true);

                // Use chinese-article-processor's language endpoint directly (filtered on server)
                const { data, error } = await get('/chinese-article-processor/languages', {
                    signal: controller.signal
                });

                if (!isMounted) return;

                if (error) {
                    console.warn('Failed to fetch languages from server, using defaults', error);
                    setLanguages(defaultLanguages);
                } else if (data && Array.isArray(data.data)) {
                    console.log(`Received ${data.data.length} languages from server`);
                    setLanguages(data.data);
                } else {
                    console.warn('Invalid response format from language endpoint, using defaults');
                    setLanguages(defaultLanguages);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to fetch languages:', error);
                    setLanguages(defaultLanguages);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchLanguages();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [customLanguages, get]);

    return (
        <Box>
            <Flex gap={2}>
                <Box style={{ flexGrow: 1 }}>
                    <Select
                        id="language-selector"
                        name="language"
                        label={label}
                        placeholder="Select a language"
                        value={value}
                        onChange={(value: string) => onChange(value)}
                        disabled={disabled || isLoading}
                        error={error}
                        hint={hint}
                    >
                        {languages.map((language) => (
                            <Option key={language.code} value={language.code}>
                                {language.name}
                            </Option>
                        ))}
                    </Select>
                </Box>

                {onAddNewLanguage && (
                    <Box style={{ alignSelf: 'flex-end' }}>
                        <Button
                            variant="secondary"
                            startIcon={<Plus />}
                            onClick={onAddNewLanguage}
                            disabled={disabled}
                        >
                            {addNewLabel}
                        </Button>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};

export default LanguageSelector;