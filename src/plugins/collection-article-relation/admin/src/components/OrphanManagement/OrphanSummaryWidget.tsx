// src/plugins/collection-article-relation/admin/src/components/OrphanManagement/OrphanSummaryWidget.tsx
// Simplified main widget - delegates Quick Actions to separate component

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
import { useOrphanStats } from '../../hooks/useOrphanManagement';
import OrphanQuickActions from './OrphanQuickActions';

const StatsCard = styled(Box)`
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  cursor: default;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const InsightCard = styled(Box)`
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  cursor: default;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const MetricNumber = styled(Box)`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const ProgressRing = styled(Box) <{ $percentage: number; $color: string; $backgroundColor?: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.$color} ${props => props.$percentage * 3.6}deg,
    ${props => props.$backgroundColor || '#e9ecef'} 0deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  
  &::before {
    content: '';
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: white;
    position: absolute;
  }
`;

const MetricText = styled(Typography)`
  position: relative;
  z-index: 1;
  font-weight: bold;
`;

const OrphanSummaryWidget: React.FC = () => {
    const { stats, loading, error, refetch, forceRefresh } = useOrphanStats();

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
                <Loader>Loading orphan statistics...</Loader>
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
                            Error loading orphan statistics: {error}
                        </Typography>
                    </Box>
                    <Button variant="secondary" onClick={refetch} size="S">
                        Retry
                    </Button>
                </Flex>
            </Box>
        );
    }

    if (!stats) {
        return null;
    }

    // Safe calculation with fallbacks to prevent NaN
    const safeStats = {
        totalCollections: stats.totalCollections || 0,
        orphanedCollections: stats.orphanedCollections || 0,
        healthyCollections: stats.healthyCollections || 0,
        singleArticleCollections: stats.singleArticleCollections || 0,
        emptyCollections: stats.emptyCollections || 0,
        brokenReferenceCollections: stats.brokenReferenceCollections || 0
    };

    // Calculate health score: 100% if no orphaned collections
    const healthScore = safeStats.totalCollections > 0
        ? Math.round(((safeStats.totalCollections - safeStats.orphanedCollections) / safeStats.totalCollections) * 100)
        : 100;

    const multiArticlePercentage = safeStats.totalCollections > 0
        ? Math.round((safeStats.healthyCollections / safeStats.totalCollections) * 100)
        : 0;

    const singleArticlePercentage = safeStats.totalCollections > 0
        ? Math.round((safeStats.singleArticleCollections / safeStats.totalCollections) * 100)
        : 0;

    const collectionsWithContent = safeStats.totalCollections - safeStats.orphanedCollections;

    // Color functions based on orphan status
    const getHealthColor = (score: number) => {
        if (score >= 100) return '#28a745'; // Perfect - no orphans
        if (score >= 90) return '#ffc107';  // Good - few orphans
        return '#dc3545'; // Needs attention - many orphans
    };

    const getHealthTextColor = (score: number) => {
        if (score >= 100) return 'success600';
        if (score >= 90) return 'warning600';
        return 'danger600';
    };

    // System status message
    const getSystemStatus = () => {
        if (safeStats.orphanedCollections === 0) {
            return "System is clean - no orphans detected";
        } else if (safeStats.orphanedCollections === 1) {
            return "1 orphaned collection detected";
        } else {
            return `${safeStats.orphanedCollections} orphaned collections detected`;
        }
    };

    // Debug logging for troubleshooting
    console.log('[OrphanSummaryWidget] Debug stats:', {
        rawStats: stats,
        safeStats,
        healthScore,
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
            {/* Header */}
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
                        backgroundColor={safeStats.orphanedCollections === 0 ? 'success100' : 'danger100'}
                        textColor={safeStats.orphanedCollections === 0 ? 'success700' : 'danger700'}
                    >
                        {safeStats.orphanedCollections === 0 ? 'All Clean' : `${safeStats.orphanedCollections} Orphaned`}
                    </Badge>
                </Box>
            </Flex>

            {/* Main Stats Grid */}
            <Grid.Root gap={4} marginBottom={4}>
                {/* Health Score */}
                <Grid.Item col={3}>
                    <StatsCard background="neutral100">
                        <ProgressRing $percentage={healthScore} $color={getHealthColor(healthScore)}>
                            <MetricText variant="omega" textColor={getHealthTextColor(healthScore)}>
                                {healthScore}%
                            </MetricText>
                        </ProgressRing>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Health Score
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="pi" textColor="neutral600">
                                Collections with content
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

                {/* Multi-Article Collections */}
                <Grid.Item col={3}>
                    <StatsCard background="primary100">
                        <MetricNumber>
                            <Typography variant="alpha" textColor="primary700">
                                {safeStats.healthyCollections}
                            </Typography>
                        </MetricNumber>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="primary700">
                                Multi-Article Collections
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor="primary600">
                                {multiArticlePercentage}% of total collections
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Single Article Collections */}
                <Grid.Item col={3}>
                    <StatsCard background="neutral100">
                        <MetricNumber>
                            <Typography variant="alpha" textColor="neutral700">
                                {safeStats.singleArticleCollections}
                            </Typography>
                        </MetricNumber>

                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral700">
                                Single Article Collections
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor="neutral600">
                                {singleArticlePercentage}% of total collections
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>
            </Grid.Root>

            {/* Enhanced Insights Section - Refocused on orphan detection */}
            <Box marginBottom={4}>
                <Box marginBottom={3}>
                    <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                        📈 Key Insights
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
                                    {collectionsWithContent} collections have content
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral500">
                                    {safeStats.healthyCollections} multi-article, {safeStats.singleArticleCollections} single-article
                                </Typography>
                            </Box>
                        </InsightCard>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <InsightCard background="neutral0" borderColor="neutral200" borderWidth="1px">
                            <Flex alignItems="center" gap={2} marginBottom={2}>
                                <Database color={safeStats.orphanedCollections > 0 ? "danger600" : "success600"} width="1.5rem" height="1.5rem" />
                                <Box>
                                    <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                        Orphan Status
                                    </Typography>
                                </Box>
                            </Flex>
                            <Box marginBottom={2}>
                                <Typography variant="pi" textColor="neutral600">
                                    {safeStats.orphanedCollections === 0 ? "No orphaned collections" : `${safeStats.orphanedCollections} collections need attention`}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral500">
                                    {safeStats.orphanedCollections === 0 ? "All collections have articles" : "Some collections are empty"}
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
                                    {safeStats.totalCollections} total collections
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral500">
                                    {healthScore}% health score
                                </Typography>
                            </Box>
                        </InsightCard>
                    </Grid.Item>
                </Grid.Root>
            </Box>

            {/* Quick Actions - Delegated to separate component */}
            <OrphanQuickActions
                stats={stats}
                onRefreshStats={refetch}
                onForceRefresh={forceRefresh}
            />
        </Box>
    );
};

export default OrphanSummaryWidget;