// Updated GrammarRulesGenerator Component using FormUtils
import React, { useState, useEffect } from 'react';
import {
    Button,
    Box,
    Typography,
    Stack,
    TextInput,
    Radio,
    Accordion,
    AccordionToggle,
    AccordionContent,
    Alert,
    Card,
    IconButton,
    Flex,
    LoadingIndicator
} from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import { useFormIntegration } from '../../utils/formUtils';

interface GrammarRule {
    sentence: string;
    rules: string[];
    translation?: string;
}

interface GrammarRulesGeneratorProps {
    name: string;
    value?: string; // Important: value is a string in Strapi custom fields
    intlLabel: { id: string; defaultMessage: string };
}

type EngineChoice = 'stanford' | 'jieba' | 'both';

const GrammarRulesGenerator: React.FC<GrammarRulesGeneratorProps> = ({
    name,
    value = '', // Default to empty string
    intlLabel,
}) => {
    const { formatMessage } = useIntl();
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedAccordion, setExpandedAccordion] = useState<number | null>(null);
    const [engineChoice, setEngineChoice] = useState<EngineChoice>('both');
    const [sentences, setSentences] = useState<GrammarRule[]>([]);
    const { modifiedData, initialData, isCreating } = useCMEditViewDataManager();
    const { updateFormData } = useFormIntegration();

    // Parse the value string
    useEffect(() => {
        try {
            console.log("Value received:", value);
            if (value && typeof value === 'string') {
                // Attempt to parse the value as JSON
                const parsedValue = JSON.parse(value);
                if (parsedValue && Array.isArray(parsedValue)) {
                    setSentences(parsedValue);
                }
            }
        } catch (e) {
            console.error("Failed to parse value:", e);
            // Just use empty array if parsing fails
            setSentences([]);
        }
    }, [value]);

    // Update value when sentences change
    useEffect(() => {
        // Skip updating during initial load
        if (sentences.length > 0 || modifiedData?.Grammar) {
            const stringValue = JSON.stringify(sentences);
            console.log("Updating form value:", stringValue);
            updateFormData(name, stringValue);
        }
    }, [sentences, name]);

    // Get the article ID directly from initialData
    const getArticleId = (): string | null => {
        if (isCreating) {
            console.log('Creating new article - no ID available yet');
            return null;
        }

        const id = initialData?.id ? String(initialData.id) : null;
        console.log(`Getting article ID: ${id}`);
        return id;
    };

    // Load grammar data from the API
    const loadGrammarData = async (articleId: string) => {
        if (!articleId) return;

        setIsLoading(true);
        try {
            console.log(`Loading grammar data for article ID: ${articleId}`);

            const response = await fetch(`/${pluginId}/grammar/article/${articleId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Grammar data API error: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to load grammar data: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.data && data.data.sentences) {
                console.log(`Loaded ${data.data.sentences.length} sentences for article ID: ${articleId}`);
                setSentences(data.data.sentences);
            } else {
                console.log('No sentences found in grammar data response:', data);
            }
        } catch (err) {
            console.error('Error loading grammar data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for generating grammar rules
    const handleGenerate = async () => {
        const articleId = getArticleId();

        console.log('Generating grammar rules...');
        setIsLoading(true);
        setError(null);

        try {
            // Access the Translation field data using the Strapi data manager
            const translationText = modifiedData.Translation;

            if (!translationText) {
                throw new Error('Translation text not found. Please add content to the Translation field first.');
            }

            const response = await fetch(`/${pluginId}/grammar/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: translationText,
                    engineChoice
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Grammar generation API error: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to generate grammar rules: ${response.statusText}`);
            }

            const data = await response.json();

            // Update sentences state with the new data
            if (data.data && data.data.sentences) {
                setSentences(data.data.sentences);

                // If we have an article ID, save to database too
                if (articleId) {
                    await saveGrammarDataToAPI(articleId, data.data.sentences);
                }
            } else {
                throw new Error('Unexpected response format from grammar generation API');
            }

            console.log('Grammar rules generated successfully');
        } catch (err) {
            console.error('Grammar rules generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process text');
        } finally {
            setIsLoading(false);
        }
    };

    // Save grammar data to the API (separate from the form)
    const saveGrammarDataToAPI = async (articleId: string, sentencesToSave: GrammarRule[]) => {
        if (!articleId) return;

        setIsSaving(true);
        try {
            console.log(`Saving grammar data for article ID: ${articleId}`);

            const response = await fetch(`/${pluginId}/grammar/article/${articleId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sentences: sentencesToSave
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Grammar data save API error: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to save grammar data: ${response.statusText}`);
            }

            console.log('Grammar data saved successfully to API');
        } catch (err) {
            console.error('Error saving grammar data to API:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkTranslate = async () => {
        if (!sentences || sentences.length === 0) {
            setError('No sentences available for translation');
            return;
        }

        console.log('Starting bulk translation...');
        setIsTranslating(true);
        setError(null);

        try {
            // Prepare sentences array with explicit error handling
            const sentenceTexts = sentences.map(s => s.sentence).filter(Boolean);

            if (sentenceTexts.length === 0) {
                throw new Error('No valid sentences found for translation');
            }

            const response = await fetch(`/${pluginId}/process-sentences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sentences: sentenceTexts
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Translation API error: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to translate sentences: ${response.statusText}`);
            }

            const data = await response.json();

            // Add defensive checks for data structure
            if (!data || !data.data) {
                throw new Error('Invalid response format from translation service');
            }

            // Get translations from the response
            const translations = data.data;

            if (!Array.isArray(translations)) {
                throw new Error('Translations data is not an array');
            }

            // Update sentences with translations
            const updatedSentences = sentences.map((sentence, index) => ({
                ...sentence,
                translation: translations[index] || sentence.translation
            }));

            setSentences(updatedSentences);

            // Save to API if we have an article ID
            const articleId = getArticleId();
            if (articleId) {
                await saveGrammarDataToAPI(articleId, updatedSentences);
            }

            console.log('Translations completed successfully');
        } catch (err) {
            console.error('Translation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to translate sentences');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslationChange = (index: number, newTranslation: string) => {
        const updatedSentences = [...sentences];
        if (updatedSentences[index]) {
            updatedSentences[index].translation = newTranslation;
            setSentences(updatedSentences);
        }
    };

    const handleDeleteRule = async (sentenceIndex: number, ruleIndex: number) => {
        try {
            const updatedSentences = [...sentences];

            if (updatedSentences[sentenceIndex] && updatedSentences[sentenceIndex].rules) {
                // Remove the rule from the array
                updatedSentences[sentenceIndex].rules.splice(ruleIndex, 1);
                setSentences(updatedSentences);

                // Save to API if we have an article ID
                const articleId = getArticleId();
                if (articleId) {
                    await saveGrammarDataToAPI(articleId, updatedSentences);
                }
            }
        } catch (err) {
            console.error('Rule deletion error:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete rule');
        }
    };

    const toggleAccordion = (index: number) => {
        setExpandedAccordion(expandedAccordion === index ? null : index);
    };

    // If creating a new article, show a simplified UI
    if (isCreating) {
        return (
            <Box padding={4} background="neutral100" hasRadius>
                <Typography variant="delta">{formatMessage(intlLabel)}</Typography>
                <Box paddingTop={2}>
                    <Alert variant="info">
                        You need to save the article first before you can generate grammar rules.
                    </Alert>
                </Box>

                {/* Still show the grammar generator UI for new articles */}
                <Box paddingTop={4}>
                    <Typography variant="delta">Grammar Engine Selection</Typography>
                    <Stack spacing={2}>
                        <Radio
                            value="stanford"
                            checked={engineChoice === 'stanford'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEngineChoice(e.target.value as EngineChoice)
                            }
                        >
                            Stanford Parser
                        </Radio>
                        <Radio
                            value="jieba"
                            checked={engineChoice === 'jieba'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEngineChoice(e.target.value as EngineChoice)
                            }
                        >
                            Jieba Parser
                        </Radio>
                        <Radio
                            value="both"
                            checked={engineChoice === 'both'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEngineChoice(e.target.value as EngineChoice)
                            }
                        >
                            Both Parsers
                        </Radio>
                    </Stack>
                </Box>

                <Box paddingTop={4}>
                    <Button
                        onClick={handleGenerate}
                        loading={isLoading}
                        disabled={true} // Disabled for new articles
                    >
                        Generate Grammar Rules
                    </Button>
                </Box>

                {sentences && sentences.length > 0 && (
                    <Box paddingTop={4}>
                        <Alert variant="info">
                            You have {sentences.length} sentences with grammar rules ready to be saved.
                        </Alert>
                    </Box>
                )}
            </Box>
        );
    }

    if (isLoading && sentences.length === 0) {
        return (
            <Box padding={8} background="neutral100" hasRadius>
                <LoadingIndicator />
            </Box>
        );
    }

    // Main component render for existing articles
    return (
        <Box padding={2}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="delta">{formatMessage(intlLabel)}</Typography>
                </Box>

                <Box>
                    <Typography variant="delta">Grammar Engine Selection</Typography>
                    <Stack spacing={2}>
                        <Radio
                            value="stanford"
                            checked={engineChoice === 'stanford'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEngineChoice(e.target.value as EngineChoice)
                            }
                        >
                            Stanford Parser
                        </Radio>
                        <Radio
                            value="jieba"
                            checked={engineChoice === 'jieba'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEngineChoice(e.target.value as EngineChoice)
                            }
                        >
                            Jieba Parser
                        </Radio>
                        <Radio
                            value="both"
                            checked={engineChoice === 'both'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEngineChoice(e.target.value as EngineChoice)
                            }
                        >
                            Both Parsers
                        </Radio>
                    </Stack>
                </Box>

                <Flex>
                    <Button
                        onClick={handleGenerate}
                        loading={isLoading}
                        disabled={isLoading || isSaving || !modifiedData?.Translation}
                        style={{ marginRight: '16px' }}
                    >
                        Generate Grammar Rules
                    </Button>

                    {sentences && sentences.length > 0 && (
                        <Button
                            onClick={handleBulkTranslate}
                            loading={isTranslating}
                            disabled={isTranslating || isLoading || isSaving}
                            variant="secondary"
                            style={{ marginRight: '16px' }}
                        >
                            Translate All Sentences
                        </Button>
                    )}

                    {/* We don't need the Save button anymore as changes are saved automatically */}
                </Flex>

                {error && (
                    <Alert closeLabel="Close alert" onClose={() => setError(null)} variant="danger">
                        {error}
                    </Alert>
                )}

                {(!sentences || sentences.length === 0) && !isLoading && (
                    <Alert variant="info">
                        No grammar rules generated yet. Click "Generate Grammar Rules" to create rules based on the Translation field.
                    </Alert>
                )}

                {sentences && sentences.length > 0 && sentences.map((item: GrammarRule, index: number) => (
                    <Accordion
                        key={index}
                        expanded={expandedAccordion === index}
                        onToggle={() => toggleAccordion(index)}
                        id={`accordion-${index}`}
                    >
                        <AccordionToggle
                            title={
                                <Typography>
                                    {item.sentence || 'Empty sentence'}
                                </Typography>
                            }
                        />
                        <AccordionContent>
                            <Box padding={3}>
                                {item.rules && item.rules.length > 0 ? (
                                    <Stack spacing={2}>
                                        {item.rules.map((rule, ruleIndex) => (
                                            <Card key={ruleIndex} padding={3}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography>
                                                        {rule || 'Empty rule'}
                                                    </Typography>
                                                    <IconButton
                                                        onClick={() => handleDeleteRule(index, ruleIndex)}
                                                        label="Delete rule"
                                                        icon={<Trash />}
                                                    />
                                                </Box>
                                            </Card>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography>No grammar rules found for this sentence.</Typography>
                                )}

                                <Box marginTop={4}>
                                    <TextInput
                                        label="Translation"
                                        name={`translation-${index}`}
                                        value={item.translation || ''}
                                        onChange={(e: { target: { value: string } }) => handleTranslationChange(index, e.target.value)}
                                        hint="Edit translation if needed"
                                    />
                                </Box>
                            </Box>
                        </AccordionContent>
                    </Accordion>
                ))}
            </Stack>
        </Box>
    );
};

export default GrammarRulesGenerator;