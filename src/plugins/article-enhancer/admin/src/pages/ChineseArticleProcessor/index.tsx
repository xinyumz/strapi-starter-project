// /src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/index.tsx
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
    Alert,
    TextInput,
    Dialog,
    DialogBody,
    DialogFooter,
    Checkbox,
    Grid,
    GridItem,
    Select,
    Option,
    Divider
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

// Interface for HSK data
interface HSKData {
    calculatedLevel: number | null;
    selectedLevel: number | null;
    distribution: number[];
}

const ChineseArticleProcessor = () => {
    // Common state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Operation completed successfully');
    const [articleId, setArticleId] = useState<string | null>(null);
    const [articleTitle, setArticleTitle] = useState('');

    // Grammar states
    const [isTranslating, setIsTranslating] = useState(false);
    const [sentences, setSentences] = useState<GrammarRule[]>([]);
    const [originalSentences, setOriginalSentences] = useState<GrammarRule[]>([]);
    const [engineChoice, setEngineChoice] = useState('both');
    const [hasTranslationChanges, setHasTranslationChanges] = useState(false);
    const [selectedRules, setSelectedRules] = useState<SelectedRule[]>([]);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<{ sentenceIndex: number, ruleIndex: number } | null>(null);

    // HSK states
    const [isCalculatingHSK, setIsCalculatingHSK] = useState(false);
    const [hskData, setHskData] = useState<HSKData>({
        calculatedLevel: null,
        selectedLevel: null,
        distribution: []
    });
    const [hasHskChanges, setHasHskChanges] = useState(false);
    const [originalHskData, setOriginalHskData] = useState<HSKData>({
        calculatedLevel: null,
        selectedLevel: null,
        distribution: []
    });

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
            loadSavedHSKData(id);
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

    // Load saved HSK data
    const loadSavedHSKData = async (articleId: string) => {
        try {
            console.log(`Loading saved HSK data for article ID: ${articleId}`);

            // Try to get the article data from the public API
            const response = await fetch(`/api/articles/${articleId}?populate=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error(`Error fetching article data: ${response.status} ${response.statusText}`);
                const defaultData = { calculatedLevel: null, selectedLevel: null, distribution: [] };
                setHskData(defaultData);
                setOriginalHskData(defaultData);
                return;
            }

            const articleData = await response.json();
            console.log('Article data from API:', articleData);

            // Look for HSK field in the response structure
            const hskData = articleData.data?.attributes?.HSK;
            console.log('HSK field found in API response:', hskData);

            if (hskData && hskData !== "") {
                let hskValue;

                try {
                    // Parse if it's a string
                    if (typeof hskData === 'string') {
                        hskValue = JSON.parse(hskData);
                    } else {
                        hskValue = hskData;
                    }

                    // Validate structure
                    if (hskValue &&
                        typeof hskValue === 'object' &&
                        'distribution' in hskValue &&
                        Array.isArray(hskValue.distribution)) {
                        console.log('Successfully loaded HSK data:', hskValue);
                        setHskData(hskValue);
                        setOriginalHskData(JSON.parse(JSON.stringify(hskValue))); // Store a deep copy
                        setHasHskChanges(false); // Reset changes flag
                        return;
                    } else {
                        console.log('HSK data has invalid structure:', hskValue);
                    }
                } catch (parseError) {
                    console.error('Error parsing HSK data:', parseError);
                }
            } else {
                console.log('No HSK field found in response or field is empty');
            }

            // Default if no valid data found
            const defaultData = { calculatedLevel: null, selectedLevel: null, distribution: [] };
            setHskData(defaultData);
            setOriginalHskData(defaultData);
        } catch (err) {
            console.error('Error loading HSK data:', err);
            const defaultData = { calculatedLevel: null, selectedLevel: null, distribution: [] };
            setHskData(defaultData);
            setOriginalHskData(defaultData);
        }
    };


    // =============== HSK FUNCTIONS ===============

    // Calculate HSK level
    const handleCalculateHSK = async () => {
        if (!articleId) {
            setError("No article ID provided");
            return;
        }

        setIsCalculatingHSK(true);
        setError(null);
        setSuccess(false);

        try {
            // First, get the translation text from the article
            const articleResponse = await get(
                `/content-manager/collection-types/api::article.article/${articleId}`
            );

            if (!articleResponse.data) {
                throw new Error('Failed to retrieve article data');
            }

            const translationText = articleResponse.data.Translation;

            if (!translationText) {
                throw new Error("Translation text is required for HSK calculation");
            }

            console.log('Calculating HSK level...');

            // Use fetch directly with the correct format
            const response = await fetch(`/${pluginId}/hsk/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: translationText
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HSK calculation API error:', errorText);
                throw new Error(`HSK calculation failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const { skillLevel, skillDistribution } = result.data;

            const newHSKData = {
                calculatedLevel: skillLevel,
                selectedLevel: skillLevel,
                distribution: skillDistribution,
            };

            setHskData(newHSKData);

            // Auto-save after calculation
            await updateArticleHSKLevel(newHSKData);

            // Update original data after saving
            setOriginalHskData(JSON.parse(JSON.stringify(newHSKData)));
            setHasHskChanges(false);

            console.log('HSK level calculation completed successfully');
            setSuccessMessage('HSK level calculated successfully');
            setSuccess(true);
        } catch (err) {
            console.error('HSK calculation error:', err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsCalculatingHSK(false);
        }
    };

    // Handle HSK level selection change
    const handleHSKLevelChange = (level: string) => {
        const updatedHSKData = {
            ...hskData,
            selectedLevel: parseInt(level, 10),
        };

        setHskData(updatedHSKData);

        // Check if this is actually a change from the original
        const hasChanges = updatedHSKData.selectedLevel !== originalHskData.selectedLevel;
        setHasHskChanges(hasChanges);
    };

    // Manual save HSK level when change is made
    const handleSaveHSKLevel = async () => {
        if (!articleId || !hasHskChanges) return;

        setIsLoading(true);
        setError(null);

        try {
            await updateArticleHSKLevel(hskData);

            // Update original data to match current
            setOriginalHskData(JSON.parse(JSON.stringify(hskData)));
            setHasHskChanges(false);

            setSuccessMessage('HSK level saved successfully');
            setSuccess(true);
        } catch (err) {
            console.error('Error saving HSK level:', err);
            setError(err instanceof Error ? err.message : "Failed to save HSK level");
        } finally {
            setIsLoading(false);
        }
    };

    // Save HSK data to article
    const updateArticleHSKLevel = async (hskData: HSKData) => {
        if (!articleId) return;

        try {
            console.log('Saving HSK data to article:', hskData);

            // Format HSK data as string for storage
            const hskString = JSON.stringify(hskData);

            // Use direct API endpoint to update the article
            const response = await fetch(`/api/articles/${articleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        // Use the correct field name (HSK not HSK_Level)
                        HSK: hskString
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error saving HSK data: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to save HSK data: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('HSK data saved successfully:', result);
        } catch (err) {
            console.error('Error saving HSK data:', err);
            setError('Failed to save HSK level to article');
        }
    };

    // Helper for HSK level visualization
    const getColorForPercentage = (percentage: number): string => {
        if (percentage > 75) return '#2563eb';
        if (percentage > 50) return '#3b82f6';
        if (percentage > 25) return '#60a5fa';
        return '#93c5fd';
    };

    // =============== GRAMMAR FUNCTIONS ===============

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
                {isLoading && !isTranslating && !isCalculatingHSK ? (
                    <Box
                        background="neutral0"
                        padding={8}
                        shadow="tableShadow"
                        hasRadius
                        style={{ textAlign: 'center' }}
                    >
                        <Loader>Loading data...</Loader>
                    </Box>
                ) : (
                    <>
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

                        {/* HSK Level Analysis Section */}
                        <Box
                            background="neutral0"
                            padding={8}
                            shadow="tableShadow"
                            hasRadius
                            marginBottom={6}
                        >
                            <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                                <Typography variant="delta">HSK Level Analysis</Typography>

                                <Button
                                    onClick={handleCalculateHSK}
                                    disabled={isLoading || isCalculatingHSK}
                                    loading={isCalculatingHSK}
                                    startIcon={<Refresh />}
                                >
                                    Calculate HSK Level
                                </Button>
                            </Flex>

                            {isCalculatingHSK ? (
                                <Box padding={4} textAlign="center">
                                    <Loader>Calculating HSK level...</Loader>
                                </Box>
                            ) : hskData.distribution.length === 0 ? (
                                <Box paddingBottom={4}>
                                    <Typography>
                                        No HSK analysis found. Click the "Calculate HSK Level" button above to analyze the Chinese text.
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid gap={4}>
                                    <GridItem col={6}>
                                        <Box background="neutral0" padding={4} hasRadius shadow="filterShadow">
                                            <Typography variant="delta" paddingBottom={2}>HSK Level Distribution</Typography>
                                            <Stack spacing={2}>
                                                {hskData.distribution.map((percentage: number, index: number) => (
                                                    <Box key={index}>
                                                        <Flex justifyContent="space-between" paddingBottom={1}>
                                                            <Typography variant="pi">HSK {index + 1}</Typography>
                                                            <Typography variant="pi">{percentage}%</Typography>
                                                        </Flex>
                                                        <Box
                                                            background="neutral200"
                                                            hasRadius
                                                            height="8px"
                                                            position="relative"
                                                        >
                                                            <Box
                                                                background={getColorForPercentage(percentage)}
                                                                height="100%"
                                                                width={`${percentage}%`}
                                                                hasRadius
                                                            />
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </GridItem>

                                    <GridItem col={6}>
                                        <Box background="neutral0" padding={4} hasRadius shadow="filterShadow">
                                            <Stack spacing={4}>
                                                <Box>
                                                    <Typography variant="delta">Calculated HSK Level</Typography>
                                                    <Typography variant="alpha" textColor="primary600" paddingTop={2}>
                                                        HSK {hskData.calculatedLevel || 'N/A'}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="delta">Manual Selection</Typography>
                                                    <Box paddingTop={2}>
                                                        <Select
                                                            label="Select Final HSK Level"
                                                            value={hskData.selectedLevel?.toString() || "1"}
                                                            onChange={handleHSKLevelChange}
                                                        >
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                                                <Option key={level} value={level.toString()}>
                                                                    HSK {level}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Box>

                                                    {hasHskChanges && (
                                                        <Box paddingTop={2}>
                                                            <Button
                                                                onClick={handleSaveHSKLevel}
                                                                disabled={!hasHskChanges || isLoading}
                                                                startIcon={<Check />}
                                                                size="S"
                                                            >
                                                                Save HSK Level
                                                            </Button>
                                                        </Box>
                                                    )}

                                                    <Box paddingTop={2}>
                                                        <Typography variant="omega">
                                                            {hasHskChanges ?
                                                                "Click 'Save HSK Level' to save your selection" :
                                                                "The selected HSK level has been saved to the article."}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </GridItem>
                                </Grid>
                            )}
                        </Box>

                        {/* Grammar and Translation Section */}
                        <Box
                            background="neutral0"
                            padding={8}
                            shadow="tableShadow"
                            hasRadius
                        >
                            <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                                <Typography variant="delta">Sentence Analysis & Translation</Typography>

                                <Flex gap={2}>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isLoading || isTranslating}
                                        loading={isLoading && !isTranslating}
                                        startIcon={<Refresh />}
                                    >
                                        Generate Grammar Rules
                                    </Button>

                                    {sentences && sentences.length > 0 && (
                                        <Button
                                            variant="secondary"
                                            onClick={handleBulkTranslate}
                                            disabled={isLoading || isTranslating}
                                            loading={isTranslating}
                                            startIcon={<Plus />}
                                        >
                                            Translate All
                                        </Button>
                                    )}
                                </Flex>
                            </Flex>

                            <Box paddingBottom={4}>
                                <Stack spacing={2}>
                                    <Typography variant="epsilon">Grammar Engine</Typography>
                                    <Flex gap={4}>
                                        <Radio
                                            value="stanford"
                                            checked={engineChoice === 'stanford'}
                                            onChange={() => setEngineChoice('stanford')}
                                        >
                                            Stanford
                                        </Radio>
                                        <Radio
                                            value="jieba"
                                            checked={engineChoice === 'jieba'}
                                            onChange={() => setEngineChoice('jieba')}
                                        >
                                            Jieba
                                        </Radio>
                                        <Radio
                                            value="both"
                                            checked={engineChoice === 'both'}
                                            onChange={() => setEngineChoice('both')}
                                        >
                                            Both
                                        </Radio>
                                    </Flex>
                                </Stack>
                            </Box>

                            <Divider />

                            {hasTranslationChanges && (
                                <Alert variant="info" closeLabel="Close alert" marginTop={4} marginBottom={4}>
                                    You have unsaved translation changes. Remember to save your changes.
                                </Alert>
                            )}

                            {sentences.length === 0 ? (
                                <Box paddingTop={4} paddingBottom={4}>
                                    <Typography>No grammar rules found. Click "Generate Grammar Rules" to analyze the Chinese text.</Typography>
                                </Box>
                            ) : (
                                <>
                                    <Box paddingTop={4} paddingBottom={4}>
                                        <Typography variant="epsilon">
                                            Sentences ({sentences.length})
                                            {selectedRules.length > 0 && ` • ${selectedRules.length} rules selected`}
                                        </Typography>
                                    </Box>

                                    {sentences.map((item, index) => (
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
                                                        placeholder="No translation available. Click 'Translate All' to generate translations."
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
                                    ))}

                                    {/* Bottom actions */}
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
                                </>
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

export default ChineseArticleProcessor;