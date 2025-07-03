// src/plugins/per-language/admin/src/components/processed-data/BulkControls.tsx

import React from 'react';
import {
    Card,
    CardBody,
    Flex,
    Typography,
    Button,
    SingleSelect,
    SingleSelectOption,
    Checkbox
} from '@strapi/design-system';
import { ChartCircle } from '@strapi/icons';

interface BulkControlsProps {
    onLanguageSelect: (language: string) => void;
    onRefresh: () => void;
    onBulkPublish: (publish: boolean) => void;
    onBulkAccessTier: (tier: string) => void;
    bulkPublishState: boolean;
}

export const BulkControls: React.FC<BulkControlsProps> = ({
    onLanguageSelect,
    onRefresh,
    onBulkPublish,
    onBulkAccessTier,
    bulkPublishState
}) => {
    return (
        <Card marginBottom={4}>
            <CardBody padding={2}>
                <Flex direction="column" gap={4}>
                    {/* Line 1: Open Language Card - Responsive inline/stacked */}
                    <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3}>
                        <Flex gap={3} alignItems="center" wrap="wrap">
                            <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                                Open Language Card:
                            </Typography>
                            <SingleSelect
                                placeholder="Select language to view"
                                onChange={onLanguageSelect}
                                size="S"
                            >
                                <SingleSelectOption value="zh">Chinese (中文) ⚙️</SingleSelectOption>
                                <SingleSelectOption value="es">Spanish (Español) 🚧</SingleSelectOption>
                                <SingleSelectOption value="fr">French (Français) 🚧</SingleSelectOption>
                                <SingleSelectOption value="de">German (Deutsch) 🚧</SingleSelectOption>
                                <SingleSelectOption value="ja">Japanese (日本語) 🚧</SingleSelectOption>
                                <SingleSelectOption value="pt">Portuguese (Português) 🚧</SingleSelectOption>
                            </SingleSelect>
                        </Flex>
                        <Button
                            variant="tertiary"
                            startIcon={<ChartCircle stroke="silver" />}
                            onClick={onRefresh}
                            size="S"
                        >
                            Refresh All
                        </Button>
                    </Flex>

                    {/* Line 2: Bulk Actions - Flex with wrap */}
                    <Flex gap={4} alignItems="center" wrap="wrap" width="100%">
                        <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                            Bulk Actions:
                        </Typography>

                        <Flex gap={2} alignItems="center">
                            <Typography variant="pi" textColor="neutral600">
                                Publish All:
                            </Typography>
                            <Checkbox
                                checked={bulkPublishState}
                                onCheckedChange={() => onBulkPublish(!bulkPublishState)}
                            />
                        </Flex>

                        <Flex gap={2} alignItems="center">
                            <Typography variant="pi" textColor="neutral600">
                                Set All:
                            </Typography>
                            <SingleSelect
                                placeholder="Select tier"
                                onChange={onBulkAccessTier}
                                size="S"
                            >
                                <SingleSelectOption value="Free">Free</SingleSelectOption>
                                <SingleSelectOption value="Login">Login Required</SingleSelectOption>
                                <SingleSelectOption value="Premium">Premium</SingleSelectOption>
                            </SingleSelect>
                        </Flex>
                    </Flex>
                </Flex>
            </CardBody>
        </Card>
    );
};