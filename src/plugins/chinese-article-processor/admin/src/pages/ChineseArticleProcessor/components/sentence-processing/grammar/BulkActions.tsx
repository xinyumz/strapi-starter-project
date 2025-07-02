// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/grammar/BulkActions.tsx

import React, { useState } from 'react';
import {
  Flex,
  Box,
  Button,
  Modal,
  Typography
} from '@strapi/design-system';

interface BulkActionsProps {
  hasTranslationChanges: boolean;
  selectedRulesCount: number;
  isLoading: boolean;
  isTranslating: boolean;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
  selectedRules: any[];
}

/**
 * Displaying bulk actions for translations and rule deletion
 */
const BulkActions: React.FC<BulkActionsProps> = ({
  hasTranslationChanges,
  selectedRulesCount,
  isLoading,
  isTranslating,
  onSaveTranslations,
  onDeleteSelected,
  selectedRules
}) => {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteClick = () => {
    console.log("Delete button clicked in BulkActions component");
    console.log("Selected rules count:", selectedRulesCount);
    console.log("Actual selected rules:", selectedRules);

    if (selectedRules.length === 0) {
      console.log("No rules selected, not showing confirmation dialog");
      return;
    }

    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    console.log("Delete confirmed in BulkActions");
    console.log("Selected rules at confirmation time:", selectedRules);

    onDeleteSelected();
    setIsDeleteModalVisible(false);
  };

  const handleCancelDelete = () => {
    console.log("Delete cancelled in BulkActions");
    setIsDeleteModalVisible(false);
  };

  return (
    <>
      <Flex justifyContent="center" gap={4} paddingTop={4}>
        {hasTranslationChanges && (
          <Button
            variant="success"
            onClick={onSaveTranslations}
            disabled={!hasTranslationChanges || isLoading || isTranslating}
            size="L"
          >
            Save Translation Changes
          </Button>
        )}

        {selectedRulesCount > 0 && (
          <Button
            variant="danger"
            onClick={handleDeleteClick}
            disabled={selectedRulesCount === 0 || isLoading || isTranslating}
            size="L"
          >
            Delete Selected Rules ({selectedRulesCount})
          </Button>
        )}
      </Flex>

      {/* Delete Confirmation Modal */}
      <Modal.Root open={isDeleteModalVisible} onOpenChange={setIsDeleteModalVisible}>
        <Modal.Content>
          <Modal.Header>
            <Typography
              variant="beta"
              fontWeight="bold"
              textColor="neutral800"
            >
              Confirm Bulk Deletion
            </Typography>
          </Modal.Header>

          <Modal.Body>
            <Box paddingTop={2} paddingBottom={4}>
              <Typography
                variant="omega"
                textColor="neutral600"
                style={{ lineHeight: '1.5' }}
              >
                Are you sure you want to delete {selectedRules.length} selected grammar rules?
                This action cannot be undone.
              </Typography>
            </Box>
          </Modal.Body>

          <Modal.Footer>
            <Flex justifyContent="flex-end" gap={2}>
              <Button
                onClick={handleCancelDelete}
                variant="tertiary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="danger"
              >
                Yes, delete {selectedRules.length} rules
              </Button>
            </Flex>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};

export default BulkActions;