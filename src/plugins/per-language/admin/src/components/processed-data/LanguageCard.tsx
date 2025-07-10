// src/plugins/per-language/admin/src/components/processed-data/LanguageCard.tsx

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Flex,
    Typography,
    Badge,
    Button,
    Checkbox,
    Box,
    Divider
} from '@strapi/design-system';
import {
    ArrowClockwise,
    Eye,
    EyeStriked,
    Play,
    Check,
    WarningCircle
} from '@strapi/icons';

import { LanguageData, LanguageProcessor } from '../shared/types';
import { AccessTierSelect } from '../shared/AccessTierSelect';
import { LanguageCardDetails } from './LanguageCardDetails';

interface PendingChanges {
    accessTier?: string;
    publishState?: boolean;
}

interface LanguageCardProps {
    language: LanguageData;
    processor: LanguageProcessor;
    index: number;
    isExpanded: boolean;
    isUpdating: Record<string, boolean>;
    showAllGrammar: Record<number, boolean>;
    showAllTranslations: Record<number, boolean>;
    onToggleExpansion: (languageId: number) => void;
    onClose: (languageId: number) => void;
    onRefresh: (languageId: number, languageCode: string) => void;
    onPublishToggle: (languageId: number, currentPublished: boolean) => void;
    onAccessTierChange: (languageId: number, tier: string) => void;
    onOpenProcessor: (language: string) => void;
    onGrammarExpansionToggle: (languageId: number) => void;
    onTranslationExpansionToggle: (languageId: number) => void;
    onDelete?: (languageId: number, languageName: string) => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
    language: lang,
    processor,
    index,
    isExpanded,
    isUpdating,
    showAllGrammar,
    onToggleExpansion,
    onClose,
    onRefresh,
    onPublishToggle,
    onAccessTierChange,
    onOpenProcessor,
    onGrammarExpansionToggle,
    onDelete
}) => {
    // Manual save states
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
    const [isSaving, setIsSaving] = useState(false);

    // Track original values to detect changes
    const [originalValues, setOriginalValues] = useState({
        accessTier: lang.access_tier,
        publishState: lang.published
    });

    // Update original values when language data changes (from external refresh/save)
    useEffect(() => {
        setOriginalValues({
            accessTier: lang.access_tier,
            publishState: lang.published
        });
    }, [lang.access_tier, lang.published]);


    // Clear pending changes on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            setPendingChanges({});
        };
    }, []);

    // Calculate current values (pending changes override original values)
    const currentAccessTier = pendingChanges.accessTier !== undefined ? pendingChanges.accessTier : lang.access_tier;
    const currentPublishState = pendingChanges.publishState !== undefined ? pendingChanges.publishState : lang.published;

    // Check if there are unsaved changes
    const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

    // Handle access tier change (store locally, don't save immediately)
    const handleAccessTierChange = (newTier: string) => {
        if (newTier === originalValues.accessTier) {
            // If changing back to original value, remove from pending changes
            setPendingChanges(prev => {
                const updated = { ...prev };
                delete updated.accessTier;
                return updated;
            });
        } else {
            // Store as pending change
            setPendingChanges(prev => ({
                ...prev,
                accessTier: newTier
            }));
        }
    };

    // Handle publish toggle (store locally, don't save immediately)
    const handlePublishToggle = () => {
        const newPublishState = !currentPublishState;

        if (newPublishState === originalValues.publishState) {
            // If changing back to original value, remove from pending changes
            setPendingChanges(prev => {
                const updated = { ...prev };
                delete updated.publishState;
                return updated;
            });
        } else {
            // Store as pending change
            setPendingChanges(prev => ({
                ...prev,
                publishState: newPublishState
            }));
        }
    };

    // Save all pending changes
    const handleSavePendingChanges = async () => {
        if (!hasUnsavedChanges) return;

        try {
            setIsSaving(true);

            // Save access tier if changed
            if (pendingChanges.accessTier !== undefined) {
                await onAccessTierChange(lang.id, pendingChanges.accessTier);
            }

            // Save publish state if changed
            if (pendingChanges.publishState !== undefined) {
                await onPublishToggle(lang.id, !pendingChanges.publishState); // Note: onPublishToggle expects current state
            }

            // Clear pending changes after successful save
            setPendingChanges({});

            // Update original values to the new saved values
            setOriginalValues({
                accessTier: pendingChanges.accessTier !== undefined ? pendingChanges.accessTier : originalValues.accessTier,
                publishState: pendingChanges.publishState !== undefined ? pendingChanges.publishState : originalValues.publishState
            });

        } catch (error) {
            console.error('[LanguageCard] Error saving pending changes:', error);
            // Don't clear pending changes on error, let user try again
        } finally {
            setIsSaving(false);
        }
    };

    // Discard all pending changes
    const handleDiscardChanges = () => {
        setPendingChanges({});
    };

    const getStatusBadge = (lang: LanguageData, processor: LanguageProcessor) => {
        try {
            const hasContent = lang.per_language_text && lang.per_language_text.trim().length > 0;
            const hasProcessedData = lang.processed_data && Object.keys(lang.processed_data).length > 0;

            if (!hasContent) {
                return <Badge backgroundColor="neutral200" textColor="neutral700">No Content</Badge>;
            }

            if (!processor.hasProcessor) {
                return <Badge backgroundColor="warning200" textColor="warning700">Processor Coming Soon</Badge>;
            }

            if (hasProcessedData) {
                return <Badge backgroundColor="success200" textColor="success700">Processed</Badge>;
            }

            return <Badge backgroundColor="primary200" textColor="neutral800">Content Ready</Badge>;
        } catch (error) {
            console.error('Error in getStatusBadge:', error);
            return <Badge backgroundColor="neutral200">Unknown</Badge>;
        }
    };

    const getMetricsDisplay = (lang: LanguageData, processor: LanguageProcessor) => {
        try {
            const hasContent = lang.per_language_text && lang.per_language_text.trim().length > 0;
            const hasProcessedData = lang.processed_data && typeof lang.processed_data === 'object' && Object.keys(lang.processed_data).length > 0;

            return (
                <Flex gap={5} alignItems="center" wrap="wrap" justifyContent="flex-start" marginBottom={4}>
                    <Flex gap={2} alignItems="center">
                        <Typography variant="pi" textColor="neutral600">Content:</Typography>
                        <Badge backgroundColor={hasContent ? "success200" : "neutral200"} textColor={hasContent ? "success700" : "neutral700"}>
                            {hasContent ? 'Available' : 'None'}
                        </Badge>
                    </Flex>

                    {hasProcessedData && (
                        <>
                            {lang.display_skill && (
                                <Flex gap={2} alignItems="center">
                                    <Typography variant="pi" textColor="neutral600">{processor.difficultyLabel}:</Typography>
                                    <Badge backgroundColor="primary200" textColor="neutral800">{lang.display_skill}</Badge>
                                </Flex>
                            )}

                            {lang.processed_data.grammar?.sentences && (
                                <>
                                    <Flex gap={2} alignItems="center">
                                        <Typography variant="pi" textColor="neutral600">Grammar Rules:</Typography>
                                        <Badge backgroundColor="success200" textColor="success700">
                                            {lang.processed_data.grammar.sentences.reduce((total: number, sentence: any) =>
                                                total + (sentence.rules?.length || 0), 0
                                            )} rules
                                        </Badge>
                                    </Flex>

                                    <Flex gap={2} alignItems="center">
                                        <Typography variant="pi" textColor="neutral600">Sentences:</Typography>
                                        <Badge backgroundColor="secondary200" textColor="secondary700">
                                            {lang.processed_data.grammar.sentences.length} processed
                                        </Badge>
                                    </Flex>
                                </>
                            )}
                        </>
                    )}
                </Flex>
            );
        } catch (error) {
            console.error('Error in getMetricsDisplay:', error);
            return (
                <Typography variant="pi" color="danger600">
                    Error displaying metrics
                </Typography>
            );
        }
    };

    // Handle delete with simple confirm dialog
    const handleDeleteClick = async () => {
        if (!onDelete) return;

        // Calculate what will be deleted for the warning
        const contentLength = lang.per_language_text?.length || 0;
        const sentenceCount = lang.processed_data?.grammar?.sentences?.length || 0;
        const grammarRuleCount = lang.processed_data?.grammar?.sentences?.reduce((total: number, sentence: any) =>
            total + (sentence.rules?.length || 0), 0
        ) || 0;

        // Create detailed warning message
        const warningMessage = `⚠️ DELETE ${processor.name.toUpperCase()} CONTENT

This will permanently delete:
• Translated content (${contentLength} characters)
• ${sentenceCount} processed sentences
• ${grammarRuleCount} grammar rules
• All processing metadata and settings
• Related sentence data from connected tables

The base article content will remain unchanged.

This action CANNOT be undone!

Are you sure you want to delete all ${processor.name} content?`;

        // Show confirmation dialog
        const confirmed = confirm(warningMessage);

        if (confirmed) {
            try {
                console.log(`[LanguageCard] User confirmed deletion of ${processor.name} content`);
                await onDelete(lang.id, processor.name);
            } catch (error) {
                console.error('Error deleting language content:', error);
                alert(`Failed to delete ${processor.name} content. Please try again.`);
            }
        } else {
            console.log(`[LanguageCard] User canceled deletion of ${processor.name} content`);
        }
    };

    // Handle invalid language data
    if (!lang || typeof lang !== 'object') {
        return (
            <Card key={`invalid-${index}`}>
                <CardBody>
                    <Typography variant="pi" color="danger600">
                        Invalid language data at index {index}
                    </Typography>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card key={`lang-${lang.id}-${lang.language}-${index}`} width="100%">
            <CardHeader padding={2}>
                <Flex justifyContent="space-between" alignItems="center" width="100%">
                    <Box margin={3}>
                        <Typography variant="epsilon" fontWeight="semiBold" textColor="neutral800">
                            {processor.name}
                        </Typography>
                    </Box>
                    <Button
                        variant="ghost"
                        size="S"
                        onClick={() => onClose(lang.id)}
                    >
                        ✕
                    </Button>
                </Flex>
            </CardHeader>

            <CardBody>
                <Box width="100%">
                    <Box margin={4}>
                        {/* Status badges and action buttons */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3} marginBottom={4}>
                            <Flex gap={3} alignItems="center" wrap="wrap">
                                {processor.hasProcessor && (
                                    <Badge backgroundColor="success200" textColor="success700">
                                        Processor Available
                                    </Badge>
                                )}
                                {getStatusBadge(lang, processor)}
                                {!currentAccessTier && (
                                    <Badge backgroundColor="warning200" textColor="warning700">
                                        Access Tier Required
                                    </Badge>
                                )}
                                {/* Unsaved changes indicator */}
                                {hasUnsavedChanges && (
                                    <Badge backgroundColor="warning200" textColor="warning700">
                                        Unsaved Changes
                                    </Badge>
                                )}
                            </Flex>

                            <Flex gap={2} alignItems="center">
                                <Button
                                    variant="tertiary"
                                    startIcon={<ArrowClockwise />}
                                    onClick={() => onRefresh(lang.id, lang.language)}
                                    disabled={isUpdating[`refresh_${lang.id}`] || hasUnsavedChanges}
                                    size="S"
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant={processor.hasProcessor ? "default" : "secondary"}
                                    onClick={() => onOpenProcessor(lang.language)}
                                    disabled={!processor.hasProcessor || hasUnsavedChanges}
                                    size="S"
                                    startIcon={<Play />}
                                >
                                    Open Processor
                                </Button>
                            </Flex>
                        </Flex>

                        {/* Access tier, publish controls, and DELETE BUTTON */}
                        <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap={3} marginBottom={4}>
                            <Flex gap={4} alignItems="center" wrap="wrap">
                                <Flex gap={2} alignItems="center">
                                    <AccessTierSelect
                                        value={currentAccessTier || ''}
                                        onChange={handleAccessTierChange}
                                        disabled={isSaving}
                                        size="S"
                                        error={!currentAccessTier ? "Access tier is required" : undefined}
                                    />
                                </Flex>

                                <Flex gap={2} alignItems="center">
                                    {currentPublishState ? <Eye width="16px" height="16px" /> : <EyeStriked width="16px" height="16px" />}
                                    <Checkbox
                                        checked={currentPublishState || false}
                                        onCheckedChange={handlePublishToggle}
                                        disabled={isSaving}
                                    />
                                    <Typography variant="pi" fontWeight="semiBold">
                                        {currentPublishState ? 'Published' : 'Draft'}
                                    </Typography>
                                </Flex>
                            </Flex>

                            <Flex gap={3} alignItems="center">
                                <Typography variant="pi" textColor="neutral500">
                                    Last updated: {new Date(lang.updatedAt || lang.updated_at).toLocaleDateString()}
                                </Typography>

                                {onDelete && (
                                    <Button
                                        variant="danger-light"
                                        onClick={handleDeleteClick}
                                        disabled={isUpdating[`delete_${lang.id}`] || hasUnsavedChanges}
                                        size="S"
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Flex>
                        </Flex>

                        {/* Manual Save Controls */}
                        {hasUnsavedChanges && (
                            <Flex gap={3} marginBottom={4} background="neutral100" padding={3} hasRadius justifyContent="space-between" alignItems="center">
                                <Flex gap={1} alignItems="center">
                                    <WarningCircle />
                                    <Typography variant="pi" color="neutral700">
                                        You have {Object.keys(pendingChanges).length} unsaved change(s)
                                    </Typography>
                                </Flex>
                                <Flex gap={2} alignItems="center">
                                    <Button
                                        variant="success"
                                        size="S"
                                        onClick={handleSavePendingChanges}
                                        loading={isSaving}
                                        startIcon={<Check />}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        variant="tertiary"
                                        size="S"
                                        onClick={handleDiscardChanges}
                                        disabled={isSaving}
                                    >
                                        Discard
                                    </Button>
                                </Flex>
                            </Flex>
                        )}

                        {/* Metrics display */}
                        {getMetricsDisplay(lang, processor)}

                        {/* Expandable Details Section */}
                        {lang.processed_data && Object.keys(lang.processed_data).length > 0 && (
                            <>
                                <Divider marginBottom={4} />
                                <Box width="100%">
                                    <Button
                                        variant="tertiary"
                                        size="S"
                                        onClick={() => onToggleExpansion(lang.id)}
                                        fullWidth
                                    >
                                        {isExpanded ? 'Hide Sentence Details' : 'Show Sentence Details'}
                                    </Button>
                                </Box>

                                {isExpanded && (
                                    <LanguageCardDetails
                                        language={lang}
                                        processor={processor}
                                        showAllGrammar={showAllGrammar[lang.id] || false}
                                        onGrammarExpansionToggle={() => onGrammarExpansionToggle(lang.id)}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </CardBody>
        </Card>
    );
};