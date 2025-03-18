// src/plugins/article-enhancer/admin/src/pages/ChineseArticleProcessor/components/grammar/BulkActions.tsx
import React from 'react';
import { Flex, Button } from '@strapi/design-system';
import { Check, Trash } from '@strapi/icons';

interface BulkActionsProps {
  hasTranslationChanges: boolean;
  selectedRulesCount: number;
  isLoading: boolean;
  isTranslating: boolean;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
}

/**
 * Component for displaying bulk actions for translations and rule deletion
 */
const BulkActions: React.FC<BulkActionsProps> = ({
  hasTranslationChanges,
  selectedRulesCount,
  isLoading,
  isTranslating,
  onSaveTranslations,
  onDeleteSelected
}) => {
  return (
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
          onClick={onDeleteSelected}
          disabled={selectedRulesCount === 0 || isLoading || isTranslating}
          startIcon={<Trash />}
          size="L"
        >
          Delete Selected Rules ({selectedRulesCount})
        </Button>
      )}
    </Flex>
  );
};

export default BulkActions;