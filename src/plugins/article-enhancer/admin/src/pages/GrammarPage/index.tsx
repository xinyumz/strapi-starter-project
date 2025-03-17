// /src/plugins/article-enhancer/admin/src/pages/GrammarPage/index.tsx
import React, { useState, useEffect } from 'react';
import {
    HeaderLayout,
    ContentLayout,
    Layout,
    Box,
    Typography,
    Loader,
    Button,
    Radio,
    Stack,
    Flex,
    Divider,
    Alert,
    TextInput,
    Dialog,
    DialogBody,
    DialogFooter,
    Checkbox
} from '@strapi/design-system';
import { ArrowLeft, Trash, Plus, Refresh, Check } from '@strapi/icons';
import { request, useFetchClient } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

interface GrammarRule {
    sentence: string;
    rules: string[];
    translation?: string;
}

// Interface for tracking selected rules
interface SelectedRule {
    sentenceIndex: number;
    ruleIndex: number;
}

const GrammarPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [sentences, setSentences] = useState<GrammarRule[]>([]);
    const [originalSentences, setOriginalSentences] = useState<GrammarRule[]>([]); // Store original state for comparison
    const [engineChoice, setEngineChoice] = useState('both');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Operation completed successfully');
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');
    const [hasTranslationChanges, setHasTranslationChanges] = useState(false);

    // Delete rule states
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<{ sentenceIndex: number, ruleIndex: number } | null>(null);

    // Bulk delete states
    const [selectedRules, setSelectedRules] = useState<SelectedRule[]>([]);
    const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);

    // Use Strapi's fetch client which handles authentication
    const { get, post } = useFetchClient();

    // Get query parameters on component mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('articleId');
        const engine = params.get('engine') || 'both';

        if (id) {
            setArticleId(id);
            setEngineChoice(engine);
            loadArticleInfo(id);
            loadSavedGrammarData(id);
        }
    }, []);

    // Check for changes by comparing current sentences with original
    useEffect(() => {
        // Skip initial load or when we just loaded data
        if (originalSentences.length === 0) {
            return;
        }

        // Deep comparison of translations
        const hasChanges = sentences.some((sentence, index) => {
            // Check if the original exists at this index
            if (index >= originalSentences.length) {
                return true; // Added sentences
            }

            // Compare translations
            return sentence.translation !== originalSentences[index].translation;
        });

        console.log('Detected changes in translations:', hasChanges);
        setHasTranslationChanges(hasChanges);
    }, [sentences, originalSentences]);

    // Clear selected rules when sentences change
    useEffect(() => {
        setSelectedRules([]);
    }, [sentences]);

    // Load article information with proper authentication
    const loadArticleInfo = async (articleId: string) => {
        try {
            setIsLoading(true);
            // Using Strapi's authenticated request helper
            const response = await get(
                `/content-manager/collection-types/api::article.article/${articleId}`
            );

            if (response.data) {
                setArticleTitle(response.data.Title || `Article #${articleId}`);
            }
        } catch (err) {
            console.error('Error loading article info:', err);
            setError('Failed to load article information. Please check if you have permission to access this article.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load saved grammar data
    const loadSavedGrammarData = async (articleId: string) => {
        setIsLoading(true);
        try {
            console.log(`Loading saved grammar data for article ID: ${articleId}`);
            // Use the plugin's endpoint (no auth issues here)
            const response = await get(`/${pluginId}/grammar/article/${articleId}`);

            if (response.data && response.data.data && response.data.data.sentences) {
                console.log(`Loaded ${response.data.data.sentences.length} sentences`);
                const loadedSentences = response.data.data.sentences;
                setSentences(loadedSentences);

                // Store a deep copy of the original data for change detection
                setOriginalSentences(JSON.parse(JSON.stringify(loadedSentences)));

                // Reset changes flag
                setHasTranslationChanges(false);
            } else {
                console.log('No grammar data found');
                setSentences([]);
                setOriginalSentences([]);
            }
        } catch (err) {
            console.error('Error loading grammar data:', err);
            setError('Failed to load grammar data');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle generating grammar rules
    const handleGenerate = async () => {
        if (!articleId) {
            setError("No article ID provided");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            console.log('Starting grammar rule generation...');
            // First, get the translation text from the article with proper authentication
            const articleResponse = await get(
                `/content-manager/collection-types/api::article.article/${articleId}`
            );

            if (!articleResponse.data) {
                throw new Error('Failed to retrieve article data');
            }

            const translationText = articleResponse.data.Translation;

            if (!translationText) {
                throw new Error("Translation text is required");
            }

            // Generate grammar rules
            console.log(`Generating grammar rules for article ID: ${articleId}`);
            const genResponse = await post(`/${pluginId}/grammar/generate`, {
                data: {
                    text: translationText,
                    engineChoice
                }
            });

            if (!genResponse.data) {
                throw new Error('Failed to generate grammar rules');
            }

            // Save to database
            console.log("Saving grammar data...");
            const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                data: {
                    sentences: genResponse.data.data.sentences
                }
            });

            if (!saveResponse.data) {
                throw new Error('Failed to save grammar data');
            }

            const newSentences = genResponse.data.data.sentences;
            setSentences(newSentences);
            setOriginalSentences(JSON.parse(JSON.stringify(newSentences)));
            setHasTranslationChanges(false);

            console.log("Grammar rules generated and saved successfully");
            setSuccessMessage('Grammar rules generated and saved successfully');
            setSuccess(true);
        } catch (err) {
            console.error("Error in grammar rule generation:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle bulk translation of all sentences
    const handleBulkTranslate = async () => {
        if (!sentences || sentences.length === 0) {
            setError('No sentences available for translation');
            return;
        }

        setIsTranslating(true);
        setError(null);
        setSuccess(false);

        try {
            console.log('Starting bulk translation...');
            // Prepare sentences array
            const sentenceTexts = sentences.map(s => s.sentence).filter(Boolean);

            if (sentenceTexts.length === 0) {
                throw new Error('No valid sentences found for translation');
            }

            // Call the sentences processing endpoint
            const response = await post(`/${pluginId}/process-sentences`, {
                data: {
                    sentences: sentenceTexts
                }
            });

            if (!response.data || !response.data.data) {
                throw new Error('Invalid response from translation service');
            }

            // Get translations from the response
            const translations = response.data.data;

            if (!Array.isArray(translations)) {
                throw new Error('Translations data is not an array');
            }

            // Update sentences with translations
            const updatedSentences = sentences.map((sentence, index) => ({
                ...sentence,
                translation: translations[index] || sentence.translation
            }));

            // Save to database
            if (articleId) {
                console.log("Saving translations...");
                const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                    data: {
                        sentences: updatedSentences
                    }
                });

                if (!saveResponse.data) {
                    throw new Error('Failed to save translations');
                }
            }

            console.log('Translations completed successfully');
            setSentences(updatedSentences);
            setOriginalSentences(JSON.parse(JSON.stringify(updatedSentences)));
            setHasTranslationChanges(false);

            setSuccessMessage('All sentences translated successfully');
            setSuccess(true);
        } catch (err) {
            console.error('Translation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to translate sentences');
        } finally {
            setIsTranslating(false);
        }
    };

    // Handle direct translation change in the text field
    const handleTranslationChange = (index: number, newTranslation: string) => {
        const updatedSentences = [...sentences];
        if (updatedSentences[index]) {
            updatedSentences[index].translation = newTranslation;
            setSentences(updatedSentences);

            // No need to set hasTranslationChanges here - it's handled by the effect
        }
    };

    // Save all translations
    const handleSaveAllTranslations = async () => {
        if (!articleId || !hasTranslationChanges) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log("Saving all translation changes...");
            const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                data: {
                    sentences: sentences
                }
            });

            if (!saveResponse.data) {
                throw new Error('Failed to save translation changes');
            }

            // Update original sentences to match current state
            setOriginalSentences(JSON.parse(JSON.stringify(sentences)));
            setHasTranslationChanges(false);

            setSuccessMessage('All translations saved successfully');
            setSuccess(true);
        } catch (err) {
            console.error("Error saving translations:", err);
            setError(err instanceof Error ? err.message : "Failed to save translations");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle showing delete confirmation dialog
    const handleShowDeleteConfirm = (sentenceIndex: number, ruleIndex: number) => {
        setRuleToDelete({ sentenceIndex, ruleIndex });
        setIsDeleteModalVisible(true);
    };

    // Handle actual rule deletion when confirmed
    const handleDeleteRuleConfirmed = async () => {
        if (!ruleToDelete) return;

        const { sentenceIndex, ruleIndex } = ruleToDelete;
        setIsLoading(true);

        try {
            // Create a copy of the sentences array
            const updatedSentences = [...sentences];

            // Remove the rule from the specific sentence
            if (updatedSentences[sentenceIndex] &&
                updatedSentences[sentenceIndex].rules &&
                updatedSentences[sentenceIndex].rules.length > ruleIndex) {

                // Remove the rule from the array
                updatedSentences[sentenceIndex].rules.splice(ruleIndex, 1);

                // Update the sentences state
                setSentences(updatedSentences);

                // Save the updated data to the server
                if (articleId) {
                    console.log(`Deleting rule ${ruleIndex} from sentence ${sentenceIndex}...`);
                    const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                        data: {
                            sentences: updatedSentences
                        }
                    });

                    if (!saveResponse.data) {
                        throw new Error('Failed to save updated grammar data');
                    }

                    // Update original sentences after successful save
                    setOriginalSentences(JSON.parse(JSON.stringify(updatedSentences)));

                    setSuccessMessage('Grammar rule deleted successfully');
                    setSuccess(true);
                }
            }
        } catch (err) {
            console.error("Error deleting rule:", err);
            setError(err instanceof Error ? err.message : "Failed to delete rule");
        } finally {
            setIsLoading(false);
            setIsDeleteModalVisible(false);
            setRuleToDelete(null);
        }
    };

    // Toggle selection of a rule
    const toggleRuleSelection = (sentenceIndex: number, ruleIndex: number) => {
        const selectionKey = JSON.stringify({ sentenceIndex, ruleIndex });

        // Check if this rule is already selected
        const isSelected = selectedRules.some(
            rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
        );

        if (isSelected) {
            // Remove from selection
            setSelectedRules(selectedRules.filter(
                rule => !(rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex)
            ));
        } else {
            // Add to selection
            setSelectedRules([...selectedRules, { sentenceIndex, ruleIndex }]);
        }

        console.log('Rule selection toggled:', { sentenceIndex, ruleIndex, isSelected: !isSelected });
    };

    // Check if a rule is selected
    const isRuleSelected = (sentenceIndex: number, ruleIndex: number) => {
        return selectedRules.some(
            rule => rule.sentenceIndex === sentenceIndex && rule.ruleIndex === ruleIndex
        );
    };

    // Show confirmation for bulk delete
    const handleShowBulkDeleteConfirm = () => {
        if (selectedRules.length === 0) {
            setError('No rules selected for deletion');
            return;
        }

        setIsBulkDeleteModalVisible(true);
    };

    // Handle bulk deletion of rules
    const handleBulkDeleteConfirmed = async () => {
        if (selectedRules.length === 0 || !articleId) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log(`Bulk deleting ${selectedRules.length} rules...`);

            // Create a copy of the sentences array
            const updatedSentences = JSON.parse(JSON.stringify(sentences));

            // Sort selected rules in reverse order (by sentence and rule index)
            // This ensures we delete from the end first to avoid index shifting problems
            const sortedRules = [...selectedRules].sort((a, b) => {
                if (a.sentenceIndex !== b.sentenceIndex) {
                    return b.sentenceIndex - a.sentenceIndex;
                }
                return b.ruleIndex - a.ruleIndex;
            });

            // Remove each rule in reverse order
            for (const { sentenceIndex, ruleIndex } of sortedRules) {
                if (updatedSentences[sentenceIndex] &&
                    updatedSentences[sentenceIndex].rules &&
                    updatedSentences[sentenceIndex].rules.length > ruleIndex) {

                    updatedSentences[sentenceIndex].rules.splice(ruleIndex, 1);
                }
            }

            // Save the updated data to the server
            const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                data: {
                    sentences: updatedSentences
                }
            });

            if (!saveResponse.data) {
                throw new Error('Failed to save updated grammar data');
            }

            // Update the sentences state
            setSentences(updatedSentences);

            // Update original sentences after successful save
            setOriginalSentences(JSON.parse(JSON.stringify(updatedSentences)));

            // Clear selection
            setSelectedRules([]);

            setSuccessMessage(`${sortedRules.length} grammar rules deleted successfully`);
            setSuccess(true);
        } catch (err) {
            console.error("Error bulk deleting rules:", err);
            setError(err instanceof Error ? err.message : "Failed to delete rules");
        } finally {
            setIsLoading(false);
            setIsBulkDeleteModalVisible(false);
        }
    };

    return (
        <Layout>
            <HeaderLayout
                title={`Grammar Rules - ${articleTitle}`}
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
                primaryAction={
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || isTranslating}
                        loading={isLoading && !isTranslating}
                        startIcon={<Refresh />}
                    >
                        Regenerate Grammar Rules
                    </Button>
                }
            />

            <ContentLayout>
                {isLoading && !isTranslating ? (
                    <Box
                        background="neutral0"
                        padding={8}
                        shadow="tableShadow"
                        hasRadius
                        style={{ textAlign: 'center' }}
                    >
                        <Loader>Loading grammar data...</Loader>
                    </Box>
                ) : (
                    <>
                        <Box
                            background="neutral0"
                            padding={8}
                            shadow="tableShadow"
                            hasRadius
                            marginBottom={6}
                        >
                            <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                                <Typography variant="delta">Grammar Engine Selection</Typography>

                                {sentences && sentences.length > 0 && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleBulkTranslate}
                                        disabled={isLoading || isTranslating}
                                        loading={isTranslating}
                                        startIcon={<Plus />}
                                    >
                                        Translate All Sentences
                                    </Button>
                                )}
                            </Flex>

                            <Stack spacing={2} padding={4}>
                                <Radio
                                    value="stanford"
                                    checked={engineChoice === 'stanford'}
                                    onChange={() => setEngineChoice('stanford')}
                                >
                                    Stanford Parser
                                </Radio>
                                <Radio
                                    value="jieba"
                                    checked={engineChoice === 'jieba'}
                                    onChange={() => setEngineChoice('jieba')}
                                >
                                    Jieba Parser
                                </Radio>
                                <Radio
                                    value="both"
                                    checked={engineChoice === 'both'}
                                    onChange={() => setEngineChoice('both')}
                                >
                                    Both Parsers
                                </Radio>
                            </Stack>
                        </Box>

                        {error && (
                            <Alert closeLabel="Close alert" onClose={() => setError(null)} variant="danger" marginBottom={4}>
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert variant="success" closeLabel="Close alert" onClose={() => setSuccess(false)} marginBottom={4}>
                                {successMessage}
                            </Alert>
                        )}

                        {hasTranslationChanges && (
                            <Alert variant="info" closeLabel="Close alert" marginBottom={4}>
                                You have unsaved translation changes. Use the "Save Changes" button at the bottom of the page to save them.
                            </Alert>
                        )}

                        <Box
                            background="neutral0"
                            padding={8}
                            shadow="tableShadow"
                            hasRadius
                        >
                            <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                                <Typography variant="delta">
                                    Grammar Analysis Results ({sentences.length} sentences)
                                </Typography>

                                {selectedRules.length > 0 && (
                                    <Typography variant="omega">
                                        {selectedRules.length} rules selected
                                    </Typography>
                                )}
                            </Flex>

                            {sentences.length === 0 ? (
                                <Typography>No grammar rules found. Click "Regenerate Grammar Rules" to create grammar rules.</Typography>
                            ) : (
                                sentences.map((item, index) => (
                                    <Box key={`sentence-${index}`} marginBottom={6}>
                                        <Box
                                            background="neutral100"
                                            padding={4}
                                            hasRadius
                                        >
                                            <Typography variant="epsilon" fontWeight="bold">Sentence {index + 1}</Typography>
                                            <Box paddingTop={2}>
                                                <Typography variant="omega" fontWeight="bold">Original:</Typography>
                                                <Box
                                                    background="neutral0"
                                                    padding={2}
                                                    marginTop={1}
                                                    hasRadius
                                                >
                                                    <Typography>{item?.sentence || 'No sentence text'}</Typography>
                                                </Box>
                                            </Box>

                                            <Box paddingTop={2}>
                                                <TextInput
                                                    name={`translation-${index}`}
                                                    label={`Translation for sentence ${index + 1}`}
                                                    value={item?.translation || ''}
                                                    onChange={(e: any) => handleTranslationChange(index, e.target.value)}
                                                    placeholder="No translation available. Click 'Translate All Sentences' to generate translations."
                                                />
                                            </Box>

                                            <Box paddingTop={2}>
                                                <Typography variant="omega" fontWeight="bold">
                                                    Grammar Rules ({Array.isArray(item?.rules) ? item.rules.length : 0}):
                                                </Typography>
                                                {Array.isArray(item?.rules) && item.rules.length > 0 ? (
                                                    <Stack spacing={2} marginTop={1}>
                                                        {item.rules.map((rule, ruleIndex) => (
                                                            <Box
                                                                key={`rule-${index}-${ruleIndex}`}
                                                                background="neutral0"
                                                                padding={2}
                                                                hasRadius
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="flex-start">
                                                                    <Flex gap={3} alignItems="center">
                                                                        <Checkbox
                                                                            value={isRuleSelected(index, ruleIndex)}
                                                                            onValueChange={() => toggleRuleSelection(index, ruleIndex)}
                                                                            aria-label={`Select rule ${ruleIndex + 1}`}
                                                                        />
                                                                        <Typography>{rule || 'Empty rule'}</Typography>
                                                                    </Flex>
                                                                    <Button
                                                                        variant="danger-light"
                                                                        size="S"
                                                                        startIcon={<Trash />}
                                                                        onClick={() => handleShowDeleteConfirm(index, ruleIndex)}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </Flex>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Box padding={2}>
                                                        <Typography>No grammar rules found</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}

                            {/* Bottom button container */}
                            {sentences.length > 0 && (
                                <Flex justifyContent="center" gap={4} paddingTop={4}>
                                    {hasTranslationChanges && (
                                        <Button
                                            variant="success"
                                            onClick={handleSaveAllTranslations}
                                            disabled={!hasTranslationChanges || isLoading || isTranslating}
                                            startIcon={<Check />}
                                            size="L"
                                        >
                                            Save Translation Changes
                                        </Button>
                                    )}

                                    {selectedRules.length > 0 && (
                                        <Button
                                            variant="danger"
                                            onClick={handleShowBulkDeleteConfirm}
                                            disabled={selectedRules.length === 0 || isLoading || isTranslating}
                                            startIcon={<Trash />}
                                            size="L"
                                        >
                                            Delete Selected Rules ({selectedRules.length})
                                        </Button>
                                    )}
                                </Flex>
                            )}
                        </Box>
                    </>
                )}
            </ContentLayout>

            {/* Delete Rule Confirmation Dialog */}
            {isDeleteModalVisible && (
                <Dialog onClose={() => setIsDeleteModalVisible(false)} title="Confirm Deletion" isOpen={isDeleteModalVisible}>
                    <DialogBody>
                        Are you sure you want to delete this grammar rule?
                    </DialogBody>
                    <DialogFooter
                        startAction={
                            <Button onClick={() => setIsDeleteModalVisible(false)} variant="tertiary">
                                Cancel
                            </Button>
                        }
                        endAction={
                            <Button onClick={handleDeleteRuleConfirmed} variant="danger-light">
                                Yes, delete this rule
                            </Button>
                        }
                    />
                </Dialog>
            )}

            {/* Bulk Delete Confirmation Dialog */}
            {isBulkDeleteModalVisible && (
                <Dialog
                    onClose={() => setIsBulkDeleteModalVisible(false)}
                    title="Confirm Bulk Deletion"
                    isOpen={isBulkDeleteModalVisible}
                >
                    <DialogBody>
                        Are you sure you want to delete {selectedRules.length} selected grammar rules? This action cannot be undone.
                    </DialogBody>
                    <DialogFooter
                        startAction={
                            <Button onClick={() => setIsBulkDeleteModalVisible(false)} variant="tertiary">
                                Cancel
                            </Button>
                        }
                        endAction={
                            <Button onClick={handleBulkDeleteConfirmed} variant="danger">
                                Yes, delete {selectedRules.length} rules
                            </Button>
                        }
                    />
                </Dialog>
            )}
        </Layout>
    );
};

export default GrammarPage;