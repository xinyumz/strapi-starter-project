// src/plugins/per-language/admin/src/components/shared/AlertMessages.tsx

import React from 'react';
import { Alert } from '@strapi/design-system';

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
        <>
            {error && (
                <Alert
                    variant="danger"
                    title="Error"
                    closable
                    onClose={onErrorClose}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    variant="success"
                    title="Success"
                    closable
                    onClose={onSuccessClose}
                >
                    {success}
                </Alert>
            )}
        </>
    );
};