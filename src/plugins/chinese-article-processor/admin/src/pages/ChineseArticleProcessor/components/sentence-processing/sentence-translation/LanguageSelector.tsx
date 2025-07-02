// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/grammar/LanguageSelector.tsx
import React, { useState, useEffect } from 'react';
import {
    SingleSelect,
    SingleSelectOption,
    Flex,
    Box
} from '@strapi/design-system';
import { useFetchClient } from "@strapi/strapi/admin";

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
    hint?: string;
    error?: string;
    addNewLabel?: string;
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
                const response = await get('/chinese-article-processor/languages', {
                    signal: controller.signal
                });

                if (!isMounted) return;

                if (response.data && Array.isArray(response.data.data)) {
                    console.log(`Received ${response.data.data.length} languages from server`);
                    setLanguages(response.data.data);
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
        <Box width="100%">
            <Flex gap={2}>
                <Box style={{ flexGrow: 1 }}>
                    <SingleSelect
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
                            <SingleSelectOption key={language.code} value={language.code}>
                                {language.name}
                            </SingleSelectOption>
                        ))}
                    </SingleSelect>
                </Box>
            </Flex>
        </Box>
    );
};

export default LanguageSelector;