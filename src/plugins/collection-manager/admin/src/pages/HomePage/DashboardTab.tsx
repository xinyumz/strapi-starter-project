// src/plugins/collection-manager/admin/src/pages/HomePage/DashboardTab.tsx
// Dashboard component for health overview

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

            {/* Dashboard Features Section */}
            <SectionContainer>
                <Box marginBottom={4}>
                    <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                        🎯 Dashboard Features
                    </Typography>
                </Box>

                <InfoCard background="primary100">
                    <Box marginBottom={4}>
                        <Typography variant="gamma" textColor="primary700" fontWeight="semiBold">
                            💡 Advanced Health Monitoring
                        </Typography>
                    </Box>

                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="primary700" fontWeight="medium">
                            Complete Collection Health System:
                        </Typography>
                    </Box>

                    <Box marginLeft={3}>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Orphan Detection:</strong> Automatically identifies empty collections and broken article references
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Duplicate Detection:</strong> Uses fingerprint algorithm to detect identical article sets
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Real-time Monitoring:</strong> 2-minute auto-refresh with instant manual refresh capability
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Smart Caching:</strong> Sub-100ms response times with intelligent cache management
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                                ✅ <strong>Unified Health Score:</strong> Combined scoring system with actionable recommendations
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
                            Use the quick actions above to manage your collection health:
                        </Typography>
                    </Box>

                    <Box marginLeft={2}>
                        <Box marginBottom={2}>
                            <Typography variant="pi" textColor="neutral700">
                                🔍 <strong>Scan for Issues:</strong> Force refresh both orphan and duplicate detection with cache clearing
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="pi" textColor="neutral700">
                                ⚠️ <strong>Show Issues:</strong> View detailed information about orphaned or duplicate collections
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="pi" textColor="neutral700">
                                📋 <strong>Manage Collections:</strong> Navigate to the collection manager for hands-on editing
                            </Typography>
                        </Box>
                    </Box>
                </DashboardCard>
            </SectionContainer>

            {/* Collection Management Insights */}
            <SectionContainer>
                <InfoCard background="success100">
                    <Box marginBottom={4}>
                        <Typography variant="gamma" textColor="success700" fontWeight="semiBold">
                            📊 Collection Quality Insights
                        </Typography>
                    </Box>

                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="success700" fontWeight="medium">
                            Key Quality Indicators:
                        </Typography>
                    </Box>

                    <Box marginLeft={3}>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                🎯 <strong>Health Score:</strong> Unified metric combining orphan and duplicate penalties
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                📈 <strong>Content Distribution:</strong> Balance between single and multi-article collections
                            </Typography>
                        </Box>
                        <Box marginBottom={2}>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                🔍 <strong>Issue Detection:</strong> Proactive identification of content organization problems
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                                💡 <strong>Actionable Recommendations:</strong> Clear guidance for improving collection quality
                            </Typography>
                        </Box>
                    </Box>
                </InfoCard>
            </SectionContainer>
        </TabContentContainer>
    );
};

export default DashboardTab;