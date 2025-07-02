// src/plugins/chinese-article-processor/admin/src/components/common/LoadingOverlay.tsx

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Loader,
  Typography
} from '@strapi/design-system';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading data...'
}) => {
  if (!isLoading) return null;

  return (
    <Box marginTop={4} marginBottom={4}>
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
          <Box marginBottom={4}>
            <Loader size="L">{message}</Loader>
          </Box>

          {message && (
            <Typography
              variant="omega"
              textColor="neutral600"
            >
              Please wait while we process your request...
            </Typography>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default LoadingOverlay;