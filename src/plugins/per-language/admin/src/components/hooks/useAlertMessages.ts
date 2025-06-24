// src/plugins/per-language/admin/src/components/hooks/useAlertMessages.ts

import { useState, useEffect } from 'react';

interface UseAlertMessagesReturn {
    error: string | null;
    success: string | null;
    setError: (message: string | null) => void;
    setSuccess: (message: string | null) => void;
    clearMessages: () => void;
}

/**
 * Custom hook for managing alert messages with auto-clear functionality
 * 
 * @param autoClearDelay - Time in milliseconds before auto-clearing messages (default: 5000)
 * @returns Object with error/success states and setter functions
 */
export const useAlertMessages = (autoClearDelay: number = 5000): UseAlertMessagesReturn => {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Clear messages after specified delay
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, autoClearDelay);

            return () => clearTimeout(timer);
        }
    }, [error, success, autoClearDelay]);

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    return {
        error,
        success,
        setError,
        setSuccess,
        clearMessages
    };
};