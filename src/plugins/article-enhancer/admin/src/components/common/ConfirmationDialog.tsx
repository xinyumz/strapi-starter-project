// src/plugins/article-enhancer/admin/src/components/common/ConfirmationDialog.tsx

import React from 'react';
import {
  Dialog,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
  useTheme
} from '@strapi/design-system';

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
 * A reusable confirmation dialog with proper light/dark mode support
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
  // Get the current theme mode to adjust text colors
  const { themeColorMode } = useTheme();
  const textColor = themeColorMode === 'light' ? 'neutral100' : 'neutral800';

  return (
    <Dialog onClose={onCancel} title={title} isOpen={isVisible}>
      <DialogBody>
        <Typography textColor={textColor}>
          {message}
        </Typography>
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