export default [
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
        method: 'DELETE',
        path: '/grammar/rule',
        handler: 'grammarController.deleteRule',
        config: {
            policies: [],
            auth: false,
            description: 'Delete a specific grammar rule'
        }
    },
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