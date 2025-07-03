// admin/src/components/CategorySelector/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useFetchClient } from "@strapi/strapi/admin";
import {
    Box,
    Typography,
    Flex,
    Button,
    SingleSelect,
    SingleSelectOption,
    Field
} from '@strapi/design-system';

interface CategorySelectorProps {
    name?: string;
    value?: string | number | null;
    onChange?: (e: { target: { name: string; value: any } }) => void;
    intlLabel?: { id: string; defaultMessage: string };
    required?: boolean;
    error?: string;
    description?: { id: string; defaultMessage: string };
    disabled?: boolean;
    attribute?: any;
    placeholder?: { id: string; defaultMessage: string };
    contentTypeUID?: string;
    multiple?: boolean;
    withDefaultValue?: boolean;
    type?: string;
    options?: any[];
    labelAction?: any;
    hint?: string;
    mainField?: any;
    unique?: boolean;
    initialValue?: any;
    rawError?: any;
}

interface Taxon {
    id: number;
    name: string;
    url: string;
}

interface Category {
    id: number;
    name: string;
    url: string;
    order: number;
    taxon?: Taxon;
}

const CategorySelector: React.FC<CategorySelectorProps> = (allProps) => {
    // COMPLETE PROP ISOLATION: Extract only what we need, discard everything else
    const {
        name = 'category_id',
        value = null,
        onChange = () => { },
        required = false,
        error = '',
        disabled = false,
    } = allProps || {};

    console.log('[CategorySelector] Component rendered with safe props:', {
        name, value, required, disabled, error,
        hasOnChange: typeof onChange === 'function'
    });

    // State management
    const [taxons, setTaxons] = useState<Taxon[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [selectedTaxonId, setSelectedTaxonId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoadingValue, setIsLoadingValue] = useState(false);

    const { get } = useFetchClient();

    // Parse value safely
    const parseValueToCategoryId = useCallback((rawValue: any): number | null => {
        console.log('[CategorySelector] Parsing value:', { rawValue, type: typeof rawValue });

        if (!rawValue) return null;

        if (typeof rawValue === 'number') {
            return rawValue;
        }

        if (typeof rawValue === 'string') {
            const parsed = parseInt(rawValue, 10);
            return isNaN(parsed) ? null : parsed;
        }

        console.warn('[CategorySelector] Unexpected value type:', typeof rawValue);
        return null;
    }, []);

    // Initialize component
    useEffect(() => {
        if (!allProps) {
            setInternalError('Component not properly initialized.');
            return;
        }
        setIsInitialized(true);
        console.log('[CategorySelector] ✅ Component initialized');
    }, [allProps]);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (internalError || success) {
            const timer = setTimeout(() => {
                setInternalError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [internalError, success]);

    // Fetch taxons on mount
    useEffect(() => {
        if (!isInitialized) return;

        const fetchTaxons = async () => {
            try {
                setLoading(true);
                console.log('[CategorySelector] Fetching taxons...');

                const response = await get('/category-manager/taxons');
                let taxonData: Taxon[] = [];

                if (Array.isArray(response.data)) {
                    taxonData = response.data;
                } else if (Array.isArray(response)) {
                    taxonData = response;
                } else if (response.data && Array.isArray(response.data.data)) {
                    taxonData = response.data.data;
                }

                const validTaxons = taxonData.filter(item =>
                    item && typeof item.id === 'number' && typeof item.name === 'string'
                );

                setTaxons(validTaxons);
                console.log('[CategorySelector] ✅ Taxons loaded:', validTaxons.length);

                if (validTaxons.length === 0) {
                    setInternalError('No taxonomies found. Create taxonomies first.');
                }
            } catch (err: any) {
                console.error('[CategorySelector] Error fetching taxons:', err);
                setInternalError('Failed to load taxonomies.');
                setTaxons([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTaxons();
    }, [get, isInitialized]);

    // Fetch ALL categories on mount (for loading saved values)
    useEffect(() => {
        if (!isInitialized) return;

        const fetchAllCategories = async () => {
            try {
                console.log('[CategorySelector] Fetching all categories...');

                const response = await get('/category-manager/categories');
                let categoryData: Category[] = [];

                if (Array.isArray(response.data)) {
                    categoryData = response.data;
                } else if (Array.isArray(response)) {
                    categoryData = response;
                } else if (response.data && Array.isArray(response.data.data)) {
                    categoryData = response.data.data;
                }

                const validCategories = categoryData.filter(item =>
                    item && typeof item.id === 'number' && typeof item.name === 'string'
                );

                setAllCategories(validCategories);
                console.log('[CategorySelector] ✅ All categories loaded:', validCategories.length);
            } catch (err: any) {
                console.error('[CategorySelector] Error fetching all categories:', err);
            }
        };

        fetchAllCategories();
    }, [get, isInitialized]);

    // Load saved value when categories are available
    useEffect(() => {
        if (!isInitialized || allCategories.length === 0) return;

        setIsLoadingValue(true);

        try {
            const categoryId = parseValueToCategoryId(value);
            console.log('[CategorySelector] Loading saved value:', { value, categoryId });

            if (categoryId) {
                const savedCategory = allCategories.find(cat => cat.id === categoryId);

                if (savedCategory) {
                    setSelectedCategoryId(categoryId);

                    if (savedCategory.taxon) {
                        setSelectedTaxonId(savedCategory.taxon.id);
                        console.log('[CategorySelector] ✅ Restored selection:', {
                            taxonId: savedCategory.taxon.id,
                            taxonName: savedCategory.taxon.name,
                            categoryId: categoryId,
                            categoryName: savedCategory.name
                        });
                    } else {
                        console.warn('[CategorySelector] Category found but no taxon info:', savedCategory);
                    }
                } else {
                    console.warn('[CategorySelector] Category ID not found in available categories:', categoryId);
                }
            } else {
                setSelectedCategoryId(null);
                setSelectedTaxonId(null);
                console.log('[CategorySelector] No saved value to load');
            }
        } catch (err) {
            console.error('[CategorySelector] Error loading saved value:', err);
        } finally {
            setIsLoadingValue(false);
        }
    }, [value, allCategories, isInitialized, parseValueToCategoryId]);

    // Fetch categories for selected taxon
    useEffect(() => {
        if (!selectedTaxonId) {
            setCategories([]);
            return;
        }

        const fetchCategoriesForTaxon = async () => {
            try {
                setLoading(true);
                console.log('[CategorySelector] Fetching categories for taxon:', selectedTaxonId);

                const response = await get(`/category-manager/categories/by-taxon/${selectedTaxonId}`);
                let categoryData: Category[] = [];

                if (Array.isArray(response.data)) {
                    categoryData = response.data;
                } else if (Array.isArray(response)) {
                    categoryData = response;
                } else if (response.data && Array.isArray(response.data.data)) {
                    categoryData = response.data.data;
                }

                const validCategories = categoryData.filter(item =>
                    item && typeof item.id === 'number' && typeof item.name === 'string'
                );

                validCategories.sort((a, b) =>
                    (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name)
                );

                setCategories(validCategories);
                console.log('[CategorySelector] ✅ Categories for taxon loaded:', validCategories.length);

            } catch (err: any) {
                console.error('[CategorySelector] Error fetching categories for taxon:', err);
                setInternalError('Failed to load categories.');
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoriesForTaxon();
    }, [selectedTaxonId, get]);

    // Safe change handler - only sends category ID
    const handleValueChange = useCallback((categoryId: number | null) => {
        console.log('[CategorySelector] 🎯 Sending category ID to form:', categoryId);

        try {
            const valueToSave = categoryId ? categoryId.toString() : null;
            onChange({ target: { name, value: valueToSave } });
            console.log('[CategorySelector] ✅ Value sent successfully:', valueToSave);
        } catch (err) {
            console.error('[CategorySelector] Error sending value change:', err);
            setInternalError('Error updating category selection');
        }
    }, [name, onChange]);

    // Clear selection
    const handleClear = useCallback(() => {
        if (isLoadingValue) return;

        setSelectedTaxonId(null);
        setSelectedCategoryId(null);
        handleValueChange(null);
        setSuccess('Selection cleared');
    }, [isLoadingValue, handleValueChange]);

    // Handle taxon selection
    const handleTaxonChange = useCallback((value: string) => {
        if (!isInitialized || isLoadingValue) return;

        console.log('[CategorySelector] Taxon changed to:', value);

        const numericTaxonId = value ? parseInt(value, 10) : null;

        setSelectedTaxonId(numericTaxonId);

        if (selectedCategoryId && numericTaxonId !== selectedTaxonId) {
            setSelectedCategoryId(null);
            handleValueChange(null);
        }

        if (numericTaxonId) {
            const selectedTaxon = taxons.find(t => t.id === numericTaxonId);
            if (selectedTaxon) {
                setSuccess(`Selected taxonomy: ${selectedTaxon.name}. Choose a category to complete.`);
            }
        }

        console.log('[CategorySelector] ✅ Taxon change complete:', numericTaxonId);
    }, [isInitialized, isLoadingValue, selectedCategoryId, selectedTaxonId, taxons, handleValueChange]);

    // Handle category selection
    const handleCategoryChange = useCallback((value: string) => {
        if (!isInitialized || isLoadingValue) return;

        console.log('[CategorySelector] Category changed to:', value);

        const numericCategoryId = value ? parseInt(value, 10) : null;

        setSelectedCategoryId(numericCategoryId);
        handleValueChange(numericCategoryId);

        if (numericCategoryId && selectedTaxonId) {
            const selectedTaxon = taxons.find(t => t.id === selectedTaxonId);
            const selectedCategory = categories.find(c => c.id === numericCategoryId);

            if (selectedTaxon && selectedCategory) {
                setSuccess(`Selected: ${selectedTaxon.name} → ${selectedCategory.name}`);
            }
        }

        console.log('[CategorySelector] ✅ Category change complete:', numericCategoryId);
    }, [isInitialized, isLoadingValue, selectedTaxonId, taxons, categories, handleValueChange]);

    // Get display names
    const selectedTaxonName = taxons.find(t => t.id === selectedTaxonId)?.name || '';
    const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name ||
        allCategories.find(c => c.id === selectedCategoryId)?.name || '';

    if (!isInitialized) {
        return (
            <Box
                padding={4}
                background="danger100"
                borderRadius="4px"
                style={{ border: '1px solid #f28b82' }}
            >
                <Typography variant="omega" fontWeight="bold" textColor="danger600">
                    Configuration Error
                </Typography>
                <Typography variant="pi" textColor="neutral700" marginTop={1}>
                    Component not properly initialized.
                </Typography>
            </Box>
        );
    }

    return (
        <Box padding={0}>
            {/* Error Messages */}
            {(internalError || error) && (
                <Box
                    padding={3}
                    marginBottom={4}
                    background="danger100"
                    borderRadius="4px"
                    style={{ border: '1px solid #f28b82' }}
                >
                    <Flex justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography variant="omega" fontWeight="bold" textColor="danger600">
                                Error
                            </Typography>
                            <Typography variant="pi" textColor="neutral700" marginTop={1}>
                                {internalError || error}
                            </Typography>
                        </Box>
                        <Button
                            variant="tertiary"
                            onClick={() => setInternalError(null)}
                            size="S"
                        >
                            ✕
                        </Button>
                    </Flex>
                </Box>
            )}

            {/* Success Messages */}
            {success && (
                <Box
                    padding={3}
                    marginBottom={4}
                    background="success100"
                    borderRadius="4px"
                    style={{ border: '1px solid #4caf50' }}
                >
                    <Flex justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography variant="omega" fontWeight="bold" textColor="success600">
                                Success
                            </Typography>
                            <Typography variant="pi" textColor="neutral700" marginTop={1}>
                                {success}
                            </Typography>
                        </Box>
                        <Button
                            variant="tertiary"
                            onClick={() => setSuccess(null)}
                            size="S"
                        >
                            ✕
                        </Button>
                    </Flex>
                </Box>
            )}

            {/* Loading Value Indicator */}
            {isLoadingValue && (
                <Box
                    padding={3}
                    marginBottom={4}
                    background="primary100"
                    borderRadius="4px"
                    style={{ border: '1px solid #2196f3' }}
                >
                    <Typography variant="omega" fontWeight="bold" textColor="primary600">
                        Loading saved category selection...
                    </Typography>
                </Box>
            )}

            {/* Main Selection Interface */}
            <Flex direction="column" gap={4} width="100%">
                {/* Taxonomy and Category Selection Row */}
                <Flex gap={4} wrap="wrap" width="100%">
                    {/* Taxonomy Selection */}
                    <Box flex="1" style={{ minWidth: '250px' }}>
                        <Field.Root error={error} required={required} name={`${name}_taxon`}>
                            <Field.Label>Taxonomy</Field.Label>
                            <SingleSelect
                                value={selectedTaxonId?.toString() || ''}
                                onChange={handleTaxonChange}
                                disabled={loading || taxons.length === 0 || disabled || isLoadingValue}
                                placeholder="Select a taxonomy..."
                            >
                                {taxons.map((taxon) => (
                                    <SingleSelectOption key={`taxon-${taxon.id}`} value={taxon.id.toString()}>
                                        {taxon.name}
                                    </SingleSelectOption>
                                ))}
                            </SingleSelect>
                            <Field.Hint>Choose the content type category</Field.Hint>
                            <Field.Error />
                        </Field.Root>
                    </Box>

                    {/* Category Selection */}
                    <Box flex="1" style={{ minWidth: '250px' }}>
                        <Field.Root error={error} required={false} name={name}>
                            <Field.Label>Category</Field.Label>
                            <SingleSelect
                                value={selectedCategoryId?.toString() || ''}
                                onChange={handleCategoryChange}
                                disabled={loading || !selectedTaxonId || categories.length === 0 || disabled || isLoadingValue}
                                placeholder={
                                    !selectedTaxonId
                                        ? "First select a taxonomy"
                                        : categories.length === 0 && !loading
                                            ? "No categories available"
                                            : "Choose a category..."
                                }
                            >
                                {categories.map((category) => (
                                    <SingleSelectOption key={`category-${category.id}`} value={category.id.toString()}>
                                        {category.name} {category.order > 0 ? `(#${category.order})` : ''}
                                    </SingleSelectOption>
                                ))}
                            </SingleSelect>
                            <Field.Hint>
                                {selectedTaxonId ? `Categories in ${selectedTaxonName}` : "Select a taxonomy first"}
                            </Field.Hint>
                            <Field.Error />
                        </Field.Root>
                    </Box>
                </Flex>

                {/* Selection Display and Clear Button */}
                {selectedTaxonId && selectedCategoryId && !isLoadingValue && (
                    <Flex direction="column" gap={3} width="100%">
                        {/* Selection Display */}
                        <Box
                            padding={3}
                            background="primary100"
                            borderRadius="4px"
                            width="100%"
                        >
                            <Typography variant="omega" textColor="primary600">
                                ✓ Selected: {selectedTaxonName} → {selectedCategoryName}
                            </Typography>
                        </Box>

                        {/* Clear Button */}
                        <Flex justifyContent="flex-end" width="100%">
                            <Button
                                variant="tertiary"
                                onClick={handleClear}
                                size="S"
                            >
                                Clear Selection
                            </Button>
                        </Flex>
                    </Flex>
                )}

                {/* Clear Button Only (when partially selected) */}
                {(selectedTaxonId || selectedCategoryId) && !(selectedTaxonId && selectedCategoryId) && !disabled && !isLoadingValue && (
                    <Flex justifyContent="flex-end" gap={2} width="100%">
                        <Button
                            variant="tertiary"
                            onClick={handleClear}
                            size="S"
                        >
                            Clear Selection
                        </Button>
                    </Flex>
                )}

                {/* Loading State */}
                {loading && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="omega" textColor="neutral600">
                            Loading...
                        </Typography>
                    </Box>
                )}

                {/* Helpful Messages */}
                {taxons.length === 0 && !loading && !internalError && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="omega" textColor="neutral600">
                            No taxonomies found. Create taxonomies first in Category Manager.
                        </Typography>
                    </Box>
                )}

                {selectedTaxonId && categories.length === 0 && !loading && !internalError && (
                    <Box padding={3} background="neutral100" borderRadius="4px">
                        <Typography variant="omega" textColor="neutral600">
                            No categories found for {selectedTaxonName}. Create categories in Category Manager.
                        </Typography>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};

export default CategorySelector;