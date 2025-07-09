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

import styled from 'styled-components';

const TallTextareaWrapper = styled.div`
  margin-bottom: 1.2rem; 
  & > div {
    height: 250px !important;
  }
`;

// ====================================
// AUTHENTICATION UTILITIES
// ====================================

/**
 * Authentication token retrieval for Strapi v5
 */
function getAuthToken(): string | null {
    const tokenKeys = ['jwtToken', 'strapi-jwt-token', 'strapiToken'];

    // Check localStorage and sessionStorage quietly
    for (const key of tokenKeys) {
        let token = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (token && token.trim().length > 10) {
            return token;
        }
    }
    return null;
}


/**
 * Create authenticated headers for API requests
 */
function createAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Fetch wrapper with automatic retry and error handling
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = createAuthHeaders();

    const enhancedOptions: RequestInit = {
        ...options,
        headers: { ...headers, ...options.headers }
    };

    try {
        const response = await fetch(url, enhancedOptions);

        // Only log important events, not routine success
        if (!response.ok && response.status !== 404) {
            console.log(`[API] ${response.status} response for ${url}`);
        }

        return response;
    } catch (error) {
        console.error(`[API] Network error for ${url}:`, error);
        throw error;
    }
}

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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const lastSyncedContent = useRef<string>('');

    const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const hasContent = Boolean(value && value.trim().length > 0);
    const hasSelectedLanguage = Boolean(targetLanguage);
    const modifiedData = document || allProps || {};

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

            const response = await authenticatedFetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
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

            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
            setSuccess(`${selectedLangInfo?.name || languageCode} content saved automatically`);

        } catch (error: any) {
            console.error('[LanguageProcessor] Sync error:', error);
            setError(`Failed to sync content: ${error.message}`);
            throw error;
        }
    }, [articleId]);

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

                if (existingContent.trim()) {
                    setSuccess(`Loaded existing ${selectedLangInfo?.name || selectedLanguage} content`);
                }
            } else {
                console.log('[LanguageProcessor] No existing content, creating new record');
                onChange({ target: { name, value: '' } });
                lastSyncedContent.current = '';
                await createLanguageRecord(selectedLanguage);
            }
        } catch (error: any) {
            console.error('[LanguageProcessor] Error loading language content:', error);
            onChange({ target: { name, value: '' } });
            lastSyncedContent.current = '';
            await createLanguageRecord(selectedLanguage);
        }

        setRefreshKey(prev => prev + 1);
    }, [articleId, name, onChange, createLanguageRecord]);

    const handleManualEdit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        console.log('[LanguageProcessor] Manual edit:', {
            language: targetLanguage,
            length: newValue.length
        });

        onChange({ target: { name, value: newValue } });

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (articleId && targetLanguage) {
            debounceTimer.current = setTimeout(() => {
                syncContentToDatabase(newValue, targetLanguage);
            }, 1000);
        }
    }, [name, onChange, articleId, targetLanguage, syncContentToDatabase]);

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

            // Update the UI and sync to database
            onChange({ target: { name, value: translatedText } });
            await syncContentToDatabase(translatedText, targetLanguage);

            setSuccess(`Translation to ${selectedLangInfo?.name || targetLanguage} completed and saved`);
            setRefreshKey(prev => prev + 1);

            console.log('[LanguageProcessor] ✅ Streamlined translation workflow completed successfully');

        } catch (error: any) {
            console.error('[LanguageProcessor] Translation error:', error);
            setError(`Translation failed: ${error.message}`);
        } finally {
            setIsTranslating(false);
        }
    }, [document, targetLanguage, articleId, name, onChange, syncContentToDatabase]);

    const handleProcess = useCallback(async () => {
        if (!articleId) {
            setError('Please save the article first.');
            return;
        }

        if (!targetLanguage || !hasContent) {
            setError('Please select a language and add content first.');
            return;
        }

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

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
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

                {/* Error/Success Messages */}
                {error && (
                    <Alert variant="danger" title="Error" onClose={() => setError(null)} marginTop={2} marginBottom={3}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert variant="success" title="Success" onClose={() => setSuccess(null)} marginTop={2} marginBottom={3}>
                        {success}
                    </Alert>
                )}

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
                                    {articleId ? ' A language record will be created automatically.' : ' Save the article first to enable auto-sync.'}
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
                                        disabled={!hasContent || isCreatingRecord}
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
                                    <Box>
                                        <Typography variant="pi" textColor="neutral600">
                                            {articleId
                                                ? `Translated content for ${selectedLanguageInfo?.name}. Changes auto-sync to database.`
                                                : `Translated content for ${selectedLanguageInfo?.name}. Save article to enable auto-sync.`
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
        </Box>
    );
};

export default LanguageProcessorField;