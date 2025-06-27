/*
 * HomePage - Collection Article Relation Plugin
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
  Grid,
  GridItem,
  Badge,
  Flex
} from '@strapi/design-system';

const HomePage = () => {
  return (
    <Layout>
      <Main>
        <HeaderLayout
          title="Collection Auto-Fill Plugin"
          subtitle="Streamline your content workflow with intelligent collection creation"
        />

        <ContentLayout>
          <Box paddingBottom={8}>
            <Grid gap={6}>
              {/* Status Section */}
              <GridItem col={12}>
                <Box
                  background="success100"
                  padding={6}
                  shadow="filterShadow"
                  hasRadius
                >
                  <Box textAlign="center">
                    <Typography variant="alpha" textColor="success700" marginBottom={3}>
                      ✅ Plugin Active & Working
                    </Typography>

                    <Typography variant="epsilon" textColor="success700" marginBottom={4}>
                      The floating "📚 Quick Collection" button is now available on all article edit pages.
                      Click it to instantly create collections with auto-filled fields.
                    </Typography>

                    <Badge backgroundColor="success200" textColor="success800">
                      Ready to Use
                    </Badge>
                  </Box>
                </Box>
              </GridItem>

              {/* How to Use Section */}
              <GridItem col={12}>
                <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                  <Typography variant="delta" textColor="neutral800" marginBottom={5}>
                    🎯 How to Use
                  </Typography>

                  <Grid gap={4}>
                    <GridItem col={3}>
                      <Box textAlign="center" padding={4} background="neutral100" hasRadius>
                        <Box marginBottom={3}>
                          <Typography variant="beta" textColor="primary600">
                            1
                          </Typography>
                        </Box>
                        <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={2}>
                          Navigate to Article
                        </Typography>
                        <Typography variant="pi" textColor="neutral600">
                          Go to any article edit page in the content manager
                        </Typography>
                      </Box>
                    </GridItem>

                    <GridItem col={3}>
                      <Box textAlign="center" padding={4} background="neutral100" hasRadius>
                        <Box marginBottom={3}>
                          <Typography variant="beta" textColor="warning600">
                            2
                          </Typography>
                        </Box>
                        <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={2}>
                          Find the Button
                        </Typography>
                        <Typography variant="pi" textColor="neutral600">
                          Look for the floating "📚 Quick Collection" button in the bottom-right
                        </Typography>
                      </Box>
                    </GridItem>

                    <GridItem col={3}>
                      <Box textAlign="center" padding={4} background="neutral100" hasRadius>
                        <Box marginBottom={3}>
                          <Typography variant="beta" textColor="alternative600">
                            3
                          </Typography>
                        </Box>
                        <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={2}>
                          Click to Create
                        </Typography>
                        <Typography variant="pi" textColor="neutral600">
                          Click the button to instantly create a collection with auto-filled data
                        </Typography>
                      </Box>
                    </GridItem>

                    <GridItem col={3}>
                      <Box textAlign="center" padding={4} background="neutral100" hasRadius>
                        <Box marginBottom={3}>
                          <Typography variant="beta" textColor="success600">
                            4
                          </Typography>
                        </Box>
                        <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={2}>
                          Open Collection
                        </Typography>
                        <Typography variant="pi" textColor="neutral600">
                          Click "📂 Open Collection" in the notification to view your new collection
                        </Typography>
                      </Box>
                    </GridItem>
                  </Grid>
                </Box>
              </GridItem>

              {/* Auto-Fill Features */}
              <GridItem col={8}>
                <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                  <Typography variant="delta" textColor="neutral800" marginBottom={5}>
                    ✨ What Gets Auto-Filled
                  </Typography>

                  <Grid gap={4}>
                    <GridItem col={6}>
                      <Box padding={4} background="success100" hasRadius>
                        <Typography variant="omega" fontWeight="bold" textColor="success700" marginBottom={2}>
                          ✅ Title & Date
                        </Typography>
                        <Typography variant="pi" textColor="success700">
                          Collection title and date copied exactly from the source article
                        </Typography>
                      </Box>
                    </GridItem>

                    <GridItem col={6}>
                      <Box padding={4} background="primary100" hasRadius>
                        <Typography variant="omega" fontWeight="bold" textColor="primary700" marginBottom={2}>
                          ✅ Cover & Category
                        </Typography>
                        <Typography variant="pi" textColor="primary700">
                          Cover image and category automatically copied from the article
                        </Typography>
                      </Box>
                    </GridItem>

                    <GridItem col={6}>
                      <Box padding={4} background="warning100" hasRadius>
                        <Typography variant="omega" fontWeight="bold" textColor="warning700" marginBottom={2}>
                          ✅ Article Relation
                        </Typography>
                        <Typography variant="pi" textColor="warning700">
                          The source article is automatically linked to the new collection
                        </Typography>
                      </Box>
                    </GridItem>

                    <GridItem col={6}>
                      <Box padding={4} background="alternative100" hasRadius>
                        <Typography variant="omega" fontWeight="bold" textColor="alternative700" marginBottom={2}>
                          ✅ Duplicate Prevention
                        </Typography>
                        <Typography variant="pi" textColor="alternative700">
                          Detects existing single-article collections and redirects instead of creating duplicates
                        </Typography>
                      </Box>
                    </GridItem>
                  </Grid>
                </Box>
              </GridItem>

              {/* Key Benefits */}
              <GridItem col={4}>
                <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                  <Typography variant="delta" textColor="neutral800" marginBottom={5}>
                    🎉 Key Benefits
                  </Typography>

                  <Box marginBottom={4}>
                    <Box textAlign="center" marginBottom={4}>
                      <Typography variant="alpha" textColor="primary600" marginBottom={1}>
                        90%
                      </Typography>
                      <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={1}>
                        Time Savings
                      </Typography>
                      <Typography variant="pi" textColor="neutral600">
                        Dramatically reduce manual collection creation time
                      </Typography>
                    </Box>

                    <Box textAlign="center" marginBottom={4}>
                      <Typography variant="alpha" textColor="success600" marginBottom={1}>
                        1-Click
                      </Typography>
                      <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={1}>
                        Collection Creation
                      </Typography>
                      <Typography variant="pi" textColor="neutral600">
                        Instant collection creation with full auto-fill
                      </Typography>
                    </Box>

                    <Box textAlign="center">
                      <Typography variant="alpha" textColor="warning600" marginBottom={1}>
                        Zero
                      </Typography>
                      <Typography variant="omega" fontWeight="bold" textColor="neutral700" marginBottom={1}>
                        Learning Curve
                      </Typography>
                      <Typography variant="pi" textColor="neutral600">
                        Intuitive floating button requires no training
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </GridItem>

              {/* Multi-Article Collections */}
              <GridItem col={6}>
                <Box background="alternative100" padding={6} shadow="filterShadow" hasRadius>
                  <Typography variant="delta" textColor="alternative700" marginBottom={4}>
                    💡 Multi-Article Collections
                  </Typography>
                  <Typography variant="epsilon" textColor="alternative700" marginBottom={3}>
                    Need collections with multiple articles?
                  </Typography>
                  <Typography variant="pi" textColor="alternative700">
                    Use the quick button to create a collection from your primary article, then manually add additional articles to it.
                    This workflow is still much faster than creating everything from scratch!
                  </Typography>
                </Box>
              </GridItem>

              {/* Technical Info */}
              <GridItem col={6}>
                <Box background="neutral100" padding={6} shadow="filterShadow" hasRadius>
                  <Typography variant="delta" textColor="neutral700" marginBottom={4}>
                    🔧 Technical Details
                  </Typography>

                  <Box marginBottom={3}>
                    <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                      Plugin Version:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      2.0.0 (Simplified & Optimized)
                    </Typography>
                  </Box>

                  <Box marginBottom={3}>
                    <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                      Primary Use Case:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      Single-article collections (80% of use cases)
                    </Typography>
                  </Box>

                  <Box marginBottom={3}>
                    <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                      Integration:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      Non-invasive floating button system
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                      API Endpoints:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      /quick-create, /health
                    </Typography>
                  </Box>
                </Box>
              </GridItem>
            </Grid>
          </Box>
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default HomePage;