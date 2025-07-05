// src/plugins/collection-article-relation/admin/src/index.tsx

import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import { initializePageMonitoring } from './utils/pageMonitorSystem';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    app.addMenuLink({
      to: 'collection-article-relation',
      icon: PluginIcon,
      intlLabel: {
        id: 'collection-article-relation.plugin.name',
        defaultMessage: 'Collection Management Hub',
      },
      Component: () => import('./pages/HomePage'),
      permissions: [],
    });

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  bootstrap(app: any) {
    console.log('[Collection Article Relation] Bootstrap started');

    setTimeout(() => {
      console.log('[Collection Article Relation] Initializing floating button system');
      initializePageMonitoring();
    }, 2000);

    console.log('[Collection Article Relation] Bootstrap completed');
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => ({ data, locale }))
          .catch(() => ({ data: {}, locale }));
      })
    );
    return Promise.resolve(importedTrads);
  },
};