import React, { useState } from 'react';
import {
    Box,
    Button,
    Field,
    Typography,
    Alert,
    Card,
    CardBody,
    CardHeader,
    Flex,
    Grid,
} from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import styled from 'styled-components';
import pluginId from '../../pluginId';
import packageJson from '../../../../package.json';

const ContentWrapper = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
`;

const HomePage = () => {
    const [path, setPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [recentRevalidations, setRecentRevalidations] = useState<string[]>([]);

    const handleRevalidate = async () => {
        if (!path.trim()) {
            setResult({
                type: 'error',
                message: 'Please enter a valid path to revalidate',
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            // Construct the revalidation URL
            const revalidateUrl = `https://pandaist.com/api/revalidate?secret=tempsecret&path=${encodeURIComponent(path)}`;

            // Send GET request to trigger revalidation
            const response = await fetch(revalidateUrl, {
                method: 'GET',
            });

            if (response.ok) {
                setResult({
                    type: 'success',
                    message: `Successfully revalidated: ${path}`,
                });

                // Add to recent revalidations (keep last 5)
                setRecentRevalidations(prev => {
                    const updated = [path, ...prev.filter(p => p !== path)].slice(0, 5);
                    return updated;
                });

                // Clear the input
                setPath('');
            } else {
                setResult({
                    type: 'error',
                    message: `Failed to revalidate. Status: ${response.status}`,
                });
            }
        } catch (error) {
            setResult({
                type: 'error',
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickRevalidate = (quickPath: string) => {
        setPath(quickPath);
    };

    return (
        <Box background="neutral0" padding="3rem" minHeight="100vh">
            <ContentWrapper>
                <Box background="neutral0">
                    {/* Header Section */}
                    <Box marginBottom={8}>
                        <Box marginBottom={4}>
                            <Typography variant="alpha" textColor="neutral800" marginBottom={3}>
                                Page Revalidation
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="epsilon" textColor="neutral600" maxWidth="600px">
                                Trigger Next.js ISR revalidation for specific pages and paths
                            </Typography>
                        </Box>
                    </Box>

                    {/* Main Content */}
                    <Grid.Root gap={6}>
                        <Grid.Item col={8}>
                            <Card width="100%" height="100%">
                                <CardHeader padding={2}>
                                    <Typography variant="beta" textColor="neutral800">
                                        Revalidate Page
                                    </Typography>
                                </CardHeader>
                                <CardBody padding={4}>
                                    <Box>
                                        <Box marginBottom={6}>
                                            <Typography variant="omega" textColor="neutral600">
                                                Enter the relative path of the page you want to revalidate.
                                                The system will send a request to trigger Next.js ISR regeneration.
                                            </Typography>
                                        </Box>

                                        <Flex direction="column" alignItems="stretch" gap={6}>
                                            <Field.Root
                                                name="pagePath"
                                                id="pagePath"
                                                hint="Enter the relative URL path (e.g., /article/this-is-the-title)"
                                            >
                                                <Field.Label>Page Path</Field.Label>
                                                <Field.Input
                                                    placeholder="/article/your-article-slug"
                                                    value={path}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)}
                                                    onKeyDown={(e: React.KeyboardEvent) => {
                                                        if (e.key === 'Enter' && !isLoading && path.trim()) {
                                                            handleRevalidate();
                                                        }
                                                    }}
                                                />
                                                <Field.Hint />
                                            </Field.Root>

                                            <Button
                                                fullWidth
                                                startIcon={<ArrowClockwise />}
                                                onClick={handleRevalidate}
                                                loading={isLoading}
                                                disabled={!path.trim()}
                                                size="L"
                                            >
                                                {isLoading ? 'Revalidating...' : 'Revalidate Page'}
                                            </Button>
                                        </Flex>

                                        {result && (
                                            <Box marginTop={4}>
                                                <Alert
                                                    closeLabel="Close alert"
                                                    title={result.type === 'success' ? 'Success' : 'Error'}
                                                    variant={result.type === 'success' ? 'success' : 'danger'}
                                                    onClose={() => setResult(null)}
                                                >
                                                    {result.message}
                                                </Alert>
                                            </Box>
                                        )}
                                    </Box>
                                </CardBody>
                            </Card>
                        </Grid.Item>

                        <Grid.Item col={4}>
                            <Flex direction="column" alignItems="stretch" gap={4} width="100%" height="100%">
                                {/* Quick Actions */}
                                <Card>
                                    <CardHeader padding={2}>
                                        <Typography variant="delta" textColor="neutral800">
                                            Quick Actions
                                        </Typography>
                                    </CardHeader>
                                    <CardBody justifyContent='center' padding={2}>
                                        <Flex direction="column" alignItems="center" width="70%" gap={3}>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleQuickRevalidate('/article/')}
                                                fullWidth
                                            >
                                                Article Template
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleQuickRevalidate('/blog/')}
                                                fullWidth
                                            >
                                                Blog Template
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleQuickRevalidate('/')}
                                                fullWidth
                                            >
                                                Homepage
                                            </Button>
                                        </Flex>
                                    </CardBody>
                                </Card>

                                {/* Recent Revalidations */}
                                {recentRevalidations.length > 0 && (
                                    <Card>
                                        <CardHeader padding={2}>
                                            <Typography variant="delta" textColor="neutral800">
                                                Recent Revalidations
                                            </Typography>
                                        </CardHeader>
                                        <CardBody padding={4}>
                                            <Flex direction="column" alignItems="stretch" gap={2}>
                                                {recentRevalidations.map((recentPath, index) => (
                                                    <Box key={index} padding={2} background="neutral100" hasRadius>
                                                        <Flex justifyContent="space-between" alignItems="center">
                                                            <Typography variant="pi" textColor="neutral700" ellipsis>
                                                                {recentPath}
                                                            </Typography>
                                                            <Button
                                                                variant="ghost"
                                                                size="S"
                                                                onClick={() => handleQuickRevalidate(recentPath)}
                                                            >
                                                                <ArrowClockwise />
                                                            </Button>
                                                        </Flex>
                                                    </Box>
                                                ))}
                                            </Flex>
                                        </CardBody>
                                    </Card>
                                )}

                                {/* Info */}
                                <Card>
                                    <CardHeader padding={2}>
                                        <Typography variant="delta" textColor="neutral800">
                                            How It Works
                                        </Typography>
                                    </CardHeader>
                                    <CardBody padding={4}>
                                        <Typography variant="omega" textColor="neutral600">
                                            This tool sends a GET request to your Next.js revalidation API endpoint.
                                            Make sure your Next.js application has the revalidation API route set up
                                            and the secret key is properly configured.
                                        </Typography>
                                    </CardBody>
                                </Card>
                            </Flex>
                        </Grid.Item>
                    </Grid.Root>

                    {/* Footer Info */}
                    <Box marginTop={8} paddingTop={4} borderColor="neutral200" borderWidth="1px 0 0 0">
                        <Flex justifyContent="space-between" alignItems="center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <Typography variant="pi" textColor="neutral500">
                                Plugin ID: {pluginId}
                            </Typography>
                            <Typography variant="pi" textColor="neutral500">
                                Version {packageJson.version}
                            </Typography>
                        </Flex>
                    </Box>
                </Box>
            </ContentWrapper>
        </Box>
    );
};

export default HomePage;