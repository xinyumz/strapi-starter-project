// src/plugins/collection-article-relation/server/routes/collection-autofill-routes.ts

export default [
    // Primary functionality - Quick collection creation from single article
    {
        method: 'POST',
        path: '/quick-create',
        handler: 'collectionAutofill.quickCreateCollection',
        config: {
            policies: [],
            auth: false, // Set to true if you want to require authentication
            description: 'Create a new collection quickly from a single article with auto-filled fields',
            tags: ['collection', 'article', 'auto-fill'],
        }
    },

    // Health check endpoint
    {
        method: 'GET',
        path: '/health',
        handler: 'collectionAutofill.health',
        config: {
            policies: [],
            auth: false,
            description: 'Health check endpoint for the collection-article-relation plugin',
            tags: ['health', 'monitoring']
        }
    },

    // Cache management endpoints
    {
        method: 'GET',
        path: '/cache/stats',
        handler: 'collectionAutofill.cacheStats',
        config: {
            policies: [],
            auth: false, // Consider setting to true for production
            description: 'Get cache statistics for monitoring and debugging',
            tags: ['cache', 'monitoring', 'debug']
        }
    },

    {
        method: 'POST',
        path: '/cache/clear',
        handler: 'collectionAutofill.clearCache',
        config: {
            policies: [],
            auth: false, // Consider setting to true for production
            description: 'Clear the duplicate check cache',
            tags: ['cache', 'maintenance']
        }
    },
];