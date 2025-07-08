import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
    register(app: any) {
        console.log('[Revalidate] Starting plugin registration...');

        // Direct HomePage import
        app.addMenuLink({
            to: 'revalidate',
            icon: PluginIcon,
            intlLabel: {
                id: 'revalidate.plugin.name',
                defaultMessage: 'Page Revalidation',
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

        console.log('[Revalidate] ✅ Plugin registered successfully');
    },

    bootstrap(app: any) {
        console.log('[Revalidate] ✅ Bootstrap completed');
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