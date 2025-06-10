// src/plugins/per-language/server/register.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  console.log('[Per-Language Register] Registering plugin API routes...');

  // Register the custom field on the server side (following translator pattern)
  strapi.customFields.register({
    name: 'language-processor',
    plugin: 'per-language',
    type: 'richtext', // Use richtext like translator for better content handling
  });

  console.log('[Per-Language Register] Custom field registered on server side');
  console.log('[Per-Language Register] Plugin registration complete');
};