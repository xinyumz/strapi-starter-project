// src/plugins/collection-article-relation/admin/src/components/FloatingCollectionButton.tsx

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Box, Typography } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { useNotification, useFetchClient } from '@strapi/helper-plugin';

const FloatingCollectionButton: React.FC = () => {
    const location = useLocation();
    // Debug log
    console.log('[FloatingCollectionButton] Component rendered');
    console.log('[FloatingCollectionButton] Current location:', location.pathname);

    const [articleData, setArticleData] = useState<{ id: number; title: string } | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const toggleNotification = useNotification();
    const { post } = useFetchClient();

    useEffect(() => {
        // Check if we're on an article edit page
        const articleEditMatch = location.pathname.match(
            /\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)/
        );
        // Debug log
        console.log('[FloatingCollectionButton] Checking URL pattern');
        console.log('[FloatingCollectionButton] Match result:', articleEditMatch);

        if (articleEditMatch) {
            const articleId = parseInt(articleEditMatch[1]);

            // Get article title from the page
            const checkForTitle = () => {
                const titleInput = document.querySelector('input[name="Title"]') as HTMLInputElement;
                if (titleInput && titleInput.value) {
                    setArticleData({ id: articleId, title: titleInput.value });
                } else {
                    // Fallback: just use the ID
                    setArticleData({ id: articleId, title: `Article ${articleId}` });
                }
            };

            // Check immediately and then periodically
            checkForTitle();
            const interval = setInterval(checkForTitle, 2000);

            return () => clearInterval(interval);
        } else {
            setArticleData(null);
        }
    }, [location.pathname]);

    const handleQuickCreate = async () => {
        if (!articleData) return;

        setIsCreating(true);
        try {
            const response = await post('/collection-article-relation/quick-create', {
                articleId: articleData.id
            });

            if (response.data?.success) {
                toggleNotification({
                    type: 'success',
                    message: `Collection "${response.data.data.collection.Title}" created successfully!`,
                });

                // Navigate to the new collection
                if (response.data.data.redirectUrl) {
                    setTimeout(() => {
                        window.location.href = response.data.data.redirectUrl;
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('[FloatingCollectionButton] Creation failed:', error);
            toggleNotification({
                type: 'warning',
                message: `Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Only render if we have article data
    if (!articleData) {
        return null;
    }

    return (
        <Box
            position="fixed"
            top="100px"
            right="20px"
            zIndex={9999}
            background="primary600"
            padding={3}
            borderRadius="50px"
            shadow="popupShadow"
            style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            <Button
                variant="ghost"
                startIcon={<Plus />}
                onClick={handleQuickCreate}
                loading={isCreating}
                disabled={isCreating}
                style={{
                    color: 'white',
                    border: 'none',
                    background: 'transparent'
                }}
            >
                Collection
            </Button>

            {/* Tooltip */}
            <Box
                position="absolute"
                bottom="100%"
                right="0"
                marginBottom={2}
                padding={2}
                background="neutral800"
                borderRadius="4px"
                style={{
                    whiteSpace: 'nowrap',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none'
                }}
                className="tooltip"
            >
                <Typography variant="pi" textColor="neutral0">
                    Create collection from "{articleData.title}"
                </Typography>
            </Box>

            <style>
                {`
                .tooltip:hover {
                    opacity: 1 !important;
                }
                `}
            </style>
        </Box>
    );
};

export default FloatingCollectionButton;