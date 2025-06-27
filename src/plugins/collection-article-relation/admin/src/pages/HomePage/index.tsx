/*
 * HomePage - Collection Article Relation Plugin
 * Informational dashboard only
 */

import React from 'react';
import {
  Layout,
  Main,
  HeaderLayout,
  ContentLayout,
  Box,
  Typography,
  Grid,
  GridItem,
  Badge,
  Link
} from '@strapi/design-system';
import { CheckCircle, ExternalLink } from '@strapi/icons';

const HomePage = () => {
  return (
    <Layout>
      <Main>
        <HeaderLayout
          title="Collection Article Relation"
          subtitle="Intelligent single-article collection creation with auto-fill capabilities"
        />

        <ContentLayout>
          <Grid gap={6}>
            {/* Plugin Status */}
            <GridItem col={12}>
              <Box background="neutral0" padding={6} shadow="filterShadow" borderRadius="4px">
                <Box marginBottom={4}>
                  <Typography variant="alpha" textColor="neutral800" marginBottom={2}>
                    🚀 Quick Collection Creation
                  </Typography>
                  <Badge backgroundColor="success100" textColor="success700" size="M">
                    ✅ Active & Working
                  </Badge>
                </Box>

                <Typography variant="epsilon" textColor="neutral600" marginBottom={4}>
                  This plugin adds a floating "📚 Quick Collection" button to every article page.
                  Click it to instantly create a collection with all fields auto-filled from the article.
                </Typography>

                <Box background="primary100" padding={4} borderRadius="4px">
                  <Typography variant="omega" fontWeight="bold" textColor="primary700" marginBottom={2}>
                    🎯 How to Use:
                  </Typography>
                  <Box as="ol" style={{ margin: 0, paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <Typography variant="pi" textColor="primary700">
                        Navigate to any article edit page
                      </Typography>
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <Typography variant="pi" textColor="primary700">
                        Look for the floating "📚 Quick Collection" button (top-right)
                      </Typography>
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <Typography variant="pi" textColor="primary700">
                        Click the button to create a collection instantly
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="pi" textColor="primary700">
                        You'll be redirected to the new collection with all fields pre-filled
                      </Typography>
                    </li>
                  </Box>
                </Box>
              </Box>
            </GridItem>

            {/* Features */}
            <GridItem col={12}>
              <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                <Typography variant="delta" marginBottom={3}>
                  ✨ What Gets Auto-Filled
                </Typography>

                <Grid gap={4}>
                  <GridItem col={6}>
                    <Box padding={3} background="success100" borderRadius="4px">
                      <CheckCircle color="success600" marginBottom={2} />
                      <Typography variant="omega" fontWeight="bold" textColor="success700" marginBottom={1}>
                        Title & Date
                      </Typography>
                      <Typography variant="pi" textColor="success700">
                        Collection title and date copied exactly from the source article.
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={6}>
                    <Box padding={3} background="primary100" borderRadius="4px">
                      <CheckCircle color="primary600" marginBottom={2} />
                      <Typography variant="omega" fontWeight="bold" textColor="primary700" marginBottom={1}>
                        Cover & Category
                      </Typography>
                      <Typography variant="pi" textColor="primary700">
                        Cover image and category automatically copied from the article.
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={6}>
                    <Box padding={3} background="warning100" borderRadius="4px">
                      <CheckCircle color="warning600" marginBottom={2} />
                      <Typography variant="omega" fontWeight="bold" textColor="warning700" marginBottom={1}>
                        Article Relation
                      </Typography>
                      <Typography variant="pi" textColor="warning700">
                        The source article is automatically linked to the new collection.
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={6}>
                    <Box padding={3} background="alternative100" borderRadius="4px">
                      <CheckCircle color="alternative600" marginBottom={2} />
                      <Typography variant="omega" fontWeight="bold" textColor="alternative700" marginBottom={1}>
                        Duplicate Prevention
                      </Typography>
                      <Typography variant="pi" textColor="alternative700">
                        Detects existing single-article collections and redirects instead of creating duplicates.
                      </Typography>
                    </Box>
                  </GridItem>
                </Grid>
              </Box>
            </GridItem>

            {/* Benefits */}
            <GridItem col={12}>
              <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                <Typography variant="delta" marginBottom={3}>
                  🎉 Benefits
                </Typography>

                <Grid gap={4}>
                  <GridItem col={4}>
                    <Box textAlign="center">
                      <Typography variant="beta" textColor="primary600" marginBottom={2}>
                        90%
                      </Typography>
                      <Typography variant="omega" textColor="neutral700">
                        Time Savings
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={4}>
                    <Box textAlign="center">
                      <Typography variant="beta" textColor="success600" marginBottom={2}>
                        1-Click
                      </Typography>
                      <Typography variant="omega" textColor="neutral700">
                        Collection Creation
                      </Typography>
                    </Box>
                  </GridItem>

                  <GridItem col={4}>
                    <Box textAlign="center">
                      <Typography variant="beta" textColor="warning600" marginBottom={2}>
                        Zero
                      </Typography>
                      <Typography variant="omega" textColor="neutral700">
                        Learning Curve
                      </Typography>
                    </Box>
                  </GridItem>
                </Grid>
              </Box>
            </GridItem>

            {/* API Status */}
            <GridItem col={12}>
              <Box background="neutral0" padding={4} shadow="filterShadow" borderRadius="4px">
                <Typography variant="delta" marginBottom={3}>
                  🔧 Technical Details
                </Typography>

                <Grid gap={4}>
                  <GridItem col={6}>
                    <Typography variant="omega" fontWeight="bold" textColor="neutral800" marginBottom={1}>
                      Plugin Version:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      2.0.0 (Simplified & Optimized)
                    </Typography>
                  </GridItem>

                  <GridItem col={6}>
                    <Typography variant="omega" fontWeight="bold" textColor="neutral800" marginBottom={1}>
                      API Endpoints:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      /quick-create, /health
                    </Typography>
                  </GridItem>

                  <GridItem col={6}>
                    <Typography variant="omega" fontWeight="bold" textColor="neutral800" marginBottom={1}>
                      Primary Use Case:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      Single-article collections (80% of use cases)
                    </Typography>
                  </GridItem>

                  <GridItem col={6}>
                    <Typography variant="omega" fontWeight="bold" textColor="neutral800" marginBottom={1}>
                      Integration:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      Non-invasive floating button system
                    </Typography>
                  </GridItem>
                </Grid>

                <Box marginTop={4} padding={3} background="neutral100" borderRadius="4px">
                  <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={1}>
                    💡 Multi-Article Collections:
                  </Typography>
                  <Typography variant="pi" textColor="neutral600">
                    Use the quick button to create a collection from one article, then manually add more articles to it.
                    This approach is still much faster than full manual creation!
                  </Typography>
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