export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://market-assets.strapi.io',
            'https://cdn.pandaist.com',
            'https://akmvcaugzq.cloudimg.io',
            'https:', // Allow all HTTPS images as fallback
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://cdn.pandaist.com',
            'https://akmvcaugzq.cloudimg.io',
            'https:', // Allow all HTTPS media as fallback
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];