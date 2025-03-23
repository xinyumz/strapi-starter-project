// Updated index.tsx with explicit imports
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
// Import ChineseArticleData directly to ensure it exists
import ChineseArticleData from './components/ChineseArticleData';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    // Register chinese-language-tools custom field
    app.customFields.register({
      name: 'chinese-language-tools',
      pluginId: 'chinese-article-processor',
      type: 'json',
      intlLabel: {
        id: `${pluginId}.chinese-tools.label`,
        defaultMessage: 'Chinese Language Tools',
      },
      intlDescription: {
        id: `${pluginId}.chinese-tools.description`,
        defaultMessage: 'Process Chinese text with HSK calculation and grammar analysis',
      },
      components: {
        // Use a direct reference to the component
        Input: async () => ({ default: ChineseArticleData }),
      },
      options: {
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: 'form.attribute.item.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'form.attribute.item.requiredField.description',
                  defaultMessage: "You won't be able to create an entry if this field is empty",
                },
              },
            ],
          },
        ],
      },
    });

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
              data: prefixPluginTranslations(data, pluginId),
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