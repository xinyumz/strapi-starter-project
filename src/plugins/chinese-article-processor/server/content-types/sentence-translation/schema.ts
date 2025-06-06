// src/plugins/chinese-article-processor/server/content-types/sentence-translation/schema.ts

export default {
    kind: 'collectionType',
    collectionName: 'sentence_translations',
    info: {
        singularName: 'sentence-translation',
        pluralName: 'sentence-translations',
        displayName: 'Sentence Translation',
        description: 'Translations of individual sentences',
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
        translation_language: {
            type: 'string',
            required: true,
        },
        translation_text: {
            type: 'richtext',  // ← Changed from 'text' to 'richtext' for LONGTEXT
            required: true,
        },
    },
};