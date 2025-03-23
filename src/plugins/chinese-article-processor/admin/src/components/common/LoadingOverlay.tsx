// src/plugins/chinese-article-processor/admin/src/components/common/LoadingOverlay.tsx
import React from 'react';
import { Box, Loader, Typography } from '@strapi/design-system';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Loading overlay component with optional message
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading data...'
}) => {
  if (!isLoading) return null;

  return (
    <Box
      background="neutral0"
      padding={8}
      shadow="tableShadow"
      hasRadius
      style={{ textAlign: 'center' }}
    >
      <Loader>{message}</Loader>
      {message && (
        <Typography variant="omega" textColor="neutral600" paddingTop={4}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingOverlay;
