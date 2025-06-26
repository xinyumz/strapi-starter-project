// admin/src/components/CategorySelector/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Stack,
    Select,
    Option,
    Typography,
    Box,
    Flex,
    Button,
    Alert
} from '@strapi/design-system';
import { useFetchClient, useNotification, useCMEditViewDataManager } from '@strapi/helper-plugin';

interface CategorySelectorProps {
    name?: string;
    value?: string | number | null; // Simple string/number for category ID
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

const CategorySelector: React.FC<CategorySelectorProps> = (props) => {
    console.log('[CategorySelector] Component rendered with props:', props);

    const {
        name = 'category_id',
        value = null,
        onChange = () => { },
        intlLabel = { id: 'category-selector.label', defaultMessage: 'Category' },
        required = false,
        error = '',
        description,
        disabled = false,
    } = props || {};

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
    const toggleNotification = useNotification();
    const { modifiedData } = useCMEditViewDataManager();

    // Parse value safely
    const parseValueToCategoryId = useCallback((rawValue: any): number | null => {
        console.log('[CategorySelector] Parsing value:', { rawValue, type: typeof rawValue });

        if (!rawValue) return null;

        // Handle number
        if (typeof rawValue === 'number') {
            return rawValue;
        }

        // Handle string
        if (typeof rawValue === 'string') {
            const parsed = parseInt(rawValue, 10);
            return isNaN(parsed) ? null : parsed;
        }

        console.warn('[CategorySelector] Unexpected value type:', typeof rawValue);
        return null;
    }, []);

    // Initialize component
    useEffect(() => {
        if (!props) {
            setInternalError('Component not properly initialized.');
            return;
        }
        setIsInitialized(true);
        console.log('[CategorySelector] ✅ Component initialized');
    }, [props]);

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
                // Find the category
                const savedCategory = allCategories.find(cat => cat.id === categoryId);

                if (savedCategory) {
                    setSelectedCategoryId(categoryId);

                    // Set taxon if available
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

                // Sort by order then name
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
            // Convert to string as that's what we want to store
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


    // Validate saved category is still valid
    useEffect(() => {
        if (!selectedCategoryId || isLoadingValue || allCategories.length === 0) return;

        const validateCategory = async () => {
            try {
                const savedCategory = allCategories.find(cat => cat.id === selectedCategoryId);

                if (!savedCategory) {
                    console.warn('[CategorySelector] Saved category no longer exists:', selectedCategoryId);
                    setInternalError(`Category ${selectedCategoryId} no longer exists. Please select a new category.`);
                    handleClear();
                    return;
                }

                if (savedCategory.taxon && selectedTaxonId && savedCategory.taxon.id !== selectedTaxonId) {
                    console.warn('[CategorySelector] Category moved to different taxon');
                    setInternalError(`Category has been moved. Please reselect.`);
                    handleClear();
                    return;
                }

                console.log('[CategorySelector] ✅ Category validation passed');
            } catch (err) {
                console.error('[CategorySelector] Category validation error:', err);
            }
        };

        validateCategory();
    }, [selectedCategoryId, allCategories, selectedTaxonId, isLoadingValue, handleClear]);

    // Handle taxon selection
    const handleTaxonChange = useCallback((taxonId: string) => {
        if (!isInitialized || isLoadingValue) return;

        console.log('[CategorySelector] Taxon changed to:', taxonId);

        const numericTaxonId = taxonId ? parseInt(taxonId, 10) : null;

        // Update state immediately to prevent disappearing
        setSelectedTaxonId(numericTaxonId);

        // Clear category selection when taxon changes
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
    const handleCategoryChange = useCallback((categoryId: string) => {
        if (!isInitialized || isLoadingValue) return;

        console.log('[CategorySelector] Category changed to:', categoryId);

        const numericCategoryId = categoryId ? parseInt(categoryId, 10) : null;

        // Update state immediately to prevent disappearing
        setSelectedCategoryId(numericCategoryId);

        // Send value change
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
            <Stack spacing={4}>
                <Alert variant="danger" title="Configuration Error">
                    Component not properly initialized.
                </Alert>
            </Stack>
        );
    }

    return (
        <Stack spacing={4}>
            {/* Error Messages */}
            {(internalError || error) && (
                <Alert variant="danger" title="Error" closable onClose={() => setInternalError(null)}>
                    {internalError || error}
                </Alert>
            )}

            {/* Success Messages */}
            {success && (
                <Alert variant="success" title="Success" closable onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Loading Value Indicator */}
            {isLoadingValue && (
                <Alert variant="default" title="Loading">
                    Loading saved category selection...
                </Alert>
            )}

            {/* Taxonomy and Category Selection - Side by Side */}
            <Flex gap={4} wrap="wrap">
                {/* Taxonomy Selection */}
                <Box flex="1" minWidth="200px">
                    <Select
                        label="Taxonomy"
                        placeholder="Select a taxonomy..."
                        value={selectedTaxonId?.toString() || ''}
                        onChange={handleTaxonChange}
                        required={required}
                        disabled={loading || taxons.length === 0 || disabled || isLoadingValue}
                        error={error}
                        hint="Choose the content type category"
                    >
                        {taxons.map((taxon) => (
                            <Option key={`taxon-${taxon.id}`} value={taxon.id.toString()}>
                                {taxon.name}
                            </Option>
                        ))}
                    </Select>
                </Box>

                {/* Category Selection */}
                <Box flex="1" minWidth="200px">
                    <Select
                        label="Category"
                        placeholder={
                            !selectedTaxonId
                                ? "First select a taxonomy"
                                : categories.length === 0 && !loading
                                    ? "No categories available"
                                    : "Choose a category..."
                        }
                        value={selectedCategoryId?.toString() || ''}
                        onChange={handleCategoryChange}
                        disabled={loading || !selectedTaxonId || categories.length === 0 || disabled || isLoadingValue}
                        hint={selectedTaxonId ? `Categories in ${selectedTaxonName}` : "Select a taxonomy first"}
                    >
                        {categories.map((category) => (
                            <Option key={`category-${category.id}`} value={category.id.toString()}>
                                {category.name} {category.order > 0 ? `(#${category.order})` : ''}
                            </Option>
                        ))}
                    </Select>
                </Box>
            </Flex>

            {/* Current Selection Display */}
            {selectedTaxonId && selectedCategoryId && !isLoadingValue && (
                <Box padding={3} background="primary100" borderRadius="4px" width="100%">
                    <Typography variant="pi" textColor="primary700">
                        Selected: {selectedTaxonName} → {selectedCategoryName}
                    </Typography>
                </Box>
            )}

            {/* Helpful Messages */}
            {taxons.length === 0 && !loading && !internalError && (
                <Box padding={3} background="neutral100" borderRadius="4px" width="100%">
                    <Typography variant="pi" textColor="neutral600">
                        No taxonomies found. Create taxonomies first in Category Manager.
                    </Typography>
                </Box>
            )}

            {selectedTaxonId && categories.length === 0 && !loading && !internalError && (
                <Box padding={3} background="neutral100" borderRadius="4px" width="100%">
                    <Typography variant="pi" textColor="neutral600">
                        No categories found for {selectedTaxonName}. Create categories in Category Manager.
                    </Typography>
                </Box>
            )}

            {!selectedTaxonId && !loading && !isLoadingValue && (
                <Box padding={3} background="neutral100" borderRadius="4px" width="100%">
                    <Typography variant="pi" textColor="neutral600">
                        Select a taxonomy first, then choose a category.
                    </Typography>
                </Box>
            )}

            {/* Action Buttons */}
            {(selectedTaxonId || selectedCategoryId) && !disabled && !isLoadingValue && (
                <Flex justifyContent="flex-end" gap={2}>
                    <Button variant="tertiary" onClick={handleClear}>
                        Clear Selection
                    </Button>
                </Flex>
            )}

            {/* Loading State */}
            {loading && (
                <Box padding={2} background="neutral100" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral500">
                        Loading...
                    </Typography>
                </Box>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <Box padding={2} background="neutral50" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral500" style={{ fontSize: '11px' }}>
                        Debug: TaxonID={selectedTaxonId}, CategoryID={selectedCategoryId},
                        Value="{value}", Loading={isLoadingValue ? 'YES' : 'NO'}
                    </Typography>
                </Box>
            )}

            {/* Description */}
            {description && (
                <Typography variant="pi" textColor="neutral600">
                    {description.defaultMessage}
                </Typography>
            )}
        </Stack>
    );
};

export default CategorySelector;