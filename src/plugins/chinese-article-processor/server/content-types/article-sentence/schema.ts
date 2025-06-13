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
        // Keep for backward compatibility
        article_id: {
            type: 'integer',
            required: true,
        },

        // Link to specific per_languages entry
        per_language_id: {
            type: 'integer',
            required: true,
            unsigned: true, // ADDED: This should match per_languages.id type
        },

        // Store language code for easy filtering
        language: {
            type: 'string',
            required: true,
            maxLength: 10,
        },

        // Sentence content
        sentence_text: {
            type: 'richtext',
            required: true,
        },

        // Order within the language content
        sentence_order: {
            type: 'integer',
            required: true,
        },
    },
};