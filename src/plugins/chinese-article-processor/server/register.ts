// server/register.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  strapi.customFields.register({
    name: 'chinese-language-tools',
    plugin: 'chinese-article-processor',
    type: 'json',
  });
};