// src/plugins/per-language/admin/src/components/article-perlanguage/LanguageProcessorField.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ProcessedDataDisplay } from './ProcessedDataDisplay';
import { SUPPORTED_LANGUAGES } from '../shared';

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
        intlLabel,
        required,
        document,
        documentId,
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

    // ENHANCED DEBUGGING: Better document ID extraction for Strapi v5
    const articleId = (() => {
        console.log('[DEBUG] All props passed to component:', {
            documentId,
            document,
            modifiedData,
            allPropsKeys: Object.keys(allProps),
            url: window.location.pathname,
            search: window.location.search
        });

        // Try documentId first (Strapi v5)
        if (documentId) {
            console.log('[DEBUG] Using documentId prop:', documentId);
            return documentId.toString();
        }

        // Try document.documentId (Strapi v5)
        if (modifiedData.documentId) {
            console.log('[DEBUG] Using document.documentId:', modifiedData.documentId);
            return modifiedData.documentId.toString();
        }

        // Try document.id (fallback for v4 compatibility)
        if (modifiedData.id) {
            console.log('[DEBUG] Using document.id:', modifiedData.id);
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
                console.log('[DEBUG] Extracted from URL using pattern', pattern, ':', urlMatch[1]);
                return urlMatch[1];
            }
        }

        console.log('[DEBUG] No article ID found anywhere');
        return null;
    })();

    console.log('[LanguageProcessor] Final Document ID extraction result:', {
        documentId,
        documentDocumentId: modifiedData.documentId,
        documentId_prop: modifiedData.id,
        urlPath: window.location.pathname,
        finalArticleId: articleId
    });

    // Show debugging information in UI when no ID is found
    const debugInfo = !articleId ? (
        <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            marginBottom: '16px'
        }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>🔍 Debug Information</h4>
            <pre style={{
                fontSize: '12px',
                color: '#856404',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
            }}>
                {`Props received:
- documentId: ${documentId}
- document.documentId: ${modifiedData.documentId}
- document.id: ${modifiedData.id}
- URL: ${window.location.pathname}
- All props keys: ${Object.keys(allProps).join(', ')}

Document object: ${JSON.stringify(modifiedData, null, 2)}`}
            </pre>
        </div>
    ) : null;

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

            const response = await fetch(`/per-language/article/${articleId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
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

    const handleLanguageSelect = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLanguage = event.target.value;
        console.log('[LanguageProcessor] Language selected:', selectedLanguage);
        setTargetLanguage(selectedLanguage);

        if (!articleId || !selectedLanguage) {
            return;
        }

        try {
            setError(null);
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

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

            console.log('[LanguageProcessor] Starting translation process:', {
                articleId,
                targetLanguage,
                languageName: selectedLangInfo?.name,
                modifiedDataKeys: Object.keys(modifiedData || {}),
                allPropsKeys: Object.keys(allProps || {})
            });

            // ENHANCED: Better Base field extraction with reliable strategies
            let sourceText = null;

            // Strategy 1: Direct access from modifiedData (most reliable)
            sourceText = modifiedData?.Base || modifiedData?.base;

            // Strategy 2: Try from document prop if it exists
            if (!sourceText && document) {
                sourceText = (document as any)?.Base || (document as any)?.base;
            }

            // Strategy 3: Try from allProps with safe property access
            if (!sourceText) {
                try {
                    const propsAny = allProps as any;
                    sourceText = propsAny?.document?.Base ||
                        propsAny?.document?.base ||
                        propsAny?.initialValues?.Base ||
                        propsAny?.initialValues?.base ||
                        propsAny?.value?.Base ||
                        propsAny?.value?.base;
                } catch (e) {
                    console.log('[LanguageProcessor] Could not access props safely:', e);
                }
            }

            // Strategy 4: Fetch fresh article data from API as fallback
            if (!sourceText) {
                console.log('[LanguageProcessor] No Base field found in component props, fetching from API...');

                try {
                    // Try Strapi v5 API format first
                    let apiResponse = await fetch(`/api/articles/${articleId}?populate=*`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    // If v5 format fails, try content-manager API
                    if (!apiResponse.ok) {
                        apiResponse = await fetch(`/content-manager/collection-types/api::article.article/${articleId}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    if (apiResponse.ok) {
                        const articleData = await apiResponse.json();

                        // Try different response structures
                        sourceText = articleData?.data?.attributes?.Base ||
                            articleData?.data?.Base ||
                            articleData?.attributes?.Base ||
                            articleData?.Base ||
                            articleData?.base;

                        console.log('[LanguageProcessor] Fetched Base field from API:', {
                            found: !!sourceText,
                            length: sourceText?.length || 0,
                            apiStructure: Object.keys(articleData)
                        });
                    } else {
                        console.warn('[LanguageProcessor] API fetch failed:', apiResponse.status);
                    }
                } catch (apiError) {
                    console.warn('[LanguageProcessor] Failed to fetch article from API:', apiError);
                }
            }

            // Strategy 5: Let the backend handle Base field extraction
            if (!sourceText || sourceText.trim() === '') {
                console.log('[LanguageProcessor] No Base field accessible from frontend, delegating to backend...');

                const response = await fetch('/translator/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                    body: JSON.stringify({
                        text: '', // Empty text signals backend to extract Base field
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
                        errorMessage = `Translation failed: ${response.status}`;
                    }
                    throw new Error(errorMessage);
                }

                const { translatedText } = await response.json();

                console.log('[LanguageProcessor] Backend extraction and translation successful:', {
                    translatedLength: translatedText.length,
                    targetLanguage
                });

                onChange({ target: { name, value: translatedText } });
                await syncContentToDatabase(translatedText, targetLanguage);

                setSuccess(`Translation to ${selectedLangInfo?.name || targetLanguage} completed and saved`);
                setRefreshKey(prev => prev + 1);

                console.log('[LanguageProcessor] ✅ Translation completed via backend extraction');
                return;
            }

            console.log('[LanguageProcessor] Found Base content:', {
                length: sourceText.length,
                preview: sourceText.substring(0, 100) + '...'
            });

            // Proceed with translation using found source text
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
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || 'Translation failed';
                } catch {
                    errorMessage = `Translation failed: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const { translatedText } = await response.json();

            console.log('[LanguageProcessor] Translation completed:', {
                translatedLength: translatedText.length,
                targetLanguage
            });

            onChange({ target: { name, value: translatedText } });
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
    }, [modifiedData, targetLanguage, articleId, name, onChange, syncContentToDatabase, document, allProps]);

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

    // COMPLETELY AVOID STRAPI DESIGN SYSTEM - Use native HTML elements
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            {/* Debug info when no ID found */}
            {debugInfo}

            {/* Error/Success Messages */}
            {error && (
                <div style={{ padding: '12px', border: '1px solid #f28b82', borderRadius: '4px', backgroundColor: '#ffebee' }}>
                    <strong style={{ color: '#c62828' }}>Error</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#424242' }}>{error}</p>
                    <button
                        style={{ marginTop: '8px', padding: '4px 8px', border: 'none', background: '#f5f5f5', borderRadius: '2px', cursor: 'pointer' }}
                        onClick={() => setError(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {success && (
                <div style={{ padding: '12px', border: '1px solid #4caf50', borderRadius: '4px', backgroundColor: '#e8f5e8' }}>
                    <strong style={{ color: '#2e7d32' }}>Success</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#424242' }}>{success}</p>
                    <button
                        style={{ marginTop: '8px', padding: '4px 8px', border: 'none', background: '#f5f5f5', borderRadius: '2px', cursor: 'pointer' }}
                        onClick={() => setSuccess(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Translation Section */}
            <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#424242' }}>
                    Translation {articleId && <span style={{ fontSize: '12px', color: '#666' }}>(ID: {articleId})</span>}
                </h3>

                <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                    {/* Language selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#424242' }}>
                            Select Target Language {required && <span style={{ color: '#f44336' }}>*</span>}
                        </label>
                        <select
                            value={targetLanguage}
                            onChange={handleLanguageSelect}
                            disabled={isCreatingRecord}
                            style={{
                                width: '100%',
                                maxWidth: '300px',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                backgroundColor: isCreatingRecord ? '#f5f5f5' : 'white'
                            }}
                        >
                            <option value="">Choose a language to begin translation</option>
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name} {lang.hasProcessor ? '⚙️' : '🚧'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!hasSelectedLanguage && (
                        <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                                Please select a target language to begin translation and processing.
                                {articleId ? ' A language record will be created automatically.' : ' Save the article first to enable auto-sync.'}
                            </p>
                        </div>
                    )}

                    {hasSelectedLanguage && (
                        <>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleTranslate}
                                    disabled={isTranslating || isCreatingRecord || !articleId}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #1976d2',
                                        borderRadius: '4px',
                                        backgroundColor: isTranslating || isCreatingRecord || !articleId ? '#f5f5f5' : '#1976d2',
                                        color: isTranslating || isCreatingRecord || !articleId ? '#999' : 'white',
                                        cursor: isTranslating || isCreatingRecord || !articleId ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {isTranslating ? 'Translating...' : 'Translate'}
                                </button>

                                <button
                                    onClick={handleProcess}
                                    disabled={!hasContent || isCreatingRecord}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: !hasContent || isCreatingRecord ? '#f5f5f5' : 'white',
                                        color: !hasContent || isCreatingRecord ? '#999' : '#424242',
                                        cursor: !hasContent || isCreatingRecord ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {selectedLanguageInfo?.hasProcessor ? 'Process Content' : 'Processor (Coming Soon)'}
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#424242' }}>
                                    {selectedLanguageInfo?.name || 'Translation'} Content {required && <span style={{ color: '#f44336' }}>*</span>}
                                </label>
                                <textarea
                                    name={name}
                                    onChange={handleManualEdit}
                                    value={value}
                                    disabled={isCreatingRecord}
                                    style={{
                                        width: '100%',
                                        minHeight: '200px',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        backgroundColor: isCreatingRecord ? '#f5f5f5' : 'white'
                                    }}
                                />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    {articleId
                                        ? `Translated content for ${selectedLanguageInfo?.name}. Changes auto-sync to database.`
                                        : `Translated content for ${selectedLanguageInfo?.name}. Save article to enable auto-sync.`
                                    }
                                </small>
                            </div>

                            {isCreatingRecord && (
                                <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                                    <p style={{ margin: 0, color: '#1976d2', fontSize: '14px' }}>
                                        Creating {selectedLanguageInfo?.name} language record...
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />

            {/* Multi-Language Processing Center */}
            <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#424242' }}>
                    Multi-Language Processing Center
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
                    Manage translation status, processing, publishing, and access controls across all languages.
                </p>
                {articleId ? (
                    <ProcessedDataDisplay
                        key={refreshKey}
                        articleId={articleId}
                        onRefresh={handleRefresh}
                    />
                ) : (
                    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            Please save the article first to enable multi-language processing and management.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageProcessorField;