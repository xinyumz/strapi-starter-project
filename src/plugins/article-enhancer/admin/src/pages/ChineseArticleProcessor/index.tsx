// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/index.tsx
import React, { useState, useEffect } from 'react';
import {
    HeaderLayout,
    ContentLayout,
    Layout,
    Button,
} from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

// Components from shared directory
import { LoadingOverlay, AlertMessages, ConfirmationDialog } from '../../components/common';

// Feature-specific components
import { HSKAnalysisSection } from './components/hsk';
import { GrammarSection } from './components/grammar';

// Hooks
import { useLoadingState } from '../../hooks';
import { useHSKManagement, useGrammarManagement } from './hooks';

/**
 * Main component for processing Chinese articles
 * Handles HSK level calculation and grammar rule generation
 */
const ChineseArticleProcessor = () => {
    // Common state
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Operation completed successfully');

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

    // Initialize Grammar management hook
    const {
        sentences,
        engineChoice,
        hasTranslationChanges,
        isProcessing,
        isTranslating,
        isDeleteModalVisible,

        selectedRules, // Get the selectedRules array
        loadGrammarData,
        generateGrammarRules,
        handleEngineChange,
        translateAllSentences,
        handleTranslationChange,
        saveAllTranslations,
        handleShowDeleteConfirm,
        handleDeleteRuleConfirmed,
        handleBulkDeleteConfirmed,
        setIsDeleteModalVisible,
        toggleRuleSelection,
        isRuleSelected,
        selectedRulesCount
    } = useGrammarManagement({
        articleId,
        pluginId,
        onSuccess: handleSuccess,
        onError: handleError
    });

    // Get query parameters on component mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('articleId');
        const engine = params.get('engine') || 'both';

        if (id) {
            setArticleId(id);
            handleEngineChange(engine as any);
            loadArticleInfo(id);
            loadGrammarData(id);
            loadHSKData(id);
        }
    }, []);

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

    // Debug logging for selectedRules
    useEffect(() => {
        console.log('Main component: selectedRules updated:', selectedRules);
        console.log('Main component: selectedRulesCount:', selectedRulesCount);
    }, [selectedRules, selectedRulesCount]);

    return (
        <Layout>
            <HeaderLayout
                title={`Chinese Article Processor - ${articleTitle}`}
                subtitle={`Article ID: ${articleId}`}
                navigationAction={
                    <Button
                        startIcon={<ArrowLeft />}
                        variant="tertiary"
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
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
                        <GrammarSection
                            sentences={sentences}
                            engineChoice={engineChoice}
                            isLoading={isLoading || isProcessing}
                            isTranslating={isTranslating}
                            hasTranslationChanges={hasTranslationChanges}
                            selectedRulesCount={selectedRulesCount}
                            selectedRules={selectedRules} // Pass the actual selected rules array
                            onEngineChange={handleEngineChange}
                            onGenerateClick={generateGrammarRules}
                            onTranslateClick={translateAllSentences}
                            onTranslationChange={handleTranslationChange}
                            onToggleRuleSelection={toggleRuleSelection}
                            onDeleteRuleClick={handleShowDeleteConfirm}
                            onSaveTranslations={saveAllTranslations}
                            onDeleteSelected={handleBulkDeleteConfirmed} // Skip the confirmation and call the handler directly
                            isRuleSelected={isRuleSelected}
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

            {/* We're not using this anymore - moved to BulkActions component */}
            {/* <ConfirmationDialog
        isVisible={isBulkDeleteModalVisible}
        title="Confirm Bulk Deletion"
        message={`Are you sure you want to delete ${selectedRulesCount} selected grammar rules? This action cannot be undone.`}
        confirmText={`Yes, delete ${selectedRulesCount} rules`}
        cancelText="Cancel"
        confirmButtonVariant="danger"
        onConfirm={handleBulkDeleteConfirmed}
        onCancel={() => setIsBulkDeleteModalVisible(false)}
      /> */}
        </Layout>
    );
};

export default ChineseArticleProcessor;