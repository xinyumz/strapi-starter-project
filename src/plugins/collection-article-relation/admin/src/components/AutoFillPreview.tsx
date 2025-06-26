// src/plugins/collection-article-relation/admin/src/components/AutoFillPreview.tsx

import React from 'react';
import { Box, Typography, Flex, Badge, Button } from '@strapi/design-system';
import { CheckIcon, CrossIcon, WarningIcon } from '@strapi/icons';

interface AutoFillData {
    scenario: 'no_articles' | 'single_article' | 'multiple_articles';
    message: string;
    suggestedData?: {
        title?: string;
        date?: string;
        cover?: any;
        category?: any;
    };
    conflicts?: {
        categories?: boolean;
        dates?: boolean;
        covers?: boolean;
    };
    articleDetails?: {
        count: number;
        articles: any[];
    };
}

interface AutoFillPreviewProps {
    autoFillData: AutoFillData | null;
    onApplyAutoFill: () => void;
    onClearAutoFill: () => void;
    isLoading?: boolean;
}

const AutoFillPreview: React.FC<AutoFillPreviewProps> = ({
    autoFillData,
    onApplyAutoFill,
    onClearAutoFill,
    isLoading = false
}) => {
    if (!autoFillData || autoFillData.scenario === 'no_articles') {
        return null;
    }

    const { suggestedData, conflicts, message, scenario } = autoFillData;

    const getFieldStatus = (fieldName: string, hasConflict: boolean = false) => {
        if (hasConflict) {
            return {
                icon: <WarningIcon />,
                color: 'warning',
                text: 'Conflict'
            };
        }
        if (suggestedData && suggestedData[fieldName as keyof typeof suggestedData]) {
            return {
                icon: <CheckIcon />,
                color: 'success',
                text: 'Auto-filled'
            };
        }
        return {
            icon: <CrossIcon />,
            color: 'neutral',
            text: 'Manual required'
        };
    };

    const titleStatus = getFieldStatus('title');
    const dateStatus = getFieldStatus('date', conflicts?.dates);
    const coverStatus = getFieldStatus('cover', conflicts?.covers);
    const categoryStatus = getFieldStatus('category', conflicts?.categories);

    return (
        <Box
            background="neutral100"
            padding={4}
            borderRadius="4px"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="neutral200"
        >
            <Flex direction="column" alignItems="stretch" gap={3}>
                {/* Header */}
                <Flex justifyContent="space-between" alignItems="flex-start">
                    <Box flex="1">
                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                            Auto-Fill Preview
                        </Typography>
                        <Typography variant="pi" textColor="neutral600" marginTop={1}>
                            {message}
                        </Typography>
                    </Box>

                    <Flex gap={2}>
                        <Button
                            variant="secondary"
                            size="S"
                            onClick={onClearAutoFill}
                            disabled={isLoading}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="default"
                            size="S"
                            onClick={onApplyAutoFill}
                            disabled={isLoading || !suggestedData}
                            loading={isLoading}
                        >
                            Apply Auto-Fill
                        </Button>
                    </Flex>
                </Flex>

                {/* Field Status Grid */}
                {suggestedData && (
                    <Box>
                        <Typography variant="sigma" textColor="neutral700" marginBottom={2}>
                            Field Status:
                        </Typography>

                        <Flex direction="column" gap={2}>
                            {/* Title */}
                            <Flex justifyContent="space-between" alignItems="center">
                                <Typography variant="pi" textColor="neutral700">
                                    Title: {suggestedData.title || 'No title'}
                                </Typography>
                                <Badge backgroundColor={titleStatus.color}>
                                    {titleStatus.text}
                                </Badge>
                            </Flex>

                            {/* Date */}
                            <Flex justifyContent="space-between" alignItems="center">
                                <Typography variant="pi" textColor="neutral700">
                                    Date: {suggestedData.date || 'No date'}
                                    {conflicts?.dates && scenario === 'multiple_articles' && (
                                        <Typography as="span" variant="pi" textColor="warning600" marginLeft={2}>
                                            (earliest selected)
                                        </Typography>
                                    )}
                                </Typography>
                                <Badge backgroundColor={dateStatus.color}>
                                    {dateStatus.text}
                                </Badge>
                            </Flex>

                            {/* Cover */}
                            <Flex justifyContent="space-between" alignItems="center">
                                <Typography variant="pi" textColor="neutral700">
                                    Cover: {suggestedData.cover ? suggestedData.cover.name || 'Image selected' : 'No cover'}
                                    {conflicts?.covers && (
                                        <Typography as="span" variant="pi" textColor="warning600" marginLeft={2}>
                                            (multiple covers found)
                                        </Typography>
                                    )}
                                </Typography>
                                <Badge backgroundColor={coverStatus.color}>
                                    {coverStatus.text}
                                </Badge>
                            </Flex>

                            {/* Category */}
                            <Flex justifyContent="space-between" alignItems="center">
                                <Typography variant="pi" textColor="neutral700">
                                    Category: {suggestedData.category ? `Category ${suggestedData.category}` : 'No category'}
                                    {conflicts?.categories && (
                                        <Typography as="span" variant="pi" textColor="warning600" marginLeft={2}>
                                            (different categories found)
                                        </Typography>
                                    )}
                                </Typography>
                                <Badge backgroundColor={categoryStatus.color}>
                                    {categoryStatus.text}
                                </Badge>
                            </Flex>
                        </Flex>
                    </Box>
                )}

                {/* Article Details */}
                {autoFillData.articleDetails && (
                    <Box>
                        <Typography variant="sigma" textColor="neutral700">
                            Based on {autoFillData.articleDetails.count} article{autoFillData.articleDetails.count !== 1 ? 's' : ''}:
                        </Typography>
                        <Box marginTop={2}>
                            {autoFillData.articleDetails.articles.slice(0, 3).map((article, index) => (
                                <Typography key={article.id} variant="pi" textColor="neutral600">
                                    • {article.Title || `Article ${article.id}`}
                                </Typography>
                            ))}
                            {autoFillData.articleDetails.count > 3 && (
                                <Typography variant="pi" textColor="neutral600">
                                    • ...and {autoFillData.articleDetails.count - 3} more
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Conflict Summary */}
                {scenario === 'multiple_articles' && conflicts && (
                    <Box
                        background="warning100"
                        padding={3}
                        borderRadius="4px"
                    >
                        <Typography variant="pi" textColor="warning700" fontWeight="semiBold">
                            Conflict Resolution Applied:
                        </Typography>
                        <Box marginTop={1}>
                            {conflicts.categories && (
                                <Typography variant="pi" textColor="warning700">
                                    • Category: Different categories found - manual selection required
                                </Typography>
                            )}
                            {conflicts.covers && (
                                <Typography variant="pi" textColor="warning700">
                                    • Cover: Multiple covers found - manual selection required
                                </Typography>
                            )}
                            {conflicts.dates && (
                                <Typography variant="pi" textColor="warning700">
                                    • Date: Multiple dates found - using earliest date
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};

export default AutoFillPreview;