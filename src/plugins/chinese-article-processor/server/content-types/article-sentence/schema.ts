// src/plugins/chinese-article-processor/server/content-types/article-sentence/schema.ts

export default {
    kind: 'collectionType',
    collectionName: 'article_sentences',
    info: {
        singularName: 'article-sentence',
        pluralName: 'article-sentences',
        displayName: 'Article Sentence',
        description: 'Individual sentences from articles for processing',
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
        article_id: {
            type: 'integer',
            required: true,
        },
        sentence_text: {
            type: 'richtext',  // ← Changed from 'text' to 'richtext' for LONGTEXT
            required: true,
        },
        sentence_order: {
            type: 'integer',
            required: true,
        },
    },
};