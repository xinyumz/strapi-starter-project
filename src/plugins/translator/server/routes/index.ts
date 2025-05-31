//server/routes/index.ts
console.log('[Translator Routes] Registering routes...');

export default [
  {
    method: 'POST',
    path: '/translate',
    handler: 'translation-controller.translate',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/languages',
    handler: 'translation-controller.listLanguages',
    config: {
      auth: false,
      policies: [],
      description: 'Get supported languages for translation'
    },
  },
  {
    method: 'GET',
    path: '/',
    handler: 'my-controller.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/test-sync',
    handler: 'my-controller.testSync',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/sync-existing-article',
    handler: 'my-controller.syncExistingArticle',
    config: {
      policies: [],
    },
  }
];

console.log('[Translator Routes] Routes defined');