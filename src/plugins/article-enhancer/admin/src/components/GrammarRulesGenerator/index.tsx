// Updated GrammarRulesGenerator Component
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

interface GrammarRule {
    sentence: string;
    rules: string[];
}

interface GrammarRulesGeneratorProps {
    name: string;
    onChange: (data: { target: { name: string; value: any; } }) => void;
    value?: any;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
}

type EngineChoice = 'stanford' | 'jieba' | 'both';

const GrammarRulesGenerator: React.FC<GrammarRulesGeneratorProps> = ({
    name,
    onChange,
    value,
    intlLabel,
    required,
}) => {
    const { formatMessage } = useIntl();
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedAccordion, setExpandedAccordion] = useState<number | null>(null);
    const [engineChoice, setEngineChoice] = useState<EngineChoice>('both');
    const { modifiedData } = useCMEditViewDataManager();

    const handleGenerate = async () => {
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
                throw new Error('Failed to generate grammar rules');
            }

            const data = await response.json();
            onChange({
                target: {
                    name,
                    value: {
                        sentences: data.data.sentences,
                        translations: {}
                    },
                },
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process text');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkTranslate = async () => {
        if (!value?.sentences || value.sentences.length === 0) {
            setError('No sentences available for translation');
            return;
        }

        setIsTranslating(true);
        setError(null);
        try {
            // Prepare sentences array with explicit error handling
            const sentences = [];
            for (const sentenceObj of value.sentences) {
                if (sentenceObj && typeof sentenceObj.sentence === 'string') {
                    sentences.push(sentenceObj.sentence);
                }
            }

            if (sentences.length === 0) {
                throw new Error('No valid sentences found for translation');
            }

            console.log('Sending sentences for translation:', sentences);

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
            console.log('Translation response:', data);

            // Add defensive checks for data structure
            if (!data || !data.data) {
                console.error('Unexpected response format:', data);
                throw new Error('Invalid response format from translation service');
            }

            // Handle different possible response formats
            let translations = [];
            if (data.data.translations && Array.isArray(data.data.translations)) {
                translations = data.data.translations;
            } else if (Array.isArray(data.data)) {
                translations = data.data;
            } else {
                console.error('Cannot find translations array in response:', data);
                throw new Error('Translation data not found in response');
            }

            const newTranslations = Object.fromEntries(
                translations.map((translation: string, index: number) => [index, translation])
            );

            onChange({
                target: {
                    name,
                    value: {
                        ...value,
                        translations: newTranslations
                    },
                },
            });
        } catch (err) {
            console.error('Translation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to translate sentences');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslationChange = (index: number, newTranslation: string) => {
        const updatedTranslations = {
            ...(value?.translations || {}),
            [index]: newTranslation
        };

        onChange({
            target: {
                name,
                value: {
                    ...value,
                    translations: updatedTranslations
                },
            },
        });
    };

    const handleDeleteRule = async (sentenceIndex: number, ruleIndex: number) => {
        try {
            if (!value?.sentences) {
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
                    rules: value.sentences
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete rule');
            }

            const data = await response.json();
            onChange({
                target: {
                    name,
                    value: {
                        ...value,
                        sentences: data.data
                    },
                },
            });
        } catch (err) {
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

                    {value?.sentences && value.sentences.length > 0 && (
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

                {value?.sentences && value.sentences.map((item: GrammarRule, index: number) => (
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
                                {item.rules.length > 0 ? (
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
                                        value={value.translations?.[index] || ''}
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