//server/routes/index.ts

export default [
  {
    method: 'POST',
    path: '/translate',
    handler: 'translation-controller.translate',
    config: {
      auth: false,
      policies: [],
      description: 'Translate text to target language'
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
  }
];