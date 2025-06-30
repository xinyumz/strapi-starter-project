// src/plugins/chinese-article-processor/admin/src/components/common/LoadingOverlay.tsx
import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Native HTML loading overlay component
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading data...'
}) => {
  if (!isLoading) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center' as const,
      margin: '1rem 0'
    }}>
      {/* Simple CSS spinner */}
      <div style={{
        display: 'inline-block',
        width: '24px',
        height: '24px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #4945ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }} />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {message && (
        <div style={{
          fontSize: '0.875rem',
          color: '#666687',
          marginTop: '0.5rem'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;