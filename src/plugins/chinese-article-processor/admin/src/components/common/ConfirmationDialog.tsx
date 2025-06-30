// src/plugins/chinese-article-processor/admin/src/components/common/ConfirmationDialog.tsx
import React from 'react';

interface ConfirmationDialogProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonVariant?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Native HTML confirmation dialog
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isVisible,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonVariant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isVisible) return null;

  const getButtonStyle = (variant: string) => {
    const base = {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500' as const,
      fontSize: '0.875rem',
      transition: 'all 0.2s ease'
    };

    switch (variant) {
      case 'danger':
      case 'danger-light':
        return {
          ...base,
          backgroundColor: '#dc3545',
          color: 'white'
        };
      default:
        return {
          ...base,
          backgroundColor: '#f6f6f9',
          color: '#4a4a6a',
          border: '1px solid #dcdce4'
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#212134'
            }}>
              {title}
            </h2>
          </div>

          {/* Content */}
          <div style={{
            padding: '1.5rem',
            color: '#4a4a6a',
            lineHeight: '1.5'
          }}>
            {message}
          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button
              onClick={onCancel}
              style={getButtonStyle('tertiary')}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e6e6e6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f6f6f9';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={getButtonStyle(confirmButtonVariant)}
              onMouseOver={(e) => {
                if (confirmButtonVariant === 'danger' || confirmButtonVariant === 'danger-light') {
                  e.currentTarget.style.backgroundColor = '#c82333';
                }
              }}
              onMouseOut={(e) => {
                if (confirmButtonVariant === 'danger' || confirmButtonVariant === 'danger-light') {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                }
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationDialog;