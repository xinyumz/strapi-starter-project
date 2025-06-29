// src/plugins/per-language/admin/src/components/shared/AlertMessages.tsx

import React from 'react';

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

    const alertBaseStyle: React.CSSProperties = {
        padding: '12px 16px',
        borderRadius: '4px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px'
    };

    const errorStyle: React.CSSProperties = {
        ...alertBaseStyle,
        border: '1px solid #f28b82',
        backgroundColor: '#ffebee',
        color: '#c62828'
    };

    const successStyle: React.CSSProperties = {
        ...alertBaseStyle,
        border: '1px solid #4caf50',
        backgroundColor: '#e8f5e8',
        color: '#2e7d32'
    };

    const closeButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '0',
        color: 'inherit',
        opacity: 0.7
    };

    return (
        <div>
            {error && (
                <div style={errorStyle}>
                    <div>
                        <strong>Error</strong>
                        <div style={{ marginTop: '4px' }}>{error}</div>
                    </div>
                    {onErrorClose && (
                        <button
                            onClick={onErrorClose}
                            style={closeButtonStyle}
                            title="Close error message"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {success && (
                <div style={successStyle}>
                    <div>
                        <strong>Success</strong>
                        <div style={{ marginTop: '4px' }}>{success}</div>
                    </div>
                    {onSuccessClose && (
                        <button
                            onClick={onSuccessClose}
                            style={closeButtonStyle}
                            title="Close success message"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};