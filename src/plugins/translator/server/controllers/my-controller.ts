// src/plugins/translator/server/controllers/my-controller.ts

import { Strapi } from '@strapi/strapi';

console.log('[My Controller] Loading my-controller...');

export default ({ strapi }: { strapi: Strapi }) => {
  console.log('[My Controller] Controller function called');

  return {
    /**
     * Plugin info endpoint
     */
    index(ctx) {
      console.log('[My Controller] index method called');
      ctx.body = strapi
        .plugin('translator')
        .service('myService')
        .getWelcomeMessage();
    }
  };
};

console.log('[My Controller] Controller exported');