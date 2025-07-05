// src/plugins/collection-article-relation/admin/src/components/OrphanManagement/OrphanQuickActions.tsx
// Cleaned up version with proper cache control

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    Dialog,
    Flex,
    Badge,
    Loader
} from '@strapi/design-system';
import styled from 'styled-components';
import { useOrphanDetection, OrphanStats } from '../../hooks/useOrphanManagement';

const QuickActionButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

interface OrphanQuickActionsProps {
    stats: OrphanStats;
    onRefreshStats: () => Promise<void>;
    onForceRefresh: () => Promise<void>; // New prop for cache-busting refresh
}

const OrphanQuickActions: React.FC<OrphanQuickActionsProps> = ({
    stats,
    onRefreshStats,
    onForceRefresh
}) => {
    const [showOrphanModal, setShowOrphanModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { orphans, loading: orphansLoading, forceDetect } = useOrphanDetection();

    // Safe stats calculation
    const safeStats = {
        totalCollections: stats.totalCollections || 0,
        orphanedCollections: stats.orphanedCollections || 0,
        healthyCollections: stats.healthyCollections || 0,
        singleArticleCollections: stats.singleArticleCollections || 0,
        emptyCollections: stats.emptyCollections || 0,
        brokenReferenceCollections: stats.brokenReferenceCollections || 0
    };

    // Handler: Scan for Orphans - FORCE CACHE BYPASS
    const handleScanForOrphans = async () => {
        setRefreshing(true);
        try {
            console.log('[OrphanQuickActions] Force refreshing orphan data');
            await onForceRefresh(); // Use the cache-busting refresh
            console.log('[OrphanQuickActions] Force refresh completed');
        } catch (error) {
            console.error('[OrphanQuickActions] Error during force refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Handler: Show Orphaned Collections
    const handleShowOrphans = async () => {
        if (safeStats.orphanedCollections > 0) {
            setShowOrphanModal(true);
            console.log('[OrphanQuickActions] Loading orphan details with cache bypass');
            await forceDetect(); // Force fresh detection
        }
    };

    // Handler: Go to Collections
    const handleGoToCollections = () => {
        window.open('/admin/content-manager/collection-types/api::collection.collection', '_blank');
    };

    // Helper function for orphan type display (simplified)
    const getOrphanTypeLabel = (orphanType: string) => {
        switch (orphanType) {
            case 'empty':
                return 'Empty';
            case 'broken_references':
                return 'Broken References';
            default:
                return 'Issues Detected';
        }
    };

    // Helper function for severity colors
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            default: return 'secondary';
        }
    };

    // Filter to show only truly orphaned collections (empty or broken)
    const actualOrphans = orphans.filter(orphan =>
        orphan.status.orphanType === 'empty' || orphan.status.orphanType === 'broken_references'
    );

    return (
        <>
            {/* Quick Actions Section */}
            <Box>
                <Box marginBottom={3}>
                    <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                        🚀 Quick Actions
                    </Typography>
                </Box>
                <Grid.Root gap={3}>
                    <Grid.Item col={4}>
                        <QuickActionButton
                            variant="secondary"
                            onClick={handleScanForOrphans}
                            size="S"
                            disabled={refreshing}
                        >
                            {refreshing ? '🔄 Scanning...' : '🔍 Scan for Orphans'}
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <QuickActionButton
                            variant={safeStats.orphanedCollections > 0 ? "danger" : "tertiary"}
                            onClick={handleShowOrphans}
                            size="S"
                            disabled={safeStats.orphanedCollections === 0}
                        >
                            ⚠️ Show Orphaned Collections
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={4}>
                        <QuickActionButton
                            variant="primary"
                            onClick={handleGoToCollections}
                            size="S"
                        >
                            📋 Go to Collections
                        </QuickActionButton>
                    </Grid.Item>
                </Grid.Root>
            </Box>

            {/* Orphan Details Modal */}
            <Dialog.Root open={showOrphanModal} onOpenChange={setShowOrphanModal}>
                <Dialog.Content size="L">
                    <Dialog.Header>
                        ⚠️ Orphaned Collections ({safeStats.orphanedCollections} found)
                    </Dialog.Header>

                    <Dialog.Body>
                        <Box marginBottom={3}>
                            <Typography variant="omega">
                                The following collections are empty or have broken references:
                            </Typography>
                        </Box>

                        {orphansLoading ? (
                            <Box textAlign="center" padding="2rem">
                                <Loader>Loading orphaned collection details...</Loader>
                            </Box>
                        ) : (
                            <Box>
                                {actualOrphans.map((orphan, index) => (
                                    <Box
                                        key={orphan.collection.id}
                                        background="neutral100"
                                        padding="1.5rem"
                                        borderRadius="8px"
                                        marginBottom={index < actualOrphans.length - 1 ? "1rem" : "0"}
                                        style={{
                                            borderLeft: `4px solid ${orphan.status.severity === 'high' ? 'var(--danger-600)' :
                                                orphan.status.severity === 'medium' ? 'var(--warning-600)' :
                                                    'var(--secondary-600)'
                                                }`
                                        }}
                                    >
                                        {/* Collection Header */}
                                        <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={2}>
                                            <Box width="80%">
                                                <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                                    {orphan.collection.title}
                                                </Typography>
                                            </Box>
                                            <Badge
                                                backgroundColor={`${getSeverityColor(orphan.status.severity)}100`}
                                                textColor={`${getSeverityColor(orphan.status.severity)}700`}
                                            >
                                                {getOrphanTypeLabel(orphan.status.orphanType)}
                                            </Badge>
                                        </Flex>

                                        {/* Collection Details */}
                                        <Grid.Root gap={2} marginBottom={2}>
                                            <Grid.Item col={6}>
                                                <Box>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        <strong>Articles:</strong> {orphan.status.articleCount}
                                                    </Typography>
                                                </Box>
                                            </Grid.Item>
                                            <Grid.Item col={6}>
                                                <Box>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        <strong>Last Checked:</strong> {new Date(orphan.metadata.lastChecked).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Grid.Item>
                                        </Grid.Root>

                                        {/* Issue Description */}
                                        <Box marginBottom={2}>
                                            <Typography variant="pi" textColor="neutral700">
                                                {orphan.status.orphanType === 'empty' && 'This collection has no articles.'}
                                                {orphan.status.orphanType === 'broken_references' &&
                                                    `This collection has ${orphan.status.missingArticleIds.length} missing article references.`
                                                }
                                            </Typography>
                                        </Box>

                                        {/* Suggested Actions */}
                                        {orphan.suggestedActions.length > 0 && (
                                            <Box marginBottom={2}>
                                                <Box marginBottom={1}>
                                                    <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                                                        Suggested Actions:
                                                    </Typography>
                                                </Box>
                                                <Box paddingLeft="1rem">
                                                    {orphan.suggestedActions.map((action, actionIndex) => (
                                                        <Typography
                                                            key={actionIndex}
                                                            variant="pi"
                                                            textColor="neutral600"
                                                            style={{ display: 'block', marginBottom: '0.25rem' }}
                                                        >
                                                            • {action}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Quick Actions for Individual Collection */}
                                        <Flex gap={2} marginTop={3}>
                                            <Button
                                                variant="tertiary"
                                                size="S"
                                                onClick={() => window.open(orphan.collection.url, '_blank')}
                                            >
                                                📝 Edit Collection
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="S"
                                                onClick={handleGoToCollections}
                                            >
                                                📋 View All Collections
                                            </Button>
                                        </Flex>
                                    </Box>
                                ))}

                                {actualOrphans.length === 0 && !orphansLoading && (
                                    <Box background="success100" padding="1.5rem" borderRadius="8px" textAlign="center">
                                        <Typography variant="omega" textColor="success700">
                                            No orphaned collections found! Your system is clean.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Dialog.Cancel asChild>
                            <Button variant="tertiary">
                                Close
                            </Button>
                        </Dialog.Cancel>
                        <Button variant="secondary" onClick={handleScanForOrphans}>
                            🔍 Refresh Data
                        </Button>
                        <Button variant="primary" onClick={handleGoToCollections}>
                            📋 Go to Collections
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
};

export default OrphanQuickActions;