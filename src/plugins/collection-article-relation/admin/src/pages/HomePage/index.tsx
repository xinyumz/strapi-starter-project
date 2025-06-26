/*
 *
 * HomePage
 *
 */

import React from 'react';
import {
  Layout,
  Main,
  HeaderLayout,
  ContentLayout,
  Box,
  Typography,
  Button,
  Flex,
  Grid,
  GridItem,
  Alert,
  LinkButton
} from '@strapi/design-system';
import { ExternalLink, Play, CheckCircle } from '@strapi/icons';
import pluginId from '../../pluginId';

const HomePage = () => {
  return (
    <Layout>
      <Main>
        <HeaderLayout
          title="Collection Article Relation"
          subtitle="Intelligent collection creation with auto-fill capabilities"
        />

        <ContentLayout>
          <Grid gap={6}>
            {/* Welcome Section */}
            <GridItem col={12}>
              <Box background="neutral0" padding={6} shadow="filterShadow" borderRadius="4px">
                <Typography variant="alpha" textColor="neutral800" marginBottom={4}>
                  🚀 Welcome to Collection Auto-Fill
                </Typography>

                <Typography variant="epsilon" textColor="neutral600" marginBottom={4}>
                  This plugin enhances Strapi's collection creation with intelligent auto-fill
                  capabilities. Create collections faster by automatically populating fields
                  from selected articles.
                </Typography>

                <Alert title="Ready for Testing!" variant="success" marginBottom={4}>
                  Your backend API endpoints are working perfectly. Time to test the frontend components!
                </Alert>

                <Flex gap={3}>
                  <LinkButton to={`/plugins/${pluginId}/test`} startIcon={<Play />} size="L">
                    Open Test Page
                  </LinkButton>
                </Flex>
              </Box>
            </GridItem>

            {/* Features Overview */}
            <GridItem col={12}>
              <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                <Typography variant="delta" marginBottom={3}>
                  ✨ Features Implemented
                </Typography>

                <Grid gap={4}>
                  <GridItem col={6}>
                    <Box padding={3} background="success100" borderRadius="4px">
                      <Flex alignItems="center" gap={2} marginBottom={2}>
                        <CheckCircle color="success600" />
                        <Typography variant="omega" fontWeight="bold" textColor="success700">
                          Auto-Fill Analysis
                        </Typography>
                      </Flex>
                      <Typography variant="pi" textColor="success700">
                        Automatically analyze selected articles and suggest field values
                        for new collections with intelligent conflict resolution.
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={6}>
                    <Box padding={3} background="primary100" borderRadius="4px">
                      <Flex alignItems="center" gap={2} marginBottom={2}>
                        <CheckCircle color="primary600" />
                        <Typography variant="omega" fontWeight="bold" textColor="primary700">
                          Quick Collection Creation
                        </Typography>
                      </Flex>
                      <Typography variant="pi" textColor="primary700">
                        Create collections instantly from article pages with one click.
                        All fields auto-populated from the source article.
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={6}>
                    <Box padding={3} background="warning100" borderRadius="4px">
                      <Flex alignItems="center" gap={2} marginBottom={2}>
                        <CheckCircle color="warning600" />
                        <Typography variant="omega" fontWeight="bold" textColor="warning700">
                          Conflict Resolution
                        </Typography>
                      </Flex>
                      <Typography variant="pi" textColor="warning700">
                        Smart handling of conflicts when multiple articles have
                        different categories, covers, or dates.
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={6}>
                    <Box padding={3} background="alternative100" borderRadius="4px">
                      <Flex alignItems="center" gap={2} marginBottom={2}>
                        <CheckCircle color="alternative600" />
                        <Typography variant="omega" fontWeight="bold" textColor="alternative700">
                          Enhanced UX
                        </Typography>
                      </Flex>
                      <Typography variant="pi" textColor="alternative700">
                        Real-time preview, visual conflict indicators, and
                        seamless integration with existing Strapi workflows.
                      </Typography>
                    </Box>
                  </GridItem>
                </Grid>
              </Box>
            </GridItem>

            {/* Testing Instructions */}
            <GridItem col={12}>
              <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                <Typography variant="delta" marginBottom={3}>
                  🧪 Testing Guide
                </Typography>

                <Typography variant="omega" textColor="neutral600" marginBottom={3}>
                  Use the test page to verify all components work correctly with your backend:
                </Typography>

                <Box as="ol" style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="pi">
                      **Single Article Test**: Test with article ID 20 to see exact field copying
                    </Typography>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="pi">
                      **Multiple Articles Test**: Test with IDs 20,21 to see conflict resolution
                    </Typography>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="pi">
                      **Quick Creation Test**: Test one-click collection creation
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="pi">
                      **Integration Validation**: Verify API responses and component behavior
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

export default HomePage;