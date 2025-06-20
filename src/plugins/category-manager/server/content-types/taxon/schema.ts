export default {
    kind: 'collectionType',
    collectionName: 'category_manager_taxons',
    info: {
        singularName: 'taxon',
        pluralName: 'taxons',
        displayName: 'Taxon',
        description: 'Top-level categorization groups',
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
        name: {
            type: 'string',
            required: true,
            unique: true,
            maxLength: 100,
        },
        url: {
            type: 'string',
            required: true,
            unique: true,
            regex: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        },
        categories: {
            type: 'relation',
            relation: 'oneToMany',
            target: 'plugin::category-manager.category',
            mappedBy: 'taxon',
        },
    },
};