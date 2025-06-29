// admin/src/components/CategorySelector/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useFetchClient } from "@strapi/strapi/admin";

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
    const handleTaxonChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        if (!isInitialized || isLoadingValue) return;

        const taxonId = event.target.value;
        console.log('[CategorySelector] Taxon changed to:', taxonId);

        const numericTaxonId = taxonId ? parseInt(taxonId, 10) : null;

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
    const handleCategoryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        if (!isInitialized || isLoadingValue) return;

        const categoryId = event.target.value;
        console.log('[CategorySelector] Category changed to:', categoryId);

        const numericCategoryId = categoryId ? parseInt(categoryId, 10) : null;

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
            <div style={{ padding: '16px', border: '1px solid #f28b82', borderRadius: '4px', backgroundColor: '#ffeaa7' }}>
                <strong style={{ color: '#d63031' }}>Configuration Error</strong>
                <p style={{ margin: '8px 0 0 0', color: '#2d3436' }}>Component not properly initialized.</p>
            </div>
        );
    }

    // COMPLETELY AVOID STRAPI DESIGN SYSTEM - Use native HTML elements
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* Error Messages */}
            {(internalError || error) && (
                <div style={{ padding: '12px', border: '1px solid #f28b82', borderRadius: '4px', backgroundColor: '#ffebee' }}>
                    <strong style={{ color: '#c62828' }}>Error</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#424242' }}>{internalError || error}</p>
                    <button
                        style={{ marginTop: '8px', padding: '4px 8px', border: 'none', background: '#f5f5f5', borderRadius: '2px', cursor: 'pointer' }}
                        onClick={() => setInternalError(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Success Messages */}
            {success && (
                <div style={{ padding: '12px', border: '1px solid #4caf50', borderRadius: '4px', backgroundColor: '#e8f5e8' }}>
                    <strong style={{ color: '#2e7d32' }}>Success</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#424242' }}>{success}</p>
                    <button
                        style={{ marginTop: '8px', padding: '4px 8px', border: 'none', background: '#f5f5f5', borderRadius: '2px', cursor: 'pointer' }}
                        onClick={() => setSuccess(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Loading Value Indicator */}
            {isLoadingValue && (
                <div style={{ padding: '12px', border: '1px solid #2196f3', borderRadius: '4px', backgroundColor: '#e3f2fd' }}>
                    <strong style={{ color: '#1976d2' }}>Loading</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#424242' }}>Loading saved category selection...</p>
                </div>
            )}

            {/* Taxonomy and Category Selection */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Taxonomy Selection */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#424242' }}>
                        Taxonomy {required && <span style={{ color: '#f44336' }}>*</span>}
                    </label>
                    <select
                        value={selectedTaxonId?.toString() || ''}
                        onChange={handleTaxonChange}
                        disabled={loading || taxons.length === 0 || disabled || isLoadingValue}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: disabled || isLoadingValue ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">Select a taxonomy...</option>
                        {taxons.map((taxon) => (
                            <option key={`taxon-${taxon.id}`} value={taxon.id.toString()}>
                                {taxon.name}
                            </option>
                        ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>Choose the content type category</small>
                </div>

                {/* Category Selection */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#424242' }}>
                        Category
                    </label>
                    <select
                        value={selectedCategoryId?.toString() || ''}
                        onChange={handleCategoryChange}
                        disabled={loading || !selectedTaxonId || categories.length === 0 || disabled || isLoadingValue}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: disabled || isLoadingValue || !selectedTaxonId ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">
                            {!selectedTaxonId
                                ? "First select a taxonomy"
                                : categories.length === 0 && !loading
                                    ? "No categories available"
                                    : "Choose a category..."}
                        </option>
                        {categories.map((category) => (
                            <option key={`category-${category.id}`} value={category.id.toString()}>
                                {category.name} {category.order > 0 ? `(#${category.order})` : ''}
                            </option>
                        ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                        {selectedTaxonId ? `Categories in ${selectedTaxonName}` : "Select a taxonomy first"}
                    </small>
                </div>
            </div>

            {/* Current Selection Display */}
            {selectedTaxonId && selectedCategoryId && !isLoadingValue && (
                <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px', width: '100%' }}>
                    <span style={{ color: '#1976d2', fontSize: '14px' }}>
                        Selected: {selectedTaxonName} → {selectedCategoryName}
                    </span>
                </div>
            )}

            {/* Action Buttons */}
            {(selectedTaxonId || selectedCategoryId) && !disabled && !isLoadingValue && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        onClick={handleClear}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Loading...</span>
                </div>
            )}

            {/* Helpful Messages */}
            {taxons.length === 0 && !loading && !internalError && (
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', width: '100%' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                        No taxonomies found. Create taxonomies first in Category Manager.
                    </span>
                </div>
            )}

            {selectedTaxonId && categories.length === 0 && !loading && !internalError && (
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', width: '100%' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                        No categories found for {selectedTaxonName}. Create categories in Category Manager.
                    </span>
                </div>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <span style={{ color: '#666', fontSize: '11px' }}>
                        Debug: TaxonID={selectedTaxonId}, CategoryID={selectedCategoryId},
                        Value="{value}", Loading={isLoadingValue ? 'YES' : 'NO'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CategorySelector;