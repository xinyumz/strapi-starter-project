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
                        {/* Line 1: Open Language Card */}
                        <Flex justifyContent="space-between" alignItems="center">
                            <Flex gap={3} alignItems="center">
                                <Typography variant="pi" fontWeight="bold">Open Language Card:</Typography>
                                <Select
                                    placeholder="Select language to view"
                                    size="S"
                                    onChange={(value: string) => onLanguageSelect(value)}
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
                            >
                                Refresh All
                            </Button>
                        </Flex>

                        {/* Line 2: Bulk Actions */}
                        <Flex gap={4} alignItems="center" wrap="wrap">
                            <Typography variant="pi" fontWeight="bold">Bulk Actions:</Typography>

                            <Flex gap={2} alignItems="center" wrap="nowrap">
                                <Typography variant="pi" style={{ whiteSpace: 'nowrap' }}>Publish All:</Typography>
                                <ToggleCheckbox
                                    checked={bulkPublishState}
                                    onChange={(event: any) => {
                                        const isChecked = event.target ? event.target.checked : event;
                                        onBulkPublish(Boolean(isChecked));
                                    }}
                                />
                            </Flex>

                            <Flex gap={2} alignItems="center">
                                <Typography variant="pi">Set All:</Typography>
                                <Select size="S" onChange={(value: string) => onBulkAccessTier(value)}>
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