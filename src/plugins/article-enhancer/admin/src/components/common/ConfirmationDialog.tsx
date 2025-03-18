// src/plugins/article-enhancer/admin/src/components/common/ConfirmationDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogBody,
  DialogFooter,
  Button
} from '@strapi/design-system';

interface ConfirmationDialogProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonVariant?: 'danger' | 'danger-light' | 'success' | 'secondary';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog component
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isVisible,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonVariant = 'danger-light',
  onConfirm,
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <Dialog onClose={onCancel} title={title} isOpen={isVisible}>
      <DialogBody>
        {message}
      </DialogBody>
      <DialogFooter
        startAction={
          <Button onClick={onCancel} variant="tertiary">
            {cancelText}
          </Button>
        }
        endAction={
          <Button onClick={onConfirm} variant={confirmButtonVariant}>
            {confirmText}
          </Button>
        }
      />
    </Dialog>
  );
};

export default ConfirmationDialog;
