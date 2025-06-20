export default {
    kind: 'collectionType',
    collectionName: 'category_manager_categories',
    info: {
        singularName: 'category',
        pluralName: 'categories',
        displayName: 'Category',
        description: 'Specific categories within taxonomies',
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
            maxLength: 100,
        },
        url: {
            type: 'string',
            required: true,
            regex: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        },
        taxon: {
            type: 'relation',
            relation: 'manyToOne',
            target: 'plugin::category-manager.taxon',
            inversedBy: 'categories',
            required: true,
        },
        order: {
            type: 'integer',
            default: 0,
            min: 0,
        },
    },
};