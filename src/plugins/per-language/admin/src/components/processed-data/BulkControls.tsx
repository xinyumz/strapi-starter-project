// src/plugins/per-language/admin/src/components/processed-data/BulkControls.tsx

import React from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    Typography,
    SingleSelect,
    SingleSelectOption,
    Checkbox,
} from '@strapi/design-system';
import { Refresh } from '@strapi/icons';

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
            <CardBody>
                <Box width="100%" padding={4}>
                    <Flex gap={4}>
                        {/* Line 1: Open Language Card - Responsive inline/stacked */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3}>
                            <Flex gap={3} alignItems="center" wrap="wrap" style={{ minWidth: 'fit-content', maxWidth: '100%' }}>
                                <Typography variant="pi" fontWeight="bold" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    Open Language Card:
                                </Typography>
                                <SingleSelect
                                    placeholder="Select language to view"
                                    size="S"
                                    onChange={(value: string) => onLanguageSelect(value)}
                                    style={{ minWidth: '200px', flexShrink: 1 }}
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
                                startIcon={<Refresh />}
                                variant="tertiary"
                                onClick={onRefresh}
                                size="S"
                                style={{ flexShrink: 0 }}
                            >
                                Refresh All
                            </Button>
                        </Flex>

                        {/* Line 2: Bulk Actions - Flex with wrap */}
                        <Flex gap={4} alignItems="center" wrap="wrap">
                            <Typography variant="pi" fontWeight="bold" style={{ whiteSpace: 'nowrap' }}>
                                Bulk Actions:
                            </Typography>

                            <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                                <Typography variant="pi" style={{ whiteSpace: 'nowrap' }}>Publish All:</Typography>
                                <Checkbox
                                    checked={bulkPublishState}
                                    onChange={() => onBulkPublish(!bulkPublishState)}
                                />
                            </Flex>

                            <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                                <Typography variant="pi" style={{ whiteSpace: 'nowrap' }}>Set All:</Typography>
                                <SingleSelect size="S" onChange={(value: string) => onBulkAccessTier(value)} style={{ minWidth: '140px' }}>
                                    <SingleSelectOption value="Free">Free</SingleSelectOption>
                                    <SingleSelectOption value="Login">Login Required</SingleSelectOption>
                                    <SingleSelectOption value="Premium">Premium</SingleSelectOption>
                                </SingleSelect>
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>
            </CardBody>
        </Card>
    );
};