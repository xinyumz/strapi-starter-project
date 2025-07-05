// src/plugins/collection-article-relation/server/services/index.ts

import collectionAutofillService from './collection-autofill-service';
import orphanDetectionService from './orphan-detection-service';
import orphanCleanupService from './orphan-cleanup-service';

export default {
  collectionAutofill: collectionAutofillService,
  orphanDetection: orphanDetectionService,
  orphanCleanup: orphanCleanupService,
};