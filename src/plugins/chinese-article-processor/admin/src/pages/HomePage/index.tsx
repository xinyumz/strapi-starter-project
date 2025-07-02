// src/plugins/chinese-article-processor/admin/src/pages/HomePage/index.tsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardBody,
  CardHeader,
  Button,
  Grid,
  Badge,
} from '@strapi/design-system';
import styled from 'styled-components';

// Import the processor component
const ChineseArticleProcessor = React.lazy(() => import('../ChineseArticleProcessor'));

// Styled components using Design System v2
const PageContainer = styled(Box).attrs({
  background: "neutral0"
})`
  padding: 3rem;
  min-height: 100vh;
`;

const ContentWrapper = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
`;

const LoadingContainer = styled(Box).attrs({
  background: "neutral0"
})`
  padding: 3rem;
  text-align: center;
  min-height: 100vh;
`;

const StatusCard = styled(Card)`
  text-align: center;
  width: 100%;
`;

const IntegrationItem = styled(Box)`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const HomePage = () => {
  const [showProcessor, setShowProcessor] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on the processor route or have articleId parameter
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const articleIdParam = urlParams.get('articleId');

    console.log('[HomePage] Current path:', currentPath);
    console.log('[HomePage] Article ID param:', articleIdParam);

    if (currentPath.includes('/chinese-processor') || articleIdParam) {
      setShowProcessor(true);
      setArticleId(articleIdParam);
    }
  }, []);

  // If we should show the processor, render it
  if (showProcessor) {
    return (
      <React.Suspense fallback={
        <LoadingContainer>
          <Typography variant="omega" textColor="neutral600">
            Loading Chinese Processor...
          </Typography>
        </LoadingContainer>
      }>
        <ChineseArticleProcessor />
      </React.Suspense>
    );
  }

  // Otherwise render the homepage
  return (
    <PageContainer>
      <ContentWrapper>
        {/* Header */}
        <Box marginBottom={8}>
          <Box marginBottom={2}>
            <Typography
              variant="alpha"
              fontWeight="bold"
              textColor="neutral800"
            >
              Chinese Article Processor
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="epsilon"
              textColor="neutral600"
            >
              Advanced Chinese language processing with HSK analysis, grammar rules, and translation features.
            </Typography>
          </Box>
        </Box>

        {/* Main Content Grid */}
        <Grid.Root gap={6} style={{ marginBottom: '2rem' }}>
          {/* How to Use Card */}
          <Grid.Item col={6}>
            <Card style={{ height: '100%', width: '100%' }}>
              <CardHeader style={{ padding: '1.5rem' }}>
                <Typography variant="delta" fontWeight="semiBold" textColor="neutral800">
                  🎯 How to Use
                </Typography>
              </CardHeader>
              <CardBody style={{ padding: '1.5rem' }}>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    '• Go to Content Manager → Articles',
                    '• Edit any article and add Chinese content',
                    '• Use the "Language Processor" field to translate to Chinese',
                    '• Click "Process Content" to analyze Chinese text',
                    '• Or access the processor directly from the link below'
                  ].map((step, index) => (
                    <Box key={index}>
                      <Typography
                        variant="omega"
                        textColor="neutral700"
                        style={{ lineHeight: '1.6' }}
                      >
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardBody>
            </Card>
          </Grid.Item>

          {/* Features Card */}
          <Grid.Item col={6}>
            <Card style={{ height: '100%', width: "100%" }} background="secondary100">
              <CardHeader style={{ padding: '1.5rem' }}>
                <Typography variant="delta" fontWeight="semiBold" textColor="secondary700">
                  ✨ Features
                </Typography>
              </CardHeader>
              <CardBody style={{ padding: '1.5rem' }}>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    '✅ HSK level analysis and vocabulary difficulty',
                    '✅ AI-powered grammar rule generation',
                    '✅ Sentence-by-sentence breakdown',
                    '✅ Multi-language translation support',
                    '✅ Stable sentence ID management',
                    '✅ Integrated with per-language content system'
                  ].map((feature, index) => (
                    <Box key={index}>
                      <Typography
                        variant="omega"
                        textColor="secondary700"
                        style={{ lineHeight: '1.6' }}
                      >
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardBody>
            </Card>
          </Grid.Item>
        </Grid.Root>

        {/* Technical Integration Card */}
        <Card background="success100" style={{ marginBottom: '2rem' }}>
          <CardHeader style={{ padding: '1.5rem' }}>
            <Typography variant="delta" fontWeight="semiBold" textColor="success700">
              🔧 Technical Integration
            </Typography>
          </CardHeader>
          <CardBody style={{ padding: '1.5rem' }}>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Integrated with per-language plugin', status: 'Active' },
                { label: 'External API connections (HSK, Grammar, Pinyin)', status: 'Ready' },
                { label: 'Database relationships with foreign keys', status: 'Stable' },
                { label: 'Intelligent UPSERT operations preserve sentence IDs', status: 'Optimized' }
              ].map((item, index) => (
                <IntegrationItem key={index}>
                  <Box marginRight={2}>
                    <Badge size="S" backgroundColor="success200" textColor="success700">
                      {item.status}
                    </Badge>
                  </Box>
                  <Typography
                    variant="omega"
                    textColor="success700"
                    style={{ lineHeight: '1.6' }}
                  >
                    {item.label}
                  </Typography>
                </IntegrationItem>
              ))}
            </Box>
          </CardBody>
        </Card>

        {/* Quick Access */}
        <Box marginTop={6} marginBottom={6}>
          <Button
            variant="success"
            onClick={() => window.location.href = '/admin/content-manager/collection-types/api::article.article'}
            size="L"
          >
            → Go to Articles
          </Button>
        </Box>

        {/* Status Indicator */}
        <Card background="success100" borderColor="success200" style={{ marginBottom: '2rem' }}>
          <CardBody style={{ display: 'block', padding: '1rem' }}>
            <Box style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Typography variant="omega" textColor="success700" style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                ✅
              </Typography>
              <Typography
                variant="omega"
                fontWeight="bold"
                textColor="success700"
              >
                Plugin Status: Active & Ready
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="pi"
                textColor="success700"
              >
                Chinese processing capabilities are fully integrated and ready to use.
              </Typography>
            </Box>
          </CardBody>
        </Card>

        {/* Usage Statistics */}
        <Box marginBottom={4}>
          <Typography variant="delta" fontWeight="semiBold" textColor="neutral800" marginBottom={4}>
            System Status
          </Typography>
        </Box>
        <Grid.Root gap={4}>
          {[
            { label: 'HSK Analysis', status: 'Operational', variant: 'success' },
            { label: 'Grammar Rules', status: 'Active', variant: 'primary' },
            { label: 'Translations', status: 'Ready', variant: 'warning' },
            { label: 'Sentence Processing', status: 'Online', variant: 'secondary' }
          ].map((item, index) => (
            <Grid.Item key={index} col={3}>
              <StatusCard key={index}>
                <CardBody style={{ padding: '1.5rem' }}>
                  <Box marginRight={3}>
                    <Typography
                      variant="omega"
                      fontWeight="semiBold"
                      textColor="neutral800"
                    >
                      {item.label}
                    </Typography>
                  </Box>
                  <Box style={{ display: 'flex', justifyContent: 'center' }}>
                    <Badge
                      backgroundColor={`${item.variant}100` as any}
                      textColor={`${item.variant}600` as any}
                    >
                      {item.status}
                    </Badge>
                  </Box>
                </CardBody>
              </StatusCard>
            </Grid.Item>
          ))}
        </Grid.Root>
      </ContentWrapper>
    </PageContainer>
  );
};

export default HomePage;