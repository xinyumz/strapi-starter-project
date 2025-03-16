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
    {
        method: 'DELETE',
        path: '/grammar/rule/:ruleId',
        handler: 'grammarController.deleteRule',
        config: {
            policies: [],
            auth: false,
            description: 'Delete a specific grammar rule'
        }
    },

    // Sentence processing routes
    {
        method: 'POST',
        path: '/process-sentences',
        handler: 'sentenceController.translateSentences',
        config: {
            policies: [],
            auth: false,
            description: 'Process and translate sentences'
        }
    },
    {
        method: 'POST',
        path: '/process-article',
        handler: 'sentenceController.processArticle',
        config: {
            policies: [],
            auth: false,
            description: 'Process full article content with translations and grammar rules'
        }
    }
];