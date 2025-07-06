// src/plugins/collection-article-relation/admin/src/pages/HomePage/index.tsx

import React from 'react';
import { Box, Typography, Tabs, Flex } from '@strapi/design-system';
import { Plus, Database, ChartBubble } from '@strapi/icons';
import pluginId from '../../pluginId';
import packageJson from '../../../../package.json';

// Import modular tab components
import DashboardTab from './DashboardTab';
import UsageGuideTab from './UsageGuideTab';
import FeaturesTab from './FeaturesTab';

// Import shared styles
import { ContentWrapper } from './shared/StyledComponents';

const HomePage: React.FC = () => {
  return (
    <Box background="neutral0" padding="3rem" minHeight="100vh">
      <ContentWrapper>
        {/* Header */}
        <Box marginBottom="2rem">
          <Box marginBottom={4}>
            <Typography variant="alpha" fontWeight="bold" textColor="neutral800">
              Collection Management Hub
            </Typography>
          </Box>
          <Box marginBottom={8}>
            <Typography variant="epsilon" textColor="neutral600">
              Advanced collection management with intelligent orphan detection, duplicate prevention, and auto-fill capabilities
            </Typography>
          </Box>
        </Box>

        {/* Main Content with Clean Tabs */}
        <Box marginBottom="2rem">
          <Tabs.Root defaultValue="dashboard" id="main-navigation">
            <Tabs.List aria-label="Main navigation">
              <Tabs.Trigger value="dashboard">
                <Flex alignItems="center" gap={2}>
                  <ChartBubble />
                  Dashboard
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="usage">
                <Flex alignItems="center" gap={2}>
                  <Plus />
                  Usage Guide
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="features">
                <Flex alignItems="center" gap={2}>
                  <Database />
                  Features
                </Flex>
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="dashboard">
              <Box paddingTop={4}>
                <DashboardTab />
              </Box>
            </Tabs.Content>

            <Tabs.Content value="usage">
              <Box paddingTop={4}>
                <UsageGuideTab />
              </Box>
            </Tabs.Content>

            <Tabs.Content value="features">
              <Box paddingTop={4}>
                <FeaturesTab />
              </Box>
            </Tabs.Content>
          </Tabs.Root>
        </Box>

        {/* Footer Info */}
        <Box
          paddingTop={4}
          marginTop={6}
          borderColor="neutral200"
          borderWidth="1px 0 0 0"
        >
          <Flex
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <Typography variant="pi" textColor="neutral500">
              Plugin ID: {pluginId}
            </Typography>
            <Typography variant="pi" textColor="neutral500">
              Collection Management Hub v{packageJson.version}
            </Typography>
          </Flex>
        </Box>
      </ContentWrapper>
    </Box>
  );
};

export default HomePage;