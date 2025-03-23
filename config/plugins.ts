export default ({ env }) => ({
    seo: {
        enabled: true,
    },
    'translator': {
        enabled: true,
        resolve: './src/plugins/translator'
    },
    'chinese-article-processor': {
        enabled: true,
        resolve: './src/plugins/chinese-article-processor'
    },
});