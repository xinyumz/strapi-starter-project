// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/index.tsx

import React, { useState, useEffect } from 'react';
import pluginId from '../../pluginId';

// Import native HTML components only
import { LoadingOverlay, AlertMessages, ConfirmationDialog } from '../../components/common';

// Feature-specific components - using native HTML versions
import { HSKAnalysisSection } from './components/hsk';
import { SentenceProcessingSection } from './components/sentence-processing';

// Hooks - Import from the hooks directory
import { useLoadingState } from '../../hooks';
import { useHSKManagement, useArticleProcessor, useGrammarManagement, useTranslationManagement } from './hooks';
import { useFetchClient } from "@strapi/strapi/admin";

/**
 * Main component for processing Chinese articles - Native HTML Version
 */
const ChineseArticleProcessor = () => {
    // Common state
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Operation completed successfully');
    const [isInitialized, setIsInitialized] = useState(false);

    // Always use simplified mode to avoid complex component dependencies
    const simplified = true;

    // Main loading state
    const {
        isLoading,
        setLoading: startLoading,
        setSuccess: finishLoading,
        setError: setLoadingError
    } = useLoadingState();

    // Get Strapi's fetch client for authenticated requests
    const { get } = useFetchClient();

    // Setup success and error handlers
    const handleSuccess = (message: string) => {
        setSuccessMessage(message);
        setSuccess(true);
    };

    const handleError = (message: string) => {
        setError(message);
    };

    // Initialize HSK management hook
    const {
        hskData,
        isCalculatingHSK,
        hasHskChanges,
        loadHSKData,
        calculateHSK,
        handleHSKLevelChange,
        saveHSKLevel
    } = useHSKManagement({
        articleId,
        pluginId,
        onSuccess: handleSuccess,
        onError: handleError
    });

    // Initialize Article Processor (base hook for shared functionality)
    const {
        sentences,
        setSentences,
        hasDataChanges,
        isProcessing,
        loadArticleData,
        saveArticleData,
        updateArticleWithProcessorData,
        startProcessing,
        finishProcessing,
        setProcessingError,
        saveOriginalSentences,
    } = useArticleProcessor({
        articleId,
        pluginId,
        onSuccess: handleSuccess,
        onError: handleError
    });

    // Initialize Grammar Management hook
    const {
        engineChoice,
        selectedRules,
        isDeleteModalVisible,
        generateGrammarRules,
        handleEngineChange,
        toggleRuleSelection,
        isRuleSelected,
        handleShowDeleteConfirm,
        handleDeleteRuleConfirmed,
        handleBulkDeleteConfirmed,
        setIsDeleteModalVisible,
        selectedRulesCount
    } = useGrammarManagement({
        articleId,
        pluginId,
        sentences,
        setSentences,
        startProcessing,
        finishProcessing,
        setProcessingError,
        saveOriginalSentences,
        updateArticleWithProcessorData,
        onSuccess: handleSuccess,
        onError: handleError
    });

    // Initialize Translation Management hook
    const {
        activeLanguage,
        supportedLanguages,
        hasSupportedLanguages,
        isTranslating,
        translateAllSentences,
        handleLanguageChange,
        handleTranslationChange,
        addBulkTranslation,
        removeBulkTranslation
    } = useTranslationManagement({
        articleId,
        pluginId,
        sentences,
        setSentences,
        saveOriginalSentences,
        updateArticleWithProcessorData,
        onSuccess: handleSuccess,
        onError: handleError
    });

    // Get query parameters on component mount - only run once
    useEffect(() => {
        if (isInitialized) return;

        const params = new URLSearchParams(window.location.search);
        const id = params.get('articleId');
        const engine = params.get('engine') || 'both';

        console.log('[ChineseArticleProcessor] URL params:', { id, engine, fullUrl: window.location.href });

        if (id) {
            setArticleId(id);
            handleEngineChange(engine as any);

            // Load data in a specific order
            Promise.all([
                loadArticleInfo(id),
                loadArticleData(id),
                loadHSKData(id)
            ]).then(() => {
                setIsInitialized(true);
            }).catch((err) => {
                console.error('[ChineseArticleProcessor] Error loading data:', err);
                setError('Failed to load article data. Please try refreshing the page.');
                setIsInitialized(true);
            });
        } else {
            console.warn('[ChineseArticleProcessor] No articleId found in URL parameters');
            setError('No article ID provided. Please access this page from an article editor.');
            setIsInitialized(true);
        }
    }, []);  // Empty dependency array - only run once

    // Load article information with proper authentication
    const loadArticleInfo = async (articleId: string) => {
        try {
            startLoading();
            // Using Strapi's authenticated request helper
            const response = await get(
                `/content-manager/collection-types/api::article.article/${articleId}`
            );

            if (response.data) {
                setArticleTitle(response.data.Title || `Article #${articleId}`);
            }
            finishLoading();
        } catch (err) {
            console.error('Error loading article info:', err);
            setLoadingError();
            setError('Failed to load article information. Please check if you have permission to access this article.');
        }
    };

    // Handle error dismissal
    const handleErrorDismiss = () => {
        setError(null);
    };

    // Handle success dismissal
    const handleSuccessDismiss = () => {
        setSuccess(false);
    };

    // Navigate back to the article edit page with updated data
    const handleNavigateBack = async () => {
        try {
            // Check if there are unsaved changes and save them before navigating
            if (hasHskChanges) {
                await saveHSKLevel();
            }

            if (hasDataChanges) {
                await saveArticleData();
            }

            // Construct the URL to go back to the article edit page
            if (articleId) {
                const articleEditUrl = `/admin/content-manager/collection-types/api::article.article/${articleId}`;
                // Navigate back to the article edit page
                window.location.href = articleEditUrl;
            } else {
                // Fallback to browser history if no article ID
                window.history.back();
            }
        } catch (error) {
            console.error('Error when trying to navigate back:', error);
            // Still navigate back even if there's an error
            window.history.back();
        }
    };

    return (
        <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#212134',
                        margin: '0 0 0.25rem 0'
                    }}>
                        Chinese Article Processor - {articleTitle}
                    </h1>
                    <p style={{
                        fontSize: '0.875rem',
                        color: '#666687',
                        margin: 0
                    }}>
                        Article ID: {articleId}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Status indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                    }}>
                        <span>✓</span>
                        <span>Simplified Mode</span>
                    </div>

                    {/* Back button */}
                    <button
                        onClick={handleNavigateBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f6f6f9',
                            color: '#4a4a6a',
                            border: '1px solid #dcdce4',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#e6e6e6';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#f6f6f9';
                        }}
                    >
                        <span>←</span>
                        Back to Article
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div>
                {/* Show loading only for initial load */}
                {!isInitialized ? (
                    <LoadingOverlay isLoading={true} message="Loading article data..." />
                ) : (
                    <>
                        <AlertMessages
                            error={error}
                            success={success}
                            successMessage={successMessage}
                            onErrorDismiss={handleErrorDismiss}
                            onSuccessDismiss={handleSuccessDismiss}
                        />

                        {/* Show content only if we have an articleId */}
                        {articleId ? (
                            <>
                                {/* HSK Level Analysis Section */}
                                <HSKAnalysisSection
                                    hskData={hskData}
                                    isCalculatingHSK={isCalculatingHSK}
                                    hasHskChanges={hasHskChanges}
                                    isLoading={isLoading || isProcessing}
                                    onCalculate={calculateHSK}
                                    onLevelChange={handleHSKLevelChange}
                                    onSaveLevel={saveHSKLevel}
                                />

                                {/* Grammar and Translation Section */}
                                <SentenceProcessingSection
                                    sentences={sentences}
                                    engineChoice={engineChoice}
                                    activeLanguage={activeLanguage}
                                    supportedLanguages={supportedLanguages}
                                    hasSupportedLanguages={hasSupportedLanguages}
                                    isLoading={isLoading || isProcessing}
                                    isTranslating={isTranslating}
                                    hasTranslationChanges={hasDataChanges}
                                    selectedRulesCount={selectedRulesCount}
                                    selectedRules={selectedRules}
                                    onEngineChange={handleEngineChange}
                                    onLanguageChange={handleLanguageChange}
                                    onGenerateClick={generateGrammarRules}
                                    onTranslateClick={translateAllSentences}
                                    onTranslationChange={handleTranslationChange}
                                    onAddBulkTranslation={addBulkTranslation}
                                    onRemoveBulkTranslation={removeBulkTranslation}
                                    onToggleRuleSelection={toggleRuleSelection}
                                    onDeleteRuleClick={handleShowDeleteConfirm}
                                    onSaveTranslations={saveArticleData}
                                    onDeleteSelected={handleBulkDeleteConfirmed}
                                    isRuleSelected={isRuleSelected}
                                    simplified={simplified}
                                />
                            </>
                        ) : (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '2rem',
                                borderRadius: '8px',
                                textAlign: 'center' as const
                            }}>
                                <h2 style={{ color: '#666687', marginBottom: '1rem' }}>
                                    No Article Selected
                                </h2>
                                <p style={{ color: '#4a4a6a', marginBottom: '1.5rem' }}>
                                    Please access this page from an article editor to process Chinese content.
                                </p>
                                <a
                                    href="/admin/content-manager/collection-types/api::article.article"
                                    style={{
                                        display: 'inline-block',
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#4945ff',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Go to Articles
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Rule Confirmation Dialog */}
            <ConfirmationDialog
                isVisible={isDeleteModalVisible}
                title="Confirm Deletion"
                message="Are you sure you want to delete this grammar rule?"
                confirmText="Yes, delete this rule"
                cancelText="Cancel"
                confirmButtonVariant="danger-light"
                onConfirm={handleDeleteRuleConfirmed}
                onCancel={() => setIsDeleteModalVisible(false)}
            />
        </div>
    );
};

export default ChineseArticleProcessor;