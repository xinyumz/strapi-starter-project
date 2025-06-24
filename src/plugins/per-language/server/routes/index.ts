export default [
  {
    method: 'GET',
    path: '/',
    handler: 'myController.index',
    config: {
      auth: false,
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
      auth: false,
      policies: []
    }
  },
  {
    method: 'GET',
    path: '/article/:articleId/language/:language',
    handler: 'perLanguage.getLanguageContent',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/translate',
    handler: 'perLanguage.translateArticle',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/process',
    handler: 'perLanguage.processArticle',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/translate-and-process',
    handler: 'perLanguage.translateAndProcess',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'PUT',
    path: '/content/:contentId/publish',
    handler: 'perLanguage.setPublishStatus',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'DELETE',
    path: '/content/:contentId',
    handler: 'perLanguage.deleteLanguageContent',
    config: {
      auth: false,
      policies: []
    }
  },
  {
    method: 'PUT',
    path: '/article/:id/content',
    handler: 'content.updateArticleContent',
    config: {
      policies: [],
      auth: false,
      description: 'Update content for a specific language'
    }
  },
  {
    method: 'GET',
    path: '/article/:id/content',
    handler: 'content.getArticleContent',
    config: {
      policies: [],
      auth: false,
      description: 'Get content for a specific language'
    }
  },
  {
    method: 'GET',
    path: '/article/:id/processing-data',
    handler: 'content.getProcessingData',
    config: {
      policies: [],
      auth: false,
      description: 'Get processing data for language processors'
    }
  },
  {
    method: 'GET',
    path: '/article/:id/compatible',
    handler: 'content.getCompatibleArticleData',
    config: {
      policies: [],
      auth: false,
      description: 'Get article data compatible with Chinese processor'
    }
  },

  {
    method: 'POST',
    path: '/update-processed-data',
    handler: 'content.updateProcessedData',
    config: {
      policies: [],
      auth: false,
      description: 'Update processed data with complete preservation'
    }
  },
  {
    method: 'POST',
    path: '/translate-enhanced',
    handler: 'content.translateContent',
    config: {
      policies: [],
      auth: false,
      description: 'Enhanced translate with manual content support'
    }
  },

  {
    method: 'PUT',
    path: '/content/:contentId/access-tier',
    handler: 'content.updateAccessTier',
    config: {
      auth: false,
      policies: [],
      description: 'Update access tier for language content'
    }
  },

  {
    method: 'GET',
    path: '/article/:articleId/language/:language/refresh',
    handler: 'perLanguage.refreshLanguageData',
    config: {
      auth: false,
      policies: [],
      description: 'Refresh data for a specific language'
    }
  },
  // collection routes
  {
    method: 'PUT',
    path: '/collection/:id/content',
    handler: 'content.updateCollectionContent',
    config: {
      policies: [],
      auth: false,
      description: 'Update collection content for a specific language'
    }
  },
  {
    method: 'GET',
    path: '/collection/:id/content',
    handler: 'content.getCollectionContent',
    config: {
      policies: [],
      auth: false,
      description: 'Get collection content for a specific language'
    }
  },
  {
    method: 'GET',
    path: '/collection/:id/languages',
    handler: 'content.getCollectionLanguages',
    config: {
      policies: [],
      auth: false,
      description: 'Get all languages for a collection'
    }
  },
  {
    method: 'PUT',
    path: '/collection/:id/publish',
    handler: 'content.updateCollectionPublishStatus',
    config: {
      policies: [],
      auth: false,
      description: 'Update collection language publish status'
    }
  },
  {
    method: 'PUT',
    path: '/collection/:id/access-tier',
    handler: 'content.updateCollectionAccessTier',
    config: {
      policies: [],
      auth: false,
      description: 'Update collection language access tier'
    }
  },
  {
    method: 'PUT',
    path: '/collection/:id/display-skill',
    handler: 'content.updateCollectionDisplaySkill',
    config: {
      policies: [],
      auth: false,
      description: 'Update collection language display skill'
    }
  },
  {
    method: 'DELETE',
    path: '/collection/:id',
    handler: 'content.deleteCollectionLanguage',
    config: {
      policies: [],
      auth: false,
      description: 'Delete collection language'
    }
  }
];