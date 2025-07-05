// src/plugins/collection-article-relation/admin/src/components/OrphanManagement/OrphanSummaryWidget.tsx

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
import { WarningCircle } from '@strapi/icons';
import styled from 'styled-components';
import { useOrphanStats } from '../../hooks/useOrphanManagement';

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

const MetricNumber = styled(Box)`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
`;

// Visual progress ring for any metric
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

// Progress bar for smaller metrics
const ProgressBar = styled(Box)`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ProgressBarFill = styled(Box) <{ $percentage: number; $color: string }>`
  width: ${props => props.$percentage}%;
  height: 100%;
  background-color: ${props => props.$color};
  transition: width 0.3s ease;
  border-radius: 3px;
`;

const MetricText = styled(Typography)`
  position: relative;
  z-index: 1;
  font-weight: bold;
`;

const QuickActionButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

interface OrphanSummaryWidgetProps {
    onDetectOrphans?: () => void;
    onViewAnalytics?: () => void;
    onOpenDashboard?: () => void;
}

const OrphanSummaryWidget: React.FC<OrphanSummaryWidgetProps> = ({
    onDetectOrphans,
    onViewAnalytics,
    onOpenDashboard
}) => {
    const { stats, loading, error, refetch } = useOrphanStats();

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
                    <Typography variant="omega" textColor="danger700" textAlign="center">
                        Error loading orphan statistics: {error}
                    </Typography>
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

    // Calculate percentages and health metrics
    const healthScore = stats.totalCollections > 0
        ? Math.round((stats.healthyCollections / stats.totalCollections) * 100)
        : 100;

    const healthyPercentage = stats.totalCollections > 0
        ? Math.round((stats.healthyCollections / stats.totalCollections) * 100)
        : 0;

    const singleArticlePercentage = stats.totalCollections > 0
        ? Math.round((stats.singleArticleCollections / stats.totalCollections) * 100)
        : 0;

    // Target: ideally 50% of collections should be multi-article
    const targetHealthyCollections = Math.ceil(stats.totalCollections * 0.5);
    const healthyProgress = stats.totalCollections > 0
        ? Math.min(100, (stats.healthyCollections / targetHealthyCollections) * 100)
        : 0;

    // Color functions
    const getHealthColor = (score: number) => {
        if (score >= 90) return '#28a745';
        if (score >= 70) return '#ffc107';
        return '#dc3545';
    };

    const getHealthTextColor = (score: number) => {
        if (score >= 90) return 'success600';
        if (score >= 70) return 'warning600';
        return 'danger600';
    };

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
                            Real-time system monitoring and orphan detection
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Badge
                        backgroundColor={stats.orphanedCollections === 0 ? 'success100' : 'warning100'}
                        textColor={stats.orphanedCollections === 0 ? 'success700' : 'warning700'}
                    >
                        {stats.orphanedCollections === 0 ? 'All Healthy' : `${stats.orphanedCollections} Issues`}
                    </Badge>
                </Box>
            </Flex>

            {/* Main Stats Grid */}
            <Grid.Root gap={4} marginBottom={4}>
                {/* System Health Score */}
                <Grid.Item col={3}>
                    <StatsCard background="neutral100">
                        <ProgressRing $percentage={healthScore} $color={getHealthColor(healthScore)}>
                            <MetricText variant="omega" textColor={getHealthTextColor(healthScore)}>
                                {healthScore}%
                            </MetricText>
                        </ProgressRing>

                        <Box>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                System Health
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="pi" textColor="neutral600">
                                Overall collection integrity
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Total Collections */}
                <Grid.Item col={3}>
                    <StatsCard background="primary100" height='100%' width='100%'>
                        <MetricNumber>
                            <Typography variant="alpha" textColor="primary700">
                                {stats.totalCollections}
                            </Typography>
                        </MetricNumber>

                        <Box>
                            <Typography variant="omega" fontWeight="semiBold" textColor="primary700">
                                Total Collections
                            </Typography>
                        </Box>

                        <ProgressBar>
                            <ProgressBarFill
                                $percentage={Math.min(100, (stats.totalCollections / 15) * 100)}
                                $color="#4945ff"
                            />
                        </ProgressBar>

                        <Box>
                            <Typography variant="pi" textColor="primary600">
                                Goal: 15 collections
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Healthy Collections */}
                <Grid.Item col={3}>
                    <StatsCard background="success100">
                        <ProgressRing
                            $percentage={healthyProgress}
                            $color="#28a745"
                            $backgroundColor="rgba(40, 167, 69, 0.2)"
                        >
                            <MetricText variant="omega" textColor="success600">
                                {stats.healthyCollections}
                            </MetricText>
                        </ProgressRing>

                        <Box>
                            <Typography variant="omega" fontWeight="semiBold" textColor="success700">
                                Healthy Collections
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor="success600">
                                {healthyPercentage}% of total collections
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>

                {/* Single Article Collections */}
                <Grid.Item col={3}>
                    <StatsCard background="warning100">
                        <ProgressRing
                            $percentage={singleArticlePercentage}
                            $color="#ffc107"
                            $backgroundColor="rgba(255, 193, 7, 0.2)"
                        >
                            <MetricText variant="omega" textColor="warning600">
                                {stats.singleArticleCollections}
                            </MetricText>
                        </ProgressRing>

                        <Box>
                            <Typography variant="omega" fontWeight="semiBold" textColor="warning700">
                                Single Article
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="pi" textColor="warning600">
                                {singleArticlePercentage}% need optimization
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid.Item>
            </Grid.Root>

            {/* Enhanced Insights Section */}
            <Box marginBottom={4}>
                <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold" marginBottom={3}>
                    📈 Key Insights
                </Typography>
                <Grid.Root gap={3}>
                    <Grid.Item col={4}>
                        <Box background="neutral50" padding="1rem" borderRadius="8px" textAlign="center">
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Content Distribution
                            </Typography>
                            <Typography variant="pi" textColor="neutral600">
                                {healthyPercentage}% healthy, {singleArticlePercentage}% single-article
                            </Typography>
                        </Box>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <Box background="neutral50" padding="1rem" borderRadius="8px" textAlign="center">
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Optimization Potential
                            </Typography>
                            <Typography variant="pi" textColor="neutral600">
                                {stats.singleArticleCollections} collections can be improved
                            </Typography>
                        </Box>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <Box background="neutral50" padding="1rem" borderRadius="8px" textAlign="center">
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Content Goal
                            </Typography>
                            <Typography variant="pi" textColor="neutral600">
                                {15 - stats.totalCollections} more collections to reach target
                            </Typography>
                        </Box>
                    </Grid.Item>
                </Grid.Root>
            </Box>

            {/* Quick Actions */}
            <Box>
                <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold" marginBottom={3}>
                    🚀 Quick Actions
                </Typography>
                <Grid.Root gap={3}>
                    <Grid.Item col={4}>
                        <QuickActionButton
                            variant="secondary"
                            onClick={onDetectOrphans}
                            size="S"
                        >
                            🔍 Detect Orphans
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <QuickActionButton
                            variant="secondary"
                            onClick={onViewAnalytics}
                            size="S"
                        >
                            📊 View Analytics
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <QuickActionButton
                            variant="primary"
                            onClick={onOpenDashboard}
                            size="S"
                        >
                            🎯 Open Dashboard
                        </QuickActionButton>
                    </Grid.Item>
                </Grid.Root>
            </Box>
        </Box>
    );
};

export default OrphanSummaryWidget;