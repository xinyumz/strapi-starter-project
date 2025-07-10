// src/plugins/per-language/admin/src/components/article-perlanguage/LanguageProcessorField.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    SingleSelect,
    SingleSelectOption,
    Typography,
    Flex,
    Divider,
    Alert,
    Textarea
} from '@strapi/design-system';
import { ProcessedDataDisplay } from './ProcessedDataDisplay';
import { SUPPORTED_LANGUAGES } from '../shared';
import { useAlertMessages } from '../hooks';
import { AlertMessages } from '../shared/AlertMessages';

import { Check, Briefcase, WarningCircle } from '@strapi/icons';

import styled from 'styled-components';

import { authenticatedFetch } from '../../utils/auth';

const TallTextareaWrapper = styled.div`
  margin-bottom: 1.2rem; 
  & > div {
    height: 250px !important;
  }
`;

interface LanguageProcessorFieldProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
    document?: any;
    documentId?: string | number;
    attribute?: any;
}

// Save status type for better type safety
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const LanguageProcessorField: React.FC<LanguageProcessorFieldProps> = (allProps) => {
    // Extract only the props we need, filter out problematic ones
    const {
        name,
        value,
        onChange,
        required,
        document,
        documentId,
        attribute,
        ...Props
    } = allProps;

    const [targetLanguage, setTargetLanguage] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isCreatingRecord, setIsCreatingRecord] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    // Use the proper alert messages hook
    const { error, success, setError, setSuccess } = useAlertMessages();

    // Manual save states
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [originalContent, setOriginalContent] = useState<string>('');

    // Remove the debounce timer since we're going manual
    const lastSyncedContent = useRef<string>('');

    const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const hasContent = Boolean(value && value.trim().length > 0);
    const hasSelectedLanguage = Boolean(targetLanguage);
    const modifiedData = document || allProps || {};

    // States for language card specific alerts
    const [languageCardError, setLanguageCardError] = useState<string | null>(null);
    const [languageCardSuccess, setLanguageCardSuccess] = useState<string | null>(null);

    // document ID extraction for Strapi v5
    const articleId = (() => {
        // Try documentId first (Strapi v5)
        if (documentId) {
            return documentId.toString();
        }

        // Try document.documentId (Strapi v5)
        if (modifiedData.documentId) {
            return modifiedData.documentId.toString();
        }

        // Try document.id (fallback for v4 compatibility)
        if (modifiedData.id) {
            return modifiedData.id.toString();
        }

        // Try to extract from URL as last resort - multiple patterns for Strapi v5
        const urlPatterns = [
            /\/admin\/content-manager\/collection-types\/api::article\.article\/([^\/\?]+)/,
            /\/admin\/content-manager\/collectionType\/api::article\.article\/([^\/\?]+)/,
            /\/content-manager\/collection-types\/api::article\.article\/([^\/\?]+)/,
            /\/([a-zA-Z0-9]{20,})(?:\/|$|\?)/  // Generic documentId pattern
        ];

        for (const pattern of urlPatterns) {
            const urlMatch = window.location.pathname.match(pattern);
            if (urlMatch) {
                return urlMatch[1];
            }
        }

        return null;
    })();

    // Reset save status after successful save
    useEffect(() => {
        if (saveStatus === 'saved') {
            const timer = setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    // Auto-clear for bottom alerts
    useEffect(() => {
        if (languageCardError || languageCardSuccess) {
            const timer = setTimeout(() => {
                setLanguageCardError(null);
                setLanguageCardSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [languageCardError, languageCardSuccess]);

    // Manual save function
    const handleManualSave = useCallback(async () => {
        if (!articleId || !targetLanguage || !hasUnsavedChanges) {
            console.log('[LanguageProcessor] Manual save skipped - missing requirements or no changes');
            return;
        }

        try {
            setSaveStatus('saving');
            setError(null);

            console.log('[LanguageProcessor] Manual save initiated:', {
                articleId,
                language: targetLanguage,
                contentLength: value.length,
                preview: value.substring(0, 50) + '...'
            });

            const response = await authenticatedFetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                body: JSON.stringify({
                    language: targetLanguage,
                    content: value,
                }),
            });

            if (!response.ok) {
                throw new Error(`Save failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('[LanguageProcessor] ✅ Manual save successful:', result);

            // Update state on successful save
            lastSyncedContent.current = value;
            setOriginalContent(value);
            setHasUnsavedChanges(false);
            setSaveStatus('saved');

            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
            setSuccess(`${selectedLangInfo?.name || targetLanguage} content saved successfully`);

        } catch (error: any) {
            console.error('[LanguageProcessor] Manual save error:', error);
            setSaveStatus('error');
            setError(`Failed to save content: ${error.message}`);
        }
    }, [articleId, targetLanguage, value, hasUnsavedChanges]);

    const createLanguageRecord = useCallback(async (languageCode: string) => {
        if (!articleId) {
            console.log('[LanguageProcessor] No article ID available, skipping record creation');
            return;
        }

        try {
            setIsCreatingRecord(true);
            setError(null);

            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);

            console.log('[LanguageProcessor] Creating article_perlanguages record:', {
                articleId,
                language: languageCode,
                languageName: selectedLangInfo?.name
            });

            const response = await authenticatedFetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                body: JSON.stringify({
                    language: languageCode,
                    content: ' ',
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

    const handleLanguageSelect = useCallback(async (selectedLanguage: string) => {
        console.log('[LanguageProcessor] Language selected:', selectedLanguage);
        setTargetLanguage(selectedLanguage);

        // Reset save states when switching languages
        setHasUnsavedChanges(false);
        setSaveStatus('idle');

        if (!articleId || !selectedLanguage) {
            return;
        }

        try {
            setError(null);
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

            const response = await authenticatedFetch(`/per-language/article/${articleId}/content?language=${selectedLanguage}`);

            if (response.ok) {
                const result = await response.json();
                const existingContent = result.data?.per_language_text || '';

                console.log('[LanguageProcessor] Found existing content:', {
                    language: selectedLanguage,
                    contentLength: existingContent.length
                });

                onChange({ target: { name, value: existingContent } });
                lastSyncedContent.current = existingContent;
                setOriginalContent(existingContent);

                if (existingContent.trim()) {
                    setSuccess(`Loaded existing ${selectedLangInfo?.name || selectedLanguage} content`);
                }
            } else {
                console.log('[LanguageProcessor] No existing content, creating new record');
                onChange({ target: { name, value: '' } });
                lastSyncedContent.current = '';
                setOriginalContent('');
                await createLanguageRecord(selectedLanguage);
            }
        } catch (error: any) {
            console.error('[LanguageProcessor] Error loading language content:', error);
            onChange({ target: { name, value: '' } });
            lastSyncedContent.current = '';
            setOriginalContent('');
            await createLanguageRecord(selectedLanguage);
        }

        setRefreshKey(prev => prev + 1);
    }, [articleId, name, onChange, createLanguageRecord]);

    // Handle manual edit with change detection
    const handleManualEdit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart;

        onChange({ target: { name, value: newValue } });

        // Detect if content has changed from original
        const hasChanges = newValue !== originalContent;
        setHasUnsavedChanges(hasChanges);

        // Reset save status when user starts typing again
        if (saveStatus === 'saved' || saveStatus === 'error') {
            setSaveStatus('idle');
        }

        // Restore cursor position after state update
        requestAnimationFrame(() => {
            const textarea = e.target;
            if (textarea && typeof cursorPosition === 'number') {
                textarea.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
    }, [name, onChange, originalContent, saveStatus]);

    // Handle translation for Base field
    const handleTranslate = useCallback(async () => {
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

            console.log('[LanguageProcessor] Starting streamlined translation process:', {
                articleId,
                targetLanguage,
                languageName: selectedLangInfo?.name
            });

            // Check for Base field in component data first
            let sourceText = null;

            // Strategy 1: Direct access from props/document (most reliable)
            if (document?.Base) {
                sourceText = document.Base;
                console.log('[LanguageProcessor] ✅ Found Base content in component props');
            } else if (document?.base) {
                sourceText = document.base;
                console.log('[LanguageProcessor] ✅ Found base content in component props');
            }

            // Strategy 2: If no local content, delegate everything to backend
            if (!sourceText || sourceText.trim() === '') {
                console.log('[LanguageProcessor] 🔄 No local Base content, using backend extraction (this works well!)');
                sourceText = ''; // Backend will extract the Base field from the database
            } else {
                console.log('[LanguageProcessor] 📝 Using local Base content:', {
                    length: sourceText.length,
                    preview: sourceText.substring(0, 100) + '...'
                });
            }

            // SINGLE API CALL: Let the backend handle everything
            const response = await authenticatedFetch('/translator/translate', {
                method: 'POST',
                body: JSON.stringify({
                    text: sourceText, // Can be empty - backend will handle extraction
                    targetLanguage,
                    articleId: articleId
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || 'Translation failed';
                } catch {
                    errorMessage = `Translation failed: HTTP ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const { translatedText } = await response.json();

            console.log('[LanguageProcessor] ✅ Translation completed successfully:', {
                translatedLength: translatedText.length,
                targetLanguage
            });

            // Update the UI - this will automatically trigger change detection
            onChange({ target: { name, value: translatedText } });
            setOriginalContent(translatedText); // Set as new baseline since it's fresh from translation
            setHasUnsavedChanges(false); // Translation is auto-saved by backend
            setSaveStatus('saved'); // Show that translation was saved

            setSuccess(`Translation to ${selectedLangInfo?.name || targetLanguage} completed and saved`);
            setRefreshKey(prev => prev + 1);

            console.log('[LanguageProcessor] ✅ Streamlined translation workflow completed successfully');

        } catch (error: any) {
            console.error('[LanguageProcessor] Translation error:', error);
            setError(`Translation failed: ${error.message}`);
        } finally {
            setIsTranslating(false);
        }
    }, [document, targetLanguage, articleId, name, onChange]);

    const handleProcess = useCallback(async () => {
        if (!articleId) {
            setError('Please save the article first.');
            return;
        }

        if (!targetLanguage || !hasContent) {
            setError('Please select a language and add content first.');
            return;
        }

        // Check if there are unsaved changes before processing
        if (hasUnsavedChanges) {
            setError('Please save your changes before processing.');
            return;
        }

        if (selectedLanguageInfo?.hasProcessor) {
            const processorUrl = `/admin/plugins/chinese-article-processor/chinese-processor?articleId=${articleId}`;
            window.open(processorUrl, '_blank');
        } else {
            setError(`${selectedLanguageInfo?.name} processor is under development.`);
        }
    }, [articleId, targetLanguage, hasContent, selectedLanguageInfo, hasUnsavedChanges]);

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <Box width="100%">
            <Box marginBottom={6} width="100%">
                {/* Debug info when no ID found */}
                {!articleId && (
                    <Alert variant="danger" title="🔍 Debug Information" marginTop={2} marginBottom={2}>
                        <Typography variant="pi">
                            No article ID found. Please save the article first or access this page from the article editor.
                        </Typography>
                    </Alert>
                )}

                {/* Success/error messages */}
                <AlertMessages
                    error={error}
                    success={success}
                    onErrorClose={() => setError(null)}
                    onSuccessClose={() => setSuccess(null)}
                />

                {/* Translation Section */}
                <Box width="100%">
                    <Box paddingBottom={3}>
                        <Typography variant="delta">
                            Translation {articleId && <Typography variant="pi" color="neutral600">(ID: {articleId})</Typography>}
                        </Typography>
                    </Box>
                    <Box paddingBottom={4}>
                        {/* Language selection */}
                        <SingleSelect
                            label="Select Target Language"
                            placeholder="Choose a language to begin translation"
                            value={targetLanguage}
                            onChange={handleLanguageSelect}
                            required={required}
                            disabled={isCreatingRecord}
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <SingleSelectOption key={lang.code} value={lang.code}>
                                    {lang.name} {lang.hasProcessor ? '⚙️' : '🚧'}
                                </SingleSelectOption>
                            ))}
                        </SingleSelect>

                        {!hasSelectedLanguage && (
                            <Box padding={3} background="neutral100" hasRadius marginTop={3}>
                                <Typography variant="pi" color="neutral600">
                                    Please select a target language to begin translation and processing.
                                    {articleId ? ' A language record will be created automatically.' : ' Save the article first to enable manual save.'}
                                </Typography>
                            </Box>
                        )}

                        {hasSelectedLanguage && (
                            <Box width="100%">
                                <Flex gap={3} marginTop={3} marginBottom={3} >
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
                                        disabled={!hasContent || isCreatingRecord || hasUnsavedChanges}
                                    >
                                        {selectedLanguageInfo?.hasProcessor ? 'Process Content' : 'Processor (Coming Soon)'}
                                    </Button>
                                </Flex>

                                <Box width="100%" marginBottom={3}>
                                    <TallTextareaWrapper>
                                        <Textarea
                                            label={`${selectedLanguageInfo?.name || 'Translation'} Content`}
                                            name={name}
                                            onChange={handleManualEdit}
                                            value={value || ""}
                                            required={required}
                                            disabled={isCreatingRecord}
                                        />
                                    </TallTextareaWrapper>

                                    {/* Manual Save Controls */}
                                    {hasUnsavedChanges && (
                                        <Flex gap={2} marginTop={2} justifyContent="flex-end" alignItems="center">
                                            <Flex gap={1} alignItems="center">
                                                <WarningCircle />
                                                <Typography variant="pi" color="warning600">
                                                    You have unsaved changes
                                                </Typography>
                                            </Flex>
                                            <Button
                                                variant="success"
                                                onClick={handleManualSave}
                                                loading={saveStatus === 'saving'}
                                                startIcon={saveStatus === 'saved' ? <Check /> : <Briefcase />}
                                                size="S"
                                            >
                                                {saveStatus === 'saving' ? 'Saving...' :
                                                    saveStatus === 'saved' ? 'Saved!' :
                                                        'Save Changes'}
                                            </Button>
                                        </Flex>
                                    )}

                                    {/* Save Status Indicator */}
                                    {saveStatus === 'saved' && !hasUnsavedChanges && (
                                        <Flex gap={2} marginTop={2} justifyContent="flex-end" alignItems="center">
                                            <Flex gap={1} alignItems="center">
                                                <Check />
                                                <Typography variant="pi" color="success600">
                                                    All changes saved
                                                </Typography>
                                            </Flex>
                                        </Flex>
                                    )}

                                    {saveStatus === 'error' && (
                                        <Flex gap={2} marginTop={2} justifyContent="flex-end" alignItems="center">
                                            <Flex gap={1} alignItems="center">
                                                <WarningCircle />
                                                <Typography variant="pi" color="danger600">
                                                    Save failed - please try again
                                                </Typography>
                                            </Flex>
                                        </Flex>
                                    )}
                                    <Box marginTop={2}>
                                        <Typography variant="pi" textColor="neutral600">
                                            {articleId
                                                ? `Translated content for ${selectedLanguageInfo?.name}. Use the save button above to save changes.`
                                                : `Translated content for ${selectedLanguageInfo?.name}. Save article first to enable manual save.`
                                            }
                                        </Typography>
                                    </Box>
                                </Box>

                                {isCreatingRecord && (
                                    <Box padding={2} background="primary100" hasRadius>
                                        <Typography variant="pi" color="primary600">
                                            Creating {selectedLanguageInfo?.name} language record...
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider />

                {/* Multi-Language Processing Center */}
                <Box width="100%" marginTop={4}>
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
                            onSuccess={setLanguageCardSuccess}
                            onError={setLanguageCardError}
                        />
                    ) : (
                        <Box padding={4} background="neutral100" hasRadius>
                            <Typography variant="pi" color="neutral600">
                                Please save the article first to enable multi-language processing and management.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
            <Box marginTop={4}>
                <AlertMessages
                    error={languageCardError}
                    success={languageCardSuccess}
                    onErrorClose={() => setLanguageCardError(null)}
                    onSuccessClose={() => setLanguageCardSuccess(null)}
                />
            </Box>
        </Box>
    );
};

export default LanguageProcessorField;