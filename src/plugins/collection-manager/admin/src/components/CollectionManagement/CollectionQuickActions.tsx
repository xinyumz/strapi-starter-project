// src/plugins/collection-manager/admin/src/components/OrphanManagement/CollectionQuickActions.tsx

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
import {
    useOrphanDetection,
    useDuplicateDetection,
    CombinedHealthStats,
    DuplicateGroup
} from '../../hooks/useCollectionManagement';
import { ScrollableModalContent, QuickActionButton } from '../shared/StyledComponents';

const isDebugMode = () => window.location.search.includes('debug');
const debugLog = (message: string, ...args: any[]) => {
    if (isDebugMode()) console.log(message, ...args);
};

interface CollectionQuickActionsProps {
    healthStats: CombinedHealthStats;
    onRefreshStats: () => Promise<void>;
    onForceRefresh: () => Promise<void>;
}

const CollectionQuickActions: React.FC<CollectionQuickActionsProps> = ({
    healthStats,
    onForceRefresh
}) => {
    const [showOrphanModal, setShowOrphanModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'danger'>('success');

    const { orphans, loading: orphansLoading, forceDetect: forceDetectOrphans } = useOrphanDetection();
    const { duplicates, loading: duplicatesLoading, forceDetect: forceDetectDuplicates } = useDuplicateDetection();

    // Safe stats calculation
    const safeStats = {
        totalCollections: healthStats.totalCollections || 0,
        orphanedCollections: healthStats.orphanedCollections || 0,
        duplicateCollections: healthStats.duplicateCollections || 0,
        duplicateGroups: healthStats.duplicateGroups || 0,
        healthScore: healthStats.healthScore || 100
    };


    // Show toast notification
    const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    // Handler: Combined Refresh Scan (orphans + duplicates)
    const handleCombinedRefreshScan = async () => {
        setRefreshing(true);
        try {
            debugLog('[CollectionQuickActions] Starting combined refresh scan');

            // Show immediate feedback
            showNotification('🔄 Scanning for orphans and duplicates...', 'success');

            // Use the enhanced force refresh that clears all caches
            await onForceRefresh();

            debugLog('[CollectionQuickActions] Combined refresh scan completed successfully');
            showNotification('✅ Health scan completed! Data refreshed.', 'success');

        } catch (error) {
            console.error('[CollectionQuickActions] Error during combined refresh:', error);
            showNotification('❌ Failed to refresh health data. Please try again.', 'danger');
        } finally {
            setRefreshing(false);
        }
    };

    // Handler: Show Orphaned Collections
    const handleShowOrphans = async () => {
        if (safeStats.orphanedCollections > 0) {
            setShowOrphanModal(true);
            debugLog('[CollectionQuickActions] Loading orphan details');

            try {
                await forceDetectOrphans();
            } catch (error) {
                console.error('[CollectionQuickActions] Error loading orphan details:', error);
                showNotification('⚠️ Could not refresh orphan details, showing cached data.', 'danger');
            }
        }
    };

    // Handler: Show Duplicate Collections
    const handleShowDuplicates = async () => {
        if (safeStats.duplicateCollections > 0) {
            setShowDuplicateModal(true);
            debugLog('[CollectionQuickActions] Loading duplicate details');

            try {
                await forceDetectDuplicates();
            } catch (error) {
                console.error('[CollectionQuickActions] Error loading duplicate details:', error);
                showNotification('⚠️ Could not refresh duplicate details, showing cached data.', 'danger');
            }
        }
    };

    // Handler: Go to Collections
    const handleGoToCollections = () => {
        window.open('/admin/content-manager/collection-types/api::collection.collection', '_blank');
    };

    // Helper function for orphan type display
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

    // Filter to show only truly orphaned collections
    const actualOrphans = orphans.filter(orphan =>
        orphan.status.orphanType === 'empty' || orphan.status.orphanType === 'broken_references'
    );

    return (
        <>
            {/* Toast Notification */}
            {showToast && (
                <Box
                    position="fixed"
                    top="1rem"
                    right="1rem"
                    background={toastType === 'success' ? 'success100' : 'danger100'}
                    padding="1rem"
                    borderRadius="8px"
                    borderColor={toastType === 'success' ? 'success600' : 'danger600'}
                    borderWidth="2px"
                    style={{ zIndex: 9999 }}
                >
                    <Typography
                        variant="omega"
                        textColor={toastType === 'success' ? 'success700' : 'danger700'}
                    >
                        {toastMessage}
                    </Typography>
                </Box>
            )}

            {/* Quick Actions Section */}
            <Box>
                <Box marginBottom={3}>
                    <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold">
                        🚀 Quick Actions
                    </Typography>
                </Box>
                <Grid.Root gap={3}>
                    <Grid.Item col={3}>
                        <QuickActionButton
                            variant="secondary"
                            onClick={handleCombinedRefreshScan}
                            size="S"
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <Flex alignItems="center" gap={2}>
                                    <Loader small />
                                    Scanning...
                                </Flex>
                            ) : (
                                '🔄 Refresh Scan'
                            )}
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={3}>
                        <QuickActionButton
                            variant={safeStats.orphanedCollections > 0 ? "danger" : "tertiary"}
                            onClick={handleShowOrphans}
                            size="S"
                            disabled={safeStats.orphanedCollections === 0}
                        >
                            ⚠️ Show Orphaned Collections
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={3}>
                        <QuickActionButton
                            variant={safeStats.duplicateCollections > 0 ? "secondary" : "tertiary"}
                            onClick={handleShowDuplicates}
                            size="S"
                            disabled={safeStats.duplicateCollections === 0}
                        >
                            📂 Show Duplicate Collections
                        </QuickActionButton>
                    </Grid.Item>
                    <Grid.Item col={3}>
                        <QuickActionButton
                            variant="primary"
                            onClick={handleGoToCollections}
                            size="S"
                        >
                            📋 Go to Collections
                        </QuickActionButton>
                    </Grid.Item>
                </Grid.Root>

                {/* Action Info */}
                <Box marginTop={3} padding="1rem" background="neutral100" borderRadius="8px">
                    <Typography variant="pi" textColor="neutral600">
                        💡 <strong>Health Monitoring:</strong> "Refresh Scan" checks both orphans and duplicates
                        with cache clearing for immediate results. System auto-refreshes every 2 minutes.
                    </Typography>
                </Box>
            </Box>

            {/* Scrollable Orphan Details Modal */}
            <Dialog.Root open={showOrphanModal} onOpenChange={setShowOrphanModal}>
                <Dialog.Content size="L">
                    <Dialog.Header>
                        ⚠️ Orphaned Collections ({safeStats.orphanedCollections} found)
                    </Dialog.Header>
                    <ScrollableModalContent>
                        <Dialog.Body>
                            <Box marginBottom={3}>
                                <Typography variant="omega">
                                    The following collections are empty or have broken references:
                                </Typography>
                            </Box>

                            {orphansLoading ? (
                                <Box textAlign="center" padding="2rem">
                                    <Flex direction="column" alignItems="center" gap={2}>
                                        <Loader>Loading latest orphaned collection details...</Loader>
                                        <Typography variant="pi" textColor="neutral600">
                                            Refreshing data to ensure accuracy...
                                        </Typography>
                                    </Flex>
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
                                                borderLeft: `4px solid ${orphan.status.severity === 'high' ? '#dc3545' :
                                                    orphan.status.severity === 'medium' ? '#ffc107' : '#6c757d'
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
                                                🎉 No orphaned collections found! Your system is clean.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Dialog.Body>
                    </ScrollableModalContent>

                    <Dialog.Footer>
                        <Dialog.Cancel asChild>
                            <Button variant="tertiary">
                                Close
                            </Button>
                        </Dialog.Cancel>
                        <Button
                            variant="secondary"
                            onClick={handleCombinedRefreshScan}
                            disabled={refreshing}
                        >
                            🔄 Refresh Data
                        </Button>
                        <Button variant="primary" onClick={handleGoToCollections}>
                            📋 Go to Collections
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            {/* Duplicate Collections Modal */}
            {showDuplicateModal && (
                <Dialog.Root open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
                    <Dialog.Content size="L">
                        <Dialog.Header>
                            📂 Duplicate Collections ({safeStats.duplicateGroups} groups, {safeStats.duplicateCollections} collections)
                        </Dialog.Header>

                        <ScrollableModalContent>
                            <Dialog.Body>
                                <Box marginBottom={3}>
                                    <Typography variant="omega">
                                        The following groups contain collections with identical article sets:
                                    </Typography>
                                </Box>

                                {duplicatesLoading ? (
                                    <Box textAlign="center" padding="2rem">
                                        <Flex direction="column" alignItems="center" gap={2}>
                                            <Loader>Loading latest duplicate collection details...</Loader>
                                            <Typography variant="pi" textColor="neutral600">
                                                Analyzing collection fingerprints...
                                            </Typography>
                                        </Flex>
                                    </Box>
                                ) : (
                                    <Box>
                                        {duplicates?.duplicateGroups?.map((group: DuplicateGroup, index: number) => (
                                            <Box
                                                key={group.fingerprint}
                                                background="neutral100"
                                                padding="1.5rem"
                                                borderRadius="8px"
                                                marginBottom={index < duplicates.duplicateGroups.length - 1 ? "1rem" : "0"}
                                                style={{
                                                    borderLeft: `4px solid ${group.severity === 'high' ? '#dc3545' :
                                                        group.severity === 'medium' ? '#ffc107' : '#6c757d'
                                                        }`
                                                }}
                                            >
                                                {/* Group Header */}
                                                <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={2}>
                                                    <Box>
                                                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                                            Duplicate Group {index + 1}
                                                        </Typography>
                                                    </Box>
                                                    <Badge
                                                        backgroundColor={`${getSeverityColor(group.severity)}100`}
                                                        textColor={`${getSeverityColor(group.severity)}700`}
                                                    >
                                                        {group.collectionCount} Collections
                                                    </Badge>
                                                </Flex>

                                                {/* Group Details */}
                                                <Box marginBottom={3}>
                                                    <Typography variant="pi" textColor="neutral600">
                                                        <strong>Fingerprint:</strong> {group.fingerprint}
                                                    </Typography>
                                                    <br />
                                                    <Typography variant="pi" textColor="neutral600">
                                                        <strong>Article Count:</strong> {group.articleCount} articles per collection
                                                    </Typography>
                                                </Box>

                                                {/* Collections in Group */}
                                                <Box marginBottom={2}>
                                                    <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                                                        Duplicate Collections:
                                                    </Typography>
                                                </Box>
                                                <Box marginLeft="1rem" marginBottom={3}>
                                                    {group.collections.map((collection, colIndex) => (
                                                        <Box key={collection.id} marginBottom={1}>
                                                            <Typography variant="pi" textColor="neutral700">
                                                                • {collection.title}
                                                                <Typography variant="pi" textColor="neutral500" style={{ marginLeft: '0.5rem' }}>
                                                                    (ID: {collection.id})
                                                                </Typography>
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>

                                                {/* Suggested Actions */}
                                                {group.suggestedActions.length > 0 && (
                                                    <Box marginBottom={2}>
                                                        <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                                                            Suggested Actions:
                                                        </Typography>
                                                        <Box marginLeft="1rem" marginTop={1}>
                                                            {group.suggestedActions.map((action, actionIndex) => (
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

                                                {/* Quick Actions for Group */}
                                                <Flex gap={2} marginTop={3}>
                                                    <Button
                                                        variant="tertiary"
                                                        size="S"
                                                        onClick={() => window.open(group.collections[0].url, '_blank')}
                                                    >
                                                        Edit First Collection
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="S"
                                                        onClick={handleGoToCollections}
                                                    >
                                                        View All Collections
                                                    </Button>
                                                </Flex>
                                            </Box>
                                        ))}

                                        {(!duplicates?.duplicateGroups || duplicates.duplicateGroups.length === 0) && !duplicatesLoading && (
                                            <Box background="success100" padding="1.5rem" borderRadius="8px" textAlign="center">
                                                <Typography variant="omega" textColor="success700">
                                                    🎉 No duplicate collections found! All collections have unique article sets.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Dialog.Body>
                        </ScrollableModalContent>

                        <Dialog.Footer>
                            <Dialog.Cancel asChild>
                                <Button variant="tertiary">
                                    Close
                                </Button>
                            </Dialog.Cancel>
                            <Button
                                variant="secondary"
                                onClick={handleCombinedRefreshScan}
                                disabled={refreshing}
                            >
                                🔄 Refresh Data
                            </Button>
                            <Button variant="primary" onClick={handleGoToCollections}>
                                📋 Go to Collections
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Root>
            )}
        </>
    );
};

export default CollectionQuickActions;