// src/plugins/per-language/admin/src/components/shared/AlertMessages.tsx

import React from 'react';
import { Alert, Box } from '@strapi/design-system';

interface AlertMessagesProps {
    error: string | null;
    success: string | null;
    onErrorClose?: () => void;
    onSuccessClose?: () => void;
}

/**
 * Reusable component for displaying error and success messages
 * 
 * Features:
 * - Displays error alerts with danger variant
 * - Displays success alerts with success variant  
 * - Closable alerts with custom handlers
 * - Conditional rendering (only shows when messages exist)
 * - Full Design System v2 compliance
 */
export const AlertMessages: React.FC<AlertMessagesProps> = ({
    error,
    success,
    onErrorClose,
    onSuccessClose
}) => {
    if (!error && !success) {
        return null;
    }

    return (
        <Box>
            {error && (
                <Box marginBottom={3}>
                    <Alert
                        variant="danger"
                        title="Error"
                        onClose={onErrorClose}
                        closeLabel="Close error message"
                    >
                        {error}
                    </Alert>
                </Box>
            )}

            {success && (
                <Box marginBottom={3}>
                    <Alert
                        variant="success"
                        title="Success"
                        onClose={onSuccessClose}
                        closeLabel="Close success message"
                    >
                        {success}
                    </Alert>
                </Box>
            )}
        </Box>
    );
};