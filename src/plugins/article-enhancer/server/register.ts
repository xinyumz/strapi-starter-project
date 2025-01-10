// server/register.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  // Register HSK Calculator
  strapi.customFields.register({
    name: 'hsk-calculator',
    plugin: 'article-enhancer',
    type: 'string',
  });

  // Register Grammar Rules
  strapi.customFields.register({
    name: 'grammar-rules',
    plugin: 'article-enhancer',
    type: 'string',
  });
};