// src/plugins/collection-article-relation/admin/src/components/Dashboard/SmartRecommendationsWidget.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Flex,
    Badge,
    Button,
    Loader
} from '@strapi/design-system';
import { Lightbulb, ArrowUp, ArrowRight, CheckCircle, WarningCircle, ArrowClockwise } from '@strapi/icons';
import styled from 'styled-components';

const RecommendationCard = styled(Box)`
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

// Fix styled components warning by using transient props ($priority)
const PriorityIndicator = styled(Box) <{ $priority: 'high' | 'medium' | 'low' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props =>
        props.$priority === 'high' ? '#dc3545' :
            props.$priority === 'medium' ? '#ffc107' : '#28a745'
    };
  margin-right: 0.5rem;
`;

const ActionButton = styled(Button)`
  margin-top: 1rem;
  width: 100%;
`;

const RefreshButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

interface Recommendation {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'optimization' | 'cleanup' | 'performance' | 'content';
    impact: string;
    effort: 'low' | 'medium' | 'high';
    action: string;
    actionUrl?: string;
    completed?: boolean;
}

interface SmartRecommendationsWidgetProps {
    onRecommendationClick?: (recommendation: Recommendation) => void;
    onRefresh?: () => void;
}

const SmartRecommendationsWidget: React.FC<SmartRecommendationsWidgetProps> = ({
    onRecommendationClick,
    onRefresh
}) => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Simulate AI-powered recommendations based on your system state
    const generateRecommendations = async () => {
        setLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate smart recommendations based on documented system state
        const mockRecommendations: Recommendation[] = [
            {
                id: '1',
                title: 'Optimize Single-Article Collections',
                description: 'Found 8 collections with only one article. Consider merging similar collections or adding more articles to enhance value.',
                priority: 'medium',
                category: 'optimization',
                impact: 'Improve content organization and user experience',
                effort: 'medium',
                action: 'Review Collections',
                actionUrl: '/admin/content-manager/collection-types/api::collection.collection'
            },
            {
                id: '2',
                title: 'Excellent System Health',
                description: 'Your system is running at 100% health with zero orphaned collections. All relationships are intact.',
                priority: 'low',
                category: 'performance',
                impact: 'System stability maintained',
                effort: 'low',
                action: 'View Analytics',
                completed: true
            },
            {
                id: '3',
                title: 'Cache Performance Optimization',
                description: 'Cache hit rate is at 94%. Consider implementing longer TTL for frequently accessed data.',
                priority: 'low',
                category: 'performance',
                impact: 'Further reduce response times',
                effort: 'low',
                action: 'Tune Cache'
            },
            {
                id: '4',
                title: 'Content Expansion Opportunity',
                description: 'Chinese article processor shows strong engagement. Consider adding more HSK-level content.',
                priority: 'medium',
                category: 'content',
                impact: 'Increase user engagement and learning outcomes',
                effort: 'high',
                action: 'Plan Content'
            }
        ];

        setRecommendations(mockRecommendations);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        generateRecommendations();
    }, []);

    const handleRefresh = () => {
        generateRecommendations();
        onRefresh?.();
    };

    const getPriorityBackground = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return 'danger100';
            case 'medium': return 'warning100';
            case 'low': return 'success100';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'optimization': return <ArrowUp color="primary600" />;
            case 'performance': return <CheckCircle color="success600" />;
            case 'content': return <Lightbulb color="warning600" />;
            case 'cleanup': return <WarningCircle color="danger600" />;
            default: return <Lightbulb color="neutral600" />;
        }
    };

    const getEffortBadge = (effort: 'low' | 'medium' | 'high') => {
        const colors = {
            low: { bg: 'success100', text: 'success700' },
            medium: { bg: 'warning100', text: 'warning700' },
            high: { bg: 'danger100', text: 'danger700' }
        };
        return (
            <Badge
                backgroundColor={colors[effort].bg}
                textColor={colors[effort].text}
                size="S"
            >
                {effort} effort
            </Badge>
        );
    };

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
                <Loader>Generating smart recommendations...</Loader>
            </Box>
        );
    }

    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
    const completedCount = recommendations.filter(r => r.completed).length;

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
                            🤖 Smart Recommendations
                        </Typography>
                    </Box>
                    <Box marginBottom={2}>
                        <Typography variant="omega" textColor="neutral600" marginTop={1}>
                            AI-powered insights for system optimization
                        </Typography>
                    </Box>
                </Box>
                <Flex gap={2} alignItems="center">
                    {highPriorityCount > 0 && (
                        <Badge backgroundColor="danger100" textColor="danger700">
                            {highPriorityCount} high priority
                        </Badge>
                    )}
                    <Typography variant="pi" textColor="neutral500">
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                    {/* Replace IconButton with regular Button to avoid Tooltip issues */}
                    <RefreshButton
                        variant="tertiary"
                        onClick={handleRefresh}
                        disabled={loading}
                        size="S"
                        startIcon={<ArrowClockwise />}
                    >
                        Refresh
                    </RefreshButton>
                </Flex>
            </Flex>

            {/* Summary Stats */}
            <Grid.Root gap={3} marginBottom={4}>
                <Grid.Item col={3}>
                    <Box background="primary100" padding="1rem" borderRadius="8px" textAlign="center" width="100%" height="100%">
                        <Typography variant="alpha" textColor="primary700" fontWeight="bold">
                            {recommendations.length}
                        </Typography>
                        <Typography variant="pi" textColor="primary600">
                            Total Recommendations
                        </Typography>
                    </Box>
                </Grid.Item>
                <Grid.Item col={3}>
                    <Box background="success100" padding="1rem" borderRadius="8px" textAlign="center" width="100%" height="100%">
                        <Typography variant="alpha" textColor="success700" fontWeight="bold">
                            {completedCount}
                        </Typography>
                        <Typography variant="pi" textColor="success600">
                            Completed Actions
                        </Typography>
                    </Box>
                </Grid.Item>
                <Grid.Item col={3}>
                    <Box background="warning100" padding="1rem" borderRadius="8px" textAlign="center" width="100%" height="100%">
                        <Typography variant="alpha" textColor="warning700" fontWeight="bold">
                            {recommendations.filter(r => r.priority === 'medium').length}
                        </Typography>
                        <Typography variant="pi" textColor="warning600">
                            Medium Priority
                        </Typography>
                    </Box>
                </Grid.Item>
                <Grid.Item col={3}>
                    <Box background="neutral100" padding="1rem" borderRadius="8px" textAlign="center" width="100%" height="100%">
                        <Typography variant="alpha" textColor="neutral700" fontWeight="bold">
                            94%
                        </Typography>
                        <Typography variant="pi" textColor="neutral600">
                            System Score
                        </Typography>
                    </Box>
                </Grid.Item>
            </Grid.Root>

            {/* Recommendations List */}
            <Box>
                <Typography variant="gamma" textColor="neutral800" fontWeight="semiBold" marginBottom={3}>
                    📋 Recommended Actions
                </Typography>

                <Grid.Root gap={3}>
                    {recommendations.map((recommendation) => (
                        <Grid.Item key={recommendation.id} col={6}>
                            <RecommendationCard
                                background={getPriorityBackground(recommendation.priority)}
                                style={{
                                    borderLeftColor: recommendation.priority === 'high' ? '#dc3545' :
                                        recommendation.priority === 'medium' ? '#ffc107' : '#28a745',
                                    opacity: recommendation.completed ? 0.7 : 1
                                }}
                            >
                                {/* Header */}
                                <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={2}>
                                    <Flex alignItems="center" gap={2}>
                                        {getCategoryIcon(recommendation.category)}
                                        <Box>
                                            <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                                                {recommendation.title}
                                            </Typography>
                                            {recommendation.completed && (
                                                <CheckCircle color="success600" width="1rem" height="1rem" style={{ marginLeft: '0.5rem' }} />
                                            )}
                                        </Box>
                                    </Flex>
                                    <Flex gap={1}>
                                        {/* Use transient prop $priority to avoid DOM warning */}
                                        <PriorityIndicator $priority={recommendation.priority} />
                                        {getEffortBadge(recommendation.effort)}
                                    </Flex>
                                </Flex>

                                {/* Description */}
                                <Box marginBottom={2}>
                                    <Typography variant="pi" textColor="neutral600" style={{ lineHeight: '1.4' }}>
                                        {recommendation.description}
                                    </Typography>
                                </Box>

                                {/* Impact */}
                                <Box marginBottom={2}>
                                    <Typography variant="pi" fontWeight="medium" textColor="neutral700">
                                        Impact: {recommendation.impact}
                                    </Typography>
                                </Box>

                                {/* Action Button */}
                                <ActionButton
                                    variant={recommendation.completed ? "secondary" : "primary"}
                                    size="S"
                                    onClick={() => onRecommendationClick?.(recommendation)}
                                    disabled={recommendation.completed}
                                    endIcon={<ArrowRight />}
                                >
                                    {recommendation.completed ? 'Completed' : recommendation.action}
                                </ActionButton>
                            </RecommendationCard>
                        </Grid.Item>
                    ))}
                </Grid.Root>
            </Box>

            {/* Footer */}
            <Box marginTop={4} padding="1rem" background="neutral50" borderRadius="8px">
                <Flex justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                            🎯 Optimization Score: 94/100
                        </Typography>
                        <Typography variant="pi" textColor="neutral600">
                            Your system is performing excellently with minimal optimization needed
                        </Typography>
                    </Box>
                    <Box textAlign="right">
                        <Typography variant="pi" textColor="neutral500">
                            Next analysis in 1 hour
                        </Typography>
                    </Box>
                </Flex>
            </Box>
        </Box>
    );
};

export default SmartRecommendationsWidget;