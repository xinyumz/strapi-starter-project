// src/plugins/per-language/server/routes/migration-routes.ts

export default [
    {
        method: 'GET',
        path: '/test-sources',
        handler: 'migration.testDataSources',
        config: {
            auth: false,
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/system-overview',
        handler: 'migration.getSystemOverview',
        config: {
            auth: false,
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/data-source/:articleId',
        handler: 'migration.getDataSourceInfo',
        config: {
            auth: false,
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/article/:articleId/processing-data',
        handler: 'migration.getArticleForProcessing',
        config: {
            auth: false,
            policies: []
        }
    },
    {
        method: 'POST',
        path: '/article/:articleId/create-entry',
        handler: 'migration.createPerLanguageEntry',
        config: {
            auth: false,
            policies: []
        }
    }
];