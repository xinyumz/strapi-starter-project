// src/plugins/collection-article-relation/admin/src/components/QuickCollectionButton.tsx

import React, { useState } from 'react';
import { Button, Box, Typography, Flex } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { useNotification, useTracking } from '@strapi/helper-plugin';
import { useCollectionAutoFill } from '../hooks/useCollectionAutoFill';

interface QuickCollectionButtonProps {
    articleId: number;
    articleTitle?: string;
    onSuccess?: (collectionId: number) => void;
    variant?: 'default' | 'secondary' | 'tertiary';
    size?: 'S' | 'M' | 'L';
}

const QuickCollectionButton: React.FC<QuickCollectionButtonProps> = ({
    articleId,
    articleTitle = 'this article',
    onSuccess,
    variant = 'secondary',
    size = 'S'
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { quickCreateCollection, isLoading } = useCollectionAutoFill();
    const toggleNotification = useNotification();
    const { trackUsage } = useTracking();

    const handleQuickCreate = async () => {
        try {
            console.log('[QuickCollectionButton] Creating quick collection for article:', articleId);

            // Track usage for analytics
            trackUsage('collection-article-relation.quick-create', {
                articleId,
                source: 'article-edit-page'
            });

            const result = await quickCreateCollection(articleId);

            if (result?.collection?.id) {
                toggleNotification({
                    type: 'success',
                    message: `Collection "${result.collection.Title}" created successfully!`,
                });

                // Close modal
                setIsModalOpen(false);

                // Callback with collection ID
                if (onSuccess) {
                    onSuccess(result.collection.id);
                }

                // Navigate to the new collection
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                }
            }
        } catch (error) {
            console.error('[QuickCollectionButton] Quick creation failed:', error);
            toggleNotification({
                type: 'warning',
                message: `Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    };

    return (
        <>
            <Button
                startIcon={<Plus />}
                variant={variant}
                size={size}
                onClick={() => setIsModalOpen(true)}
                disabled={!articleId}
            >
                Create Collection
            </Button>

            {isModalOpen && (
                <Box
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    background="neutral0"
                    padding={6}
                    shadow="popupShadow"
                    borderRadius="4px"
                    zIndex={1000}
                    style={{ minWidth: '400px' }}
                >
                    <Typography variant="beta" marginBottom={4}>
                        Create Collection from Article
                    </Typography>

                    <Typography variant="omega" textColor="neutral600" marginBottom={4}>
                        This will create a new collection using "{articleTitle}" as the base.
                    </Typography>

                    <Flex gap={3} justifyContent="flex-end">
                        <Button variant="tertiary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleQuickCreate}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create Collection'}
                        </Button>
                    </Flex>

                    {/* Backdrop */}
                    <Box
                        position="fixed"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        background="neutral800"
                        opacity="0.5"
                        zIndex={-1}
                        onClick={() => setIsModalOpen(false)}
                    />
                </Box>
            )}
        </>
    );
};

export default QuickCollectionButton;