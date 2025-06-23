// src/plugins/category-manager/admin/src/index.tsx

import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    console.log('[Category Manager] Starting plugin registration...');

    app.customFields.register({
      name: 'category-selector',
      pluginId: 'category-manager',
      type: 'string',
      intlLabel: {
        id: 'category-manager.category-selector.label',
        defaultMessage: 'Category Selector',
      },
      intlDescription: {
        id: 'category-manager.category-selector.description',
        defaultMessage: 'Select taxonomy and category for content organization',
      },
      components: {
        Input: async () => import('./components/CategorySelector'),
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
              {
                name: 'default',
                type: 'string',
                intlLabel: {
                  id: 'form.attribute.item.defaultValue',
                  defaultMessage: 'Default value',
                },
                description: {
                  id: 'category-manager.default-value.description',
                  defaultMessage: 'Set default category ID',
                },
              },
            ],
          },
        ],
      },
    });

    console.log('[Category Manager] ✅ Category selector field registered successfully as STRING type');

    // Register plugin page
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
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

    console.log('[Category Manager] ✅ Plugin registered successfully');
  },

  bootstrap(app: any) {
    console.log('[Category Manager] ✅ Bootstrap completed');
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