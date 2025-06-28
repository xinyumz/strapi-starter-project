// src/plugins/chinese-article-processor/admin/src/components/common/ConfirmationDialog.tsx

import React from 'react';
import {
  Box,
  Flex,
  Dialog,
  Button,
  Typography,
  useDesignSystem
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
  const { theme } = useDesignSystem();
  const themeColorMode = theme === 'dark' ? 'dark' : 'light'; // or however theme mode is determined
  const textColor = themeColorMode === 'light' ? 'neutral100' : 'neutral800';

  return (
    <Dialog onClose={onCancel} title={title} isOpen={isVisible}>
      <Box padding={4}>
        <Typography textColor={textColor}>
          {message}
        </Typography>
      </Box>
      <Flex justifyContent="flex-end" gap={2} padding={4}>
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
      </Flex>
    </Dialog>
  );
};

export default ConfirmationDialog;