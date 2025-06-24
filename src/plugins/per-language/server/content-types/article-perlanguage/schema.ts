// src/plugins/per-language/server/content-types/article-perlanguage/schema.ts
export default {
    kind: 'collectionType',
    collectionName: 'article_perlanguages',
    info: {
        singularName: 'article-perlanguage',
        pluralName: 'article-perlanguages',
        displayName: 'Article Per Language',
        description: 'Language-specific content for articles',
    },
    options: {
        draftAndPublish: false,
    },
    pluginOptions: {
        'content-manager': {
            visible: true,
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
        language: {
            type: 'string',
            required: true,
        },
        per_language_text: {
            type: 'text',
            required: true,
        },
        processed_data: {
            type: 'json',
            required: false,
        },
        display_skill: {
            type: 'string',
            required: false,
        },
        difficulty_data: {
            type: 'json',
            required: false,
        },
        published: {
            type: 'boolean',
            default: false,
        },
        access_tier: {
            type: 'string',
            required: false,
        },
    },
};