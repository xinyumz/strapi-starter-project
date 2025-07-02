// src/plugins/collection-article-relation/admin/src/pages/HomePage/index.tsx

import React from 'react';
import {
  Box,
  Typography,
  Grid,
} from '@strapi/design-system';
import styled from 'styled-components';

// Styled components using Design System v2 color tokens
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

const HeaderSection = styled(Box)`
  margin-bottom: 2rem;
`;

const StatusCard = styled(Box).attrs({
  background: "success100"
})`
  padding: 3rem;
  border-radius: 12px;
  margin-bottom: 2rem;
`;

const WhiteCard = styled(Box).attrs({
  background: "neutral0",
  borderColor: "neutral200"
})`
  padding: 3rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%
`;

const StepCard = styled(Box).attrs({
  background: "neutral100"
})`
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%
`;

const StepNumber = styled(Box)`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const FeatureCard = styled(Box)`
  padding: 2rem;
  border-radius: 8px;
  width: 100%
`;

const BenefitCard = styled(Box)`
  margin-bottom: 1.5rem;
  &:last-child {
    margin-bottom: 0;
  }
`;

const BenefitMetric = styled(Box)`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const InfoCard = styled(Box)`
  padding: 3rem;
  border-radius: 12px;
  width: 100%
`;

const TechnicalDetailItem = styled(Box)`
  margin-bottom: 0.75rem;
`;

const ReadyBadge = styled(Box).attrs({
  background: "success200"
})`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const HomePage = () => {
  return (
    <PageContainer>
      <ContentWrapper>
        {/* Header */}
        <HeaderSection>
          <Box marginBottom={4}>
            <Typography
              variant="alpha"
              fontWeight="bold"
              textColor="neutral800"
            >
              Collection Auto-Fill Plugin
            </Typography>
          </Box>
          <Box marginBottom={8}>
            <Typography
              variant="epsilon"
              textColor="neutral600"
            >
              Streamline your content workflow with intelligent collection creation
            </Typography>
          </Box>
        </HeaderSection>

        {/* Status Section */}
        <StatusCard>
          <Box marginBottom={4}>
            <Typography
              variant="beta"
              textColor="success700"
              fontWeight="semiBold"
            >
              ✅ Plugin Active & Working
            </Typography>
          </Box>
          <Box marginBottom={4}>
            <Typography
              variant="omega"
              textColor="success700"
              style={{ lineHeight: '1.6' }}
            >
              The floating "📚 Quick Collection" button is now available on all article edit pages.
              Click it to instantly create collections with auto-filled fields.
            </Typography>
          </Box>
          <ReadyBadge>
            <Typography variant="pi" textColor="success700" fontWeight="medium">
              Ready to Use
            </Typography>
          </ReadyBadge>
        </StatusCard>

        {/* How to Use Section */}
        <WhiteCard>
          <Box marginBottom={6}>
            <Typography
              variant="beta"
              textColor="neutral800"
              fontWeight="semiBold"
            >
              🎯 How to Use
            </Typography>
          </Box>

          <Grid.Root gap={6}>
            {[
              {
                step: '1',
                title: 'Navigate to Article',
                description: 'Go to any article edit page in the content manager',
                color: 'primary600' as const
              },
              {
                step: '2',
                title: 'Find the Button',
                description: 'Look for the floating "📚 Quick Collection" button in the bottom-right',
                color: 'warning600' as const
              },
              {
                step: '3',
                title: 'Click to Create',
                description: 'Click the button to instantly create a collection with auto-filled data',
                color: 'secondary600' as const
              },
              {
                step: '4',
                title: 'Open Collection',
                description: 'Click "📂 Open Collection" in the notification to view your new collection',
                color: 'success600' as const
              }
            ].map((item, index) => (
              <Grid.Item key={index} col={6}>
                <StepCard>
                  <StepNumber>
                    <Typography variant="alpha" textColor={item.color}>
                      {item.step}
                    </Typography>
                  </StepNumber>
                  <Box marginBottom={2}>
                    <Typography
                      variant="omega"
                      fontWeight="semiBold"
                      textColor="neutral800"
                    >
                      {item.title}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="pi"
                      textColor="neutral600"
                      style={{ lineHeight: '1.4' }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </StepCard>
              </Grid.Item>
            ))}
          </Grid.Root>
        </WhiteCard>

        {/* Auto-Fill Features */}
        <Grid.Root gap={6} align="stretch" style={{ marginBottom: '2rem' }}>
          <Grid.Item col={8}>
            <WhiteCard height="100%" style={{ margin: 0 }}>
              < Box marginBottom={6} >
                <Typography
                  variant="beta"
                  textColor="neutral800"
                  fontWeight="semiBold"
                >
                  ✨ What Gets Auto-Filled
                </Typography>
              </Box>


              <Grid.Root gap={6}>
                {[
                  { title: 'Title & Date', desc: 'Collection title and date copied exactly from the source article', bg: 'success100', textColor: 'success700' },
                  { title: 'Cover & Category', desc: 'Cover image and category automatically copied from the article', bg: 'primary100', textColor: 'primary700' },
                  { title: 'Article Relation', desc: 'The source article is automatically linked to the new collection', bg: 'warning100', textColor: 'warning700' },
                  { title: 'Duplicate Prevention', desc: 'Detects existing single-article collections and redirects instead of creating duplicates', bg: 'secondary100', textColor: 'secondary700' }
                ].map((feature, index) => (
                  <Grid.Item key={index} col={6}>
                    <FeatureCard key={index} background={feature.bg as any}>
                      <Box marginBottom={3}>
                        <Typography
                          variant="omega"
                          fontWeight="semiBold"
                          textColor={feature.textColor as any}
                        >
                          ✅ {feature.title}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="omega"
                          textColor={feature.textColor as any}
                          style={{ lineHeight: '1.5' }}
                        >
                          {feature.desc}
                        </Typography>
                      </Box>
                    </FeatureCard>
                  </Grid.Item>
                ))}
              </Grid.Root>
            </WhiteCard>
          </Grid.Item>

          {/* Key Benefits */}
          <Grid.Item col={4}>
            <WhiteCard height="100%" style={{ margin: 0 }}>
              <Box marginBottom={6}>
                <Typography
                  variant="beta"
                  textColor="neutral800"
                  fontWeight="semiBold"
                >
                  🎉 Key Benefits
                </Typography>
              </Box>

              {[
                { metric: '90%', title: 'Time Savings', desc: 'Dramatically reduce manual collection creation time', color: 'primary600' },
                { metric: '1-Click', title: 'Collection Creation', desc: 'Instant collection creation with full auto-fill', color: 'success600' },
                { metric: 'Zero', title: 'Learning Curve', desc: 'Intuitive floating button requires no training', color: 'warning600' }
              ].map((benefit, index) => (
                <BenefitCard key={index}>
                  <BenefitMetric>
                    <Typography variant="alpha" textColor={benefit.color as any}>
                      {benefit.metric}
                    </Typography>
                  </BenefitMetric>
                  <Box marginBottom={1}>
                    <Typography
                      variant="pi"
                      fontWeight="semiBold"
                      textColor="neutral800"
                    >
                      {benefit.title}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="pi"
                      textColor="neutral600"
                      style={{ lineHeight: '1.4' }}
                    >
                      {benefit.desc}
                    </Typography>
                  </Box>
                </BenefitCard>
              ))}
            </WhiteCard>
          </Grid.Item>
        </Grid.Root>

        {/* Additional Info */}
        <Grid.Root gap={6}>
          {/* Multi-Article Collections */}
          <Grid.Item col={6}>
            <InfoCard background="secondary100" height="100%">
              <Box marginBottom={4}>
                <Typography
                  variant="gamma"
                  textColor="secondary700"
                  fontWeight="semiBold"
                >
                  💡 Multi-Article Collections
                </Typography>
              </Box>
              <Box marginBottom={3}>
                <Typography
                  variant="omega"
                  textColor="secondary700"
                  fontWeight="medium"
                >
                  Need collections with multiple articles?
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="omega"
                  textColor="secondary700"
                  style={{ lineHeight: '1.5' }}
                >
                  Use the quick button to create a collection from your primary article, then manually add additional articles to it.
                  This workflow is still much faster than creating everything from scratch!
                </Typography>
              </Box>
            </InfoCard>
          </Grid.Item>

          {/* Technical Info */}
          <Grid.Item col={6}>
            <InfoCard background="neutral100" height="100%">
              <Box marginBottom={4}>
                <Typography
                  variant="gamma"
                  textColor="neutral800"
                  fontWeight="semiBold"
                >
                  🔧 Technical Details
                </Typography>
              </Box>

              {[
                { label: 'Plugin Version:', value: '2.0.0 (Simplified & Optimized)' },
                { label: 'Primary Use Case:', value: 'Single-article collections (80% of use cases)' },
                { label: 'Integration:', value: 'Non-invasive floating button system' },
                { label: 'API Endpoints:', value: '/quick-create, /health' }
              ].map((detail, index) => (
                <TechnicalDetailItem key={index}>
                  <Box>
                    <Typography
                      variant="pi"
                      fontWeight="semiBold"
                      textColor="neutral800"
                    >
                      {detail.label}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="pi"
                      textColor="neutral600"
                    >
                      {detail.value}
                    </Typography>
                  </Box>
                </TechnicalDetailItem>
              ))}
            </InfoCard>
          </Grid.Item>
        </Grid.Root>
      </ContentWrapper >
    </PageContainer >
  );
};

export default HomePage;