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
    }
];