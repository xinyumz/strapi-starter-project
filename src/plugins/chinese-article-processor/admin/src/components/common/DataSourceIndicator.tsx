// src/plugins/chinese-article-processor/admin/src/components/common/DataSourceIndicator.tsx

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Typography,
    Button,
    Badge,
    Alert,
    Card,
    CardBody,
    Icon,
    Tooltip
} from '@strapi/design-system';
import { Database, CheckCircle, AlertTriangle, ArrowRight, Refresh, Search } from '@strapi/icons';
import { useDataSourceInfo } from '../../hooks/useDataSourceInfo';

interface DataSourceIndicatorProps {
    articleId: string | null;
    onTransition?: () => void;
    showDetails?: boolean;
    className?: string;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
    articleId,
    onTransition,
    showDetails = false,
    className
}) => {
    const {
        dataSourceInfo,
        isLoading,
        isUsingModernSystem,
        isInTransition,
        needsTransition,
        statusMessage,
        statusColor,
        getDataSourceInfo,
        createPerLanguageEntry
    } = useDataSourceInfo({
        articleId,
        onSuccess: (message) => console.log('DataSource success:', message),
        onError: (message) => console.error('DataSource error:', message)
    });

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [hasUserTriedToLoad, setHasUserTriedToLoad] = useState(false);

    const handleGetDataSource = () => {
        if (articleId) {
            setHasUserTriedToLoad(true);
            getDataSourceInfo(articleId);
        }
    };

    const handleTransition = async () => {
        if (!articleId) return;

        setIsTransitioning(true);
        try {
            const success = await createPerLanguageEntry(articleId);
            if (success && onTransition) {
                onTransition();
            }
        } finally {
            setIsTransitioning(false);
        }
    };

    if (!articleId) {
        return (
            <Card className={className}>
                <CardBody>
                    <Typography variant="omega" color="neutral500">
                        No article selected
                    </Typography>
                </CardBody>
            </Card>
        );
    }

    // If we have data, show the actual information
    if (dataSourceInfo) {
        return (
            <Card className={className}>
                <CardBody>
                    <Flex direction="column" gap={3}>
                        {/* Status Header */}
                        <Flex alignItems="center" justifyContent="space-between">
                            <Flex alignItems="center" gap={2}>
                                <Icon as={Database} />
                                <Typography variant="omega" fontWeight="bold">
                                    Data Source
                                </Typography>
                            </Flex>
                            <Badge backgroundColor={statusColor}>
                                {isUsingModernSystem ? 'Modern' : isInTransition ? 'Transition' : 'Legacy'}
                            </Badge>
                        </Flex>

                        {/* Status Message */}
                        <Typography variant="pi" color="neutral600">
                            {statusMessage}
                        </Typography>

                        {/* Detailed Information */}
                        {showDetails && (
                            <Box>
                                <Flex direction="column" gap={2}>
                                    <DataSourceRow
                                        label="Content"
                                        source={dataSourceInfo.content.source}
                                        isModern={dataSourceInfo.content.isModern}
                                    />
                                    <DataSourceRow
                                        label="Processed Data"
                                        source={dataSourceInfo.processedData.source}
                                        isModern={dataSourceInfo.processedData.isModern}
                                    />
                                </Flex>
                            </Box>
                        )}

                        {/* Transition Action */}
                        {needsTransition && (
                            <Box>
                                <Alert
                                    variant="warning"
                                    title="Legacy System Detected"
                                    message="This article can be transitioned to the modern multi-language system"
                                />
                                <Button
                                    variant="default"
                                    startIcon={<ArrowRight />}
                                    onClick={handleTransition}
                                    disabled={isTransitioning}
                                    size="S"
                                    marginTop={2}
                                >
                                    {isTransitioning ? 'Transitioning...' : 'Transition to Modern System'}
                                </Button>
                            </Box>
                        )}

                        {/* Success State */}
                        {isUsingModernSystem && (
                            <Flex alignItems="center" gap={2}>
                                <Icon as={CheckCircle} color="success500" />
                                <Typography variant="pi" color="success600">
                                    Using optimized multi-language architecture
                                </Typography>
                            </Flex>
                        )}
                    </Flex>
                </CardBody>
            </Card>
        );
    }

    // If currently loading, show loading state
    if (isLoading) {
        return (
            <Card className={className}>
                <CardBody>
                    <Flex alignItems="center" gap={2}>
                        <Icon as={Refresh} />
                        <Typography variant="omega">
                            Checking data source...
                        </Typography>
                    </Flex>
                </CardBody>
            </Card>
        );
    }

    // Initial state: Friendly "Get Data Source" button
    if (!hasUserTriedToLoad) {
        return (
            <Card className={className}>
                <CardBody>
                    <Flex direction="column" gap={3}>
                        <Flex alignItems="center" gap={2}>
                            <Icon as={Database} />
                            <Typography variant="omega" fontWeight="bold">
                                Data Source Information
                            </Typography>
                        </Flex>
                        <Typography variant="pi" color="neutral600">
                            Check which database system is being used for this article
                        </Typography>
                        <Button
                            variant="default"
                            startIcon={<Search />}
                            onClick={handleGetDataSource}
                            size="S"
                        >
                            Get Data Source Info
                        </Button>
                    </Flex>
                </CardBody>
            </Card>
        );
    }

    // If user tried to load but failed, show warning with retry
    return (
        <Card className={className}>
            <CardBody>
                <Alert
                    variant="warning"
                    title="Data Source Unknown"
                    message="Unable to determine data source"
                />
                <Button
                    variant="tertiary"
                    startIcon={<Refresh />}
                    onClick={handleGetDataSource}
                    size="S"
                    marginTop={2}
                >
                    Retry
                </Button>
            </CardBody>
        </Card>
    );
};

// Helper Components

interface DataSourceRowProps {
    label: string;
    source: string;
    isModern: boolean;
}

const DataSourceRow: React.FC<DataSourceRowProps> = ({ label, source, isModern }) => {
    const getSourceDisplay = () => {
        switch (source) {
            case 'per_languages':
                return { text: 'per_languages table', color: 'success', icon: CheckCircle };
            case 'articles':
                return { text: 'articles table', color: 'warning', icon: AlertTriangle };
            case 'none':
                return { text: 'Not available', color: 'neutral', icon: AlertTriangle };
            default:
                return { text: source, color: 'neutral', icon: Database };
        }
    };

    const sourceDisplay = getSourceDisplay();

    return (
        <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="pi">{label}:</Typography>
            <Flex alignItems="center" gap={2}>
                <Badge backgroundColor={sourceDisplay.color}>
                    {sourceDisplay.text}
                </Badge>
                {isModern && (
                    <Tooltip description="Modern multi-language system">
                        <Icon as={CheckCircle} color="success500" />
                    </Tooltip>
                )}
            </Flex>
        </Flex>
    );
};

export default DataSourceIndicator;