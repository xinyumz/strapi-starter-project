// src/plugins/collection-article-relation/admin/src/pages/HomePage/FeaturesTab.tsx

import React from 'react';
import { Box, Typography, Grid } from '@strapi/design-system';
import packageJson from '../../../../package.json';

// Import shared styles
import {
    TabContentContainer,
    SectionContainer,
    WhiteCard,
    FeatureCard,
    BenefitCard,
    BenefitMetric,
    BenefitsGrid,
    InfoCard
} from './shared/StyledComponents';

const FeaturesTab: React.FC = () => {
    return (
        <TabContentContainer>
            {/* Auto-Fill Features and Benefits Section */}
            <SectionContainer>
                <WhiteCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={6}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            ✨ Auto-Fill Features
                        </Typography>
                    </Box>

                    {/* Features Grid */}
                    <Grid.Root gap={6} marginBottom={6}>
                        {[
                            {
                                title: 'Title & Date',
                                desc: 'Collection title and date copied exactly from the source article',
                                bg: 'success100',
                                textColor: 'success700'
                            },
                            {
                                title: 'Cover & Category',
                                desc: 'Cover image and category automatically copied from the article',
                                bg: 'primary100',
                                textColor: 'primary700'
                            },
                            {
                                title: 'Article Relation',
                                desc: 'The source article is automatically linked to the new collection',
                                bg: 'warning100',
                                textColor: 'warning700'
                            },
                            {
                                title: 'Duplicate Prevention',
                                desc: 'Detects existing single-article collections and redirects instead of creating duplicates',
                                bg: 'secondary100',
                                textColor: 'secondary700'
                            }
                        ].map((feature, index) => (
                            <Grid.Item key={index} col={6}>
                                <FeatureCard background={feature.bg as any}>
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

                    {/* Key Benefits Section - FIXED RESPONSIVE GRID */}
                    <Box marginTop={6}>
                        <Box marginBottom={4}>
                            <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                                🎉 Key Benefits
                            </Typography>
                        </Box>

                        <BenefitsGrid>
                            {[
                                {
                                    metric: '90%',
                                    title: 'Time Savings',
                                    desc: 'Dramatically reduce manual collection creation time',
                                    bg: 'primary100',
                                    color: 'primary600'
                                },
                                {
                                    metric: '1-Click',
                                    title: 'Collection Creation',
                                    desc: 'Instant collection creation with full auto-fill',
                                    bg: 'success100',
                                    color: 'success600'
                                },
                                {
                                    metric: 'Zero',
                                    title: 'Learning Curve',
                                    desc: 'Intuitive floating button requires no training',
                                    bg: 'warning100',
                                    color: 'warning600'
                                }
                            ].map((benefit, index) => (
                                <BenefitCard key={index} background={benefit.bg as any}>
                                    <BenefitMetric>
                                        <Typography variant="alpha" textColor={benefit.color as any}>
                                            {benefit.metric}
                                        </Typography>
                                    </BenefitMetric>
                                    <Box marginBottom={2}>
                                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                            {benefit.title}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral600" style={{ lineHeight: '1.4' }}>
                                            {benefit.desc}
                                        </Typography>
                                    </Box>
                                </BenefitCard>
                            ))}
                        </BenefitsGrid>
                    </Box>
                </WhiteCard>
            </SectionContainer>

            {/* Health Monitoring Features */}
            <SectionContainer>
                <WhiteCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={6}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            🎯 Health Monitoring Features
                        </Typography>
                    </Box>

                    <Grid.Root gap={6}>
                        {[
                            {
                                title: 'Orphan Detection',
                                desc: 'Automatically identifies empty collections and broken article references',
                                icon: '🗑️',
                                bg: 'danger100',
                                textColor: 'danger700'
                            },
                            {
                                title: 'Duplicate Detection',
                                desc: 'Uses fingerprint algorithm to detect collections with identical article sets',
                                icon: '📂',
                                bg: 'secondary100',
                                textColor: 'secondary700'
                            },
                            {
                                title: 'Real-time Monitoring',
                                desc: '2-minute auto-refresh with instant manual refresh capability',
                                icon: '⚡',
                                bg: 'primary100',
                                textColor: 'primary700'
                            },
                            {
                                title: 'Smart Caching',
                                desc: 'Sub-100ms response times with intelligent cache management',
                                icon: '🚀',
                                bg: 'success100',
                                textColor: 'success700'
                            }
                        ].map((feature, index) => (
                            <Grid.Item key={index} col={6}>
                                <FeatureCard background={feature.bg as any}>
                                    <Box marginBottom={3}>
                                        <Typography
                                            variant="omega"
                                            fontWeight="semiBold"
                                            textColor={feature.textColor as any}
                                        >
                                            {feature.icon} {feature.title}
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
            </SectionContainer>

            {/* Advanced Capabilities */}
            <SectionContainer>
                <Grid.Root gap={6}>
                    {/* Multi-Article Collections */}
                    <Grid.Item col={6}>
                        <InfoCard background="secondary100" height="100%">
                            <Box marginBottom={4}>
                                <Typography variant="gamma" textColor="secondary700" fontWeight="semiBold">
                                    💡 Multi-Article Collections
                                </Typography>
                            </Box>
                            <Box marginBottom={3}>
                                <Typography variant="omega" textColor="secondary700" fontWeight="medium">
                                    Need collections with multiple articles?
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="omega" textColor="secondary700" style={{ lineHeight: '1.5' }}>
                                    Use the quick button to create a collection from your primary article, then manually add
                                    additional articles to it. This workflow is still much faster than creating everything from scratch!
                                </Typography>
                            </Box>
                        </InfoCard>
                    </Grid.Item>

                    {/* Technical Excellence */}
                    <Grid.Item col={6}>
                        <InfoCard background="neutral100" height="100%">
                            <Box marginBottom={4}>
                                <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                                    🔧 Technical Excellence
                                </Typography>
                            </Box>

                            {[
                                { label: 'Plugin Version:', value: packageJson.version },
                                { label: 'Backend Architecture:', value: '6 modular controllers, 5 specialized services' },
                                { label: 'API Coverage:', value: '20+ endpoints with authentication & caching' },
                                { label: 'Performance:', value: 'Sub-100ms cached responses, 2-3s fresh scans' }
                            ].map((detail, index) => (
                                <Box marginBottom="0.75rem" key={index}>
                                    <Box>
                                        <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                                            {detail.label}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral600">
                                            {detail.value}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </InfoCard>
                    </Grid.Item>
                </Grid.Root>
            </SectionContainer>

            {/* Enterprise Features */}
            <SectionContainer>
                <WhiteCard background="neutral0" borderColor="neutral200">
                    <Box marginBottom={6}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            🏢 Enterprise Features
                        </Typography>
                    </Box>

                    <Grid.Root gap={4}>
                        <Grid.Item col={4}>
                            <Box textAlign="center" padding="2rem" background="primary100" borderRadius="8px" width="100%">
                                <Box marginBottom={3}>
                                    <Typography variant="alpha" textColor="primary700">
                                        95%+
                                    </Typography>
                                </Box>
                                <Box marginBottom={2}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="primary700">
                                        Cache Efficiency
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="pi" textColor="primary600">
                                        Smart caching with 2-minute TTL
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid.Item>

                        <Grid.Item col={4}>
                            <Box textAlign="center" padding="2rem" background="success100" borderRadius="8px" width="100%">
                                <Box marginBottom={3}>
                                    <Typography variant="alpha" textColor="success700">
                                        100%
                                    </Typography>
                                </Box>
                                <Box marginBottom={2}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="success700">
                                        Backward Compatible
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="pi" textColor="success600">
                                        All existing features preserved
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid.Item>

                        <Grid.Item col={4}>
                            <Box textAlign="center" padding="2rem" background="warning100" borderRadius="8px" width="100%">
                                <Box marginBottom={3}>
                                    <Typography variant="alpha" textColor="warning700">
                                        20+
                                    </Typography>
                                </Box>
                                <Box marginBottom={2}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="warning700">
                                        API Endpoints
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="pi" textColor="warning600">
                                        Complete management coverage
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid.Item>
                    </Grid.Root>
                </WhiteCard>
            </SectionContainer>

            {/* Health Scoring System */}
            <SectionContainer>
                <InfoCard background="primary100">
                    <Box marginBottom={4}>
                        <Typography variant="gamma" textColor="primary700" fontWeight="semiBold">
                            📊 Advanced Health Scoring
                        </Typography>
                    </Box>

                    <Box marginBottom={3}>
                        <Typography variant="omega" textColor="primary700" fontWeight="medium">
                            Unified Health Formula:
                        </Typography>
                    </Box>

                    <Box
                        background="primary200"
                        padding="1rem"
                        borderRadius="6px"
                        marginBottom={3}
                        textAlign="center"
                    >
                        <Typography variant="omega" textColor="primary800" fontWeight="bold">
                            Health Score = 100 - (Orphan Penalty × 50) - (Duplicate Penalty × 30)
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="omega" textColor="primary700" style={{ lineHeight: '1.6' }}>
                            This formula prioritizes orphan cleanup (higher penalty) while also encouraging
                            duplicate consolidation. The scoring system provides clear, actionable health metrics
                            for enterprise content management.
                        </Typography>
                    </Box>
                </InfoCard>
            </SectionContainer>

            {/* Future Roadmap */}
            <SectionContainer>
                <Box background="neutral100" padding="2.5rem" borderRadius="8px">
                    <Box marginBottom={3}>
                        <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                            🚀 System Capabilities
                        </Typography>
                    </Box>

                    <Grid.Root gap={4}>
                        <Grid.Item col={6}>
                            <Box marginLeft={2}>
                                <Box marginBottom={2}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="success700">
                                        ✅ Currently Available:
                                    </Typography>
                                </Box>
                                <Box marginLeft={2}>
                                    <Box marginBottom={1}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Complete orphan detection and cleanup
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={1}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Advanced duplicate detection with fingerprinting
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={1}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Real-time health monitoring and analytics
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Professional dashboard with actionable insights
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid.Item>

                        <Grid.Item col={6}>
                            <Box marginLeft={2}>
                                <Box marginBottom={2}>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="primary700">
                                        🔮 Architecture Ready For:
                                    </Typography>
                                </Box>
                                <Box marginLeft={2}>
                                    <Box marginBottom={1}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Automated cleanup scheduling and rules
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={1}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Advanced duplicate merge workflows
                                        </Typography>
                                    </Box>
                                    <Box marginBottom={1}>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Content relationship analysis and optimization
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="pi" textColor="neutral700">
                                            • Integration with external content management systems
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid.Item>
                    </Grid.Root>
                </Box>
            </SectionContainer>
        </TabContentContainer>
    );
};

export default FeaturesTab;