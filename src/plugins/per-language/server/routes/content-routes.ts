// src/plugins/per-language/server/routes/content-routes.ts

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

    // NEW content management routes for Phase 5.1 fixes
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

    // NEW enhanced translation route for Phase 5.1 fixes
    {
        method: 'POST',
        path: '/translate-enhanced',
        handler: 'content.translateContent',
        config: {
            policies: [],
            auth: false,
            description: 'Enhanced translate with manual content support'
        }
    }
];