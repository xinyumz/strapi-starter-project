// src/plugins/collection-manager/server/services/index.ts

import collectionAutofillService from './collection-autofill-service';
import orphanDetectionService from './orphan-detection-service';
import orphanCleanupService from './orphan-cleanup-service';
import duplicateDetectionService from './duplicate-detection-service';
import collectionHealthService from './collection-health-service';

export default {
  collectionAutofill: collectionAutofillService,
  orphanDetection: orphanDetectionService,
  orphanCleanup: orphanCleanupService,
  duplicateDetection: duplicateDetectionService,
  collectionHealth: collectionHealthService,
};