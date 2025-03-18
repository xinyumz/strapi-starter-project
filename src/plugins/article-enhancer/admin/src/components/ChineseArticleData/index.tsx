// Simplified ChineseArticleData
import React from 'react';
import {
    Button,
    Box,
    Typography,
    Divider
} from '@strapi/design-system';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

const ChineseArticleData = (props: any) => {
    const { initialData, modifiedData } = useCMEditViewDataManager();

    // Get the article ID directly from initialData
    const getArticleId = (): string | null => {
        return initialData?.id ? String(initialData.id) : null;
    };

    // Direct handler for opening the Chinese processor
    const handleOpenProcessor = () => {
        const articleId = getArticleId();
        if (!articleId) {
            alert("Please save the article first to access the Chinese language tools.");
            return;
        }

        if (!modifiedData.Translation) {
            alert("Translation text is required");
            return;
        }

        // Open in a new tab/window
        const queryParams = new URLSearchParams({ articleId }).toString();
        window.open(`/admin/plugins/${pluginId}/chinese-processor?${queryParams}`, '_blank');
    };

    return (
        <Box padding={4} background="neutral100" hasRadius>
            <Typography variant="delta">Chinese Language Tools</Typography>
            <Divider />

            <Box paddingTop={4}>
                <Button onClick={handleOpenProcessor}>Process Chinese Article</Button>
            </Box>
        </Box>
    );
};

export default ChineseArticleData;