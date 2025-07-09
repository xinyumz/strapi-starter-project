// src/plugins/per-language/server/routes/article-routes.ts

export default [
    // Article content management
    {
        method: 'PUT',
        path: '/article/:id/content',
        handler: 'article.updateArticleContent',
        config: {
            policies: [],
            auth: false,
            description: 'Update content for a specific language'
        }
    },
    {
        method: 'GET',
        path: '/article/:id/content',
        handler: 'article.getArticleContent',
        config: {
            policies: [],
            auth: false,
            description: 'Get content for a specific language'
        }
    },
    {
        method: 'GET',
        path: '/article/:id/processing-data',
        handler: 'article.getProcessingData',
        config: {
            policies: [],
            auth: false,
            description: 'Get processing data for language processors'
        }
    },
    {
        method: 'GET',
        path: '/article/:id/compatible',
        handler: 'article.getCompatibleArticleData',
        config: {
            policies: [],
            auth: false,
            description: 'Get article data compatible with Chinese processor'
        }
    },

    // Article processing and translation
    {
        method: 'POST',
        path: '/update-processed-data',
        handler: 'article.updateProcessedData',
        config: {
            policies: [],
            auth: false,
            description: 'Update processed data with complete preservation'
        }
    },
    {
        method: 'POST',
        path: '/translate-enhanced',
        handler: 'article.translateContent',
        config: {
            policies: [],
            auth: false,
            description: 'Enhanced translate with manual content support'
        }
    },

    // Article access management
    {
        method: 'PUT',
        path: '/content/:contentId/access-tier',
        handler: 'article.updateAccessTier',
        config: {
            auth: false,
            policies: [],
            description: 'Update access tier for language content'
        }
    },

    // Generic processing
    {
        method: 'POST',
        path: '/article/:id/process-generic',
        handler: 'article.processContentGeneric',
        config: {
            policies: [],
            auth: false,
            description: 'Generic processing endpoint that routes to appropriate processor'
        }
    },
];