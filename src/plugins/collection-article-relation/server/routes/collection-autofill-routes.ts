// src/plugins/collection-article-relation/server/routes/collection-autofill-routes.ts

export default [
    // ====================================
    // COLLECTION AUTO-FILL ROUTES
    // Maps to collectionAutofill controller
    // ====================================

    // Quick collection creation from single article
    {
        method: 'POST',
        path: '/quick-create',
        handler: 'collectionAutofill.quickCreateCollection',
        config: {
            policies: [],
            auth: {
                scope: ['admin'] // Changed: Require admin auth for collection creation
            },
            description: 'Create a new collection quickly from a single article with auto-filled fields',
            tags: ['collection', 'article', 'auto-fill'],
        }
    },

    // Health check endpoint (detailed)
    {
        method: 'GET',
        path: '/health',
        handler: 'collectionAutofill.health',
        config: {
            policies: [],
            auth: false, // Keep false for monitoring systems
            description: 'Detailed health check endpoint for the collection-article-relation plugin',
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
            auth: {
                scope: ['admin'] // Changed: Require admin auth for cache stats
            },
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
            auth: {
                scope: ['admin'] // Changed: Require admin auth for cache clearing
            },
            description: 'Clear the duplicate check cache',
            tags: ['cache', 'maintenance']
        }
    },
];