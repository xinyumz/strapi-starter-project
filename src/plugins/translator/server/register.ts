//server/register.ts



export default ({ strapi }: any) => {
  strapi.customFields.register({
    name: 'translator',
    plugin: 'translator',
    type: 'richtext',
  });
};