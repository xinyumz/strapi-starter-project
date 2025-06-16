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

    // Article processing routes
    {
        method: 'POST',
        path: '/process-article/:id',
        handler: 'articleController.processArticle',
        config: {
            policies: [],
            auth: false,
            description: 'Process article from per_languages table (main endpoint)'
        }
    },
    {
        method: 'POST',
        path: '/process-article-content',
        handler: 'articleController.processArticleWithContent',
        config: {
            policies: [],
            auth: false,
            description: 'Process article with direct content input (legacy)'
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
        method: 'PUT',
        path: '/article/:id/processed-data',
        handler: 'articleController.updateArticleProcessedData',
        config: {
            policies: [],
            auth: false,
            description: 'Update article processed data (per_languages only)'
        }
    }
];