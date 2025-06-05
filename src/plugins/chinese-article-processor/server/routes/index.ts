// server/routes/index.ts
export default [
    // HSK Calculator routes
    {
        method: 'POST',
        path: '/hsk/calculate',
        handler: 'hskController.calculateHSK',
        config: {
            policies: [],
            auth: false,
            description: 'Calculate HSK level for Chinese text'
        }
    },
    // Grammar rules routes
    {
        method: 'POST',
        path: '/grammar/generate',
        handler: 'grammarController.generateRules',
        config: {
            policies: [],
            auth: false,
            description: 'Generate grammar rules for Chinese text'
        }
    },
    {
        method: 'GET',
        path: '/grammar/article/:id',
        handler: 'grammarController.getArticleGrammar',
        config: {
            policies: [],
            auth: false,
            description: 'Get grammar data for an article'
        }
    },
    {
        method: 'POST',
        path: '/grammar/article/:id',
        handler: 'grammarController.saveArticleGrammar',
        config: {
            policies: [],
            auth: false,
            description: 'Save grammar data for an article'
        }
    },
    // Translation routes
    {
        method: 'POST',
        path: '/process-sentences',
        handler: 'translationController.translateSentences',
        config: {
            policies: [],
            auth: false,
            description: 'Process and translate sentences'
        }
    },
    {
        method: 'GET',
        path: '/languages',
        handler: 'translationController.getSupportedLanguages',
        config: {
            policies: [],
            auth: false,
            description: 'Get supported languages for translation'
        }
    },
    // Article routes
    {
        method: 'POST',
        path: '/process-article',
        handler: 'articleController.processArticle',
        config: {
            policies: [],
            auth: false,
            description: 'Process full article content with translations and grammar rules'
        }
    },
    {
        method: 'GET',
        path: '/article/:id/sentences',
        handler: 'articleController.getArticleSentences',
        config: {
            policies: [],
            auth: false,
            description: 'Get sentences with translations for an article'
        }
    },
    {
        method: 'POST',
        path: '/process-from-any-source/:id',
        handler: 'articleController.processArticleFromAnySource',
        config: {
            policies: [],
            auth: false,
            description: 'Process article using dual-source approach with fallback'
        },
    },
    {
        method: 'POST',
        path: '/process-v2/:id',
        handler: 'articleController.processArticleV2',
        config: {
            policies: [],
            auth: false,
            description: 'Process article using dual-source approach (Phase 3)'
        }
    },
    {
        method: 'PUT',
        path: '/article/:id/processed-data',
        handler: 'articleController.updateArticleProcessedData',
        config: {
            policies: [],
            auth: false,
            description: 'Update article processed data with dual-write support'
        }
    },
    {
        method: 'POST',
        path: '/sync-processed-data/:id',
        handler: 'articleController.syncProcessedDataManually',
        config: {
            policies: [],
            auth: false,
            description: 'Manually sync processed data from articles to per_languages table'
        }
    }
];