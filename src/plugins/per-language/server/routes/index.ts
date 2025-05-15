// src/plugins/per-language/server/routes/index.ts
export default [
  {
    method: 'GET',
    path: '/',
    handler: 'myController.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/languages',
    handler: 'perLanguage.getLanguages',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'GET',
    path: '/article/:articleId/languages',
    handler: 'perLanguage.getArticleLanguages',
    config: {
      policies: []
    }
  },
  {
    method: 'GET',
    path: '/article/:articleId/language/:language',
    handler: 'perLanguage.getLanguageContent',
    config: {
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/translate',
    handler: 'perLanguage.translateArticle',
    config: {
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/process',
    handler: 'perLanguage.processArticle',
    config: {
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/translate-and-process',
    handler: 'perLanguage.translateAndProcess',
    config: {
      policies: []
    }
  },
  {
    method: 'PUT',
    path: '/content/:contentId/publish',
    handler: 'perLanguage.setPublishStatus',
    config: {
      policies: []
    }
  },
  {
    method: 'DELETE',
    path: '/content/:contentId',
    handler: 'perLanguage.deleteLanguageContent',
    config: {
      policies: []
    }
  }
];