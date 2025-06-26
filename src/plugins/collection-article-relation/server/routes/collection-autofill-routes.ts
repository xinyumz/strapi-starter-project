// src/plugins/collection-article-relation/server/routes/collection-autofill-routes.ts

export default [
    // Article analysis for auto-fill
    {
        method: 'POST',
        path: '/analyze-articles',
        handler: 'collectionAutofill.analyzeArticles',
        config: {
            policies: [],
            auth: false,
            description: 'Analyze selected articles to determine auto-fill suggestions for collection creation'
        }
    },

    // Quick collection creation from single article
    {
        method: 'POST',
        path: '/quick-create',
        handler: 'collectionAutofill.quickCreateCollection',
        config: {
            policies: [],
            auth: false,
            description: 'Create a new collection quickly from a single article with auto-filled fields'
        }
    },

    // Get article data for preview/analysis
    {
        method: 'GET',
        path: '/articles',
        handler: 'collectionAutofill.getArticleData',
        config: {
            policies: [],
            auth: false,
            description: 'Get article data for auto-fill analysis and preview'
        }
    },

    // Health check
    {
        method: 'GET',
        path: '/health',
        handler: 'collectionAutofill.health',
        config: {
            policies: [],
            auth: false,
            description: 'Health check endpoint for the collection-article-relation plugin'
        }
    }
];