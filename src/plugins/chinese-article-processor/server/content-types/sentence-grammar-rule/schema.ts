// src/plugins/chinese-article-processor/server/content-types/sentence-grammar-rule/schema.ts

export default {
    kind: 'collectionType',
    collectionName: 'sentence_grammar_rules',
    info: {
        singularName: 'sentence-grammar-rule',
        pluralName: 'sentence-grammar-rules',
        displayName: 'Sentence Grammar Rule',
        description: 'Grammar rules for individual sentences',
    },
    options: {
        draftAndPublish: false,
    },
    pluginOptions: {
        'content-manager': {
            visible: false, // Hide from admin UI
        },
        'content-type-builder': {
            visible: false,
        },
    },
    attributes: {
        sentence_id: {
            type: 'integer',
            required: true,
        },
        rule: {
            type: 'string',
            required: true,
        },
    },
};