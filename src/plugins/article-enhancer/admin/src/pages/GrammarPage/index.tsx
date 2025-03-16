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
    Dialog, DialogBody, DialogFooter
} from '@strapi/design-system';
import { ArrowLeft, Trash } from '@strapi/icons';
import { request, useFetchClient } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

interface GrammarRule {
    sentence: string;
    rules: string[];
    translation?: string;
}

const GrammarPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [sentences, setSentences] = useState<GrammarRule[]>([]);
    const [engineChoice, setEngineChoice] = useState('both');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<{ sentenceIndex: number, ruleIndex: number } | null>(null);

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
                setSentences(response.data.data.sentences);
            } else {
                console.log('No grammar data found');
                setSentences([]);
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

            console.log("Grammar rules generated and saved successfully");
            setSentences(genResponse.data.data.sentences);
            setSuccess(true);
        } catch (err) {
            console.error("Error in grammar rule generation:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
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
                    const saveResponse = await post(`/${pluginId}/grammar/article/${articleId}`, {
                        data: {
                            sentences: updatedSentences
                        }
                    });

                    if (!saveResponse.data) {
                        throw new Error('Failed to save updated grammar data');
                    }

                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
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
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        Regenerate Grammar Rules
                    </Button>
                }
            />

            <ContentLayout>
                {isLoading ? (
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
                            <Typography variant="delta">Grammar Engine Selection</Typography>
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
                                Grammar rules generated and saved successfully!
                            </Alert>
                        )}

                        <Box
                            background="neutral0"
                            padding={8}
                            shadow="tableShadow"
                            hasRadius
                        >
                            <Typography variant="delta" marginBottom={4}>
                                Grammar Analysis Results ({sentences.length} sentences)
                            </Typography>

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

                                            {item?.translation && (
                                                <Box paddingTop={2}>
                                                    <Typography variant="omega" fontWeight="bold">Translation:</Typography>
                                                    <Box
                                                        background="neutral0"
                                                        padding={2}
                                                        marginTop={1}
                                                        hasRadius
                                                    >
                                                        <Typography>{item.translation}</Typography>
                                                    </Box>
                                                </Box>
                                            )}

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
                                                                    <Typography>{rule || 'Empty rule'}</Typography>
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
                        </Box>
                    </>
                )}
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
            </ContentLayout>
        </Layout>
    );
};

export default GrammarPage;