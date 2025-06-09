// ChineseArticleData component - Updated to use per_languages table

import React, { useEffect, useState } from 'react';
import {
    Button,
    Box,
    Typography,
    Divider,
    Loader,
    Tag,
    Accordion,
    AccordionToggle,
    AccordionContent,
    Badge,
    Flex,
    Alert
} from '@strapi/design-system';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

// Define types for Chinese processor data
interface HSKData {
    calculatedLevel: number;
    selectedLevel: number;
    distribution: Array<{ level: number; count: number; percentage: number }>;
}

interface GrammarRule {
    sentence: string;
    translation: string;
    rules: string[];
}

interface ProcessorData {
    hsk?: HSKData;
    grammar?: {
        sentences?: GrammarRule[];
    };
}

interface DataSourceInfo {
    source: 'per_languages' | 'articles' | 'none';
    isModern: boolean;
}

const ChineseArticleData = (props: any) => {
    const { initialData, modifiedData } = useCMEditViewDataManager();
    const [isExpanded, setIsExpanded] = useState(false);
    const [processorData, setProcessorData] = useState<ProcessorData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dataSource, setDataSource] = useState<DataSourceInfo>({ source: 'none', isModern: false });

    // Get the article ID directly from initialData
    const getArticleId = (): string | null => {
        return initialData?.id ? String(initialData.id) : null;
    };

    // Load processor data when component mounts or when initialData changes
    useEffect(() => {
        const articleId = getArticleId();
        if (articleId) {
            loadProcessorData(articleId);
        }
    }, [initialData.id]);

    // Load the processor data from per_languages table first, then fallback to articles
    const loadProcessorData = async (articleId: string) => {
        setIsLoading(true);
        try {
            console.log(`[ChineseArticleData] Loading processor data for article ID: ${articleId}`);

            // PRIMARY: Try to get data from per_languages table
            let processorValue = null;
            let sourceInfo: DataSourceInfo = { source: 'none', isModern: false };

            try {
                console.log(`[ChineseArticleData] Trying per_languages table first...`);
                const perLanguageResponse = await fetch(`/per-language/article/${articleId}/processing-data?language=zh`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (perLanguageResponse.ok) {
                    const perLanguageData = await perLanguageResponse.json();
                    console.log(`[ChineseArticleData] per_languages response:`, perLanguageData);

                    if (perLanguageData.data?.processedData?.data) {
                        processorValue = perLanguageData.data.processedData.data;
                        sourceInfo = { source: 'per_languages', isModern: true };
                        console.log(`[ChineseArticleData] ✅ Using data from per_languages table`);
                    }
                }
            } catch (perLanguageError) {
                console.log(`[ChineseArticleData] per_languages table access failed:`, perLanguageError);
            }

            // FALLBACK: If no data from per_languages, try articles table
            if (!processorValue) {
                console.log(`[ChineseArticleData] 🔄 Falling back to articles table...`);
                try {
                    const response = await fetch(`/api/articles/${articleId}?populate=*`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const articleData = await response.json();
                        const chineseProcessor = articleData.data?.attributes?.ChineseProcessor;
                        console.log(`[ChineseArticleData] Legacy ChineseProcessor data:`, chineseProcessor);

                        if (chineseProcessor && chineseProcessor !== "") {
                            try {
                                // Parse if it's a string
                                if (typeof chineseProcessor === 'string') {
                                    processorValue = JSON.parse(chineseProcessor);
                                } else {
                                    processorValue = chineseProcessor;
                                }
                                sourceInfo = { source: 'articles', isModern: false };
                                console.log(`[ChineseArticleData] ⚠️ Using legacy data from articles table`);
                            } catch (parseError) {
                                console.error('[ChineseArticleData] Error parsing legacy ChineseProcessor data:', parseError);
                            }
                        }
                    }
                } catch (articlesError) {
                    console.error('[ChineseArticleData] Articles table access failed:', articlesError);
                }
            }

            // If we have processor data but no grammar, try to fetch grammar separately
            if (processorValue && (!processorValue.grammar || !processorValue.grammar.sentences)) {
                console.log('[ChineseArticleData] No grammar data found, fetching separately...');
                try {
                    const grammarResponse = await fetch(`/${pluginId}/grammar/article/${articleId}`);
                    if (grammarResponse.ok) {
                        const grammarData = await grammarResponse.json();
                        console.log('[ChineseArticleData] Fetched grammar data:', grammarData);

                        if (grammarData && grammarData.data && grammarData.data.sentences) {
                            processorValue.grammar = {
                                sentences: grammarData.data.sentences
                            };
                        }
                    }
                } catch (grammarError) {
                    console.error('[ChineseArticleData] Error fetching grammar data:', grammarError);
                }
            }

            setProcessorData(processorValue);
            setDataSource(sourceInfo);

            console.log(`[ChineseArticleData] Final data source:`, sourceInfo);
            console.log(`[ChineseArticleData] Processed data:`, processorValue);

        } catch (error) {
            console.error('[ChineseArticleData] Error loading processor data:', error);
            setProcessorData(null);
            setDataSource({ source: 'none', isModern: false });
        } finally {
            setIsLoading(false);
        }
    };

    // Direct handler for opening the Chinese processor
    const handleOpenProcessor = () => {
        const articleId = getArticleId();
        if (!articleId) {
            alert("Please save the article first to access the Chinese language tools.");
            return;
        }

        if (!modifiedData.Translation) {
            alert("Translation text is required");
            return;
        }

        // Open in a new tab/window
        const queryParams = new URLSearchParams({ articleId }).toString();
        window.open(`/admin/plugins/${pluginId}/chinese-processor?${queryParams}`, '_blank');
    };

    // Force refresh button handler
    const handleForceRefresh = () => {
        const articleId = getArticleId();
        if (articleId) {
            loadProcessorData(articleId);
        }
    };

    // Check if we have grammar rules
    const hasGrammarRules = () => {
        if (!processorData || !processorData.grammar || !processorData.grammar.sentences) {
            return false;
        }

        return processorData.grammar.sentences.some(
            sentence => sentence.rules && sentence.rules.length > 0
        );
    };

    // Count total number of grammar rules
    const countTotalGrammarRules = () => {
        if (!processorData || !processorData.grammar || !processorData.grammar.sentences) {
            return 0;
        }

        return processorData.grammar.sentences.reduce(
            (total, sentence) => total + (sentence.rules?.length || 0),
            0
        );
    };

    // Render data source indicator
    const renderDataSourceIndicator = () => {
        if (dataSource.source === 'none') return null;

        return (
            <Box paddingBottom={3}>
                <Flex alignItems="center" gap={2}>
                    <Typography variant="pi" color="neutral600">Data source:</Typography>
                    <Badge backgroundColor={dataSource.isModern ? 'success' : 'warning'}>
                        {dataSource.isModern ? 'Modern System' : 'Legacy System'}
                    </Badge>
                    {dataSource.source === 'per_languages' && (
                        <Typography variant="pi" color="success600">
                            (per_languages table)
                        </Typography>
                    )}
                    {dataSource.source === 'articles' && (
                        <Typography variant="pi" color="warning600">
                            (articles table)
                        </Typography>
                    )}
                </Flex>
            </Box>
        );
    };

    // Render HSK level information
    const renderHSKInfo = () => {
        if (!processorData?.hsk) {
            return (
                <Box paddingTop={4} paddingBottom={2}>
                    <Typography fontWeight="bold">HSK Level</Typography>
                    <Typography>No HSK data available</Typography>
                </Box>
            );
        }

        const { calculatedLevel, selectedLevel } = processorData.hsk;

        return (
            <Box paddingTop={4} paddingBottom={2}>
                <Typography fontWeight="bold" variant="delta">HSK Level</Typography>
                <Flex alignItems="center" gap={2} paddingTop={2}>
                    <Typography>Calculated: HSK {calculatedLevel}</Typography>
                    <Typography>|</Typography>
                    <Typography>Selected: </Typography>
                    <Tag background="primary100" textColor="primary600" fontWeight="bold">HSK {selectedLevel}</Tag>
                </Flex>
            </Box>
        );
    };

    // Render grammar rules information
    const renderGrammarInfo = () => {
        if (!hasGrammarRules()) {
            return (
                <Box paddingTop={2} paddingBottom={4}>
                    <Typography fontWeight="bold" variant="delta">Grammar Rules</Typography>
                    <Typography paddingTop={2}>No grammar rules generated</Typography>
                </Box>
            );
        }

        const totalGrammarRules = countTotalGrammarRules();

        return (
            <Box paddingTop={2} paddingBottom={4}>
                <Flex alignItems="center" gap={2}>
                    <Typography fontWeight="bold" variant="delta">Grammar Rules</Typography>
                    <Badge>{totalGrammarRules}</Badge>
                </Flex>

                <Box paddingTop={2}>
                    <Accordion expanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} id="grammar-rules">
                        <AccordionToggle
                            title="Expand to view rules"
                            togglePosition="right"
                        />
                        <AccordionContent>
                            <Box paddingLeft={7} paddingRight={7} paddingTop={5} paddingBottom={5} background="neutral100">
                                {processorData?.grammar?.sentences?.map((sentence, sentenceIndex) => (
                                    <Box
                                        key={`sentence-${sentenceIndex}`}
                                        paddingTop={1}
                                        paddingBottom={sentence.rules && sentence.rules.length > 0 ? 1 : 2}
                                    >
                                        <Typography
                                            fontWeight="bold"
                                            variant="epsilon"
                                            textColor={sentence.rules && sentence.rules.length > 0 ? "neutral800" : "primary600"}>
                                            {sentence.sentence}
                                        </Typography>
                                        <Box>
                                            <Typography
                                                paddingTop={1}
                                                textColor={sentence.rules && sentence.rules.length > 0 ? "neutral800" : "primary600"}>
                                                {sentence.translation}
                                            </Typography>
                                        </Box>
                                        <Box paddingTop={1} paddingBottom={3}>
                                            {sentence.rules.map((rule, ruleIndex) => (
                                                <Box
                                                    key={`rule-${sentenceIndex}-${ruleIndex}`}
                                                    paddingLeft={3}
                                                    paddingTop={1}
                                                >
                                                    <Typography>• {rule}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </AccordionContent>
                    </Accordion>
                </Box>
            </Box>
        );
    };

    return (
        <Box padding={4} background="neutral100" hasRadius>
            <Typography variant="delta">Chinese Language Tools</Typography>
            <Divider />

            {/* Data Source Indicator */}
            {renderDataSourceIndicator()}

            {/* Show warning if using legacy system */}
            {dataSource.source === 'articles' && (
                <Box paddingBottom={3}>
                    <Alert
                        variant="warning"
                        title="Legacy Data Source"
                        message="This data is from the legacy system. Consider processing the article to update to the modern system."
                    />
                </Box>
            )}

            {isLoading ? (
                <Box paddingTop={4} paddingBottom={4} textAlign="center">
                    <Loader>Loading Chinese language data...</Loader>
                </Box>
            ) : (
                <>
                    {/* HSK Info Section */}
                    {renderHSKInfo()}

                    {/* Grammar Info Section */}
                    {renderGrammarInfo()}
                </>
            )}

            <Flex gap={2}>
                <Button onClick={handleOpenProcessor}>Process Chinese Article</Button>
                <Button onClick={handleForceRefresh} variant="secondary">Refresh Data</Button>
            </Flex>
        </Box>
    );
};

export default ChineseArticleData;