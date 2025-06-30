// src/plugins/category-manager/admin/src/index.tsx

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
      type: 'integer',
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
            ],
          },
        ],
      },
    });

    // FIXED: Simple plugin - direct HomePage import
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: async () => {
        const { default: HomePage } = await import('./pages/HomePage');
        return HomePage;
      },
      permissions: [],
    });

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });

    console.log('[Category Manager] ✅ Plugin registered successfully');
  },

  bootstrap(app: any) {
    console.log('[Category Manager] ✅ Bootstrap completed');
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => ({ data, locale }))
          .catch(() => ({ data: {}, locale }));
      })
    );
    return Promise.resolve(importedTrads);
  },
};