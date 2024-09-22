//server/register.ts

import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  strapi.customFields.register({
    name: 'translator',
    plugin: 'translator',
    type: 'string',
  });
};