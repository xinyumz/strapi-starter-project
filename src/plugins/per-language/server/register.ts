// src/plugins/per-language/server/register.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  // Register plugin routes with Strapi
  console.log('[Per-Language Register] Registering plugin API routes...');

  // The routes are automatically loaded from routes/index.ts
  // No additional registration needed for basic route setup

  console.log('[Per-Language Register] Plugin registration complete');
};