// src/plugins/per-language/admin/src/components/processed-data/BulkControls.tsx

import React from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    Typography,
    Select,
    Option,
    ToggleCheckbox,
    Stack
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
                    <Stack spacing={4}>
                        {/* Line 1: Open Language Card - Responsive inline/stacked */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3}>
                            <Flex gap={3} alignItems="center" wrap="wrap" style={{ minWidth: 'fit-content', maxWidth: '100%' }}>
                                <Typography variant="pi" fontWeight="bold" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    Open Language Card:
                                </Typography>
                                <Select
                                    placeholder="Select language to view"
                                    size="S"
                                    onChange={(value: string) => onLanguageSelect(value)}
                                    style={{ minWidth: '200px', flexShrink: 1 }}
                                >
                                    <Option value="zh">Chinese (中文) ⚙️</Option>
                                    <Option value="es">Spanish (Español) 🚧</Option>
                                    <Option value="fr">French (Français) 🚧</Option>
                                    <Option value="de">German (Deutsch) 🚧</Option>
                                    <Option value="ja">Japanese (日本語) 🚧</Option>
                                    <Option value="pt">Portuguese (Português) 🚧</Option>
                                </Select>
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
                                <ToggleCheckbox
                                    checked={bulkPublishState}
                                    onChange={() => onBulkPublish(!bulkPublishState)}
                                />
                            </Flex>

                            <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                                <Typography variant="pi" style={{ whiteSpace: 'nowrap' }}>Set All:</Typography>
                                <Select size="S" onChange={(value: string) => onBulkAccessTier(value)} style={{ minWidth: '140px' }}>
                                    <Option value="Free">Free</Option>
                                    <Option value="Login">Login Required</Option>
                                    <Option value="Premium">Premium</Option>
                                </Select>
                            </Flex>
                        </Flex>
                    </Stack>
                </Box>
            </CardBody>
        </Card>
    );
};