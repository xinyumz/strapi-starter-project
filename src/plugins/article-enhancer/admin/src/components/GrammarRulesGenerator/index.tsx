// GrammarRulesGenerator Component
import React, { useState } from 'react';
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
    Flex
} from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import { useFormIntegration } from '../../utils/formUtils';

interface GrammarRule {
    sentence: string;
    rules: string[];
}

interface GrammarRulesGeneratorProps {
    name: string;
    value?: any;
    intlLabel: { id: string; defaultMessage: string };
}

type EngineChoice = 'stanford' | 'jieba' | 'both';

const GrammarRulesGenerator: React.FC<GrammarRulesGeneratorProps> = ({
    name,
    value,
    intlLabel,
}) => {
    const { formatMessage } = useIntl();
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedAccordion, setExpandedAccordion] = useState<number | null>(null);
    const [engineChoice, setEngineChoice] = useState<EngineChoice>('both');
    const { modifiedData } = useCMEditViewDataManager();

    const { updateFormData } = useFormIntegration();

    // Initialize with safe default values, parsing the string if needed
    const safeValue = typeof value === 'string' && value ?
        JSON.parse(value) :
        (value || { sentences: [], translations: {} });

    const handleGenerate = async () => {
        console.log('Generating grammar rules...');
        setIsLoading(true);
        setError(null);
        try {
            // Access the Translation field data using the Strapi data manager
            const translationText = modifiedData.Translation;

            if (!translationText) {
                throw new Error('Translation text not found');
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
                console.error('Grammar rules API error:', errorText);
                throw new Error(`Failed to generate grammar rules: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Create a clean structure for the new value
            const newValue = {
                sentences: Array.isArray(data.data.sentences) ? data.data.sentences : [],
                translations: {},
            };

            // Update Strapi's form data properly - stringify the JSON
            updateFormData(name, JSON.stringify(newValue));
            console.log('Grammar rules generated successfully');
        } catch (err) {
            console.error('Grammar rules generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process text');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkTranslate = async () => {
        if (!safeValue.sentences || safeValue.sentences.length === 0) {
            setError('No sentences available for translation');
            return;
        }

        console.log('Starting bulk translation...');
        setIsTranslating(true);
        setError(null);
        try {
            // Prepare sentences array with explicit error handling
            const sentences = [];
            for (const sentenceObj of safeValue.sentences) {
                if (sentenceObj && typeof sentenceObj.sentence === 'string') {
                    sentences.push(sentenceObj.sentence);
                }
            }

            if (sentences.length === 0) {
                throw new Error('No valid sentences found for translation');
            }

            const response = await fetch(`/${pluginId}/process-sentences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sentences
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Translation API error:', errorData);
                throw new Error(`Failed to translate sentences: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Add defensive checks for data structure
            if (!data || !data.data) {
                throw new Error('Invalid response format from translation service');
            }

            // Handle different possible response formats
            let translations = [];
            if (data.data.translations && Array.isArray(data.data.translations)) {
                translations = data.data.translations;
            } else if (Array.isArray(data.data)) {
                translations = data.data;
            } else {
                throw new Error('Translation data not found in response');
            }

            const newTranslations = Object.fromEntries(
                translations.map((translation: string, index: number) => [index, translation])
            );

            // Update Strapi's form data properly - stringify the JSON
            updateFormData(name, JSON.stringify({
                ...safeValue,
                translations: newTranslations
            }));

            console.log('Translations completed successfully');
        } catch (err) {
            console.error('Translation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to translate sentences');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslationChange = (index: number, newTranslation: string) => {
        const updatedTranslations = {
            ...(safeValue.translations || {}),
            [index]: newTranslation
        };

        // Update Strapi's form data properly - stringify the JSON
        updateFormData(name, JSON.stringify({
            ...safeValue,
            translations: updatedTranslations
        }));
    };

    const handleDeleteRule = async (sentenceIndex: number, ruleIndex: number) => {
        try {
            if (!safeValue.sentences) {
                throw new Error('No sentences data available');
            }

            const response = await fetch(`/${pluginId}/grammar/rule`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sentenceIndex,
                    ruleIndex,
                    rules: safeValue.sentences
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete rule API error:', errorText);
                throw new Error(`Failed to delete rule: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Update Strapi's form data properly - stringify the JSON
            updateFormData(name, JSON.stringify({
                ...safeValue,
                sentences: data.data
            }));
        } catch (err) {
            console.error('Rule deletion error:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete rule');
        }
    };

    const toggleAccordion = (index: number) => {
        setExpandedAccordion(expandedAccordion === index ? null : index);
    };

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
                        disabled={isLoading}
                        style={{ marginRight: '16px' }}
                    >
                        Generate Grammar Rules
                    </Button>

                    {safeValue.sentences && safeValue.sentences.length > 0 && (
                        <Button
                            onClick={handleBulkTranslate}
                            loading={isTranslating}
                            disabled={isTranslating}
                            variant="secondary"
                        >
                            Translate All Sentences
                        </Button>
                    )}
                </Flex>

                {error && (
                    <Alert closeLabel="Close alert" onClose={() => setError(null)} variant="danger">
                        {error}
                    </Alert>
                )}

                {safeValue.sentences && safeValue.sentences.map((item: GrammarRule, index: number) => (
                    <Accordion
                        key={index}
                        expanded={expandedAccordion === index}
                        onToggle={() => toggleAccordion(index)}
                        id={`accordion-${index}`}
                    >
                        <AccordionToggle
                            title={
                                <Typography>
                                    {item.sentence}
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
                                                        {rule}
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
                                        value={safeValue.translations?.[index] || ''}
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