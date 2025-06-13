// src/plugins/per-language/admin/src/components/LanguageProcessorField.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    Alert
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { ProcessedDataDisplay } from './ProcessedDataDisplay';
import { SUPPORTED_LANGUAGES } from './shared';

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
    const [targetLanguage, setTargetLanguage] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isCreatingRecord, setIsCreatingRecord] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { modifiedData } = useCMEditViewDataManager();

    // Debounce timer for manual input
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const lastSyncedContent = useRef<string>('');

    const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const hasContent = Boolean(value && value.trim().length > 0);
    const hasSelectedLanguage = Boolean(targetLanguage);
    const articleId = modifiedData.id;

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    /**
     * FIXED: Direct sync function that takes explicit parameters
     */
    const syncContentToDatabase = useCallback(async (content: string, languageCode: string) => {
        if (!articleId || !languageCode) {
            console.log('[LanguageProcessor] Missing articleId or languageCode, skipping sync');
            return;
        }

        if (content === lastSyncedContent.current) {
            console.log('[LanguageProcessor] Content unchanged, skipping sync');
            return;
        }

        try {
            console.log('[LanguageProcessor] Syncing to database:', {
                articleId,
                language: languageCode,
                contentLength: content.length,
                preview: content.substring(0, 50) + '...'
            });

            const response = await fetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: languageCode,
                    content: content,
                }),
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('[LanguageProcessor] ✅ Content synced successfully:', result);

            lastSyncedContent.current = content;

            // Add success message for manual input sync
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
            setSuccess(`${selectedLangInfo?.name || languageCode} content saved automatically`);

        } catch (error: any) {
            console.error('[LanguageProcessor] Sync error:', error);
            setError(`Failed to sync content: ${error.message}`);
            throw error;
        }
    }, [articleId]);

    /**
     * FIXED: Create per_languages record with empty content only
     */
    const createLanguageRecord = useCallback(async (languageCode: string) => {
        if (!articleId) {
            console.log('[LanguageProcessor] No article ID available, skipping record creation');
            return;
        }

        try {
            setIsCreatingRecord(true);
            setError(null);

            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);

            console.log('[LanguageProcessor] Creating per_languages record:', {
                articleId,
                language: languageCode,
                languageName: selectedLangInfo?.name
            });

            const response = await fetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: languageCode,
                    content: ' ', // Always start with empty content for new records
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create language record: ${response.status}`);
            }

            const result = await response.json();
            console.log('[LanguageProcessor] ✅ Language record created:', result);

            setSuccess(`${selectedLangInfo?.name || languageCode} content initialized`);

        } catch (error: any) {
            console.error('[LanguageProcessor] Error creating language record:', error);
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
            setError(`Failed to initialize ${selectedLangInfo?.name || languageCode}: ${error.message}`);
        } finally {
            setIsCreatingRecord(false);
        }
    }, [articleId]);

    /**
     * FIXED: Language selection with proper content loading
     */
    const handleLanguageSelect = useCallback(async (selectedLanguage: string) => {
        console.log('[LanguageProcessor] Language selected:', selectedLanguage);
        setTargetLanguage(selectedLanguage);

        if (!articleId || !selectedLanguage) {
            return;
        }

        try {
            setError(null);
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

            // First, try to get existing content for this language
            const response = await fetch(`/per-language/article/${articleId}/content?language=${selectedLanguage}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                const existingContent = result.data?.per_language_text || '';

                console.log('[LanguageProcessor] Found existing content:', {
                    language: selectedLanguage,
                    contentLength: existingContent.length
                });

                // Update UI with existing content
                onChange({ target: { name, value: existingContent } });
                lastSyncedContent.current = existingContent;

                if (existingContent.trim()) {
                    setSuccess(`Loaded existing ${selectedLangInfo?.name || selectedLanguage} content`);
                }
            } else {
                // No existing content, clear field and create new record
                console.log('[LanguageProcessor] No existing content, creating new record');
                onChange({ target: { name, value: '' } });
                lastSyncedContent.current = '';

                await createLanguageRecord(selectedLanguage);
            }
        } catch (error: any) {
            console.error('[LanguageProcessor] Error loading language content:', error);
            // Clear field and create new record as fallback
            onChange({ target: { name, value: '' } });
            lastSyncedContent.current = '';
            await createLanguageRecord(selectedLanguage);
        }

        setRefreshKey(prev => prev + 1);
    }, [articleId, name, onChange, createLanguageRecord]);

    /**
     * FIXED: Manual edit with proper debounced sync
     */
    const handleManualEdit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        console.log('[LanguageProcessor] Manual edit:', {
            language: targetLanguage,
            length: newValue.length
        });

        // Update UI immediately
        onChange({ target: { name, value: newValue } });

        // Clear existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer for database sync (1 second delay)
        if (articleId && targetLanguage) {
            debounceTimer.current = setTimeout(() => {
                syncContentToDatabase(newValue, targetLanguage);
            }, 1000);
        }
    }, [name, onChange, articleId, targetLanguage, syncContentToDatabase]);

    /**
     * FIXED: Translation with immediate database sync
     */
    const handleTranslate = useCallback(async () => {
        const sourceText = modifiedData.Base || modifiedData.base;

        if (!sourceText) {
            setError('Base field is empty. Please add content to the Base field first.');
            return;
        }

        if (!targetLanguage) {
            setError('Please select a target language first.');
            return;
        }

        if (!articleId) {
            setError('Please save the article first.');
            return;
        }

        setIsTranslating(true);
        setError(null);

        try {
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);

            console.log('[LanguageProcessor] Starting translation:', {
                articleId,
                targetLanguage,
                sourceLength: sourceText.length,
                languageName: selectedLangInfo?.name
            });

            const response = await fetch('/translator/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    text: sourceText,
                    targetLanguage,
                    articleId: articleId
                }),
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.status}`);
            }

            const { translatedText } = await response.json();

            console.log('[LanguageProcessor] Translation received:', {
                translatedLength: translatedText.length,
                targetLanguage,
                preview: translatedText.substring(0, 50) + '...'
            });

            // Update UI field first
            onChange({ target: { name, value: translatedText } });

            // Immediately sync to database with explicit parameters
            await syncContentToDatabase(translatedText, targetLanguage);

            setSuccess(`Translation to ${selectedLangInfo?.name || targetLanguage} completed and saved`);
            setRefreshKey(prev => prev + 1);

            console.log('[LanguageProcessor] ✅ Translation workflow completed');

        } catch (error: any) {
            console.error('[LanguageProcessor] Translation error:', error);
            setError(`Translation failed: ${error.message}`);
        } finally {
            setIsTranslating(false);
        }
    }, [modifiedData, targetLanguage, articleId, name, onChange, syncContentToDatabase]);

    /**
     * Enhanced process handler with content verification
     */
    const handleProcess = useCallback(async () => {
        if (!articleId) {
            setError('Please save the article first.');
            return;
        }

        if (!targetLanguage || !hasContent) {
            setError('Please select a language and add content first.');
            return;
        }

        // Ensure content is synced before processing
        if (value && value !== lastSyncedContent.current) {
            try {
                await syncContentToDatabase(value, targetLanguage);
            } catch (error) {
                setError('Failed to sync content. Please try again.');
                return;
            }
        }

        if (selectedLanguageInfo?.hasProcessor) {
            const processorUrl = `/admin/plugins/chinese-article-processor/chinese-processor?articleId=${articleId}`;
            window.open(processorUrl, '_blank');
        } else {
            setError(`${selectedLanguageInfo?.name} processor is under development.`);
        }
    }, [articleId, targetLanguage, hasContent, value, selectedLanguageInfo, syncContentToDatabase]);

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    return (
        <Stack spacing={6}>
            {/* Error/Success Messages */}
            {error && (
                <Alert variant="danger" title="Error" closable onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" title="Success" closable onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Translation Section */}
            <Box>
                <Box paddingBottom={3}>
                    <Typography variant="delta">
                        Translation
                    </Typography>
                </Box>
                <Stack spacing={4}>
                    {/* Language selection */}
                    <Select
                        label="Select Target Language"
                        placeholder="Choose a language to begin translation"
                        value={targetLanguage}
                        onChange={handleLanguageSelect}
                        required
                        disabled={isCreatingRecord}
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <Option key={lang.code} value={lang.code}>
                                {lang.name} {lang.hasProcessor ? '⚙️' : '🚧'}
                            </Option>
                        ))}
                    </Select>

                    {!hasSelectedLanguage && (
                        <Box padding={3} background="neutral100" borderRadius="4px">
                            <Typography variant="pi" color="neutral600">
                                Please select a target language to begin translation and processing.
                                {articleId ? ' A language record will be created automatically.' : ' Save the article first to enable auto-sync.'}
                            </Typography>
                        </Box>
                    )}

                    {hasSelectedLanguage && (
                        <>
                            <Flex gap={3}>
                                <Button
                                    onClick={handleTranslate}
                                    disabled={isTranslating || isCreatingRecord || !articleId}
                                    loading={isTranslating}
                                >
                                    {isTranslating ? 'Translating...' : 'Translate'}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={handleProcess}
                                    disabled={!hasContent || isCreatingRecord}
                                >
                                    {selectedLanguageInfo?.hasProcessor ? 'Process Content' : 'Processor (Coming Soon)'}
                                </Button>
                            </Flex>

                            <Textarea
                                label={`${selectedLanguageInfo?.name || 'Translation'} Content`}
                                name={name}
                                onChange={handleManualEdit}
                                value={value}
                                required={required}
                                disabled={isCreatingRecord}
                                style={{ minHeight: '200px' }}
                                hint={articleId
                                    ? `Translated content for ${selectedLanguageInfo?.name}. Changes auto-sync to database.`
                                    : `Translated content for ${selectedLanguageInfo?.name}. Save article to enable auto-sync.`
                                }
                            />

                            {isCreatingRecord && (
                                <Box padding={2} background="primary100" borderRadius="4px">
                                    <Typography variant="pi" color="primary600">
                                        Creating {selectedLanguageInfo?.name} language record...
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Stack>
            </Box>

            <Divider />

            {/* Multi-Language Processing Center */}
            <Stack>
                <Box paddingBottom={2}>
                    <Typography variant="delta">
                        Multi-Language Processing Center
                    </Typography>
                </Box>
                <Box paddingBottom={4}>
                    <Typography variant="pi" color="neutral600">
                        Manage translation status, processing, publishing, and access controls across all languages.
                    </Typography>
                </Box>
                {articleId ? (
                    <ProcessedDataDisplay
                        key={refreshKey}
                        articleId={articleId}
                        onRefresh={handleRefresh}
                    />
                ) : (
                    <Box padding={4} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" color="neutral600">
                            Please save the article first to enable multi-language processing and management.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Stack>
    );
};

export default LanguageProcessorField;