// src/plugins/per-language/admin/src/components/LanguageProcessorField.tsx

import React, { useState } from 'react';
import {
    Stack,
    Textarea,
    Button,
    Select,
    Option,
    Typography,
    Box,
    Flex,
    Divider,
    Wysiwyg
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { ProcessedDataDisplay } from './ProcessedDataDisplay';
import { SUPPORTED_LANGUAGES, StatusIndicators } from './shared';

interface LanguageProcessorFieldProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
}

const LanguageProcessorField: React.FC<LanguageProcessorFieldProps> = ({
    name,
    value,
    onChange,
    intlLabel,
    required,
}) => {
    const { formatMessage } = useIntl();
    // CHANGED: No default language selection - user must choose
    const [targetLanguage, setTargetLanguage] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCreatingRecord, setIsCreatingRecord] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { modifiedData } = useCMEditViewDataManager();

    // Add ref for debouncing manual edits
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const hasContent = Boolean(value && value.trim().length > 0);
    const canProcess = Boolean(hasContent && targetLanguage); // FIXED: Convert to boolean
    const hasSelectedLanguage = Boolean(targetLanguage); // NEW: Track if language is selected

    // NEW: Function to create per_languages record when language is selected
    const createLanguageRecord = async (articleId: string, language: string, initialContent: string = '') => {
        setIsCreatingRecord(true);
        try {
            console.log('[LanguageProcessorField] Creating language record:', {
                articleId,
                language,
                hasInitialContent: !!initialContent
            });

            const response = await fetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: language,
                    content: initialContent || ' ' // Use space if no content to ensure record creation
                }),
            });

            if (response.ok) {
                console.log('[LanguageProcessorField] ✅ Language record created successfully');
                // Refresh the ProcessedDataDisplay to show the new record
                setRefreshKey(prev => prev + 1);
                return true;
            } else {
                console.error('[LanguageProcessorField] Failed to create language record');
                return false;
            }
        } catch (error) {
            console.error('[LanguageProcessorField] Error creating language record:', error);
            return false;
        } finally {
            setIsCreatingRecord(false);
        }
    };

    // CHANGED: Enhanced language selection handler
    const handleLanguageSelect = async (selectedLanguage: string) => {
        const articleId = modifiedData.id;

        console.log('[LanguageProcessorField] Language selected:', {
            selectedLanguage,
            articleId,
            hasExistingContent: !!value
        });

        setTargetLanguage(selectedLanguage);

        // If article is saved, immediately create the per_languages record
        if (articleId && selectedLanguage) {
            // Use existing field content if available
            const existingContent = value || '';
            await createLanguageRecord(articleId, selectedLanguage, existingContent);
        }
    };

    const handleTranslate = async () => {
        const sourceText = modifiedData.Base || modifiedData.base;
        const articleId = modifiedData.id;

        console.log('[LanguageProcessorField] Starting translation:', {
            hasSourceText: !!sourceText,
            sourceTextLength: sourceText?.length || 0,
            articleId,
            targetLanguage,
            fieldName: name
        });

        if (!sourceText) {
            alert('Base field is empty. Please add content to the Base field first.');
            return;
        }

        if (!targetLanguage) {
            alert('Please select a target language first.');
            return;
        }

        setIsTranslating(true);
        try {
            const requestBody = {
                text: sourceText,
                targetLanguage,
                articleId: articleId
            };

            console.log('[LanguageProcessorField] Request body:', requestBody);

            const response = await fetch('/translator/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Translation failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const { translatedText } = await response.json();

            console.log('[LanguageProcessorField] Translation successful, updating field and syncing to per_languages');

            // Update the field value
            onChange({ target: { name, value: translatedText } });

            // IMMEDIATELY sync to per_languages table
            if (articleId) {
                await syncToPerLanguages(translatedText, articleId, targetLanguage);
            }

            // Refresh the ProcessedDataDisplay
            setRefreshKey(prev => prev + 1);

        } catch (error: any) {
            console.error('Translation error:', error);
            alert(`Translation failed: ${error.message}`);
        } finally {
            setIsTranslating(false);
        }
    };

    // UPDATED: Improved sync function
    const syncToPerLanguages = async (content: string, articleId: string, language: string) => {
        if (!language) {
            console.log('[LanguageProcessorField] No language selected for sync');
            return;
        }

        setIsSyncing(true);
        try {
            console.log('[LanguageProcessorField] Syncing to per_languages table:', {
                articleId,
                language,
                contentLength: content?.length || 0,
                contentPreview: content ? content.substring(0, 50) + '...' : 'empty'
            });

            // Use the primary sync endpoint
            const response = await fetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: language,
                    content: content || ' ' // Ensure we always have some content
                }),
            });

            if (response.ok) {
                console.log('[LanguageProcessorField] ✅ Successfully synced to per_languages table');
            } else {
                console.warn('[LanguageProcessorField] Primary sync failed, trying fallback method');

                // Fallback: use the translate endpoint with manual flag
                const fallbackResponse = await fetch('/per-language/translate-enhanced', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                    body: JSON.stringify({
                        articleId: articleId,
                        targetLanguage: language,
                        text: content || ' ',
                        isManualContent: true // Flag to indicate this is manual content, not auto-translated
                    }),
                });

                if (fallbackResponse.ok) {
                    console.log('[LanguageProcessorField] ✅ Successfully synced via fallback method');
                } else {
                    console.error('[LanguageProcessorField] Both sync methods failed');
                }
            }
        } catch (error) {
            console.error('[LanguageProcessorField] Error syncing to per_languages:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // UPDATED: Manual edit handler now works with language selection
    const handleManualEdit = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        console.log('[LanguageProcessorField] Manual edit detected:', {
            newValueLength: newValue.length,
            targetLanguage,
            hasLanguageSelected: !!targetLanguage
        });

        // Update the form field immediately
        onChange({ target: { name, value: newValue } });

        // Only sync if language is selected
        if (!targetLanguage) {
            console.log('[LanguageProcessorField] No language selected, skipping sync');
            return;
        }

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce the sync operation
        saveTimeoutRef.current = setTimeout(async () => {
            const articleId = modifiedData.id;
            if (articleId && targetLanguage) {
                console.log('[LanguageProcessorField] Debounced sync triggered for manual edit');
                await syncToPerLanguages(newValue, articleId, targetLanguage);
                // Refresh the ProcessedDataDisplay
                setRefreshKey(prev => prev + 1);
            }
        }, 1000); // Wait 1 second after user stops typing
    };

    const handleProcess = () => {
        const articleId = modifiedData.id;

        if (!articleId) {
            alert('Please save the article first.');
            return;
        }

        if (!targetLanguage) {
            alert('Please select a target language first.');
            return;
        }

        if (!hasContent) {
            alert('Please add content in the selected language first.');
            return;
        }

        console.log('[LanguageProcessorField] Opening processor:', {
            language: targetLanguage,
            articleId,
            hasProcessor: selectedLanguageInfo?.hasProcessor,
            contentLength: value.length
        });

        if (selectedLanguageInfo?.hasProcessor) {
            // Open the processor with article ID as query parameter
            const processorUrl = `/admin/plugins/chinese-article-processor/chinese-processor?articleId=${articleId}`;
            window.open(processorUrl, '_blank');
        } else {
            // Show under development message
            alert(`${selectedLanguageInfo?.name} processor is under development. Coming soon!`);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Stack spacing={6}>
            {/* Translation Section */}
            <Box>
                <Typography variant="delta" paddingBottom={3}>
                    Translation
                </Typography>

                <Stack spacing={4}>
                    {/* Status indicators - only show if language is selected */}
                    {hasSelectedLanguage && (
                        <StatusIndicators
                            hasContent={hasContent}
                            canProcess={canProcess}
                            hasProcessor={selectedLanguageInfo?.hasProcessor || false}
                            isSyncing={isSyncing}
                        />
                    )}

                    {/* UPDATED: Language selection with placeholder and required selection */}
                    <Select
                        label="Select Target Language"
                        placeholder="Select target language"
                        value={targetLanguage}
                        onChange={handleLanguageSelect}
                        required
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <Option key={lang.code} value={lang.code}>
                                {lang.name} {lang.hasProcessor ? '⚙️' : '🚧'}
                            </Option>
                        ))}
                    </Select>

                    {/* Show message if no language selected */}
                    {!hasSelectedLanguage && (
                        <Box padding={3} background="neutral100" borderRadius="4px">
                            <Typography variant="pi" color="neutral600">
                                Please select a target language to begin translation and processing.
                            </Typography>
                        </Box>
                    )}

                    {/* Controls - only show if language is selected */}
                    {hasSelectedLanguage && (
                        <Flex gap={3}>
                            <Button
                                onClick={handleTranslate}
                                disabled={isTranslating || isCreatingRecord}
                                loading={isTranslating}
                            >
                                {isTranslating ? 'Translating...' : 'Translate'}
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={handleProcess}
                                disabled={!canProcess || isCreatingRecord}
                            >
                                {selectedLanguageInfo?.hasProcessor ? 'Process Content' : 'Processor (Coming Soon)'}
                            </Button>

                            {isCreatingRecord && (
                                <Typography variant="pi" color="neutral600">
                                    Setting up language record...
                                </Typography>
                            )}
                        </Flex>
                    )}

                    {/* Translation text area - only show if language is selected */}
                    {hasSelectedLanguage && (
                        <Textarea
                            label={`${selectedLanguageInfo?.name || 'Translation'} Content`}
                            name={name}
                            onChange={handleManualEdit}
                            value={value}
                            required={required}
                            style={{ minHeight: '200px' }}
                            hint={`Translated content for ${selectedLanguageInfo?.name} will appear here after translation. You can also edit manually.`}
                        />
                    )}
                </Stack>
            </Box>

            <Divider />

            {/* Multi-Language Processing Center */}
            <Box>
                <Flex justifyContent="flex-start" alignItems="center" paddingBottom={3}>
                    <Typography variant="delta">
                        Multi-Language Processing Center
                    </Typography>
                </Flex>

                <Box paddingBottom={4}>
                    <Typography variant="pi" color="neutral600">
                        Manage translation status, processing, publishing, and access controls for all languages from this centralized interface.
                    </Typography>
                </Box>

                {/* Integrated ProcessedDataDisplay */}
                {modifiedData.id ? (
                    <ProcessedDataDisplay
                        key={refreshKey} // Force refresh when key changes
                        articleId={modifiedData.id}
                        onRefresh={handleRefresh}
                    />
                ) : (
                    <Box padding={4} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" color="neutral600">
                            Please save the article first to enable multi-language processing.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Stack>
    );
};

export default LanguageProcessorField;