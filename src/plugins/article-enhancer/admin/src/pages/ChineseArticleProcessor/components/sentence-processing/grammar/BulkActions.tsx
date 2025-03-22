// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/BulkActions.tsx
import React, { useState } from 'react';
import {
  Flex, Button, Dialog, DialogBody, DialogFooter, Typography, useTheme
} from '@strapi/design-system';
import { Check, Trash } from '@strapi/icons';

interface BulkActionsProps {
  hasTranslationChanges: boolean;
  selectedRulesCount: number;
  isLoading: boolean;
  isTranslating: boolean;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
  selectedRules: any[]; // Actual selected rules array
}

/**
 * Component for displaying bulk actions for translations and rule deletion
 * Now includes direct dialog handling
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
  // Local state to manage the confirmation dialog
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Get the current theme mode to adjust text colors
  const { themeColorMode } = useTheme();
  const textColor = themeColorMode === 'light' ? 'neutral100' : 'neutral800';

  const handleDeleteClick = () => {
    console.log("Delete button clicked in BulkActions component");
    console.log("Selected rules count:", selectedRulesCount);
    console.log("Actual selected rules:", selectedRules);
    console.log("Loading state:", isLoading);
    console.log("Translating state:", isTranslating);

    if (selectedRules.length === 0) {
      console.log("No rules selected, not showing confirmation dialog");
      return;
    }

    // Show the confirmation dialog
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    console.log("Delete confirmed in BulkActions");
    console.log("Selected rules at confirmation time:", selectedRules);

    // Call the provided handler
    onDeleteSelected();

    // Close the dialog
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
            startIcon={<Check />}
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
            startIcon={<Trash />}
            size="L"
            id="bulk-delete-button"
          >
            Delete Selected Rules ({selectedRulesCount})
          </Button>
        )}
      </Flex>

      {/* Delete Confirmation Dialog */}
      <Dialog onClose={handleCancelDelete} title="Confirm Bulk Deletion" isOpen={isDeleteModalVisible}>
        <DialogBody>
          <Typography textColor={textColor}>
            Are you sure you want to delete {selectedRules.length} selected grammar rules? This action cannot be undone.
          </Typography>
        </DialogBody>
        <DialogFooter
          startAction={
            <Button onClick={handleCancelDelete} variant="tertiary">
              Cancel
            </Button>
          }
          endAction={
            <Button onClick={handleConfirmDelete} variant="danger">
              Yes, delete {selectedRules.length} rules
            </Button>
          }
        />
      </Dialog>
    </>
  );
};

export default BulkActions;