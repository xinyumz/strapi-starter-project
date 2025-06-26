// src/plugins/per-language/server/routes/collection-routes.ts

export default [
    // Collection content management
    {
        method: 'PUT',
        path: '/collection/:id/content',
        handler: 'collection.updateCollectionContent',
        config: {
            policies: [],
            auth: false,
            description: 'Update collection content for a specific language (with auto-retrieval support)'
        }
    },
    {
        method: 'GET',
        path: '/collection/:id/content',
        handler: 'collection.getCollectionContent',
        config: {
            policies: [],
            auth: false,
            description: 'Get collection content for a specific language'
        }
    },
    {
        method: 'GET',
        path: '/collection/:id/languages',
        handler: 'collection.getCollectionLanguages',
        config: {
            policies: [],
            auth: false,
            description: 'Get all languages for a collection'
        }
    },

    // Collection language property updates
    {
        method: 'PUT',
        path: '/collection/:id/display-skill',
        handler: 'collection.updateCollectionDisplaySkill',
        config: {
            policies: [],
            auth: false,
            description: 'Update collection language display skill'
        }
    },
    {
        method: 'PUT',
        path: '/collection/:id/access-tier',
        handler: 'collection.updateCollectionAccessTier',
        config: {
            policies: [],
            auth: false,
            description: 'Update collection language access tier'
        }
    },
    {
        method: 'PUT',
        path: '/collection/:id/publish',
        handler: 'collection.updateCollectionPublishStatus',
        config: {
            policies: [],
            auth: false,
            description: 'Update collection language publish status'
        }
    },
    {
        method: 'DELETE',
        path: '/collection/:id',
        handler: 'collection.deleteCollectionLanguage',
        config: {
            policies: [],
            auth: false,
            description: 'Delete collection language'
        }
    },

    // Collection auto-retrieval endpoints
    {
        method: 'GET',
        path: '/collection/:id/auto-retrieval',
        handler: 'collection.getCollectionAutoRetrieval',
        config: {
            policies: [],
            auth: false,
            description: 'Get auto-retrieval suggestions for collection language creation'
        }
    },
    {
        method: 'GET',
        path: '/collection/:id/stats',
        handler: 'collection.getCollectionStats',
        config: {
            policies: [],
            auth: false,
            description: 'Get collection statistics (article count, etc.)'
        }
    }
];