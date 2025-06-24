// src/plugins/per-language/server/content-types/collection-perlanguage/schema.ts
export default {
    kind: 'collectionType',
    collectionName: 'collection_perlanguages',
    info: {
        singularName: 'collection-perlanguage',
        pluralName: 'collection-perlanguages',
        displayName: 'Collection Per Language',
        description: 'Language-specific content for collections',
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
        collection_id: {
            type: 'integer',
            required: true,
        },
        language: {
            type: 'string',
            required: true,
        },
        description: {
            type: 'text',
            required: false,
        },
        display_skill: {
            type: 'string',
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