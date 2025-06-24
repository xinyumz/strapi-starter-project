// server/register.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  strapi.customFields.register({
    name: 'category-selector',
    plugin: 'category-manager',
    type: 'integer',
    inputSize: {
      default: 6,
      isResizable: true,
    },
  });
};