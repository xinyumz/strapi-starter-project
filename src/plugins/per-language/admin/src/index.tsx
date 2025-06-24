// src/plugins/per-language/admin/src/index.tsx
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    console.log('[per-language admin] Registering language processor field...');

    // Register the language processor custom field
    app.customFields.register({
      name: 'language-processor',
      pluginId: 'per-language',
      type: 'richtext',
      intlLabel: {
        id: 'per-language.language-processor.label',
        defaultMessage: 'Language Processor',
      },
      intlDescription: {
        id: 'per-language.language-processor.description',
        defaultMessage: 'Translate and process content in multiple languages',
      },
      components: {
        Input: async () => import('./components/article-perlanguage/LanguageProcessorField'),
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

    // Register the collection perlanguage custom field
    app.customFields.register({
      name: 'collection-perlanguage',
      pluginId: 'per-language',
      type: 'text',
      intlLabel: {
        id: 'per-language.collection-perlanguage.label',
        defaultMessage: 'Collection Per-Language',
      },
      intlDescription: {
        id: 'per-language.collection-perlanguage.description',
        defaultMessage: 'Manage collection content in multiple languages',
      },
      components: {
        Input: async () => import('./components/collection-perlanguage/CollectionPerlanguageField'),
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

    // Register the menu link
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Language Processing Hub',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [],
    });

    // Register the plugin
    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  bootstrap(app: any) {
    console.log('[per-language admin] Bootstrap completed');
  },

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