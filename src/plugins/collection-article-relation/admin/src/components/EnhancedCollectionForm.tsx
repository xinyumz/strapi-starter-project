// src/plugins/collection-article-relation/admin/src/components/EnhancedCollectionForm.tsx

import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Flex } from '@strapi/design-system';
import { useCollectionAutoFill } from '../hooks/useCollectionAutoFill';
import AutoFillPreview from './AutoFillPreview';

interface EnhancedCollectionFormProps {
    selectedArticles: any[];
    onAutoFillApply: (autoFillData: any) => void;
    disabled?: boolean;
}

const EnhancedCollectionForm: React.FC<EnhancedCollectionFormProps> = ({
    selectedArticles,
    onAutoFillApply,
    disabled = false
}) => {
    const { autoFillData, isLoading, error, analyzeArticles, clearAutoFill } = useCollectionAutoFill();
    const [lastAnalyzedIds, setLastAnalyzedIds] = useState<string>('');

    // Extract article IDs from selected articles
    const articleIds = selectedArticles
        ?.map(article => article?.id || article?.value)
        .filter(id => id && Number.isInteger(id)) || [];

    // Auto-analyze when article selection changes
    useEffect(() => {
        const currentIds = articleIds.sort().join(',');

        // Only analyze if the selection actually changed
        if (currentIds !== lastAnalyzedIds && !disabled) {
            setLastAnalyzedIds(currentIds);

            if (articleIds.length > 0) {
                console.log('[EnhancedCollectionForm] Article selection changed, analyzing:', articleIds);
                analyzeArticles(articleIds);
            } else {
                clearAutoFill();
            }
        }
    }, [articleIds.join(','), lastAnalyzedIds, analyzeArticles, clearAutoFill, disabled]);

    const handleApplyAutoFill = () => {
        if (autoFillData?.suggestedData) {
            console.log('[EnhancedCollectionForm] Applying auto-fill:', autoFillData.suggestedData);
            onAutoFillApply(autoFillData.suggestedData);
        }
    };

    const handleClearAutoFill = () => {
        clearAutoFill();
        setLastAnalyzedIds('');
    };

    // Don't render anything if no articles selected
    if (articleIds.length === 0) {
        return null;
    }

    return (
        <Box marginTop={4}>
            {/* Error Display */}
            {error && (
                <Box marginBottom={3}>
                    <Alert
                        title="Auto-Fill Error"
                        variant="danger"
                        onClose={() => clearAutoFill()}
                    >
                        {error}
                    </Alert>
                </Box>
            )}

            {/* Loading State */}
            {isLoading && !autoFillData && (
                <Box marginBottom={3}>
                    <Alert title="Analyzing Articles" variant="default">
                        Analyzing {articleIds.length} selected article{articleIds.length !== 1 ? 's' : ''} for auto-fill suggestions...
                    </Alert>
                </Box>
            )}

            {/* Auto-Fill Preview */}
            {autoFillData && (
                <AutoFillPreview
                    autoFillData={autoFillData}
                    onApplyAutoFill={handleApplyAutoFill}
                    onClearAutoFill={handleClearAutoFill}
                    isLoading={isLoading}
                />
            )}

            {/* No Auto-Fill Data Available */}
            {!isLoading && !error && autoFillData?.scenario === 'no_articles' && (
                <Box marginBottom={3}>
                    <Alert title="No Auto-Fill Available" variant="default">
                        {autoFillData.message}
                    </Alert>
                </Box>
            )}

            {/* Development Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <Box marginTop={3} padding={2} background="neutral150" borderRadius="4px">
                    <Typography variant="pi" textColor="neutral600">
                        Debug: Selected {articleIds.length} articles - IDs: {articleIds.join(', ')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default EnhancedCollectionForm;