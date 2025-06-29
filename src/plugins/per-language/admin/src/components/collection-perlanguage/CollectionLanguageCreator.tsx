// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionLanguageCreator.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../shared';
import { CollectionLanguageData } from '../hooks';

interface CollectionStats {
    collectionId: number;
    articleCount: number;
    articles: Array<{
        id: number;
        title: string;
    }>;
}

interface AutoRetrievalData {
    scenario: 'no_articles' | 'no_language_data' | 'single_article' | 'multiple_articles';
    message: string;
    suggestedData?: {
        access_tier?: string;
        display_skill?: string;
        description?: string;
    };
    collectionStats?: {
        articleCount: number;
        hasLanguageData: boolean;
        languageDataCount: number;
    };
}

// Support both old and new prop interfaces
interface CollectionLanguageCreatorProps {
    // Original props (for backward compatibility)
    collectionId?: string;
    collectionLanguages?: CollectionLanguageData[];
    isCreatingRecord: boolean;
    onLanguageCreate: (languageCode: string, useAutoRetrieval?: boolean) => Promise<void>;
    onError?: (message: string) => void;

    // New enhanced props (optional)
    availableLanguages?: Array<{
        code: string;
        name: string;
        nativeName: string;
        processorAvailable?: boolean;
    }>;
    usedLanguages?: string[];
    collectionStats?: CollectionStats | null;
    isLoadingAutoRetrieval?: boolean;
    autoRetrievalData?: AutoRetrievalData | null;
    onGetAutoRetrieval?: (languageCode: string) => Promise<AutoRetrievalData | null>;
}

/**
 * Collection Language Creator with backward compatibility
 * 
 * Features:
 * - Backward compatible with original interface
 * - Auto-retrieval preview when enhanced props are provided
 * - Collection statistics display
 * - Smart vs Manual creation options
 */
export const CollectionLanguageCreator: React.FC<CollectionLanguageCreatorProps> = ({
    // Original props
    collectionId,
    collectionLanguages = [],
    isCreatingRecord,
    onLanguageCreate,
    onError,

    // Enhanced props
    availableLanguages,
    usedLanguages,
    collectionStats,
    isLoadingAutoRetrieval = false,
    autoRetrievalData,
    onGetAutoRetrieval
}) => {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [showAutoRetrievalPreview, setShowAutoRetrievalPreview] = useState(false);
    const [useAutoRetrieval, setUseAutoRetrieval] = useState(true);

    // Determine if we're using enhanced mode
    const isEnhancedMode = Boolean(availableLanguages && onGetAutoRetrieval);

    // Use provided languages or fall back to SUPPORTED_LANGUAGES
    const languageOptions = isEnhancedMode
        ? availableLanguages!
        : SUPPORTED_LANGUAGES.map(lang => ({
            code: lang.code,
            name: lang.name,
            nativeName: lang.name,
            processorAvailable: lang.hasProcessor
        }));

    // Use provided used languages or derive from collectionLanguages
    const usedLanguageCodes = usedLanguages || collectionLanguages.map(lang => lang.language);

    // Filter out already used languages
    const availableOptions = languageOptions.filter(
        lang => !usedLanguageCodes.includes(lang.code)
    );

    // Auto-load retrieval data when language is selected (enhanced mode only)
    useEffect(() => {
        if (isEnhancedMode && selectedLanguage && useAutoRetrieval && onGetAutoRetrieval) {
            onGetAutoRetrieval(selectedLanguage);
            setShowAutoRetrievalPreview(true);
        } else {
            setShowAutoRetrievalPreview(false);
        }
    }, [selectedLanguage, useAutoRetrieval, onGetAutoRetrieval, isEnhancedMode]);

    const handleCreateLanguage = useCallback(async () => {
        if (!selectedLanguage) return;

        // Check if language already exists (for both modes)
        const existingLanguage = collectionLanguages.find(lang => lang.language === selectedLanguage);
        if (existingLanguage) {
            onError?.(`${selectedLanguage} collection language already exists`);
            return;
        }

        await onLanguageCreate(selectedLanguage, isEnhancedMode ? useAutoRetrieval : false);

        // Reset form
        setSelectedLanguage('');
        setShowAutoRetrievalPreview(false);
    }, [selectedLanguage, collectionLanguages, onLanguageCreate, onError, useAutoRetrieval, isEnhancedMode]);

    const handleLanguageSelect = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLang = event.target.value;

        if (isEnhancedMode) {
            // Enhanced mode - just set selection, don't auto-create
            setSelectedLanguage(selectedLang);
        } else {
            // Original mode - auto-create on selection
            setSelectedLanguage(selectedLang);

            if (!collectionId || !selectedLang) return;

            const existingLanguage = collectionLanguages.find(lang => lang.language === selectedLang);
            if (existingLanguage) {
                onError?.(`${selectedLang} collection language already exists`);
                return;
            }

            await onLanguageCreate(selectedLang);
            setSelectedLanguage('');
        }
    }, [collectionId, collectionLanguages, onLanguageCreate, onError, isEnhancedMode]);

    const getScenarioIcon = (scenario: string) => {
        switch (scenario) {
            case 'no_articles':
                return '⚠️';
            case 'no_language_data':
                return '⚠️';
            case 'single_article':
                return '💡';
            case 'multiple_articles':
                return '✅';
            default:
                return 'ℹ️';
        }
    };

    const getScenarioColor = (scenario: string) => {
        switch (scenario) {
            case 'no_articles':
                return '#f44336';
            case 'no_language_data':
                return '#ff9800';
            case 'single_article':
                return '#4caf50';
            case 'multiple_articles':
                return '#2196f3';
            default:
                return '#666';
        }
    };

    const selectedLangInfo = languageOptions.find(lang => lang.code === selectedLanguage);

    // Render enhanced version if in enhanced mode
    if (isEnhancedMode) {
        return (
            <div style={{
                background: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '16px',
                marginBottom: '16px'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#424242' }}>
                    Add New Language
                </h3>

                {/* Collection Statistics */}
                {collectionStats && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#424242' }}>
                                Collection Info:
                            </span>
                            <span style={{
                                padding: '2px 8px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color: '#1976d2'
                            }}>
                                {collectionStats.articleCount} article{collectionStats.articleCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {collectionStats.articleCount > 0 && (
                            <div style={{ marginLeft: '8px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                    Articles: {collectionStats.articles.map(a => a.title).join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#424242' }}>
                            Select Language
                        </label>
                        <select
                            value={selectedLanguage}
                            onChange={handleLanguageSelect}
                            disabled={isCreatingRecord}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                backgroundColor: isCreatingRecord ? '#f5f5f5' : 'white'
                            }}
                        >
                            <option value="">Choose a language to add...</option>
                            {availableOptions.map(language => (
                                <option key={language.code} value={language.code}>
                                    {language.name} ({language.nativeName}) {language.processorAvailable ? '⚙️' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#424242' }}>
                            Auto-Retrieval Options
                        </label>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <button
                                onClick={() => setUseAutoRetrieval(true)}
                                disabled={isCreatingRecord || !selectedLanguage}
                                style={{
                                    padding: '6px 12px',
                                    border: `1px solid ${useAutoRetrieval ? '#2196f3' : '#ddd'}`,
                                    borderRadius: '4px',
                                    backgroundColor: useAutoRetrieval ? '#2196f3' : 'white',
                                    color: useAutoRetrieval ? 'white' : '#424242',
                                    cursor: isCreatingRecord || !selectedLanguage ? 'not-allowed' : 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                💡 Smart Create
                            </button>

                            <button
                                onClick={() => setUseAutoRetrieval(false)}
                                disabled={isCreatingRecord}
                                style={{
                                    padding: '6px 12px',
                                    border: `1px solid ${!useAutoRetrieval ? '#2196f3' : '#ddd'}`,
                                    borderRadius: '4px',
                                    backgroundColor: !useAutoRetrieval ? '#2196f3' : 'white',
                                    color: !useAutoRetrieval ? 'white' : '#424242',
                                    cursor: isCreatingRecord ? 'not-allowed' : 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Manual Create
                            </button>
                        </div>

                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                            {useAutoRetrieval
                                ? 'Automatically populate fields based on articles'
                                : 'Create with empty fields for manual setup'
                            }
                        </p>
                    </div>
                </div>

                {/* Auto-Retrieval Preview */}
                {showAutoRetrievalPreview && selectedLanguage && (
                    <div style={{ marginTop: '16px' }}>
                        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '12px 0' }} />

                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#424242' }}>
                            Auto-Retrieval Preview for {selectedLangInfo?.name}
                        </h4>

                        {isLoadingAutoRetrieval ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                                <div style={{ marginRight: '8px' }}>⌛</div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                    Analyzing collection data...
                                </p>
                            </div>
                        ) : autoRetrievalData ? (
                            <div>
                                <div style={{
                                    padding: '12px',
                                    border: `1px solid ${getScenarioColor(autoRetrievalData.scenario)}`,
                                    borderRadius: '4px',
                                    backgroundColor: `${getScenarioColor(autoRetrievalData.scenario)}10`,
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{getScenarioIcon(autoRetrievalData.scenario)}</span>
                                        <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                            Scenario: {autoRetrievalData.scenario.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ margin: '4px 0 0 20px', fontSize: '14px' }}>
                                        {autoRetrievalData.message}
                                    </p>
                                </div>

                                {/* Collection Stats Summary */}
                                {autoRetrievalData.collectionStats && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                    {autoRetrievalData.collectionStats.articleCount}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    Articles
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                    {autoRetrievalData.collectionStats.languageDataCount}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    Translated
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                    {autoRetrievalData.collectionStats.hasLanguageData ? '✓' : '✗'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    Ready
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Data Preview */}
                                {autoRetrievalData.suggestedData && (
                                    <div style={{
                                        backgroundColor: '#e3f2fd',
                                        border: '1px solid #bbdefb',
                                        borderRadius: '4px',
                                        padding: '12px'
                                    }}>
                                        <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                                            Will be auto-populated:
                                        </h5>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {autoRetrievalData.suggestedData.access_tier && (
                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                                        Access Tier:
                                                    </span>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        marginLeft: '4px',
                                                        padding: '2px 6px',
                                                        backgroundColor: '#fff',
                                                        borderRadius: '8px',
                                                        fontSize: '11px'
                                                    }}>
                                                        {autoRetrievalData.suggestedData.access_tier}
                                                    </div>
                                                </div>
                                            )}

                                            {autoRetrievalData.suggestedData.display_skill && (
                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                                        Skill Level:
                                                    </span>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        marginLeft: '4px',
                                                        padding: '2px 6px',
                                                        backgroundColor: '#fff',
                                                        borderRadius: '8px',
                                                        fontSize: '11px'
                                                    }}>
                                                        {autoRetrievalData.suggestedData.display_skill}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: '#f5f5f5'
                            }}>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    No preview available. Unable to get auto-retrieval data for this language.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button
                        onClick={handleCreateLanguage}
                        disabled={!selectedLanguage || isCreatingRecord}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #2196f3',
                            borderRadius: '4px',
                            backgroundColor: !selectedLanguage || isCreatingRecord ? '#f5f5f5' : '#2196f3',
                            color: !selectedLanguage || isCreatingRecord ? '#999' : 'white',
                            cursor: !selectedLanguage || isCreatingRecord ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {isCreatingRecord
                            ? `Creating ${selectedLangInfo?.name || 'Language'}...`
                            : `➕ Add ${selectedLangInfo?.name || 'Language'}`
                        }
                    </button>
                </div>

                {/* Help Text */}
                {availableOptions.length === 0 && (
                    <div style={{
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#f5f5f5',
                        marginTop: '12px'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            All available languages have been added to this collection.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Render original simple version for backward compatibility
    return (
        <div>
            <div style={{ paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#424242' }}>
                    Collection Per-Language Management
                </h3>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#424242' }}>
                        Choose Collection Target Language
                    </label>
                    <select
                        value={selectedLanguage}
                        onChange={handleLanguageSelect}
                        disabled={isCreatingRecord || !collectionId}
                        style={{
                            width: '100%',
                            maxWidth: '300px',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: isCreatingRecord || !collectionId ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">Select a language to create collection content</option>
                        {availableOptions.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* No collection ID warning */}
                {!collectionId && (
                    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                            Please save the collection first to enable per-language management.
                        </p>
                    </div>
                )}

                {/* Creating record loading state */}
                {isCreatingRecord && (
                    <div style={{ padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#1976d2' }}>
                            Creating collection language record...
                        </p>
                    </div>
                )}

                {/* No more languages available */}
                {collectionId && availableOptions.length === 0 && (
                    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                            All supported languages have been added to this collection.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};