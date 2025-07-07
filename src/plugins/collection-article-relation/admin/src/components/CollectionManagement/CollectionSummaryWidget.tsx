// src/plugins/collection-article-relation/admin/src/components/OrphanManagement/CollectionSummaryWidget.tsx
// Enhanced version with duplicate detection support and unified health monitoring

import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Flex,
    Badge,
    Button,
    Loader
} from '@strapi/design-system';
import { WarningCircle, Database, CheckCircle, ChartCircle } from '@strapi/icons';
import styled from 'styled-components';
import { useCombinedHealth } from '../../hooks/useCollectionManagement';
import CollectionQuickActions from './CollectionQuickActions';
import {
    StatsCard,
    InsightCard,
    MetricNumber,
    ProgressRing,
    MetricText
} from '../shared/StyledComponents';


const CollectionSummaryWidget: React.FC = () => {
    const { healthStats, loading, error, refetch, forceRefresh } = useCombinedHealth();

    if (loading) {
        return (
            <Box
                background="neutral0"
                padding="2rem"
                borderRadius="12px"
                borderColor="neutral200"
                borderWidth="1px"
                textAlign="center"
            >
                <Loader>Loading collection health statistics...</Loader>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                background="danger100"
                padding="2rem"
                borderRadius="12px"
                borderColor="danger200"
                borderWidth="1px"
            >
                <Flex direction="column" alignItems="center" gap={3}>
                    <WarningCircle color="danger600" width="3rem" height="3rem" />
                    <Box>
                        <Typography variant="omega" textColor="danger700" textAlign="center">
                            Error loading health statistics: {error}
                        </Typography>
                    </Box>
                    <Button variant="secondary" onClick={refetch} size="S">
                        Retry
                    </Button>
                </Flex>
            </Box>
        );
    }

    if (!healthStats) {
        return null;
    }

    // Safe calculation with fallbacks to prevent NaN
    const safeStats = {
        totalCollections: healthStats.totalCollections || 0,
        orphanedCollections: healthStats.orphanedCollections || 0,
        duplicateCollections: healthStats.duplicateCollections || 0,
        healthyCollections: healthStats.healthyCollections || 0,
        singleArticleCollections: healthStats.singleArticleCollections || 0,
        emptyCollections: healthStats.emptyCollections || 0,
        brokenReferenceCollections: healthStats.brokenReferenceCollections || 0,
        duplicateGroups: healthStats.duplicateGroups || 0,
        healthScore: healthStats.healthScore || 100
    };

    const totalIssues = safeStats.orphanedCollections + safeStats.duplicateCollections;
    const collectionsWithContent = safeStats.totalCollections - safeStats.orphanedCollections;

    const multiArticlePercentage = safeStats.totalCollections > 0
        ? Math.round((safeStats.healthyCollections / safeStats.totalCollections) * 100)
        : 0;

    const singleArticlePercentage = safeStats.totalCollections > 0
        ? Math.round((safeStats.singleArticleCollections / safeStats.totalCollections) * 100)
        : 0;

    // Color functions based on health status
    const getHealthColor = (score: number) => {
        if (score >= 90) return '#28a745'; // Excellent health
        if (score >= 70) return '#ffc107'; // Good health
        if (score >= 50) return '#fd7e14'; // Moderate issues
        return '#dc3545'; // Poor health - needs attention
    };

    // Enhanced system status message
    const getSystemStatus = () => {
        if (totalIssues === 0) {
            return "System is healthy - no issues detected";
        } else if (totalIssues === 1) {
            return "1 collection needs attention";
        } else {
            const orphanText = safeStats.orphanedCollections > 0 ? `${safeStats.orphanedCollections} orphaned` : '';
            const duplicateText = safeStats.duplicateCollections > 0 ? `${safeStats.duplicateCollections} duplicated` : '';
            const parts = [orphanText, duplicateText].filter(Boolean);
            return `${totalIssues} collections need attention (${parts.join(', ')})`;
        }
    };

    // Debug logging for troubleshooting
    console.log('[CollectionSummaryWidget] Debug stats:', {
        rawStats: healthStats,
        safeStats,
        totalIssues,
        multiArticlePercentage,
        singleArticlePercentage,
        collectionsWithContent
    });

    return (
        <Box
            background="neutral0"
            padding="2rem"
            borderRadius="12px"
            borderColor="neutral200"
            borderWidth="1px"
            marginBottom="2rem"
        >
            {/* Enhanced Header with Combined Status */}
            <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={4}>
                <Box>
                    <Box marginBottom={2}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            📊 Collection Health Overview
                        </Typography>
                    </Box>
                    <Box marginBottom={2}>
                        <Typography variant="omega" textColor="neutral600" marginTop={1}>
                            {getSystemStatus()}
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Badge
                        backgroundColor={totalIssues === 0 ? 'success100' : 'warning100'}
                        textColor={totalIssues === 0 ? 'success700' : 'warning700'}
                    >
                        {totalIssues === 0 ? 'All Healthy' : `${totalIssues} Issues`}
                    </Badge>
                </Box>
            </Flex>

            {/* Enhanced Main Stats Grid - 4 Key Metrics */}
            <Grid.Root gap={4} marginBottom={4}>
                {/* Combined Health Score */}
                <Grid.Item col={3}>
                    <StatsCard background="neutral100">
                        <ProgressRing $percentage={safeStats.healthScore} $color={getHealthColor(safeStats.healthScore)}>
                            <MetricText variant="omega">
                                {safeStats.healthScore}%
                            </MetricText>
                        </ProgressRing>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Health Score
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="pi" textColor="neutral600">
                                Combined health metric
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Orphaned Collections */}
                <Grid.Item col={3}>
                    <StatsCard background={safeStats.orphanedCollections > 0 ? "danger100" : "success100"}>
                        <MetricNumber>
                            <Typography variant="alpha" textColor={safeStats.orphanedCollections > 0 ? "danger700" : "success700"}>
                                {safeStats.orphanedCollections}
                            </Typography>
                        </MetricNumber>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor={safeStats.orphanedCollections > 0 ? "danger700" : "success700"}>
                                Orphaned Collections
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor={safeStats.orphanedCollections > 0 ? "danger600" : "success600"}>
                                {safeStats.orphanedCollections > 0 ? "Need attention" : "None found"}
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Duplicate Collections */}
                <Grid.Item col={3}>
                    <StatsCard background={safeStats.duplicateCollections > 0 ? "warning100" : "success100"}>
                        <MetricNumber>
                            <Typography variant="alpha" textColor={safeStats.duplicateCollections > 0 ? "warning700" : "success700"}>
                                {safeStats.duplicateCollections}
                            </Typography>
                        </MetricNumber>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor={safeStats.duplicateCollections > 0 ? "warning700" : "success700"}>
                                Duplicate Collections
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor={safeStats.duplicateCollections > 0 ? "warning600" : "success600"}>
                                {safeStats.duplicateGroups > 0 ? `${safeStats.duplicateGroups} groups` : "None found"}
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Collection Types */}
                <Grid.Item col={3}>
                    <StatsCard background="primary100">
                        <MetricNumber>
                            <Typography variant="alpha" textColor="primary700">
                                {safeStats.totalCollections}
                            </Typography>
                        </MetricNumber>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="primary700">
                                Total Collections
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor="primary600">
                                {collectionsWithContent} with content
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>
            </Grid.Root>

            {/* Enhanced Insights Section - Combined Health Analysis */}
            <Box marginBottom={4}>
                <Box marginBottom={3}>
                    <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                        📈 Health Analysis
                    </Typography>
                </Box>
                <Grid.Root gap={3}>
                    <Grid.Item col={4}>
                        <InsightCard background="neutral0" borderColor="neutral200" borderWidth="1px">
                            <Flex alignItems="center" gap={2} marginBottom={2}>
                                <ChartCircle color="primary600" width="1.5rem" height="1.5rem" />
                                <Box>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                        Content Distribution
                                    </Typography>
                                </Box>
                            </Flex>
                            <Box marginBottom={2}>
                                <Typography variant="pi" textColor="neutral600">
                                    {safeStats.healthyCollections} multi-article ({multiArticlePercentage}%)
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral500">
                                    {safeStats.singleArticleCollections} single-article ({singleArticlePercentage}%)
                                </Typography>
                            </Box>
                        </InsightCard>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <InsightCard background="neutral0" borderColor="neutral200" borderWidth="1px">
                            <Flex alignItems="center" gap={2} marginBottom={2}>
                                <Database color={totalIssues > 0 ? "warning600" : "success600"} width="1.5rem" height="1.5rem" />
                                <Box>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                        Issue Summary
                                    </Typography>
                                </Box>
                            </Flex>
                            <Box marginBottom={2}>
                                <Typography variant="pi" textColor="neutral600">
                                    {safeStats.orphanedCollections} orphaned, {safeStats.duplicateCollections} duplicated
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral500">
                                    {totalIssues === 0 ? "System is clean" : `${totalIssues} total issues`}
                                </Typography>
                            </Box>
                        </InsightCard>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <InsightCard background="neutral0" borderColor="neutral200" borderWidth="1px">
                            <Flex alignItems="center" gap={2} marginBottom={2}>
                                <CheckCircle color="success600" width="1.5rem" height="1.5rem" />
                                <Box>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                        System Health
                                    </Typography>
                                </Box>
                            </Flex>
                            <Box marginBottom={2}>
                                <Typography variant="pi" textColor="neutral600">
                                    {safeStats.healthScore}% overall health score
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral500">
                                    {safeStats.healthScore >= 90 ? "Excellent" :
                                        safeStats.healthScore >= 70 ? "Good" :
                                            safeStats.healthScore >= 50 ? "Moderate" : "Needs attention"}
                                </Typography>
                            </Box>
                        </InsightCard>
                    </Grid.Item>
                </Grid.Root>
            </Box>

            {/* Enhanced Quick Actions - Now includes duplicate detection */}
            <CollectionQuickActions
                healthStats={healthStats}
                onRefreshStats={refetch}
                onForceRefresh={forceRefresh}
            />
        </Box>
    );
};

export default CollectionSummaryWidget;