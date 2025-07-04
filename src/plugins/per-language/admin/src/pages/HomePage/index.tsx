// src/plugins/per-language/admin/src/pages/HomePage/index.tsx

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardBody,
  CardHeader,
  Button,
  Flex
} from '@strapi/design-system';
import styled from 'styled-components';
import pluginId from '../../pluginId';
import packageJson from '../../../../package.json';


const ContentWrapper = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
`;

const HomePage: React.FC = () => {
  return (
    <Box background="neutral0" padding='3rem' minHeight="100vh">
      <ContentWrapper>
        {/* Header */}
        <Box marginBottom={8}>
          <Box marginBottom={2}>
            <Typography
              variant="alpha"
              fontWeight="bold"
              textColor="neutral800"
            >
              Per-Language Content Management
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="epsilon"
              textColor="neutral600"
            >
              This plugin provides multi-language content management capabilities for articles.
            </Typography>
          </Box>
        </Box>

        {/* How to Use Card */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader style={{ padding: '1.5rem' }}>
            <Typography variant="delta" fontWeight="semiBold" textColor="neutral800">
              How to Use
            </Typography>
          </CardHeader>
          <CardBody style={{ padding: '1.5rem' }}>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                '• Go to Content Manager → Articles',
                '• Edit any article',
                '• Use the "Language Processor" field to translate and manage content',
                '• The field provides integrated translation, processing, and publishing controls'
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

        {/* Features Card */}
        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader style={{ padding: '1.5rem' }}>
            <Typography variant="delta" fontWeight="semiBold" textColor="neutral800">
              Features
            </Typography>
          </CardHeader>
          <CardBody style={{ padding: '1.5rem' }}>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                '✅ Multi-language translation',
                '✅ Chinese content processing (HSK analysis, grammar rules)',
                '✅ Per-language publishing controls',
                '✅ Access tier management (Free/Login/Premium)',
                '✅ Integrated workflow within article editor'
              ].map((feature, index) => (
                <Box key={index}>
                  <Typography
                    variant="omega"
                    textColor="neutral700"
                    style={{ lineHeight: '1.6' }}
                  >
                    {feature}
                  </Typography>
                </Box>
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

        {/* Status Card */}
        <Card background="success100" borderColor="success200">
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
                The Language Processor field is available in all article content types.
              </Typography>
            </Box>
          </CardBody>
        </Card>

        {/* Footer Info */}
        <Box paddingTop={4} marginTop={6} borderColor="neutral200" borderWidth="1px 0 0 0">
          <Flex style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <Typography variant="pi" textColor="neutral500">
              Plugin ID: {pluginId}
            </Typography>
            <Typography variant="pi" textColor="neutral500">
              Version {packageJson.version}
            </Typography>
          </Flex>
        </Box>

      </ContentWrapper>
    </Box>
  );
};

export default HomePage;