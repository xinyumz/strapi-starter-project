// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionLanguageCard.tsx

import React from 'react';
import {
    Textarea,
    Typography,
    Box,
    Flex,
    Card,
    CardHeader,
    CardBody,
    Badge,
    Checkbox,
    SingleSelect,
    SingleSelectOption,
    Button
} from '@strapi/design-system';
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
            case 'zh': return ''; // "HSK" already included in skill level, which also is used for level selection
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
        <Card shadow="filterShadow" width="100%">
            <CardHeader paddingTop={5} paddingBottom={3} paddingLeft={5} paddingRight={5}>
                <Box width="100%">
                    {/* Centered Title */}
                    <Box paddingBottom={2} textAlign="center">
                        <Typography variant="beta" fontWeight="semiBold">
                            {langInfo.name} ({langInfo.code})
                        </Typography>
                    </Box>

                    {/* Badges and Delete Button */}
                    <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
                        <Flex alignItems="center" gap={2} wrap="wrap" style={{ minWidth: 'fit-content' }}>

                            {getCurrentValue(language, 'display_skill') && (
                                <Badge
                                    backgroundColor="secondary100"
                                    textColor="secondary600"
                                >
                                    {skillLabel} {getCurrentValue(language, 'display_skill')}
                                </Badge>
                            )}

                            {getCurrentValue(language, 'access_tier') && (
                                <Badge
                                    backgroundColor="primary100"
                                    textColor="primary600"
                                >
                                    {getCurrentValue(language, 'access_tier')}
                                </Badge>
                            )}

                            <Badge
                                backgroundColor={getCurrentValue(language, 'published') ? 'success100' : 'neutral100'}
                                textColor={getCurrentValue(language, 'published') ? 'success600' : 'neutral600'}
                            >
                                {getCurrentValue(language, 'published') ? 'PUBLISHED' : 'DRAFT'}
                            </Badge>

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

            <CardBody width="100%" paddingBottom={4}>
                <Box width="100%" padding={4}>
                    <Flex direction="column" gap={4}>
                        {/* Description Field */}
                        <Box width="100%">
                            <Textarea
                                label="Description"
                                value={getCurrentValue(language, 'description') || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    onFieldChange('description', e.target.value);
                                }}
                                style={{ minHeight: '100px' }}
                            />
                            <Box marginTop={1}>
                                <Typography variant="pi" textColor="neutral600">
                                    Collection description for this language (optional for single-article collections)
                                </Typography>
                            </Box>
                        </Box>

                        {/* Controls Layout */}
                        <Flex gap={4} wrap="wrap" width="100%" justifyContent='space-between'>
                            <Flex gap={3} wrap="wrap" flex={1}>
                                {/* Skill Level */}
                                <Box flex={1}>
                                    <SingleSelect
                                        label={skillLabel}
                                        value={getCurrentValue(language, 'display_skill') as string || ''}
                                        onChange={(value: string) => onFieldChange('display_skill', value)}
                                        placeholder="Select level"
                                    >
                                        {skillOptions.map(option => (
                                            <SingleSelectOption key={option.value} value={option.value}>
                                                {option.label}
                                            </SingleSelectOption>
                                        ))}
                                    </SingleSelect>
                                </Box>

                                {/* Access Tier */}
                                <Box flex={1.2}>
                                    <SingleSelect
                                        label="Access Tier"
                                        value={getCurrentValue(language, 'access_tier') as string || ''}
                                        onChange={(value: string) => onFieldChange('access_tier', value)}
                                        placeholder="Select tier"
                                    >
                                        <SingleSelectOption value="Free">Free</SingleSelectOption>
                                        <SingleSelectOption value="Login">Login Required</SingleSelectOption>
                                        <SingleSelectOption value="Premium">Premium</SingleSelectOption>
                                    </SingleSelect>
                                </Box>
                            </Flex>

                            {/* Published Toggle */}
                            <Flex gap={2} alignItems="center" flex={0.4} justifyContent="flex-end">
                                <Box>
                                    <Typography variant="pi" fontWeight="bold">Published</Typography>
                                </Box>
                                <Box
                                    style={{
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Checkbox
                                        checked={Boolean(getCurrentValue(language, 'published')) || false}
                                        onCheckedChange={(checked: boolean) => {
                                            onFieldChange('published', checked);
                                        }}
                                    />
                                </Box>
                            </Flex>
                        </Flex>

                        {/* Save Button */}
                        {hasChanges && (
                            <Flex justifyContent="flex-end" paddingTop={2}>
                                <Button
                                    onClick={onSave}
                                    disabled={isSaving}
                                    loading={isSaving}
                                    size="S"
                                >
                                    Save Changes
                                </Button>
                            </Flex>
                        )}
                    </Flex>
                </Box>
            </CardBody>
        </Card>
    );
};