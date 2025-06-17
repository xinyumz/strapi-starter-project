import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('category-manager')
      .service('myService')
      .getWelcomeMessage();
  },
});
