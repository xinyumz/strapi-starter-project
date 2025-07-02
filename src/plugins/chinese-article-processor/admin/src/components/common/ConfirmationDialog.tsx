// src/plugins/chinese-article-processor/admin/src/components/common/ConfirmationDialog.tsx

import React from 'react';
import {
  Modal,
  Typography,
  Button,
  Flex,
  Box
} from '@strapi/design-system';

interface ConfirmationDialogProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonVariant?: 'danger' | 'danger-light' | 'default' | 'secondary';
  onConfirm: () => void;
  onCancel: () => void;
}

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

  return (
    <Modal.Root open={isVisible} onOpenChange={onCancel}>
      <Modal.Content>
        <Modal.Header>
          <Typography
            variant="beta"
            fontWeight="bold"
            textColor="neutral800"
          >
            {title}
          </Typography>
        </Modal.Header>

        <Modal.Body>
          <Box paddingTop={2} paddingBottom={4}>
            <Typography
              variant="omega"
              textColor="neutral600"
              style={{ lineHeight: '1.5' }}
            >
              {message}
            </Typography>
          </Box>
        </Modal.Body>

        <Modal.Footer>
          <Flex justifyContent="flex-end" gap={2}>
            <Button
              onClick={onCancel}
              variant="tertiary"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              variant={confirmButtonVariant}
            >
              {confirmText}
            </Button>
          </Flex>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default ConfirmationDialog;