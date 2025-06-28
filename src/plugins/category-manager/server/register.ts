// server/register.ts


export default ({ strapi }: any) => {
  strapi.customFields.register({
    name: 'category-selector',
    plugin: 'category-manager',
    type: 'integer',
    inputSize: {
      default: 6,
      isResizable: true,
    },
  });
};