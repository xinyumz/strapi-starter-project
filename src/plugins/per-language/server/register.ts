// src/plugins/per-language/server/register.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  console.log('[Per-Language Register] Registering plugin API routes...');

  // Register the custom field on the server side
  strapi.customFields.register({
    name: 'language-processor',
    plugin: 'per-language',
    type: 'richtext',
  });

  // Register the collection per-language custom field on the server side
  strapi.customFields.register({
    name: 'collection-perlanguage',
    plugin: 'per-language',
    type: 'text',
  });

  console.log('[Per-Language Register] Custom field registered on server side');
  console.log('[Per-Language Register] Plugin registration complete');
};