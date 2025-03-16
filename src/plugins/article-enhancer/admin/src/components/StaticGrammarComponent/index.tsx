// StaticGrammarComponent.tsx - No state changes after initial render
import React from 'react';
import {
    Button,
    Box,
    Typography,
    Divider
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

const StaticGrammarComponent = (props: any) => {
    const { formatMessage } = useIntl();
    const { modifiedData, initialData } = useCMEditViewDataManager();

    // Get the article ID directly from initialData
    const getArticleId = (): string | null => {
        return initialData?.id ? String(initialData.id) : null;
    };

    // Direct handler for generating grammar rules
    const handleGenerate = () => {
        const articleId = getArticleId();
        if (!articleId) {
            alert("No article ID found. Please save the article first.");
            return;
        }

        const translationText = modifiedData.Translation;
        if (!translationText) {
            alert("Translation text is required");
            return;
        }

        // Use window.location to navigate to a new page with the results
        // This avoids React state changes that might cause errors
        const queryParams = new URLSearchParams({
            articleId: articleId,
            engine: 'both'
        }).toString();

        // Open in a new tab/window
        window.open(`/admin/plugins/${pluginId}/grammar?${queryParams}`, '_blank');
    };

    return (
        <Box padding={4} background="neutral100" hasRadius>
            <Typography variant="delta">
                Grammar Rules
            </Typography>
            <Divider />

            <Box paddingTop={4}>
                <Typography>
                    This component allows you to generate and manage grammar rules for Chinese text.
                </Typography>
            </Box>

            <Box paddingTop={4}>
                <Button onClick={handleGenerate}>
                    Generate Grammar Rules
                </Button>
            </Box>

            <Box paddingTop={4}>
                <Typography variant="omega">
                    Note: Grammar rules will open in a new window
                </Typography>
            </Box>
        </Box>
    );
};

export default StaticGrammarComponent;