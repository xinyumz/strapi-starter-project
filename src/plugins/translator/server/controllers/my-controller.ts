// src/plugins/translator/server/controllers/my-controller.ts



console.log('[My Controller] Loading my-controller...');

export default ({ strapi }: any) => {
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