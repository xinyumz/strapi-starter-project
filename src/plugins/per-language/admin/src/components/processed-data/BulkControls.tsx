// src/plugins/per-language/admin/src/components/processed-data/BulkControls.tsx

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Flex,
    Typography,
    Button,
    SingleSelect,
    SingleSelectOption,
    Checkbox,
    Box
} from '@strapi/design-system';
import { ArrowClockwise, Check, WarningCircle } from '@strapi/icons';

interface PendingBulkChanges {
    publishAll?: boolean;
    accessTier?: string;
}

interface BulkControlsProps {
    onLanguageSelect: (language: string) => void;
    onRefresh: () => void;
    onBulkPublish: (publish: boolean) => void;
    onBulkAccessTier: (tier: string) => void;
    bulkPublishState: boolean;
    languageCount?: number;
}

export const BulkControls: React.FC<BulkControlsProps> = ({
    onLanguageSelect,
    onRefresh,
    onBulkPublish,
    onBulkAccessTier,
    bulkPublishState,
    languageCount = 0
}) => {
    // Manual save states
    const [pendingChanges, setPendingChanges] = useState<PendingBulkChanges>({});
    const [isSaving, setIsSaving] = useState(false);

    // Track original values
    const [originalValues, setOriginalValues] = useState({
        publishAll: bulkPublishState,
        accessTier: ''
    });

    // Update original values when bulk state changes externally
    useEffect(() => {
        setOriginalValues(prev => ({
            ...prev,
            publishAll: bulkPublishState
        }));
    }, [bulkPublishState]);

    // Calculate current values (pending changes override original values)
    const currentPublishState = pendingChanges.publishAll !== undefined ? pendingChanges.publishAll : bulkPublishState;
    const currentAccessTier = pendingChanges.accessTier || '';

    // Check if there are unsaved changes
    const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

    // Handle publish toggle (store locally, don't save immediately)
    const handleBulkPublishToggle = () => {
        const newPublishState = !currentPublishState;

        if (newPublishState === originalValues.publishAll) {
            // If changing back to original value, remove from pending changes
            setPendingChanges(prev => {
                const updated = { ...prev };
                delete updated.publishAll;
                return updated;
            });
        } else {
            // Store as pending change
            setPendingChanges(prev => ({
                ...prev,
                publishAll: newPublishState
            }));
        }
    };

    // Handle access tier change (store locally, don't save immediately)
    const handleAccessTierChange = (tier: string) => {
        if (!tier) return;

        setPendingChanges(prev => ({
            ...prev,
            accessTier: tier
        }));
    };

    // Save all pending bulk changes
    const handleSaveBulkChanges = async () => {
        if (!hasUnsavedChanges) return;

        try {
            setIsSaving(true);

            // Apply bulk publish if changed
            if (pendingChanges.publishAll !== undefined) {
                await onBulkPublish(pendingChanges.publishAll);
            }

            // Apply bulk access tier if changed
            if (pendingChanges.accessTier) {
                await onBulkAccessTier(pendingChanges.accessTier);
            }

            // Clear pending changes after successful save
            setPendingChanges({});

            // Update original values to the new saved values
            setOriginalValues({
                publishAll: pendingChanges.publishAll !== undefined ? pendingChanges.publishAll : originalValues.publishAll,
                accessTier: pendingChanges.accessTier || originalValues.accessTier
            });

        } catch (error) {
            console.error('[BulkControls] Error saving bulk changes:', error);
            // Don't clear pending changes on error, let user try again
        } finally {
            setIsSaving(false);
        }
    };

    // Discard all pending bulk changes
    const handleDiscardBulkChanges = () => {
        setPendingChanges({});
    };

    return (
        <Card marginBottom={4}>
            <CardBody padding={4}>
                <Flex direction="column" gap={5} width="100%">
                    {/* Line 1: Open Language Card - Responsive inline/stacked */}
                    <Flex justifyContent="space-between" wrap="wrap" gap={3} width="100%">
                        <Flex gap={3} alignItems="center" wrap="wrap">
                            <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                                Open Language Card:
                            </Typography>
                            <SingleSelect
                                placeholder="Select language to view"
                                onChange={onLanguageSelect}
                                size="S"
                                disabled={hasUnsavedChanges} // Disable when there are unsaved changes
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
                            startIcon={<ArrowClockwise />}
                            onClick={onRefresh}
                            size="S"
                            disabled={hasUnsavedChanges} // Disable when there are unsaved changes
                        >
                            Refresh All
                        </Button>
                    </Flex>

                    {/* Line 2: Bulk Actions - Flex with wrap */}
                    <Flex gap={4} alignItems="center" wrap="wrap" width="100%">
                        <Typography variant="pi" fontWeight="semiBold" textColor="neutral800">
                            Bulk Actions{languageCount > 0 && ` (${languageCount} languages)`}:
                        </Typography>

                        <Flex gap={2} alignItems="center">
                            <Typography variant="pi" textColor="neutral600">
                                Publish All:
                            </Typography>
                            <Checkbox
                                checked={currentPublishState}
                                onCheckedChange={handleBulkPublishToggle} // Use local handler
                                disabled={isSaving}
                            />
                        </Flex>

                        <Flex gap={2} alignItems="center">
                            <Typography variant="pi" textColor="neutral600">
                                Set All:
                            </Typography>
                            <SingleSelect
                                placeholder="Select tier"
                                onChange={handleAccessTierChange} // Use local handler
                                size="S"
                                value={currentAccessTier}
                                disabled={isSaving}
                            >
                                <SingleSelectOption value="Free">Free</SingleSelectOption>
                                <SingleSelectOption value="Login">Login Required</SingleSelectOption>
                                <SingleSelectOption value="Premium">Premium</SingleSelectOption>
                            </SingleSelect>
                        </Flex>
                    </Flex>

                    {/* Bulk Save Controls - only show when there are pending changes */}
                    {hasUnsavedChanges && (
                        <Box background="neutral100" padding={3} hasRadius width="100%">
                            <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={3}>
                                <Flex gap={1} alignItems="center">
                                    <WarningCircle />
                                    <Typography variant="pi" color="neutral700">
                                        Bulk changes pending - this will affect {languageCount > 0 ? `${languageCount} language${languageCount !== 1 ? 's' : ''}` : 'all languages'}
                                    </Typography>
                                </Flex>
                                <Flex gap={2} alignItems="center">
                                    <Button
                                        variant="success"
                                        size="S"
                                        onClick={handleSaveBulkChanges}
                                        loading={isSaving}
                                        startIcon={<Check />}
                                    >
                                        {isSaving ? 'Applying...' : 'Apply Bulk Changes'}
                                    </Button>
                                    <Button
                                        variant="tertiary"
                                        size="S"
                                        onClick={handleDiscardBulkChanges}
                                        disabled={isSaving}
                                    >
                                        Discard
                                    </Button>
                                </Flex>
                            </Flex>
                        </Box>
                    )}
                </Flex>
            </CardBody>
        </Card>
    );
};