// src/plugins/collection-manager/admin/src/pages/HomePage/DashboardTab.tsx
// Streamlined version with reduced redundancy

import React from 'react';
import { Box, Typography, } from '@strapi/design-system';

// Import our enhanced widgets
import CollectionSummaryWidget from '../../components/CollectionManagement/CollectionSummaryWidget';

// Import shared styles
import {
    TabContentContainer,
    SectionContainer,
    DashboardCard,
    InfoCard
} from '../../components/shared/StyledComponents';

const DashboardTab: React.FC = () => {
    return (
        <TabContentContainer>
            {/* Main Health Overview */}
            <SectionContainer>
                <CollectionSummaryWidget />
            </SectionContainer>

            {/* Dashboard Features Section - Streamlined */}
            <SectionContainer>
                <Box marginBottom={4}>
                    <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                        🎯 Health Monitoring Features
                    </Typography>
                </Box>

                <InfoCard background="primary100">
                    <Box marginBottom={4}>
                        <Typography variant="gamma" textColor="primary700" fontWeight="semiBold">
                            💡 Real-Time Health System
                        </Typography>
                    </Box>

                    <Box marginLeft={3}>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Floating Health Badge:</strong> Appears on Collections list page with live health score
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Smart Detection:</strong> Automatic orphan and duplicate identification
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Performance Optimized:</strong> Sub-100ms responses with intelligent caching
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Actionable Insights:</strong> Clear recommendations with one-click access to tools
                            </Typography>
                        </Box>
                    </Box>
                </InfoCard>
            </SectionContainer>

            {/* Quick Actions Summary */}
            <SectionContainer>
                <DashboardCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={4}>
                        <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                            🚀 Available Actions
                        </Typography>
                    </Box>

                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="neutral600">
                            Use the dashboard controls above or visit the Collections page to see the health badge:
                        </Typography>
                    </Box>

                    <Box marginLeft={2}>
                        <Box marginBottom={2}>
                            <Typography variant="pi" textColor="neutral700">
                                🔍 <strong>Scan for Issues:</strong> Force refresh health data with cache clearing
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="pi" textColor="neutral700">
                                ⚠️ <strong>Show Issues:</strong> View detailed information about problem collections
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="pi" textColor="neutral700">
                                📋 <strong>Health Badge:</strong> Real-time monitoring on Collections list page
                            </Typography>
                        </Box>
                    </Box>
                </DashboardCard>
            </SectionContainer>

            {/* Health Scoring Info - Consolidated */}
            <SectionContainer>
                <InfoCard background="success100">
                    <Box marginBottom={4}>
                        <Typography variant="gamma" textColor="success700" fontWeight="semiBold">
                            📊 Health Scoring System
                        </Typography>
                    </Box>

                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="success700" fontWeight="medium">
                            Weighted Formula: Health = 100 - (Orphans × 1.0) - (Duplicates × 0.5)
                        </Typography>
                    </Box>

                    <Box marginLeft={3}>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                🎯 <strong>Orphan Penalty:</strong> Full weight (1.0) - always problematic
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                📂 <strong>Duplicate Penalty:</strong> Half weight (0.5) - sometimes intentional
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                💡 <strong>Color Coding:</strong> Green (90%+), Yellow (70-89%), Red (&lt;70%)
                            </Typography>
                        </Box>
                    </Box>
                </InfoCard>
            </SectionContainer>
        </TabContentContainer>
    );
};

export default DashboardTab;