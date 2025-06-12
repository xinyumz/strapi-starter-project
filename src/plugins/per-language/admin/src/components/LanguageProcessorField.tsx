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
    Badge,
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
    const [targetLanguage, setTargetLanguage] = useState('zh');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
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
    const canProcess = hasContent;

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

    // FIXED: Separate sync function with proper error handling
    const syncToPerLanguages = async (content: string, articleId: string, language: string) => {
        if (!content || !content.trim()) {
            console.log('[LanguageProcessorField] No content to sync');
            return;
        }

        setIsSyncing(true);
        try {
            console.log('[LanguageProcessorField] Syncing to per_languages table:', {
                articleId,
                language,
                contentLength: content.length,
                contentPreview: content.substring(0, 50) + '...'
            });

            // Primary sync endpoint
            const response = await fetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: language,
                    content: content
                }),
            });

            if (response.ok) {
                console.log('[LanguageProcessorField] ✅ Successfully synced to per_languages table');
            } else {
                console.warn('[LanguageProcessorField] Primary sync failed, trying fallback method');

                // Fallback: use the translate endpoint with manual flag
                const fallbackResponse = await fetch('/per-language/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                    body: JSON.stringify({
                        articleId: articleId,
                        targetLanguage: language,
                        text: content,
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

    // FIXED: Updated manual edit handler
    const handleManualEdit = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        console.log('[LanguageProcessorField] Manual edit detected:', {
            newValueLength: newValue.length,
            targetLanguage
        });

        // Update the form field immediately
        onChange({ target: { name, value: newValue } });

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce the sync operation
        saveTimeoutRef.current = setTimeout(async () => {
            const articleId = modifiedData.id;
            if (articleId && newValue.trim()) {
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

        if (!hasContent) {
            alert('Please translate content first.');
            return;
        }

        console.log('[LanguageProcessorField] Opening processor:', {
            language: targetLanguage,
            articleId,
            hasProcessor: selectedLanguageInfo?.hasProcessor,
            contentLength: value.length
        });

        if (selectedLanguageInfo?.hasProcessor) {
            // Open the Chinese processor with article ID as query parameter
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
            {/* FIXED: Reorganized Translation Section */}
            <Box>
                <Typography variant="delta" paddingBottom={3}>
                    Translation
                </Typography>

                <Stack spacing={4}>
                    {/* FIXED: Status indicators moved to top, no label */}
                    <StatusIndicators
                        hasContent={hasContent}
                        canProcess={canProcess}
                        hasProcessor={selectedLanguageInfo?.hasProcessor || false}
                        isSyncing={isSyncing}
                    />

                    {/* FIXED: Language selection with updated label */}
                    <Select
                        label="Select Target Language"
                        value={targetLanguage}
                        onChange={(value: string) => {
                            setTargetLanguage(value);
                        }}
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <Option key={lang.code} value={lang.code}>
                                {lang.name} {lang.hasProcessor ? '⚙️' : '🚧'}
                            </Option>
                        ))}
                    </Select>

                    {/* FIXED: Translate button moved up */}
                    <Flex gap={3}>
                        <Button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            loading={isTranslating}
                        >
                            {isTranslating ? 'Translating...' : `Translate to ${selectedLanguageInfo?.name}`}
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={handleProcess}
                            disabled={!canProcess}
                        >
                            {selectedLanguageInfo?.hasProcessor ? 'Process Content' : 'Processor (Coming Soon)'}
                        </Button>
                    </Flex>

                    {/* FIXED: Translation text area moved below controls */}
                    <Textarea
                        label={formatMessage(intlLabel)}
                        name={name}
                        onChange={handleManualEdit}
                        value={value}
                        required={required}
                        style={{ minHeight: '200px' }}
                        hint="Translated content will appear here after translation. You can also edit manually."
                    />
                </Stack>
            </Box>

            <Divider />

            {/* Multi-Language Processing Center - unchanged */}
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