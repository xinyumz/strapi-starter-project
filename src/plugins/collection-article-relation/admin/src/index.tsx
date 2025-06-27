// src/plugins/collection-article-relation/admin/src/index.tsx

import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import { initializePageMonitoring } from './utils/pageMonitorSystem';

const name = pluginPkg.strapi.name;

export default {
  /**
   * Register plugin with Strapi admin
   */
  register(app: any) {
    // Add menu link
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

    // Register plugin
    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  /**
   * Bootstrap plugin functionality
   */
  bootstrap(app: any) {
    console.log('[Collection Article Relation] Bootstrap started');

    // Initialize floating button system with delay to ensure DOM is ready
    setTimeout(() => {
      console.log('[Collection Article Relation] Initializing floating button system');
      initializePageMonitoring();
    }, 2000);

    console.log('[Collection Article Relation] Bootstrap completed');
  },

  /**
   * Register translations
   */
  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map((locale) => {
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