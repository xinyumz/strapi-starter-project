// Updated CollectionPerlanguageField.tsx with improved UI and manual save

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Stack,
    Textarea,
    Select,
    Option,
    Typography,
    Box,
    Flex,
    Alert,
    Grid,
    GridItem,
    Card,
    CardHeader,
    CardBody,
    Badge,
    IconButton,
    Toggle,
    Switch,
    ToggleCheckbox,
    SingleSelect,
    SingleSelectOption,
    Button
} from '@strapi/design-system';
import { Trash, Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { SUPPORTED_LANGUAGES } from './shared';

// Import from centralized constants
import {
    getDisplaySkillOptions,
    getLanguageSkillConfig,
    type SkillOption
} from '../utils/display-skill-constants';

interface CollectionPerlanguageFieldProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
}

interface CollectionLanguageData {
    id: number;
    language: string;
    description: string;
    display_skill?: string;
    published: boolean;
    access_tier: string;
    created_at: string;
    updated_at: string;
}

interface PendingChanges {
    [languageId: number]: {
        description?: string;
        published?: boolean;
        access_tier?: string;
        display_skill?: string;
        hasChanges: boolean;
    };
}

const CollectionPerlanguageField: React.FC<CollectionPerlanguageFieldProps> = ({
    name,
    value,
    onChange,
    intlLabel,
    required,
}) => {

    if (!name || !onChange) {
        return null;
    }

    const { formatMessage } = useIntl();
    const [targetLanguage, setTargetLanguage] = useState('');
    const [collectionLanguages, setCollectionLanguages] = useState<CollectionLanguageData[]>([]);
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
    const [isCreatingRecord, setIsCreatingRecord] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<Record<number, boolean>>({});
    const { modifiedData } = useCMEditViewDataManager();

    const selectedLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const collectionId = modifiedData.id;

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Load existing collection languages on mount
    useEffect(() => {
        if (collectionId) {
            loadCollectionLanguages();
        }
    }, [collectionId]);

    /**
     * Load all languages for this collection
     */
    const loadCollectionLanguages = useCallback(async () => {
        if (!collectionId) return;

        try {
            const response = await fetch(`/per-language/collection/${collectionId}/languages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                setCollectionLanguages(result.data || []);
                // Clear pending changes when reloading
                setPendingChanges({});
            }
        } catch (error) {
            console.error('[CollectionPerlanguage] Error loading languages:', error);
        }
    }, [collectionId]);

    /**
     * Create new collection language record
     */
    const createLanguageRecord = useCallback(async (languageCode: string) => {
        if (!collectionId) {
            setError('Please save the collection first.');
            return;
        }

        try {
            setIsCreatingRecord(true);
            setError(null);

            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);

            const response = await fetch(`/per-language/collection/${collectionId}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    language: languageCode,
                    description: null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create language record: ${response.status} - ${errorData}`);
            }

            await loadCollectionLanguages();
            setSuccess(`${selectedLangInfo?.name || languageCode} collection language created`);

        } catch (error: any) {
            const selectedLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
            setError(`Failed to create ${selectedLangInfo?.name || languageCode}: ${error.message}`);
        } finally {
            setIsCreatingRecord(false);
        }
    }, [collectionId, loadCollectionLanguages]);

    /**
     * Language selection handler
     */
    const handleLanguageSelect = useCallback(async (selectedLanguage: string) => {
        setTargetLanguage(selectedLanguage);

        if (!collectionId || !selectedLanguage) {
            return;
        }

        const existingLanguage = collectionLanguages.find(lang => lang.language === selectedLanguage);
        if (existingLanguage) {
            setError(`${selectedLanguage} collection language already exists`);
            return;
        }

        await createLanguageRecord(selectedLanguage);
        setTargetLanguage('');
    }, [collectionId, collectionLanguages, createLanguageRecord]);

    /**
     * Update pending changes for a language
     */
    const updatePendingChange = useCallback((languageId: number, field: string, value: any) => {
        setPendingChanges(prev => ({
            ...prev,
            [languageId]: {
                ...prev[languageId],
                [field]: value,
                hasChanges: true
            }
        }));
    }, []);

    /**
     * Get current value for a field (pending change or original value)
     */
    const getCurrentValue = useCallback((lang: CollectionLanguageData, field: keyof CollectionLanguageData) => {
        if (!lang) return '';  // Add this safety check

        const pending = pendingChanges[lang.id];
        if (pending && pending.hasChanges && field in pending) {
            return pending[field as keyof typeof pending];
        }
        return lang[field];
    }, [pendingChanges]);

    /**
     * Check if language has pending changes
     */
    const hasChanges = useCallback((languageId: number) => {
        return pendingChanges[languageId]?.hasChanges || false;
    }, [pendingChanges]);

    /**
     * Save changes for a specific language
     */
    const saveLanguageChanges = useCallback(async (languageId: number) => {
        const pending = pendingChanges[languageId];
        if (!pending?.hasChanges) return;

        try {
            setIsSaving(prev => ({ ...prev, [languageId]: true }));
            setError(null);

            const language = collectionLanguages.find(lang => lang.id === languageId);
            if (!language) {
                throw new Error('Language not found');
            }

            // Save all pending changes
            const promises = [];

            // Description update
            if ('description' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${collectionId}/content`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            language: language.language,
                            description: pending.description || null,
                        }),
                    })
                );
            }

            // Publish status update
            if ('published' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${languageId}/publish`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            published: pending.published
                        }),
                    })
                );
            }

            // Access tier update
            if ('access_tier' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${languageId}/access-tier`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            access_tier: pending.access_tier
                        })
                    })
                );
            }

            // Display skill update
            if ('display_skill' in pending) {
                promises.push(
                    fetch(`/per-language/collection/${languageId}/display-skill`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        },
                        body: JSON.stringify({
                            display_skill: pending.display_skill
                        })
                    })
                );
            }

            // Execute all updates
            const responses = await Promise.all(promises);
            const failedResponses = responses.filter(response => !response.ok);

            if (failedResponses.length > 0) {
                throw new Error(`${failedResponses.length} update(s) failed`);
            }

            // Update local state with pending changes
            setCollectionLanguages(prev =>
                prev.map(lang => {
                    if (lang.id === languageId) {
                        return {
                            ...lang,
                            ...pending
                        };
                    }
                    return lang;
                })
            );

            // Clear pending changes for this language
            setPendingChanges(prev => {
                const newPending = { ...prev };
                delete newPending[languageId];
                return newPending;
            });

            const langInfo = getLanguageInfo(language.language);
            setSuccess(`${langInfo.name} changes saved successfully`);

        } catch (error: any) {
            console.error('[CollectionPerlanguage] Error saving changes:', error);
            setError(`Failed to save changes: ${error.message}`);
        } finally {
            setIsSaving(prev => ({ ...prev, [languageId]: false }));
        }
    }, [collectionId, collectionLanguages, pendingChanges]);

    /**
     * Delete collection language
     */
    const handleDeleteLanguage = useCallback(async (languageId: number, languageName: string) => {
        if (!confirm(`Are you sure you want to delete the ${languageName} collection language?`)) {
            return;
        }

        try {
            const response = await fetch(`/per-language/collection/${languageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status}`);
            }

            setCollectionLanguages(prev => prev.filter(lang => lang.id !== languageId));

            // Clear pending changes for deleted language
            setPendingChanges(prev => {
                const newPending = { ...prev };
                delete newPending[languageId];
                return newPending;
            });

            setSuccess(`${languageName} collection language deleted`);

        } catch (error: any) {
            setError(`Failed to delete ${languageName}: ${error.message}`);
        }
    }, []);

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

        // Use abbreviations for labels
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

    return (
        <Stack spacing={6}>
            {/* Error/Success Messages */}
            {error && (
                <Alert variant="danger" title="Error" closable onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" title="Success" closable onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Add New Language Section */}
            <Box>
                <Box paddingBottom={3}>
                    <Typography variant="delta">
                        Collection Per-Language Management
                    </Typography>
                </Box>
                <Stack spacing={4}>
                    <Select
                        label="Choose Collection Target Language"
                        placeholder="Select a language to create collection content"
                        value={targetLanguage}
                        onChange={handleLanguageSelect}
                        disabled={isCreatingRecord || !collectionId}
                    >
                        {SUPPORTED_LANGUAGES
                            .filter(lang => !collectionLanguages.some(cLang => cLang.language === lang.code))
                            .map((lang) => (
                                <Option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </Option>
                            ))}
                    </Select>

                    {!collectionId && (
                        <Box padding={3} background="neutral100" borderRadius="4px">
                            <Typography variant="pi" color="neutral600">
                                Please save the collection first to enable per-language management.
                            </Typography>
                        </Box>
                    )}

                    {isCreatingRecord && (
                        <Box padding={2} background="primary100" borderRadius="4px">
                            <Typography variant="pi" color="primary600">
                                Creating collection language record...
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>

            {/* Existing Languages Section */}
            {collectionLanguages.length > 0 && (
                <Box>
                    <Box paddingBottom={3}>
                        <Typography variant="delta">
                            Existing Collection Languages ({collectionLanguages.length})
                        </Typography>
                    </Box>
                    <Stack spacing={4}>
                        {collectionLanguages.map((lang) => {
                            const langInfo = getLanguageInfo(lang.language);
                            const skillOptions = getDisplaySkillOptions(lang.language);
                            const skillLabel = getSkillLabel(lang.language);
                            const languageHasChanges = hasChanges(lang.id);

                            return (
                                <Card key={lang.id}>
                                    <CardHeader>
                                        <Flex justifyContent="space-between" alignItems="center">
                                            <Flex alignItems="center" gap={2}>
                                                <Typography variant="beta">
                                                    {langInfo.name}
                                                </Typography>
                                                <Badge
                                                    backgroundColor={getCurrentValue(lang, 'published') ? 'success100' : 'neutral100'}
                                                    textColor={getCurrentValue(lang, 'published') ? 'success600' : 'neutral600'}
                                                >
                                                    {getCurrentValue(lang, 'published') ? 'Published' : 'Draft'}
                                                </Badge>
                                                {getCurrentValue(lang, 'access_tier') && (
                                                    <Badge
                                                        backgroundColor="primary100"
                                                        textColor="primary600"
                                                    >
                                                        {getCurrentValue(lang, 'access_tier')}
                                                    </Badge>
                                                )}
                                                {getCurrentValue(lang, 'display_skill') && (
                                                    <Badge
                                                        backgroundColor="secondary100"
                                                        textColor="secondary600"
                                                    >
                                                        {getCurrentValue(lang, 'display_skill')}
                                                    </Badge>
                                                )}
                                                {languageHasChanges && (
                                                    <Badge
                                                        backgroundColor="warning100"
                                                        textColor="warning600"
                                                    >
                                                        Unsaved Changes
                                                    </Badge>
                                                )}
                                            </Flex>
                                            <IconButton
                                                onClick={() => handleDeleteLanguage(lang.id, langInfo.name)}
                                                label={`Delete ${langInfo.name}`}
                                                variant="ghost"
                                            >
                                                <Trash />
                                            </IconButton>
                                        </Flex>
                                    </CardHeader>
                                    <CardBody>
                                        <Stack spacing={4}>
                                            {/* Description Field */}
                                            <Textarea
                                                label="Description"
                                                value={getCurrentValue(lang, 'description') || ''}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                                    updatePendingChange(lang.id, 'description', e.target.value);
                                                }}
                                                style={{ minHeight: '100px' }}
                                                hint="Collection description for this language (optional for single-article collections)"
                                            />

                                            {/* Improved Controls Layout */}
                                            <Stack spacing={3}>
                                                {/* Row 1: Published and Access Tier */}
                                                <Flex gap={6} wrap="wrap">
                                                    <Box minWidth="120px">
                                                        <Flex direction="column" gap={1}>
                                                            <Typography variant="pi" fontWeight="bold">Published</Typography>
                                                            <ToggleCheckbox
                                                                checked={Boolean(getCurrentValue(lang, 'published')) || false}  // Ensure it's always a boolean
                                                                onChange={() => {
                                                                    const currentValue = Boolean(getCurrentValue(lang, 'published'));
                                                                    updatePendingChange(lang.id, 'published', !currentValue);
                                                                }}
                                                            />
                                                        </Flex>
                                                    </Box>
                                                    <Box minWidth="200px" flex="1">
                                                        <SingleSelect
                                                            label="Access Tier"
                                                            value={getCurrentValue(lang, 'access_tier') as string || ''}
                                                            onChange={(value: string) => updatePendingChange(lang.id, 'access_tier', value)}
                                                        >
                                                            <SingleSelectOption value="">Select tier</SingleSelectOption>
                                                            <SingleSelectOption value="Free">Free</SingleSelectOption>
                                                            <SingleSelectOption value="Login">Login Required</SingleSelectOption>
                                                            <SingleSelectOption value="Premium">Premium</SingleSelectOption>
                                                        </SingleSelect>
                                                    </Box>
                                                </Flex>

                                                {/* Row 2: Skill Level */}
                                                <Box minWidth="200px" maxWidth="300px">
                                                    <SingleSelect
                                                        label={skillLabel}
                                                        value={getCurrentValue(lang, 'display_skill') as string || ''}
                                                        onChange={(value: string) => updatePendingChange(lang.id, 'display_skill', value)}
                                                    >
                                                        <SingleSelectOption value="">Select level</SingleSelectOption>
                                                        {skillOptions.map(option => (
                                                            <SingleSelectOption key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SingleSelectOption>
                                                        ))}
                                                    </SingleSelect>
                                                </Box>
                                            </Stack>

                                            {/* Save Button */}
                                            {languageHasChanges && (
                                                <Flex justifyContent="flex-end" paddingTop={2}>
                                                    <Button
                                                        onClick={() => saveLanguageChanges(lang.id)}
                                                        disabled={isSaving[lang.id]}
                                                        loading={isSaving[lang.id]}
                                                        startIcon={<Check />}
                                                        size="S"
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </Flex>
                                            )}
                                        </Stack>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

export default CollectionPerlanguageField;