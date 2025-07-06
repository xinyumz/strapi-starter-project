// src/plugins/collection-article-relation/admin/src/pages/HomePage/UsageGuideTab.tsx

import React from 'react';
import { Box, Typography, Grid } from '@strapi/design-system';

// Import shared styles
import {
    TabContentContainer,
    SectionContainer,
    WhiteCard,
    StepCard,
    StepNumber,
    ReadyBadge,
    InfoCard
} from './shared/StyledComponents';

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
                    <Box marginBottom={4}>
                        <Typography variant="omega" textColor="success700" style={{ lineHeight: '1.6' }}>
                            The floating "📚 Quick Collection" button is now available on all article edit pages.
                            Click it to instantly create collections with auto-filled fields.
                        </Typography>
                    </Box>
                    <ReadyBadge background="success200">
                        <Typography variant="pi" textColor="success700" fontWeight="medium">
                            Ready to Use
                        </Typography>
                    </ReadyBadge>
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
                                title: 'Check Dashboard',
                                description: 'View the health overview to see orphaned and duplicate collections',
                                color: 'primary600' as const
                            },
                            {
                                step: '2',
                                title: 'Scan for Issues',
                                description: 'Click "🔍 Scan for Issues" to force refresh and get latest health data',
                                color: 'warning600' as const
                            },
                            {
                                step: '3',
                                title: 'Review Problems',
                                description: 'Click "⚠️ Show Issues" to see detailed information about problem collections',
                                color: 'danger600' as const
                            },
                            {
                                step: '4',
                                title: 'Take Action',
                                description: 'Use "📝 Edit Collection" or "📋 Manage Collections" to fix issues',
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

            {/* Understanding Health Issues */}
            <SectionContainer>
                <Grid.Root gap={6}>
                    {/* Orphaned Collections Guide */}
                    <Grid.Item col={6}>
                        <InfoCard background="warning100">
                            <Box marginBottom={4}>
                                <Typography variant="gamma" textColor="warning700" fontWeight="semiBold">
                                    ⚠️ Understanding Orphaned Collections
                                </Typography>
                            </Box>

                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="warning700" fontWeight="medium">
                                    What are orphaned collections?
                                </Typography>
                            </Box>

                            <Box marginLeft={2} marginBottom={3}>
                                <Box marginBottom={2}>
                                    <Typography variant="pi" textColor="warning700">
                                        • <strong>Empty Collections:</strong> Collections with no articles attached
                                    </Typography>
                                </Box>
                                <Box marginBottom={2}>
                                    <Typography variant="pi" textColor="warning700">
                                        • <strong>Broken References:</strong> Collections pointing to deleted articles
                                    </Typography>
                                </Box>
                            </Box>

                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="warning700" fontWeight="medium">
                                    Why fix them?
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="pi" textColor="warning700" style={{ lineHeight: '1.5' }}>
                                    Orphaned collections clutter your content management system and can confuse
                                    content editors. Regular cleanup maintains a professional, organized platform.
                                </Typography>
                            </Box>
                        </InfoCard>
                    </Grid.Item>

                    {/* Duplicate Collections Guide */}
                    <Grid.Item col={6}>
                        <Box background="secondary100" padding="3rem" borderRadius="12px" height="100%">
                            <Box marginBottom={4}>
                                <Typography variant="gamma" textColor="secondary700" fontWeight="semiBold">
                                    📂 Understanding Duplicate Collections
                                </Typography>
                            </Box>

                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="secondary700" fontWeight="medium">
                                    What are duplicate collections?
                                </Typography>
                            </Box>

                            <Box marginLeft={2} marginBottom={3}>
                                <Box marginBottom={2}>
                                    <Typography variant="pi" textColor="secondary700">
                                        • <strong>Exact Duplicates:</strong> Multiple collections with identical article sets
                                    </Typography>
                                </Box>
                                <Box marginBottom={2}>
                                    <Typography variant="pi" textColor="secondary700">
                                        • <strong>Fingerprint Detection:</strong> Uses sorted article IDs for precise matching
                                    </Typography>
                                </Box>
                            </Box>

                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="secondary700" fontWeight="medium">
                                    Why consolidate them?
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="pi" textColor="secondary700" style={{ lineHeight: '1.5' }}>
                                    Duplicate collections create confusion for content consumers and make content
                                    management inefficient. Consolidating improves content organization and user experience.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid.Item>
                </Grid.Root>
            </SectionContainer>

            {/* Best Practices */}
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
                                        ✅ Do This:
                                    </Typography>
                                </Box>
                                <Box marginLeft={2}>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Use the auto-fill button for consistent collection creation
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Check the dashboard weekly for health issues
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Consolidate duplicates as soon as they're detected
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
                                        ❌ Avoid This:
                                    </Typography>
                                </Box>
                                <Box marginLeft={2}>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Creating collections manually without checking for duplicates
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Leaving orphaned collections for extended periods
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={2}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Ignoring health score warnings in the dashboard
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Creating multiple collections with identical article sets
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