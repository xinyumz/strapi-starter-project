import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
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

    app.customFields.register({
      name: 'grammar-rules',
      pluginId: 'article-enhancer',
      type: 'string',
      intlLabel: {
        id: `${pluginId}.grammar-rules.label`,
        defaultMessage: 'Grammar Rules',
      },
      intlDescription: {
        id: `${pluginId}.grammar-rules.description`,
        defaultMessage: 'Generate and manage grammar rules for Chinese text',
      },
      components: {
        Input: async () => import('./components/GrammarRulesGenerator'),
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
  },

  bootstrap() { },

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