export default ({ env }) => ({
    seo: {
        enabled: true,
    },
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
});