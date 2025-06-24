// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionLanguageCard.tsx

import React from 'react';
import {
    Stack,
    Textarea,
    Typography,
    Box,
    Flex,
    Card,
    CardHeader,
    CardBody,
    Badge,
    ToggleCheckbox,
    SingleSelect,
    SingleSelectOption,
    Button
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { SUPPORTED_LANGUAGES } from '../shared';
import {
    getDisplaySkillOptions,
    getLanguageSkillConfig,
} from '../../utils/display-skill-constants';
import { CollectionLanguageData } from '../hooks';

interface CollectionLanguageCardProps {
    language: CollectionLanguageData;
    isSaving: boolean;
    hasChanges: boolean;
    getCurrentValue: (lang: CollectionLanguageData, field: keyof CollectionLanguageData) => any;
    onFieldChange: (field: string, value: any) => void;
    onSave: () => void;
    onDelete: () => void;
}

/**
 * Individual collection language card component
 * 
 * Features:
 * - Language header with title and status badges
 * - Description textarea
 * - Published/Access Tier/Skill Level controls
 * - Save and delete functionality
 * - Responsive layout that adapts to screen size
 */
export const CollectionLanguageCard: React.FC<CollectionLanguageCardProps> = ({
    language,
    isSaving,
    hasChanges,
    getCurrentValue,
    onFieldChange,
    onSave,
    onDelete
}) => {
    // Helper functions
    const getLanguageInfo = (languageCode: string) => {
        return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || {
            code: languageCode,
            name: languageCode.toUpperCase(),
            hasProcessor: false
        };
    };

    const getSkillLabel = (languageCode: string) => {
        const config = getLanguageSkillConfig(languageCode);
        if (!config) return 'Skill Level';

        switch (languageCode) {
            case 'zh': return 'HSK';
            case 'ja': return 'JLPT';
            case 'es':
            case 'fr':
            case 'de':
            case 'pt': return 'CEFR';
            default: return 'Level';
        }
    };

    const langInfo = getLanguageInfo(language.language);
    const skillOptions = getDisplaySkillOptions(language.language);
    const skillLabel = getSkillLabel(language.language);

    return (
        <Card>
            <CardHeader>
                <Box width="100%" padding={3}>
                    {/* Centered Title */}
                    <Box paddingBottom={2} textAlign="center">
                        <Typography variant="beta" fontWeight="semiBold">
                            {langInfo.name} ({langInfo.code})
                        </Typography>
                    </Box>

                    {/* Badges and Delete Button */}
                    <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
                        <Flex alignItems="center" gap={2} wrap="wrap" style={{ minWidth: 'fit-content' }}>
                            <Badge
                                backgroundColor={getCurrentValue(language, 'published') ? 'success100' : 'neutral100'}
                                textColor={getCurrentValue(language, 'published') ? 'success600' : 'neutral600'}
                            >
                                {getCurrentValue(language, 'published') ? 'PUBLISHED' : 'DRAFT'}
                            </Badge>

                            {getCurrentValue(language, 'access_tier') && (
                                <Badge
                                    backgroundColor="primary100"
                                    textColor="primary600"
                                >
                                    {getCurrentValue(language, 'access_tier')}
                                </Badge>
                            )}

                            {getCurrentValue(language, 'display_skill') && (
                                <Badge
                                    backgroundColor="secondary100"
                                    textColor="secondary600"
                                >
                                    {skillLabel} {getCurrentValue(language, 'display_skill')}
                                </Badge>
                            )}

                            {hasChanges && (
                                <Badge
                                    backgroundColor="warning100"
                                    textColor="warning600"
                                >
                                    Unsaved Changes
                                </Badge>
                            )}
                        </Flex>

                        <Button
                            variant="danger-light"
                            onClick={onDelete}
                            size="S"
                        >
                            Delete
                        </Button>
                    </Flex>
                </Box>
            </CardHeader>

            <CardBody>
                <Box width="100%" padding={4}>
                    <Stack spacing={4}>
                        {/* Description Field */}
                        <Textarea
                            label="Description"
                            value={getCurrentValue(language, 'description') || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                onFieldChange('description', e.target.value);
                            }}
                            style={{ minHeight: '100px' }}
                            hint="Collection description for this language (optional for single-article collections)"
                        />

                        {/* Controls Layout */}
                        <Flex gap={0} wrap="wrap" style={{ columnGap: '60px', rowGap: '16px' }}>

                            {/* Skill Level */}
                            <Box style={{ minWidth: '160px', maxWidth: '200px' }}>
                                <SingleSelect
                                    label={skillLabel}
                                    value={getCurrentValue(language, 'display_skill') as string || ''}
                                    onChange={(value: string) => onFieldChange('display_skill', value)}
                                >
                                    <SingleSelectOption value="">Select level</SingleSelectOption>
                                    {skillOptions.map(option => (
                                        <SingleSelectOption key={option.value} value={option.value}>
                                            {option.label}
                                        </SingleSelectOption>
                                    ))}
                                </SingleSelect>
                            </Box>

                            {/* Access Tier */}
                            <Box style={{ minWidth: '200px', maxWidth: '240px' }}>
                                <SingleSelect
                                    label="Access Tier"
                                    value={getCurrentValue(language, 'access_tier') as string || ''}
                                    onChange={(value: string) => onFieldChange('access_tier', value)}
                                >
                                    <SingleSelectOption value="">Select tier</SingleSelectOption>
                                    <SingleSelectOption value="Free">Free</SingleSelectOption>
                                    <SingleSelectOption value="Login">Login Required</SingleSelectOption>
                                    <SingleSelectOption value="Premium">Premium</SingleSelectOption>
                                </SingleSelect>
                            </Box>

                            {/* Published Toggle */}
                            <Box style={{ minWidth: '120px' }}>
                                <Flex direction="column" gap={1} alignItems="flex-start">
                                    <Typography variant="pi" fontWeight="bold">Published</Typography>
                                    <Box
                                        style={{
                                            height: '40px',
                                            width: '120px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <ToggleCheckbox
                                            checked={Boolean(getCurrentValue(language, 'published')) || false}
                                            onChange={() => {
                                                const currentValue = Boolean(getCurrentValue(language, 'published'));
                                                onFieldChange('published', !currentValue);
                                            }}
                                        />
                                    </Box>
                                </Flex>
                            </Box>

                        </Flex>

                        {/* Save Button */}
                        {hasChanges && (
                            <Flex justifyContent="flex-end" paddingTop={2}>
                                <Button
                                    onClick={onSave}
                                    disabled={isSaving}
                                    loading={isSaving}
                                    startIcon={<Check />}
                                    size="S"
                                >
                                    Save Changes
                                </Button>
                            </Flex>
                        )}
                    </Stack>
                </Box>
            </CardBody>
        </Card>
    );
};