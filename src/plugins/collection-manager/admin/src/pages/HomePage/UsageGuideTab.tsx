// src/plugins/collection-manager/admin/src/pages/HomePage/UsageGuideTab.tsx

import React from 'react';
import { Box, Typography, Grid, Flex } from '@strapi/design-system';

// Import shared styles
import {
    TabContentContainer,
    SectionContainer,
    WhiteCard,
    StepCard,
    StepNumber,
    ReadyBadge,
    InfoCard
} from '../../components/shared/StyledComponents';

const UsageGuideTab: React.FC = () => {
    return (
        <TabContentContainer>
            {/* Status Section */}
            <SectionContainer>
                <InfoCard background="success100">
                    <Box marginBottom={4}>
                        <Typography variant="beta" textColor="success700" fontWeight="semiBold">
                            ✅ Plugin Active & Working
                        </Typography>
                    </Box>

                    {/* Auto-Fill Feature Status */}
                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="success700" fontWeight="medium">
                            📚 Collection Auto-Fill:
                        </Typography>
                    </Box>
                    <Box marginBottom={4} marginLeft={2}>
                        <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                            The floating "📚 Quick Collection" button is now available on all article edit pages.
                            Click it to instantly create collections with auto-filled fields.
                        </Typography>
                    </Box>

                    {/* Health Monitoring Status */}
                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="success700" fontWeight="medium">
                            📊 Health Monitoring:
                        </Typography>
                    </Box>
                    <Box marginBottom={4} marginLeft={2}>
                        <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                            Real-time collection health monitoring is active. Check the Dashboard tab for detailed analytics,
                            or visit the <strong>Collections list page</strong> to see the floating health badge in the bottom-right corner.
                        </Typography>
                    </Box>

                    <Flex gap={3}>
                        <ReadyBadge background="success200">
                            <Typography variant="pi" textColor="success700" fontWeight="medium">
                                Auto-Fill Ready
                            </Typography>
                        </ReadyBadge>
                        <ReadyBadge background="secondary200">
                            <Typography variant="pi" textColor="secondary700" fontWeight="medium">
                                Health Badge Active
                            </Typography>
                        </ReadyBadge>
                    </Flex>
                </InfoCard>
            </SectionContainer>

            {/* How to Use Auto-Fill */}
            <SectionContainer>
                <WhiteCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={6}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            🎯 How to Use Collection Auto-Fill
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
                                <StepCard background="neutral100">
                                    <StepNumber>
                                        <Typography variant="alpha" textColor={item.color}>
                                            {item.step}
                                        </Typography>
                                    </StepNumber>
                                    <Box marginBottom={2}>
                                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                            {item.title}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral600" style={{ lineHeight: '1.4' }}>
                                            {item.description}
                                        </Typography>
                                    </Box>
                                </StepCard>
                            </Grid.Item>
                        ))}
                    </Grid.Root>
                </WhiteCard>
            </SectionContainer>

            {/* Health Monitoring Guide */}
            <SectionContainer>
                <WhiteCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={6}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            🎯 How to Use Health Monitoring
                        </Typography>
                    </Box>

                    <Grid.Root gap={6}>
                        {[
                            {
                                step: '1',
                                title: 'Check Collections Page',
                                description: 'Visit Collections list to see the floating health badge, or use the Dashboard tab',
                                color: 'primary600' as const
                            },
                            {
                                step: '2',
                                title: 'Refresh Health Data',
                                description: 'Click the health badge or "🔍 Scan for Issues" to get the latest health data',
                                color: 'warning600' as const
                            },
                            {
                                step: '3',
                                title: 'Review Problems',
                                description: 'Click "Details" on the badge or "⚠️ Show Issues" to see problem collections',
                                color: 'danger600' as const
                            },
                            {
                                step: '4',
                                title: 'Take Action',
                                description: 'Use the dashboard tools or collection manager to fix detected issues',
                                color: 'success600' as const
                            }
                        ].map((item, index) => (
                            <Grid.Item key={index} col={6}>
                                <StepCard background="neutral100">
                                    <StepNumber>
                                        <Typography variant="alpha" textColor={item.color}>
                                            {item.step}
                                        </Typography>
                                    </StepNumber>
                                    <Box marginBottom={2}>
                                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                            {item.title}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral600" style={{ lineHeight: '1.4' }}>
                                            {item.description}
                                        </Typography>
                                    </Box>
                                </StepCard>
                            </Grid.Item>
                        ))}
                    </Grid.Root>
                </WhiteCard>
            </SectionContainer>

            {/* Understanding Health Issues - Streamlined */}
            <SectionContainer>
                <Grid.Root gap={6}>
                    {/* Orphaned Collections Guide */}
                    <Grid.Item col={6}>
                        <InfoCard background="warning100">
                            <Box marginBottom={4}>
                                <Typography variant="gamma" textColor="warning700" fontWeight="semiBold">
                                    ⚠️ Orphaned Collections
                                </Typography>
                            </Box>

                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="warning700" fontWeight="medium">
                                    What are they?
                                </Typography>
                            </Box>

                            <Box marginLeft={2} marginBottom={3}>
                                <Box marginBottom={1}>
                                    <Typography variant="pi" textColor="warning700">
                                        • Empty collections with no articles
                                    </Typography>
                                </Box>
                                <Box marginBottom={1}>
                                    <Typography variant="pi" textColor="warning700">
                                        • Collections with deleted article references
                                    </Typography>
                                </Box>
                            </Box>

                            <Box marginBottom={2}>
                                <Typography variant="omega" textColor="warning700" fontWeight="medium">
                                    Why fix them?
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="pi" textColor="warning700" style={{ lineHeight: '1.5' }}>
                                    They clutter your CMS and confuse editors. Regular cleanup maintains organization.
                                </Typography>
                            </Box>
                        </InfoCard>
                    </Grid.Item>

                    {/* Duplicate Collections Guide */}
                    <Grid.Item col={6}>
                        <InfoCard background="secondary100">
                            <Box marginBottom={4}>
                                <Typography variant="gamma" textColor="secondary700" fontWeight="semiBold">
                                    📂 Duplicate Collections
                                </Typography>
                            </Box>

                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="secondary700" fontWeight="medium">
                                    What are they?
                                </Typography>
                            </Box>

                            <Box marginLeft={2} marginBottom={3}>
                                <Box marginBottom={1}>
                                    <Typography variant="pi" textColor="secondary700">
                                        • Multiple collections with identical articles
                                    </Typography>
                                </Box>
                                <Box marginBottom={1}>
                                    <Typography variant="pi" textColor="secondary700">
                                        • Detected using fingerprint algorithm
                                    </Typography>
                                </Box>
                            </Box>

                            <Box marginBottom={2}>
                                <Typography variant="omega" textColor="secondary700" fontWeight="medium">
                                    Why consolidate?
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="pi" textColor="secondary700" style={{ lineHeight: '1.5' }}>
                                    Reduces confusion and improves content organization for better user experience.
                                </Typography>
                            </Box>
                        </InfoCard>
                    </Grid.Item>
                </Grid.Root>
            </SectionContainer>

            {/* Best Practices - Streamlined */}
            <SectionContainer>
                <WhiteCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={6}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            💡 Best Practices
                        </Typography>
                    </Box>

                    <Grid.Root gap={4}>
                        <Grid.Item col={6}>
                            <Box marginLeft={2}>
                                <Box marginBottom={3}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="success700">
                                        ✅ Recommended:
                                    </Typography>
                                </Box>
                                <Box marginLeft={2}>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Use auto-fill for consistent collection creation
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Monitor health badge on Collections page
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Address issues promptly when detected
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Keep collection titles descriptive and unique
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid.Item>

                        <Grid.Item col={6}>
                            <Box marginLeft={2}>
                                <Box marginBottom={3}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="danger700">
                                        ❌ Avoid:
                                    </Typography>
                                </Box>
                                <Box marginLeft={2}>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Creating collections manually without checking duplicates
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Ignoring health score warnings
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Leaving orphaned collections unaddressed
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Creating identical collections repeatedly
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid.Item>
                    </Grid.Root>
                </WhiteCard>
            </SectionContainer>
        </TabContentContainer>
    );
};

export default UsageGuideTab;