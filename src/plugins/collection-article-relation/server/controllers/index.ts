// src/plugins/collection-article-relation/server/controllers/index.ts

import collectionAutofillController from './collection-autofill-controller';
import orphanManagementController from './orphan-management-controller';

export default {
  collectionAutofill: collectionAutofillController,
  orphanManagement: orphanManagementController,
};