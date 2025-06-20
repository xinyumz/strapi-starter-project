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
    value?: { taxonId: number | null; categoryId: number | null } | string | null;
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
}

const CategorySelector: React.FC<CategorySelectorProps> = (props) => {
    // Log received props for debugging
    console.log('CategorySelector props:', props);

    // Provide safe defaults for all props
    const {
        name = 'Category',
        value = null,
        onChange = () => { },
        intlLabel = { id: 'category-selector.label', defaultMessage: 'Category' },
        required = false,
        error = '',
        description,
        disabled = false,
        attribute,
        placeholder,
        contentTypeUID = '',
        multiple = false,
        withDefaultValue = false,
        type = '',
        options = [],
        labelAction,
        hint = ''
    } = props || {};

    // State management
    const [taxons, setTaxons] = useState<Taxon[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedTaxon, setSelectedTaxon] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const { get, put } = useFetchClient();
    const toggleNotification = useNotification();

    const { modifiedData, initialData, onChange: formOnChange } = useCMEditViewDataManager();

    // Helper function to parse value (handles both string and object formats)
    const parseValue = useCallback((rawValue: any) => {
        console.log('[CategorySelector] Parsing value:', { rawValue, type: typeof rawValue });

        if (!rawValue) return null;

        try {
            // If it's already an object, return it
            if (typeof rawValue === 'object' && rawValue.taxonId !== undefined) {
                return rawValue;
            }

            // If it's a string, try to parse it as JSON
            if (typeof rawValue === 'string') {
                const parsed = JSON.parse(rawValue);
                if (parsed && typeof parsed === 'object') {
                    console.log('[CategorySelector] ✅ Parsed string value to object:', parsed);
                    return parsed;
                }
            }
        } catch (err) {
            console.error('[CategorySelector] Error parsing value:', err);
        }

        return null;
    }, []);

    // Handle case where props might be completely undefined
    useEffect(() => {
        if (!props) {
            console.warn('[CategorySelector] Props are undefined - using defaults');
            setInternalError('Component not properly initialized. Please check field configuration.');
            return;
        }
        setIsInitialized(true);
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

    // Enhanced logging to see what value is being passed from Strapi
    useEffect(() => {
        console.log('[CategorySelector] Raw value from Strapi:', {
            value,
            type: typeof value,
            stringified: JSON.stringify(value),
            modifiedDataCategory: modifiedData?.Category,
            initialDataCategory: initialData?.Category
        });
    }, [value, modifiedData, initialData]);

    // FIXED: Initialize from value prop with proper parsing
    useEffect(() => {
        if (!isInitialized) return;

        try {
            const parsedValue = parseValue(value);
            console.log('[CategorySelector] Processing parsed value:', parsedValue);

            if (parsedValue && (parsedValue.taxonId || parsedValue.categoryId)) {
                const newTaxonId = typeof parsedValue.taxonId === 'number' ? parsedValue.taxonId : null;
                const newCategoryId = typeof parsedValue.categoryId === 'number' ? parsedValue.categoryId : null;

                setSelectedTaxon(newTaxonId);
                setSelectedCategory(newCategoryId);

                console.log('[CategorySelector] ✅ Loaded saved values:', { newTaxonId, newCategoryId });
            } else {
                setSelectedTaxon(null);
                setSelectedCategory(null);
                console.log('[CategorySelector] No saved values to load');
            }
        } catch (err) {
            console.error('[CategorySelector] Error initializing from value:', err);
            setSelectedTaxon(null);
            setSelectedCategory(null);
        }
    }, [value, isInitialized, parseValue]);

    // Fetch taxons on mount
    useEffect(() => {
        if (!isInitialized) return;

        const fetchTaxons = async () => {
            try {
                setLoading(true);
                setInternalError(null);

                console.log('[CategorySelector] Fetching taxons...');
                const response = await get('/category-manager/taxons');

                let taxonData: Taxon[] = [];

                if (Array.isArray(response.data)) {
                    taxonData = response.data;
                } else if (Array.isArray(response)) {
                    taxonData = response;
                } else if (response.data && Array.isArray(response.data.data)) {
                    taxonData = response.data.data;
                } else if (response.data && typeof response.data === 'object') {
                    taxonData = [response.data];
                } else {
                    console.warn('[CategorySelector] Unexpected response structure:', response);
                    taxonData = [];
                }

                const validTaxons = taxonData.filter(item =>
                    item &&
                    typeof item === 'object' &&
                    typeof item.id === 'number' &&
                    typeof item.name === 'string'
                );

                setTaxons(validTaxons);
                console.log('[CategorySelector] ✅ Taxons loaded:', validTaxons.length);

                if (validTaxons.length === 0) {
                    setInternalError('No taxonomies found. Please create taxonomies in Category Manager first.');
                }
            } catch (err: any) {
                console.error('[CategorySelector] Error fetching taxons:', err);
                setInternalError('Failed to load taxonomies. Please check your connection.');
                setTaxons([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTaxons();
    }, [get, isInitialized]);

    // Fetch categories when taxon changes
    useEffect(() => {
        if (!isInitialized) return;

        const fetchCategories = async () => {
            if (!selectedTaxon) {
                setCategories([]);
                return;
            }

            try {
                setLoading(true);
                setInternalError(null);

                console.log('[CategorySelector] Fetching categories for taxon:', selectedTaxon);
                const response = await get(`/category-manager/categories/by-taxon/${selectedTaxon}`);

                let categoryData: Category[] = [];

                if (Array.isArray(response.data)) {
                    categoryData = response.data;
                } else if (Array.isArray(response)) {
                    categoryData = response;
                } else if (response.data && Array.isArray(response.data.data)) {
                    categoryData = response.data.data;
                } else if (response.data && typeof response.data === 'object') {
                    categoryData = [response.data];
                } else {
                    console.warn('[CategorySelector] Unexpected categories response:', response);
                    categoryData = [];
                }

                const validCategories = categoryData.filter(item =>
                    item &&
                    typeof item === 'object' &&
                    typeof item.id === 'number' &&
                    typeof item.name === 'string'
                );

                setCategories(validCategories);
                console.log('[CategorySelector] ✅ Categories loaded:', validCategories.length);

            } catch (err: any) {
                console.error('[CategorySelector] Error fetching categories:', err);
                setInternalError('Failed to load categories for selected taxonomy.');
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [selectedTaxon, get, isInitialized]);

    // Enhanced form change detection
    const forceFormDirty = useCallback((newValue: any) => {
        console.log('[CategorySelector] Force form dirty with value:', newValue);

        // Multiple attempts to trigger form change detection
        if (onChange) {
            onChange({ target: { name, value: newValue } });
        }

        if (formOnChange) {
            formOnChange({ target: { name, value: newValue } });
        }

        // Try dispatching custom events
        setTimeout(() => {
            const event = new CustomEvent('strapi-field-change', {
                bubbles: true,
                detail: { name, value: newValue }
            });
            document.dispatchEvent(event);
        }, 10);

        // Try triggering form change events
        setTimeout(() => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                const changeEvent = new Event('change', { bubbles: true });
                form.dispatchEvent(changeEvent);
            });
        }, 20);

    }, [name, onChange, formOnChange]);

    // Safe find functions
    const findTaxonById = useCallback((id: number | null): Taxon | undefined => {
        if (!id || !Array.isArray(taxons)) return undefined;
        return taxons.find(taxon => taxon.id === id);
    }, [taxons]);

    const findCategoryById = useCallback((id: number | null): Category | undefined => {
        if (!id || !Array.isArray(categories)) return undefined;
        return categories.find(category => category.id === id);
    }, [categories]);

    // Enhanced event handlers
    const handleTaxonChange = useCallback((taxonId: string) => {
        if (!isInitialized) return;

        try {
            const numericTaxonId = taxonId ? parseInt(taxonId, 10) : null;
            setSelectedTaxon(numericTaxonId);
            setSelectedCategory(null);

            const newValue = numericTaxonId ? { taxonId: numericTaxonId, categoryId: null } : null;

            console.log('[CategorySelector] Taxon changed - forcing form dirty:', newValue);
            forceFormDirty(newValue);

            if (numericTaxonId) {
                const selectedTaxonObj = findTaxonById(numericTaxonId);
                if (selectedTaxonObj) {
                    setSuccess(`Selected taxonomy: ${selectedTaxonObj.name}. Choose a category to complete.`);
                }
            }

            console.log('[CategorySelector] Taxon change complete');
        } catch (err) {
            console.error('[CategorySelector] Error handling taxon change:', err);
            setInternalError('Error selecting taxonomy');
        }
    }, [isInitialized, forceFormDirty, findTaxonById]);

    const handleCategoryChange = useCallback((categoryId: string) => {
        console.log('[CategorySelector] handleCategoryChange called with:', categoryId);

        if (!isInitialized) return;

        try {
            const numericCategoryId = categoryId ? parseInt(categoryId, 10) : null;
            setSelectedCategory(numericCategoryId);

            const newValue = selectedTaxon && numericCategoryId
                ? { taxonId: selectedTaxon, categoryId: numericCategoryId }
                : selectedTaxon
                    ? { taxonId: selectedTaxon, categoryId: null }
                    : null;

            console.log('[CategorySelector] Category changed - forcing form dirty:', newValue);
            forceFormDirty(newValue);

            if (numericCategoryId && selectedTaxon) {
                const selectedTaxonObj = findTaxonById(selectedTaxon);
                const selectedCategoryObj = findCategoryById(numericCategoryId);

                if (selectedTaxonObj && selectedCategoryObj) {
                    setSuccess(`Selected: ${selectedTaxonObj.name} → ${selectedCategoryObj.name}`);
                }
            }

            console.log('[CategorySelector] Category change complete');
        } catch (err) {
            console.error('[CategorySelector] Error handling category change:', err);
            setInternalError('Error selecting category');
        }
    }, [selectedTaxon, isInitialized, forceFormDirty, findTaxonById, findCategoryById]);

    const handleClear = useCallback(() => {
        if (!isInitialized) return;

        try {
            setSelectedTaxon(null);
            setSelectedCategory(null);

            console.log('[CategorySelector] Clearing selection - forcing form dirty');
            forceFormDirty(null);

            setSuccess('Category selection cleared');
            console.log('[CategorySelector] Clear complete');
        } catch (err) {
            console.error('[CategorySelector] Error clearing selection:', err);
            setInternalError('Error clearing selection');
        }
    }, [isInitialized, forceFormDirty]);

    // Get display names safely
    const selectedTaxonName = (() => {
        const taxon = findTaxonById(selectedTaxon);
        return taxon ? taxon.name : '';
    })();

    const selectedCategoryName = (() => {
        const category = findCategoryById(selectedCategory);
        return category ? category.name : '';
    })();

    // Show initialization error if props are completely missing
    if (!isInitialized) {
        return (
            <Stack spacing={4}>
                <Alert variant="danger" title="Configuration Error">
                    Category selector component not properly initialized.
                    Please check the field configuration in your content type.
                </Alert>
            </Stack>
        );
    }

    // Test save function (for debugging)
    const testSave = async () => {
        console.log('[CategorySelector] Testing manual save with current value:', { selectedTaxon, selectedCategory });

        const articleId = modifiedData?.id;
        const testValue = selectedTaxon && selectedCategory ? { taxonId: selectedTaxon, categoryId: selectedCategory } : null;

        if (articleId && testValue) {
            try {
                const response = await put(`/content-manager/collection-types/api::article.article/${articleId}`, {
                    Category: testValue
                });

                console.log('[CategorySelector] Test save result:', response);
                setSuccess('Test save completed successfully');
            } catch (error) {
                console.error('[CategorySelector] Test save error:', error);
                setInternalError('Test save failed - check console for details');
            }
        } else {
            setInternalError('No article ID or category selection for test save');
        }
    };

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

            {/* Current Selection Display */}
            {selectedTaxon && selectedCategory && selectedTaxonName && selectedCategoryName && (
                <Box padding={3} background="primary100" borderRadius="4px">
                    <Typography variant="pi" textColor="primary700">
                        <strong>Selected:</strong> {selectedTaxonName} → {selectedCategoryName}
                    </Typography>
                    <Typography variant="pi" textColor="primary600" style={{ marginTop: '4px' }}>
                        Click Save to persist your changes.
                    </Typography>
                </Box>
            )}

            {/* Taxonomy Selection */}
            <Select
                label="Taxonomy"
                placeholder="Select a taxonomy..."
                value={selectedTaxon?.toString() || ''}
                onChange={handleTaxonChange}
                required={required}
                disabled={loading || taxons.length === 0 || disabled}
                error={error}
                hint="Choose the content type category"
            >
                {Array.isArray(taxons) && taxons.map((taxon) => (
                    <Option key={`taxon-${taxon.id}`} value={taxon.id.toString()}>
                        {taxon.name}
                    </Option>
                ))}
            </Select>

            {/* Category Selection */}
            <Select
                label="Category"
                placeholder={
                    !selectedTaxon
                        ? "First select a taxonomy"
                        : categories.length === 0 && !loading
                            ? `No categories available`
                            : `Choose a category...`
                }
                value={selectedCategory?.toString() || ''}
                onChange={handleCategoryChange}
                disabled={loading || !selectedTaxon || categories.length === 0 || disabled}
                hint={selectedTaxon ? `Available categories` : "Select a taxonomy first"}
            >
                {Array.isArray(categories) && categories.map((category) => (
                    <Option key={`category-${category.id}`} value={category.id.toString()}>
                        {category.name} {category.order > 0 ? `(#${category.order})` : ''}
                    </Option>
                ))}
            </Select>

            {/* Helpful Messages */}
            {taxons.length === 0 && !loading && !internalError && !error && (
                <Box padding={3} background="neutral100" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral600">
                        No taxonomies found. Create some taxonomies first in the Category Manager.
                    </Typography>
                </Box>
            )}

            {selectedTaxon && categories.length === 0 && !loading && !internalError && !error && (
                <Box padding={3} background="neutral100" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral600">
                        No categories found for {selectedTaxonName}. Create some categories first in Category Manager.
                    </Typography>
                </Box>
            )}

            {!selectedTaxon && !selectedCategory && !loading && (
                <Box padding={3} background="neutral100" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral600">
                        <strong>How to use:</strong> Select a taxonomy first, then choose a category.
                        Use the "Save Category" button to save your selection.
                    </Typography>
                </Box>
            )}

            {/* Action Buttons */}
            {(selectedTaxon || selectedCategory) && !disabled && (
                <Flex justifyContent="flex-end" gap={2}>
                    <Button variant="tertiary" onClick={handleClear}>
                        Clear Selection
                    </Button>
                    {/* Working test save button - always visible for testing */}
                    <Button onClick={testSave} variant="secondary" size="S">
                        Save Category
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

            {/* Debug Info (development only) */}
            {process.env.NODE_ENV === 'development' && (
                <Box padding={2} background="neutral50" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral500" style={{ fontSize: '11px' }}>
                        Debug: Value={JSON.stringify({ selectedTaxon, selectedCategory })},
                        RawValue={typeof value === 'string' ? 'STRING' : 'OBJECT'},
                        Loaded={selectedTaxon ? 'YES' : 'NO'}
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