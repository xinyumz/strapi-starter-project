// src/plugins/collection-article-relation/admin/src/pages/TestPage.tsx

import React, { useState } from 'react';
import {
    Layout,
    Main,
    HeaderLayout,
    ContentLayout,
    Box,
    Typography,
    TextInput,
    Button,
    Flex,
    Grid,
    GridItem,
    Divider,
    Alert
} from '@strapi/design-system';
import { ArrowLeft, Play, CheckCircle } from '@strapi/icons';
import { useNotification } from '@strapi/helper-plugin';
import {
    AutoFillPreview,
    EnhancedCollectionForm,
    QuickCollectionButton
} from '../components';
import { useCollectionAutoFill } from '../hooks';

interface MockFormData {
    title: string;
    date: string;
    cover: any | null;
    category: any | null;
}

const TestPage: React.FC = () => {
    const [articleIdsInput, setArticleIdsInput] = useState('20,21'); // Default test IDs
    const [quickCreateArticleId, setQuickCreateArticleId] = useState('20');
    const [mockFormData, setMockFormData] = useState<MockFormData>({
        title: '',
        date: '',
        cover: null,
        category: null
    });

    const { autoFillData, isLoading, error, analyzeArticles, clearAutoFill } = useCollectionAutoFill();
    const toggleNotification = useNotification();

    const handleAnalyzeTest = () => {
        const ids = articleIdsInput
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id) && id > 0);

        if (ids.length === 0) {
            toggleNotification({
                type: 'warning',
                message: 'Please enter valid article IDs (e.g., "20,21")',
            });
            return;
        }

        console.log('[TestPage] Testing analysis with IDs:', ids);
        analyzeArticles(ids);
    };

    const handleApplyAutoFill = (suggestedData: any) => {
        console.log('[TestPage] Applying auto-fill data:', suggestedData);
        setMockFormData({
            title: suggestedData.title || '',
            date: suggestedData.date || '',
            cover: suggestedData.cover,
            category: suggestedData.category
        });

        toggleNotification({
            type: 'success',
            message: 'Auto-fill data applied to mock form!',
        });
    };

    const handleQuickCreateSuccess = (collectionId: number) => {
        console.log('[TestPage] Quick creation successful, collection ID:', collectionId);
        toggleNotification({
            type: 'success',
            message: `Success! Collection ${collectionId} created.`,
        });
    };

    const mockSelectedArticles = articleIdsInput
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id) && id > 0)
        .map(id => ({ id, value: id }));

    return (
        <Layout>
            <Main>
                <HeaderLayout
                    title="Collection Auto-Fill Testing"
                    subtitle="Test all collection auto-fill components and functionality"
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
                    <Grid gap={6}>
                        {/* Test Controls */}
                        <GridItem col={12}>
                            <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                                <Typography variant="delta" marginBottom={3}>
                                    🧪 Test Controls
                                </Typography>

                                <Grid gap={4}>
                                    <GridItem col={6}>
                                        <TextInput
                                            label="Article IDs (comma-separated)"
                                            placeholder="20,21"
                                            value={articleIdsInput}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setArticleIdsInput(e.target.value)
                                            }
                                            hint="Enter article IDs to test auto-fill analysis"
                                        />
                                    </GridItem>

                                    <GridItem col={6}>
                                        <TextInput
                                            label="Quick Create Article ID"
                                            placeholder="20"
                                            value={quickCreateArticleId}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setQuickCreateArticleId(e.target.value)
                                            }
                                            hint="Single article ID for quick collection creation"
                                        />
                                    </GridItem>
                                </Grid>

                                <Flex gap={3} marginTop={4}>
                                    <Button
                                        startIcon={<Play />}
                                        onClick={handleAnalyzeTest}
                                        loading={isLoading}
                                        disabled={isLoading}
                                    >
                                        Test Analysis
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        onClick={clearAutoFill}
                                        disabled={!autoFillData}
                                    >
                                        Clear Results
                                    </Button>

                                    <QuickCollectionButton
                                        articleId={parseInt(quickCreateArticleId) || 0}
                                        articleTitle="Test Article"
                                        onSuccess={handleQuickCreateSuccess}
                                        variant="tertiary"
                                    />
                                </Flex>
                            </Box>
                        </GridItem>

                        {/* Enhanced Collection Form Test */}
                        <GridItem col={12}>
                            <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                                <Typography variant="delta" marginBottom={3}>
                                    🎛️ Enhanced Collection Form Component
                                </Typography>

                                <Typography variant="omega" textColor="neutral600" marginBottom={3}>
                                    This component automatically triggers when articles are selected:
                                </Typography>

                                <EnhancedCollectionForm
                                    selectedArticles={mockSelectedArticles}
                                    onAutoFillApply={handleApplyAutoFill}
                                />
                            </Box>
                        </GridItem>

                        {/* Mock Form Results */}
                        <GridItem col={12}>
                            <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                                <Typography variant="delta" marginBottom={3}>
                                    📝 Mock Collection Form (Auto-Fill Target)
                                </Typography>

                                <Grid gap={4}>
                                    <GridItem col={6}>
                                        <TextInput
                                            label="Title"
                                            value={mockFormData.title}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setMockFormData(prev => ({ ...prev, title: e.target.value }))
                                            }
                                            placeholder="Collection title will appear here"
                                        />
                                    </GridItem>

                                    <GridItem col={6}>
                                        <TextInput
                                            label="Date"
                                            value={mockFormData.date}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setMockFormData(prev => ({ ...prev, date: e.target.value }))
                                            }
                                            placeholder="Date will appear here"
                                        />
                                    </GridItem>

                                    <GridItem col={6}>
                                        <Box>
                                            <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                                                Cover
                                            </Typography>
                                            <Box marginTop={1} padding={2} background="neutral100" borderRadius="4px">
                                                {mockFormData.cover ? (
                                                    <Flex alignItems="center" gap={2}>
                                                        <CheckCircle color="success600" />
                                                        <Typography variant="pi">
                                                            {(mockFormData.cover as any)?.name || 'Cover image selected'}
                                                        </Typography>
                                                    </Flex>
                                                ) : (
                                                    <Typography variant="pi" textColor="neutral600">
                                                        No cover selected
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </GridItem>

                                    <GridItem col={6}>
                                        <Box>
                                            <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                                                Category
                                            </Typography>
                                            <Box marginTop={1} padding={2} background="neutral100" borderRadius="4px">
                                                <Typography variant="pi" textColor="neutral600">
                                                    {mockFormData.category ? `Category ${mockFormData.category}` : 'No category selected'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </GridItem>
                                </Grid>
                            </Box>
                        </GridItem>

                        {/* API Response Debug */}
                        {(autoFillData || error) && (
                            <GridItem col={12}>
                                <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                                    <Typography variant="delta" marginBottom={3}>
                                        🔍 API Response Debug
                                    </Typography>

                                    {error && (
                                        <Alert variant="danger" title="API Error" marginBottom={3}>
                                            {error}
                                        </Alert>
                                    )}

                                    {autoFillData && (
                                        <Box
                                            padding={3}
                                            background="neutral100"
                                            borderRadius="4px"
                                            style={{ fontFamily: 'monospace', fontSize: '12px' }}
                                        >
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                {JSON.stringify(autoFillData, null, 2)}
                                            </pre>
                                        </Box>
                                    )}
                                </Box>
                            </GridItem>
                        )}

                        {/* Instructions */}
                        <GridItem col={12}>
                            <Box background="primary100" padding={4} borderRadius="4px">
                                <Typography variant="delta" textColor="primary700" marginBottom={2}>
                                    📋 Testing Instructions
                                </Typography>

                                <Box as="ul" style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>
                                        <Typography variant="omega" textColor="primary700">
                                            **Single Article Test**: Enter "20" → Should auto-fill all fields exactly
                                        </Typography>
                                    </li>
                                    <li>
                                        <Typography variant="omega" textColor="primary700">
                                            **Multiple Articles Test**: Enter "20,21" → Should show conflicts and smart resolution
                                        </Typography>
                                    </li>
                                    <li>
                                        <Typography variant="omega" textColor="primary700">
                                            **Quick Create Test**: Use "Quick Create" button → Should create new collection
                                        </Typography>
                                    </li>
                                    <li>
                                        <Typography variant="omega" textColor="primary700">
                                            **Auto-Fill Apply**: Click "Apply Auto-Fill" → Should populate mock form fields
                                        </Typography>
                                    </li>
                                </Box>
                            </Box>
                        </GridItem>
                    </Grid>
                </ContentLayout>
            </Main>
        </Layout>
    );
};

export default TestPage;