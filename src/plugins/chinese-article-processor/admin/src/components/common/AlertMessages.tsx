// src/plugins/chinese-article-processor/admin/src/components/common/AlertMessages.tsx

import React from 'react';
import { Box, Alert } from '@strapi/design-system';

interface AlertMessagesProps {
  error: string | null;
  success: boolean;
  successMessage: string;
  onErrorDismiss: () => void;
  onSuccessDismiss: () => void;
}

const AlertMessages: React.FC<AlertMessagesProps> = ({
  error,
  success,
  successMessage,
  onErrorDismiss,
  onSuccessDismiss
}) => {
  return (
    <Box>
      {error && (
        <Box marginBottom={4}>
          <Alert
            variant="danger"
            title="Error"
            onClose={onErrorDismiss}
            closeLabel="Dismiss error"
          >
            {error}
          </Alert>
        </Box>
      )}

      {success && (
        <Box marginBottom={4}>
          <Alert
            variant="success"
            title="Success"
            onClose={onSuccessDismiss}
            closeLabel="Dismiss success message"
          >
            {successMessage}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default AlertMessages;