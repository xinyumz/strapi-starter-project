// src/plugins/collection-article-relation/server/routes/collection-autofill-routes.ts

export default [
    // Quick collection creation from single article (main functionality)
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