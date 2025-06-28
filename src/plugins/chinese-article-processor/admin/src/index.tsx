// prefixPluginTranslations removed in v5 - handle manually if needed
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    // Register the plugin page for the menu
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Chinese Article Processor',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [],
    });

    // Register the routes for the plugin pages
    app.createSettingSection(
      {
        id: `${pluginId}-chinese-tools`,
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: 'Chinese Language Tools',
        },
      },
      [
        {
          intlLabel: {
            id: `${pluginId}.chinese-tools.title`,
            defaultMessage: 'Chinese Language Tools',
          },
          id: 'chinese-processor',
          to: `/plugins/${pluginId}/chinese-processor`,
          Component: async () => {
            const component = await import('./pages/ChineseArticleProcessor');
            return component;
          },
        }
      ]
    );
  },

  bootstrap(app: any) { },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: data,
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};