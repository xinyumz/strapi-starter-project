// server/register.ts


export default ({ strapi }: any) => {
  strapi.customFields.register({
    name: 'chinese-language-tools',
    plugin: 'chinese-article-processor',
    type: 'json',
  });
};