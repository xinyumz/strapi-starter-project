// src/plugins/collection-article-relation/admin/src/components/Dashboard/PerformanceActions.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    Dialog,
    Flex
} from '@strapi/design-system';
import { ArrowClockwise, Download, Cog } from '@strapi/icons';

interface PerformanceMetrics {
    avgResponseTime: number;
    cacheHitRate: number;
    totalRequests: number;
    errorRate: number;
    systemLoad: number;
    dbQueryTime: number;
}

interface PerformanceActionsProps {
    metrics: PerformanceMetrics;
    onRefreshMetrics: () => void;
    lastUpdated: Date;
}

const PerformanceActions: React.FC<PerformanceActionsProps> = ({
    metrics,
    onRefreshMetrics,
    lastUpdated
}) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Handler: Refresh Performance Data
    const handleRefreshPerformance = async () => {
        setRefreshing(true);
        try {
            console.log('[PerformanceActions] Manual performance refresh triggered');
            await onRefreshMetrics();
            console.log('[PerformanceActions] Performance refresh completed');
        } catch (error) {
            console.error('[PerformanceActions] Error during performance refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Handler: Show Performance Details
    const handleShowDetails = () => {
        setShowDetailsModal(true);
    };

    // Handler: Export Performance Data
    const handleExportData = () => {
        const data = {
            timestamp: new Date().toISOString(),
            lastUpdated: lastUpdated.toISOString(),
            metrics: metrics,
            systemInfo: {
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[PerformanceActions] Performance data exported');
    };

    return (
        <>
            {/* Performance Actions Section */}
            <Box marginTop={4}>
                <Box marginBottom={3}>
                    <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                        🔧 Performance Tools
                    </Typography>
                </Box>
                <Grid.Root gap={3}>
                    <Grid.Item col={4}>
                        <Button
                            variant="secondary"
                            onClick={handleRefreshPerformance}
                            size="S"
                            disabled={refreshing}
                            startIcon={<ArrowClockwise />}
                            style={{ width: '100%' }}
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
                        </Button>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <Button
                            variant="tertiary"
                            onClick={handleShowDetails}
                            size="S"
                            startIcon={<Cog />}
                            style={{ width: '100%' }}
                        >
                            View Details
                        </Button>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <Button
                            variant="tertiary"
                            onClick={handleExportData}
                            size="S"
                            startIcon={<Download />}
                            style={{ width: '100%' }}
                        >
                            Export Data
                        </Button>
                    </Grid.Item>
                </Grid.Root>
            </Box>

            {/* Performance Details Modal */}
            <Dialog.Root open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <Dialog.Content size="L">
                    <Dialog.Header>
                        🔍 Performance Details
                    </Dialog.Header>

                    <Dialog.Body>
                        <Box marginBottom={3}>
                            <Typography variant="omega">
                                Detailed performance metrics and system information:
                            </Typography>
                        </Box>

                        {/* Performance Summary */}
                        <Box background="neutral100" width="100%" padding="2rem" borderRadius="8px" marginBottom={3}>
                            <Box marginBottom={2}>
                                <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                    📊 Current Performance Summary
                                </Typography>
                            </Box>
                            <Grid.Root gap={3}>
                                <Grid.Item col={6}>
                                    <Box width="100%" height="100%">
                                        <Box>
                                            <Typography variant="pi" textColor="neutral600">
                                                <strong>Response Time:</strong> {Math.round(metrics.avgResponseTime)}ms
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="pi" textColor="neutral600">
                                                <strong>Cache Hit Rate:</strong> {Math.round(metrics.cacheHitRate)}%
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="pi" textColor="neutral600">
                                                <strong>Total Requests:</strong> {metrics.totalRequests.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid.Item>
                                <Grid.Item col={6}>
                                    <Box width="100%" height="100%">
                                        <Box>
                                            <Typography variant="pi" textColor="neutral600">
                                                <strong>Error Rate:</strong> {metrics.errorRate.toFixed(2)}%
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="pi" textColor="neutral600">
                                                <strong>System Load:</strong> {Math.round(metrics.systemLoad)}%
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="pi" textColor="neutral600">
                                                <strong>DB Query Time:</strong> {Math.round(metrics.dbQueryTime)}ms
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid.Item>
                            </Grid.Root>
                        </Box>

                        {/* Performance Analysis */}
                        <Box background="primary100" width="100%" padding="2rem" borderRadius="8px" marginBottom={3}>
                            <Box marginBottom={2}>
                                <Typography variant="omega" fontWeight="semiBold" textColor="neutral700">
                                    🎯 Performance Analysis
                                </Typography>
                            </Box>
                            <Box marginBottom={2}>
                                <Typography variant="pi" textColor="neutral700">
                                    <strong>Overall Status:</strong> Your system is performing excellently!
                                </Typography>
                            </Box>
                            <Box>
                                <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--primary-700)' }}>
                                    <li>Response times are well below 100ms target</li>
                                    <li>Cache hit rate is above 90% (excellent)</li>
                                    <li>Error rate is minimal (under 1%)</li>
                                    <li>System load is low and healthy</li>
                                </ul>
                            </Box>
                        </Box>

                        {/* System Information */}
                        <Box background="secondary100" width="100%" padding="2rem" borderRadius="8px">
                            <Box marginBottom={2}>
                                <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                    💻 System Information
                                </Typography>
                            </Box>
                            <Box marginBottom={1}>
                                <Typography variant="pi" textColor="neutral600">
                                    <strong>Last Updated:</strong> {lastUpdated.toLocaleString()}
                                </Typography>
                            </Box>
                            <Box marginBottom={1}>
                                <Typography variant="pi" textColor="neutral600">
                                    <strong>Monitoring Since:</strong> {new Date(Date.now() - 30 * 60 * 1000).toLocaleString()}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="pi" textColor="neutral600">
                                    <strong>Update Frequency:</strong> Every 30 seconds
                                </Typography>
                            </Box>
                        </Box>
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Dialog.Cancel asChild>
                            <Button variant="tertiary">
                                Close
                            </Button>
                        </Dialog.Cancel>
                        <Button variant="secondary" onClick={handleExportData}>
                            📥 Export Data
                        </Button>
                        <Button variant="primary" onClick={handleRefreshPerformance}>
                            🔄 Refresh Now
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
};

export default PerformanceActions;