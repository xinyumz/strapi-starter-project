// src/plugins/collection-manager/server/routes/index.ts

import collectionAutofillRoutes from './collection-autofill-routes';
import collectionManagementRoutes from './collection-management-routes';

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
  ...collectionManagementRoutes
];