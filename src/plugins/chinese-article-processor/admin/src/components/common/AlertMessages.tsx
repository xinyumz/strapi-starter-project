// src/plugins/chinese-article-processor/admin/src/components/common/AlertMessages.tsx
import React from 'react';
import { Alert } from '@strapi/design-system';

interface AlertMessagesProps {
  error: string | null;
  success: boolean;
  successMessage: string;
  onErrorDismiss: () => void;
  onSuccessDismiss: () => void;
}

/**
 * Component for displaying error and success messages
 */
const AlertMessages: React.FC<AlertMessagesProps> = ({
  error,
  success,
  successMessage,
  onErrorDismiss,
  onSuccessDismiss
}) => {
  return (
    <>
      {error && (
        <Alert
          closeLabel="Close alert"
          onClose={onErrorDismiss}
          variant="danger"
          marginBottom={4}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          closeLabel="Close alert"
          onClose={onSuccessDismiss}
          marginBottom={4}
        >
          {successMessage}
        </Alert>
      )}
    </>
  );
};

export default AlertMessages;
