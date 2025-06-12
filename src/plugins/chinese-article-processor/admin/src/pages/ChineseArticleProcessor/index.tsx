// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/index.tsx
// CLEAN VERSION - Removed all migration-related UI components

import React, { useState, useEffect } from 'react';
import {
    Box,
    HeaderLayout,
    ContentLayout,
    Layout,
    Button,
    ToggleCheckbox,
    Flex,
    Typography
} from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

// Components from shared directory
import { LoadingOverlay, AlertMessages, ConfirmationDialog } from '../../components/common';

// Feature-specific components
import { HSKAnalysisSection } from './components/hsk';
import { SentenceProcessingSection } from './components/sentence-processing';

// Hooks - Import from the hooks directory
import { useLoadingState } from '../../hooks';
import { useHSKManagement, useArticleProcessor, useGrammarManagement, useTranslationManagement } from './hooks';

/**
 * Main component for processing Chinese articles
 * Clean version without migration UI
 */
const ChineseArticleProcessor = () => {
    // Common state
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Operation completed successfully');
    const [isInitialized, setIsInitialized] = useState(false);

    // Simplified mode toggle
    const [simplified, setSimplified] = useState(true); // Default to simplified mode

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
        useBatch,
        batchOptions,
        generateGrammarRules,
        handleEngineChange,
        toggleBatchProcessing,
        updateBatchOptions,
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
            });
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

    // Toggle simplified mode
    const handleToggleSimplified = () => {
        setSimplified(prev => !prev);
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
        <Layout>
            <HeaderLayout
                title={`Chinese Article Processor - ${articleTitle}`}
                subtitle={`Article ID: ${articleId}`}
                navigationAction={
                    <Button
                        startIcon={<ArrowLeft />}
                        variant="tertiary"
                        onClick={handleNavigateBack}
                    >
                        Back
                    </Button>
                }
                primaryAction={
                    <Flex alignItems="center" gap={3}>
                        <Typography variant="pi">Compact View</Typography>
                        <ToggleCheckbox
                            onLabel="ON"
                            offLabel="OFF"
                            checked={simplified}
                            onChange={handleToggleSimplified}
                            aria-label="Toggle simplified view"
                        />
                    </Flex>
                }
            />

            <ContentLayout>
                {isLoading && !isTranslating && !isCalculatingHSK && !isProcessing ? (
                    <LoadingOverlay isLoading={true} message="Loading data..." />
                ) : (
                    <>
                        <AlertMessages
                            error={error}
                            success={success}
                            successMessage={successMessage}
                            onErrorDismiss={handleErrorDismiss}
                            onSuccessDismiss={handleSuccessDismiss}
                        />

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
                            useBatch={useBatch}
                            onToggleBatch={toggleBatchProcessing}
                        />
                    </>
                )}
            </ContentLayout>

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
        </Layout>
    );
};

export default ChineseArticleProcessor;