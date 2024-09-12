export default ({ env }) => ({
    seo: {
        enabled: true,
    },
    'translator': {
        enabled: true,
        resolve: './src/plugins/translator'
    },
});