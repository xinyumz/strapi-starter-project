// src/plugins/collection-article-relation/server/controllers/index.ts
// Export all controllers with clear naming

import collectionAutofill from './collection-autofill-controller';
import orphanDetection from './orphan-detection-controller';
import orphanOperations from './orphan-operations-controller';
import cacheManagement from './cache-management-controller';
import duplicateDetection from './duplicate-detection-controller';
import collectionHealth from './collection-health-controller';

export default {
  // Collection auto-fill controller
  collectionAutofill,

  // Split orphan management controllers
  orphanDetection,
  orphanOperations,
  cacheManagement,

  // Duplicate detection controller
  duplicateDetection,

  // Combined health controller
  collectionHealth,

  // Backward compatibility - combine all orphan methods under original name
  orphanManagement: ({ strapi }: any) => ({
    // Detection methods
    ...orphanDetection({ strapi }),

    // Operations methods  
    ...orphanOperations({ strapi }),

    // Cache management methods
    ...cacheManagement({ strapi })
  })
};