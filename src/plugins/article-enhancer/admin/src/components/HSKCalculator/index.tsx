// Updated HSKCalculator Component
import React, { useState } from 'react';
import {
    Button,
    Box,
    Typography,
    Stack,
    Select,
    Option,
    Alert,
    Grid,
    GridItem,
    Flex
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

interface HSKCalculatorProps {
    name: string;
    onChange: (data: { target: { name: string; value: any; } }) => void;
    value?: any;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
}

const HSKCalculator: React.FC<HSKCalculatorProps> = ({
    name,
    onChange,
    value,
    intlLabel,
    required,
}) => {
    const { formatMessage } = useIntl();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { modifiedData } = useCMEditViewDataManager();

    const handleCalculate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Access the Translation field data using the Strapi data manager
            const translationText = modifiedData.Translation;

            if (!translationText) {
                throw new Error('Translation text not found');
            }

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
                throw new Error('Failed to calculate HSK level');
            }

            const result = await response.json();
            const { skillLevel, skillDistribution } = result.data;

            onChange({
                target: {
                    name,
                    value: {
                        calculatedLevel: skillLevel,
                        selectedLevel: skillLevel,
                        distribution: skillDistribution,
                    },
                },
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to calculate HSK level');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLevelChange = (level: string) => {
        onChange({
            target: {
                name,
                value: {
                    ...value,
                    selectedLevel: parseInt(level, 10),
                },
            },
        });
    };

    const getColorForPercentage = (percentage: number): string => {
        if (percentage > 75) return '#2563eb';
        if (percentage > 50) return '#3b82f6';
        if (percentage > 25) return '#60a5fa';
        return '#93c5fd';
    };

    return (
        <Box padding={4} background="neutral100" hasRadius>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="delta">{formatMessage(intlLabel)}</Typography>
                </Box>

                <Button
                    onClick={handleCalculate}
                    loading={isLoading}
                    disabled={isLoading}
                >
                    Calculate HSK Level
                </Button>

                {error && (
                    <Alert closeLabel="Close alert" onClose={() => setError(null)} variant="danger">
                        {error}
                    </Alert>
                )}

                {value?.distribution && (
                    <Grid gap={4}>
                        <GridItem col={6}>
                            <Box background="neutral0" padding={4} hasRadius shadow="filterShadow">
                                <Typography variant="delta" paddingBottom={2}>HSK Level Distribution</Typography>
                                <Stack spacing={2}>
                                    {value.distribution.map((percentage: number, index: number) => (
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
                                            HSK {value.calculatedLevel}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="delta">Manual Selection</Typography>
                                        <Box paddingTop={2}>
                                            <Select
                                                label="Select Final HSK Level"
                                                value={value.selectedLevel?.toString()}
                                                onChange={handleLevelChange}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                                    <Option key={level} value={level.toString()}>
                                                        HSK {level}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Box>
                        </GridItem>
                    </Grid>
                )}
            </Stack>
        </Box>
    );
};

export default HSKCalculator;