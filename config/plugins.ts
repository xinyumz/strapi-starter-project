export default ({ env }) => ({
    'translator': {
        enabled: true,
        resolve: './src/plugins/translator'
    },
    'per-language': {
        enabled: true,
        resolve: './src/plugins/per-language'
    },
    'chinese-article-processor': {
        enabled: true,
        resolve: './src/plugins/chinese-article-processor'
    },
    'category-manager': {
        enabled: true,
        resolve: './src/plugins/category-manager'
    },
    'collection-article-relation': {
        enabled: true,
        resolve: './src/plugins/collection-article-relation'
    },
});