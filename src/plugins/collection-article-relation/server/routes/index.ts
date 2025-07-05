// src/plugins/collection-article-relation/server/routes/index.ts

import collectionAutofillRoutes from './collection-autofill-routes';
import orphanManagementRoutes from './orphan-management-routes';

export default [
  {
    method: 'GET',
    path: '/',
    handler: 'collectionAutofill.health',
    config: {
      policies: [],
      auth: false,
      description: 'Collection Article Relation Plugin Health Check'
    },
  },
  ...collectionAutofillRoutes,
  ...orphanManagementRoutes
];