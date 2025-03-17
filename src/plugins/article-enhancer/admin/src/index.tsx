// Updated index.tsx with multi-page approach
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    // Register custom field for HSK Calculator
    app.customFields.register({
      name: 'hsk-calculator',
      pluginId: 'article-enhancer',
      type: 'string',
      intlLabel: {
        id: `${pluginId}.hsk-calculator.label`,
        defaultMessage: 'HSK Calculator',
      },
      intlDescription: {
        id: `${pluginId}.hsk-calculator.description`,
        defaultMessage: 'Calculate HSK levels for Chinese text and track results',
      },
      components: {
        Input: async () => import('./components/HSKCalculator'),
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

    // Register custom field for Grammar Rules
    // Using static component that links to a plugin page
    app.customFields.register({
      name: 'grammar-rules',
      pluginId: 'article-enhancer',
      type: 'json',
      intlLabel: {
        id: `${pluginId}.grammar-rules.label`,
        defaultMessage: 'Grammar Rules',
      },
      intlDescription: {
        id: `${pluginId}.grammar-rules.description`,
        defaultMessage: 'Generate and manage grammar rules for Chinese text',
      },
      components: {
        Input: async () => import('./components/StaticGrammarComponent'),
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

    // Register the plugin page for grammar rules
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Article Enhancer',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [
        // Uncomment to require permissions
        // {
        //   action: 'plugin::article-enhancer.access',
        //   subject: null,
        // },
      ],
    });

    // Register the routes for the plugin pages
    app.createSettingSection(
      {
        id: `${pluginId}-chinese-tools`, // Use a more specific ID
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