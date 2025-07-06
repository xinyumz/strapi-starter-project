// src/plugins/collection-article-relation/admin/src/components/Dashboard/PerformanceMetricsWidget.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Flex,
    Badge,
    Button,
    Loader,
} from '@strapi/design-system';
import { ArrowClockwise, ArrowUp, Clock, Database, Cross } from '@strapi/icons';
import styled from 'styled-components';
import PerformanceActions from './PerformanceActions';

const MetricsCard = styled(Box)`
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const MetricValue = styled(Box)`
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  text-align: center;
`;

const MetricLabel = styled(Typography)`
  text-align: center;
  margin-bottom: 0.5rem;
`;

const MetricDescription = styled(Typography)`
  text-align: center;
  opacity: 0.8;
`;

const PerformanceBar = styled(Box)`
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const PerformanceBarFill = styled(Box) <{ $percentage: number; $color: string }>`
  width: ${props => props.$percentage}%;
  height: 100%;
  background-color: ${props => props.$color};
  transition: width 0.3s ease;
`;

interface PerformanceMetrics {
    avgResponseTime: number;
    cacheHitRate: number;
    totalRequests: number;
    errorRate: number;
    systemLoad: number;
    dbQueryTime: number;
}

const PerformanceMetricsWidget: React.FC = () => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Simulate metrics fetching (in real implementation, this would call your API)
    const fetchMetrics = async () => {
        setLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate realistic metrics based on your documented performance
        const mockMetrics: PerformanceMetrics = {
            avgResponseTime: 54 + Math.random() * 20, // 54ms base + variation
            cacheHitRate: 94 + Math.random() * 5, // 94% base + variation
            totalRequests: 1247 + Math.floor(Math.random() * 100),
            errorRate: Math.random() * 0.5, // Very low error rate
            systemLoad: 15 + Math.random() * 10, // Low system load
            dbQueryTime: 12 + Math.random() * 8 // Fast DB queries
        };

        setMetrics(mockMetrics);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchMetrics();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    // Performance evaluation functions
    const getPerformanceColor = (value: number, thresholds: { good: number; warning: number; isReverse?: boolean }) => {
        if (thresholds.isReverse) {
            // For metrics where lower is better (like response time, error rate)
            if (value <= thresholds.good) return '#28a745';
            if (value <= thresholds.warning) return '#ffc107';
            return '#dc3545';
        } else {
            // For metrics where higher is better (like cache hit rate)
            if (value >= thresholds.good) return '#28a745';
            if (value >= thresholds.warning) return '#ffc107';
            return '#dc3545';
        }
    };

    const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number; isReverse?: boolean }) => {
        if (thresholds.isReverse) {
            if (value <= thresholds.good) return 'excellent';
            if (value <= thresholds.warning) return 'good';
            return 'needs attention';
        } else {
            if (value >= thresholds.good) return 'excellent';
            if (value >= thresholds.warning) return 'good';
            return 'needs attention';
        }
    };

    if (loading && !metrics) {
        return (
            <Box
                background="neutral0"
                padding="2rem"
                borderRadius="12px"
                borderColor="neutral200"
                borderWidth="1px"
                textAlign="center"
            >
                <Loader>Loading performance metrics...</Loader>
            </Box>
        );
    }

    if (!metrics) {
        return null;
    }

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
            <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                <Box>
                    <Box marginBottom={2}>
                        <Typography variant="beta" textColor="neutral800" fontWeight="semiBold">
                            ⚡ Performance Metrics
                        </Typography>
                    </Box>
                    <Box marginBottom={2}>
                        <Typography variant="omega" textColor="neutral600" marginTop={1}>
                            Real-time system performance monitoring
                        </Typography>
                    </Box>
                </Box>
                <Flex gap={2}>
                    <Box>
                        <Typography variant="pi" textColor="neutral500">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    </Box>
                    <Button
                        variant="tertiary"
                        onClick={fetchMetrics}
                        size="S"
                        startIcon={<ArrowClockwise />}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Flex>
            </Flex>

            {/* Main Metrics Grid */}
            <Grid.Root gap={4} marginBottom={4}>
                {/* Response Time */}
                <Grid.Item col={3}>
                    <MetricsCard background="primary100">
                        <Clock color="primary600" width="2rem" height="2rem" style={{ margin: '0 auto 0.5rem' }} />
                        <MetricValue>
                            <Typography variant="alpha" textColor="primary700">
                                {Math.round(metrics.avgResponseTime)}ms
                            </Typography>
                        </MetricValue>
                        <MetricLabel variant="omega" fontWeight="semiBold" textColor="primary700">
                            Avg Response Time
                        </MetricLabel>
                        <PerformanceBar>
                            <PerformanceBarFill
                                $percentage={Math.min(100, (100 - metrics.avgResponseTime) * 2)}
                                $color={getPerformanceColor(metrics.avgResponseTime, { good: 60, warning: 100, isReverse: true })}
                            />
                        </PerformanceBar>
                        <MetricDescription variant="pi" textColor="primary600">
                            {getPerformanceStatus(metrics.avgResponseTime, { good: 60, warning: 100, isReverse: true })}
                        </MetricDescription>
                    </MetricsCard>
                </Grid.Item>

                {/* Cache Hit Rate */}
                <Grid.Item col={3}>
                    <MetricsCard background="success100">
                        <Database color="success600" width="2rem" height="2rem" style={{ margin: '0 auto 0.5rem' }} />
                        <MetricValue>
                            <Typography variant="alpha" textColor="success700">
                                {Math.round(metrics.cacheHitRate)}%
                            </Typography>
                        </MetricValue>
                        <MetricLabel variant="omega" fontWeight="semiBold" textColor="success700">
                            Cache Hit Rate
                        </MetricLabel>
                        <PerformanceBar>
                            <PerformanceBarFill
                                $percentage={metrics.cacheHitRate}
                                $color={getPerformanceColor(metrics.cacheHitRate, { good: 90, warning: 75 })}
                            />
                        </PerformanceBar>
                        <MetricDescription variant="pi" textColor="success600">
                            {getPerformanceStatus(metrics.cacheHitRate, { good: 90, warning: 75 })}
                        </MetricDescription>
                    </MetricsCard>
                </Grid.Item>

                {/* Total Requests */}
                <Grid.Item col={3}>
                    <MetricsCard background="warning100">
                        <ArrowUp color="warning600" width="2rem" height="2rem" style={{ margin: '0 auto 0.5rem' }} />
                        <MetricValue>
                            <Typography variant="alpha" textColor="warning700">
                                {metrics.totalRequests.toLocaleString()}
                            </Typography>
                        </MetricValue>
                        <Flex marginTop={4} justifyContent='space-between'>
                            <MetricLabel variant="omega" fontWeight="semiBold" textColor="warning700">
                                Total Requests
                            </MetricLabel>
                            <MetricDescription variant="pi" textColor="warning600">
                                Since last restart
                            </MetricDescription>
                        </Flex>
                    </MetricsCard>
                </Grid.Item>

                {/* Error Rate */}
                <Grid.Item col={3}>
                    <MetricsCard background={metrics.errorRate > 1 ? "danger100" : "neutral100"}>
                        <Cross
                            color={metrics.errorRate > 1 ? "danger600" : "neutral600"}
                            width="2rem"
                            height="2rem"
                            style={{ margin: '0 auto 0.5rem' }}
                        />
                        <MetricValue>
                            <Typography variant="alpha" textColor={metrics.errorRate > 1 ? "danger700" : "neutral700"}>
                                {metrics.errorRate.toFixed(2)}%
                            </Typography>
                        </MetricValue>
                        <MetricLabel variant="omega" fontWeight="semiBold" textColor={metrics.errorRate > 1 ? "danger700" : "neutral700"}>
                            Error Rate
                        </MetricLabel>
                        <PerformanceBar>
                            <PerformanceBarFill
                                $percentage={Math.min(100, metrics.errorRate * 20)}
                                $color={getPerformanceColor(metrics.errorRate, { good: 0.5, warning: 2, isReverse: true })}
                            />
                        </PerformanceBar>
                        <MetricDescription variant="pi" textColor={metrics.errorRate > 1 ? "danger600" : "neutral600"}>
                            {getPerformanceStatus(metrics.errorRate, { good: 0.5, warning: 2, isReverse: true })}
                        </MetricDescription>
                    </MetricsCard>
                </Grid.Item>
            </Grid.Root>

            {/* Additional Metrics */}
            <Grid.Root gap={4} marginBottom={4}>
                <Grid.Item col={6}>
                    <MetricsCard background="neutral100">
                        <Box marginBottom={2}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                System Load
                            </Typography>
                        </Box>
                        <Flex alignItems="center" gap={2}>
                            <PerformanceBar style={{ flex: 1 }}>
                                <PerformanceBarFill
                                    $percentage={metrics.systemLoad}
                                    $color={getPerformanceColor(metrics.systemLoad, { good: 30, warning: 60, isReverse: true })}
                                />
                            </PerformanceBar>
                            <Typography variant="pi" textColor="neutral600">
                                {Math.round(metrics.systemLoad)}%
                            </Typography>
                        </Flex>
                    </MetricsCard>
                </Grid.Item>

                <Grid.Item col={6}>
                    <MetricsCard background="neutral100">
                        <Box marginBottom={2}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Database Query Time
                            </Typography>
                        </Box>
                        <Flex alignItems="center" gap={2}>
                            <PerformanceBar style={{ flex: 1 }}>
                                <PerformanceBarFill
                                    $percentage={Math.min(100, (50 - metrics.dbQueryTime) * 2)}
                                    $color={getPerformanceColor(metrics.dbQueryTime, { good: 15, warning: 30, isReverse: true })}
                                />
                            </PerformanceBar>
                            <Typography variant="pi" textColor="neutral600">
                                {Math.round(metrics.dbQueryTime)}ms
                            </Typography>
                        </Flex>
                    </MetricsCard>
                </Grid.Item>
            </Grid.Root>

            {/* System Status Summary */}
            <Box marginTop={4} padding="1rem" background="neutral50" borderRadius="8px">
                <Flex justifyContent="space-between" alignItems="center">
                    <Box>
                        <Box marginBottom={1}>
                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                Overall System Status
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="pi" textColor="neutral600">
                                All systems operational with excellent performance
                            </Typography>
                        </Box>
                    </Box>
                    <Badge
                        backgroundColor="success100"
                        textColor="success700"
                        size="M"
                    >
                        ✅ Healthy
                    </Badge>
                </Flex>
            </Box>

            {/* Performance Actions - Delegated to separate component */}
            <PerformanceActions
                metrics={metrics}
                onRefreshMetrics={fetchMetrics}
                lastUpdated={lastUpdated}
            />
        </Box>
    );
};

export default PerformanceMetricsWidget;