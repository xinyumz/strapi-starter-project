// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/index.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Flex
} from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import styled from 'styled-components';
import pluginId from '../../pluginId';

// Import Design System migrated components
import { HSKAnalysisSection } from './components/hsk';
import { SentenceProcessingSection } from './components/sentence-processing';

// Import migrated common components
import { AlertMessages, ConfirmationDialog, LoadingOverlay } from '../../components/common';

// Keep existing hooks
import { useLoadingState } from '../../hooks';
import { useHSKManagement, useArticleProcessor, useGrammarManagement, useTranslationManagement } from './hooks';
import { useFetchClient } from "@strapi/strapi/admin";

// Styled components
const HeaderSection = styled(Box).attrs({
    background: "neutral0",
    padding: 6,
    shadow: "tableShadow"
})`
  margin-bottom: 1rem;
`;

const HeaderContent = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ContentSection = styled(Box)`
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

const HeaderInfo = styled(Box)`
  flex: 1;
`;

const HeaderActions = styled(Flex)`
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

/**
 * Main component matching original layout patterns
 */
const ChineseArticleProcessor = () => {
    // Common state
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Operation completed successfully');
    const [isInitialized, setIsInitialized] = useState(false);

    // Auto-clear alert messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

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

    // Initialize Article Processor
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

    // Get query parameters on component mount
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
    }, []);

    // Load article information
    const loadArticleInfo = async (articleId: string) => {
        try {
            startLoading();
            const response = await get(
                `/content-manager/collection-types/api::article.article/${articleId}`
            );

            if (response.data?.data) {
                const actualData = response.data.data;
                const title = actualData.Title || `Article ${articleId.slice(0, 8)}`;
                setArticleTitle(title);
            } else {
                setArticleTitle('Unknown Article');
            }
            finishLoading();
        } catch (err) {
            console.error('Error loading article info:', err);
            setLoadingError();
            setError('Failed to load article information. Please check if you have permission to access this article.');
            setArticleTitle('Error Loading Article');
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

    // Navigate back to the article edit page
    const handleNavigateBack = async () => {
        try {
            if (hasHskChanges) {
                await saveHSKLevel();
            }

            if (hasDataChanges) {
                await saveArticleData();
            }

            if (articleId) {
                const articleEditUrl = `/admin/content-manager/collection-types/api::article.article/${articleId}`;
                window.location.href = articleEditUrl;
            } else {
                window.history.back();
            }
        } catch (error) {
            console.error('Error when trying to navigate back:', error);
            window.history.back();
        }
    };

    return (
        <Box
            background="neutral100"
            style={{ minHeight: '100vh' }}
        >
            {/* Header matching original HeaderLayout */}
            <HeaderSection>
                <HeaderContent>
                    <HeaderInfo>
                        <Typography
                            variant="alpha"
                            fontWeight="bold"
                            textColor="neutral800"
                            marginBottom={1}
                        >
                            Chinese Article Processor{articleTitle && articleTitle !== `Article #${articleId}` ? ` - ${articleTitle}` : ''}
                        </Typography>
                    </HeaderInfo>

                    <HeaderActions>
                        {/* Back button */}
                        <Button
                            onClick={handleNavigateBack}
                            variant="tertiary"
                            startIcon={<ArrowLeft />}
                        >
                            Back
                        </Button>
                    </HeaderActions>
                </HeaderContent>
            </HeaderSection>

            {/* Content matching original ContentLayout */}
            <ContentSection>
                {/* Show loading only for initial load */}
                {!isInitialized ? (
                    <LoadingOverlay
                        isLoading={true}
                        message="Loading article data..."
                    />
                ) : (
                    <>
                        {/* Alert Messages */}
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
                                />
                            </>
                        ) : (
                            <Box
                                background="neutral0"
                                padding={8}
                                hasRadius
                                shadow="tableShadow"
                                textAlign="center"
                            >
                                <Typography
                                    variant="delta"
                                    fontWeight="semiBold"
                                    textColor="neutral600"
                                    marginBottom={3}
                                >
                                    No Article Selected
                                </Typography>
                                <Typography
                                    variant="omega"
                                    textColor="neutral600"
                                    marginBottom={4}
                                >
                                    Please access this page from an article editor to process Chinese content.
                                </Typography>
                                <Button
                                    onClick={() => window.location.href = '/admin/content-manager/collection-types/api::article.article'}
                                    variant="default"
                                >
                                    Go to Articles
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </ContentSection>

            {/* Delete Rule Confirmation Dialog */}
            <ConfirmationDialog
                isVisible={isDeleteModalVisible}
                title="Confirm Deletion"
                message="Are you sure you want to delete this grammar rule?"
                confirmText="Yes, delete this rule"
                cancelText="Cancel"
                confirmButtonVariant="danger"
                onConfirm={handleDeleteRuleConfirmed}
                onCancel={() => setIsDeleteModalVisible(false)}
            />
        </Box>
    );
};

export default ChineseArticleProcessor;