// src/plugins/per-language/server/routes/index.ts

import contentRoutes from './content-routes';
import migrationRoutes from './migration-routes';

const allRoutes = [
  ...contentRoutes,
  ...migrationRoutes
];

export default allRoutes;