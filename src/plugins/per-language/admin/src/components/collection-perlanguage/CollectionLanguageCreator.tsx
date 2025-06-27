// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionLanguageCreator.tsx

import React, { useState, useCallback, useEffect } from 'react';
import {
    Button,
    Grid,
    GridItem,
    SingleSelect,
    SingleSelectOption,
    Typography,
    Flex,
    Box,
    Divider,
    Alert,
    Loader,
    Badge,
    Icon,
    Stack,
    Select,
    Option
} from '@strapi/design-system';
import { Plus, Information, Lightbulb, ArticleCheck } from '@strapi/icons';
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

    const handleLanguageSelect = useCallback(async (selectedLang: string) => {
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
                return <Icon as={Information} color="danger600" />;
            case 'no_language_data':
                return <Icon as={Information} color="warning600" />;
            case 'single_article':
                return <Icon as={Lightbulb} color="success600" />;
            case 'multiple_articles':
                return <Icon as={ArticleCheck} color="primary600" />;
            default:
                return <Icon as={Information} color="neutral600" />;
        }
    };

    const getScenarioVariant = (scenario: string) => {
        switch (scenario) {
            case 'no_articles':
                return 'danger';
            case 'no_language_data':
                return 'warning';
            case 'single_article':
                return 'success';
            case 'multiple_articles':
                return 'default';
            default:
                return 'neutral';
        }
    };

    const selectedLangInfo = languageOptions.find(lang => lang.code === selectedLanguage);

    // Render enhanced version if in enhanced mode
    if (isEnhancedMode) {
        return (
            <Box
                background="neutral0"
                borderColor="neutral200"
                borderWidth="1px"
                borderStyle="solid"
                borderRadius="4px"
                padding={4}
                marginBottom={4}
            >
                <Typography variant="beta" marginBottom={3}>
                    Add New Language
                </Typography>

                {/* Collection Statistics */}
                {collectionStats && (
                    <Box marginBottom={4}>
                        <Flex gap={4} alignItems="center" marginBottom={2}>
                            <Typography variant="omega" fontWeight="semiBold">
                                Collection Info:
                            </Typography>
                            <Badge>
                                {collectionStats.articleCount} article{collectionStats.articleCount !== 1 ? 's' : ''}
                            </Badge>
                        </Flex>

                        {collectionStats.articleCount > 0 && (
                            <Box marginLeft={2}>
                                <Typography variant="pi" textColor="neutral600">
                                    Articles: {collectionStats.articles.map(a => a.title).join(', ')}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                <Divider marginBottom={4} />

                <Grid gap={4}>
                    <GridItem col={12} md={6}>
                        <SingleSelect
                            label="Select Language"
                            placeholder="Choose a language to add..."
                            value={selectedLanguage}
                            onChange={setSelectedLanguage}
                            disabled={isCreatingRecord}
                        >
                            {availableOptions.map(language => (
                                <SingleSelectOption key={language.code} value={language.code}>
                                    <Flex alignItems="center" gap={2}>
                                        {language.name}
                                        <Typography variant="pi" textColor="neutral600">
                                            ({language.nativeName})
                                        </Typography>
                                        {language.processorAvailable && (
                                            <Badge variant="success" size="S">Processor</Badge>
                                        )}
                                    </Flex>
                                </SingleSelectOption>
                            ))}
                        </SingleSelect>
                    </GridItem>

                    <GridItem col={12} md={6}>
                        <Flex direction="column" gap={2}>
                            <Typography variant="omega" fontWeight="semiBold">
                                Auto-Retrieval Options
                            </Typography>

                            <Flex gap={2}>
                                <Button
                                    variant={useAutoRetrieval ? 'default' : 'secondary'}
                                    size="S"
                                    onClick={() => setUseAutoRetrieval(true)}
                                    disabled={isCreatingRecord || !selectedLanguage}
                                >
                                    <Icon as={Lightbulb} />
                                    Smart Create
                                </Button>

                                <Button
                                    variant={!useAutoRetrieval ? 'default' : 'secondary'}
                                    size="S"
                                    onClick={() => setUseAutoRetrieval(false)}
                                    disabled={isCreatingRecord}
                                >
                                    Manual Create
                                </Button>
                            </Flex>

                            <Typography variant="pi" textColor="neutral600">
                                {useAutoRetrieval
                                    ? 'Automatically populate fields based on articles'
                                    : 'Create with empty fields for manual setup'
                                }
                            </Typography>
                        </Flex>
                    </GridItem>
                </Grid>

                {/* Auto-Retrieval Preview */}
                {showAutoRetrievalPreview && selectedLanguage && (
                    <Box marginTop={4}>
                        <Divider marginBottom={3} />

                        <Typography variant="omega" fontWeight="semiBold" marginBottom={2}>
                            Auto-Retrieval Preview for {selectedLangInfo?.name}
                        </Typography>

                        {isLoadingAutoRetrieval ? (
                            <Flex justifyContent="center" alignItems="center" padding={4}>
                                <Loader />
                                <Typography variant="pi" marginLeft={2}>
                                    Analyzing collection data...
                                </Typography>
                            </Flex>
                        ) : autoRetrievalData ? (
                            <Box>
                                <Alert
                                    variant={getScenarioVariant(autoRetrievalData.scenario) as any}
                                    title={`Scenario: ${autoRetrievalData.scenario.replace('_', ' ').toUpperCase()}`}
                                    marginBottom={3}
                                >
                                    <Flex alignItems="center" gap={2}>
                                        {getScenarioIcon(autoRetrievalData.scenario)}
                                        <Typography variant="omega">
                                            {autoRetrievalData.message}
                                        </Typography>
                                    </Flex>
                                </Alert>

                                {/* Collection Stats Summary */}
                                {autoRetrievalData.collectionStats && (
                                    <Box marginBottom={3}>
                                        <Grid gap={2}>
                                            <GridItem col={4}>
                                                <Box textAlign="center" padding={2} background="neutral100" borderRadius="4px">
                                                    <Typography variant="sigma" fontWeight="bold">
                                                        {autoRetrievalData.collectionStats.articleCount}
                                                    </Typography>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        Articles
                                                    </Typography>
                                                </Box>
                                            </GridItem>
                                            <GridItem col={4}>
                                                <Box textAlign="center" padding={2} background="neutral100" borderRadius="4px">
                                                    <Typography variant="sigma" fontWeight="bold">
                                                        {autoRetrievalData.collectionStats.languageDataCount}
                                                    </Typography>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        Translated
                                                    </Typography>
                                                </Box>
                                            </GridItem>
                                            <GridItem col={4}>
                                                <Box textAlign="center" padding={2} background="neutral100" borderRadius="4px">
                                                    <Typography variant="sigma" fontWeight="bold">
                                                        {autoRetrievalData.collectionStats.hasLanguageData ? '✓' : '✗'}
                                                    </Typography>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        Ready
                                                    </Typography>
                                                </Box>
                                            </GridItem>
                                        </Grid>
                                    </Box>
                                )}

                                {/* Suggested Data Preview */}
                                {autoRetrievalData.suggestedData && (
                                    <Box
                                        background="primary100"
                                        borderColor="primary200"
                                        borderWidth="1px"
                                        borderStyle="solid"
                                        borderRadius="4px"
                                        padding={3}
                                    >
                                        <Typography variant="omega" fontWeight="semiBold" marginBottom={2}>
                                            Will be auto-populated:
                                        </Typography>

                                        <Grid gap={2}>
                                            {autoRetrievalData.suggestedData.access_tier && (
                                                <GridItem col={6}>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        Access Tier:
                                                    </Typography>
                                                    <Badge variant="secondary">
                                                        {autoRetrievalData.suggestedData.access_tier}
                                                    </Badge>
                                                </GridItem>
                                            )}

                                            {autoRetrievalData.suggestedData.display_skill && (
                                                <GridItem col={6}>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        Skill Level:
                                                    </Typography>
                                                    <Badge variant="secondary">
                                                        {autoRetrievalData.suggestedData.display_skill}
                                                    </Badge>
                                                </GridItem>
                                            )}
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Alert variant="neutral" title="No preview available">
                                Unable to get auto-retrieval data for this language.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Create Button */}
                <Flex justifyContent="flex-end" marginTop={4}>
                    <Button
                        onClick={handleCreateLanguage}
                        disabled={!selectedLanguage || isCreatingRecord}
                        loading={isCreatingRecord}
                        startIcon={<Plus />}
                    >
                        {isCreatingRecord
                            ? `Creating ${selectedLangInfo?.name || 'Language'}...`
                            : `Add ${selectedLangInfo?.name || 'Language'}`
                        }
                    </Button>
                </Flex>

                {/* Help Text */}
                {availableOptions.length === 0 && (
                    <Alert variant="neutral" title="All languages added" marginTop={3}>
                        All available languages have been added to this collection.
                    </Alert>
                )}
            </Box>
        );
    }

    // Render original simple version for backward compatibility
    return (
        <Box>
            <Box paddingBottom={3}>
                <Typography variant="delta">
                    Collection Per-Language Management
                </Typography>
            </Box>

            <Stack spacing={4}>
                <Select
                    label="Choose Collection Target Language"
                    placeholder="Select a language to create collection content"
                    value={selectedLanguage}
                    onChange={handleLanguageSelect}
                    disabled={isCreatingRecord || !collectionId}
                >
                    {availableOptions.map((lang) => (
                        <Option key={lang.code} value={lang.code}>
                            {lang.name}
                        </Option>
                    ))}
                </Select>

                {/* No collection ID warning */}
                {!collectionId && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" color="neutral600">
                            Please save the collection first to enable per-language management.
                        </Typography>
                    </Box>
                )}

                {/* Creating record loading state */}
                {isCreatingRecord && (
                    <Box padding={2} background="primary100" borderRadius="4px">
                        <Typography variant="pi" color="primary600">
                            Creating collection language record...
                        </Typography>
                    </Box>
                )}

                {/* No more languages available */}
                {collectionId && availableOptions.length === 0 && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="pi" color="neutral600">
                            All supported languages have been added to this collection.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};