// src/plugins/chinese-article-processor/admin/src/components/common/AlertMessages.tsx
import React from 'react';

interface AlertMessagesProps {
  error: string | null;
  success: boolean;
  successMessage: string;
  onErrorDismiss: () => void;
  onSuccessDismiss: () => void;
}

/**
 * Native HTML component for displaying error and success messages
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
        <div style={{
          backgroundColor: '#ffeaea',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={onErrorDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '1rem',
              marginLeft: '1rem',
              padding: '0.25rem',
              borderRadius: '3px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f5c6cb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <span style={{ flex: 1 }}>{successMessage}</span>
          <button
            onClick={onSuccessDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#155724',
              cursor: 'pointer',
              fontSize: '1rem',
              marginLeft: '1rem',
              padding: '0.25rem',
              borderRadius: '3px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#c3e6cb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default AlertMessages;