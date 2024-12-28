import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import HSKCalculator from './components/HSKCalculator';
import GrammarRulesGenerator from './components/GrammarRulesGenerator';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    // Register HSK Calculator custom field
    app.customFields.register({
      name: 'hsk-calculator',
      pluginId: 'article-enhancer',
      type: 'json',
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.hsk-calculator.label`,
        defaultMessage: 'HSK Calculator',
      },
      intlDescription: {
        id: `${pluginId}.hsk-calculator.description`,
        defaultMessage: 'Calculate HSK levels for Chinese text and track results',
      },
      components: {
        Input: HSKCalculator
      },
      options: {
        // Any configuration options for the field
        advanced: {
          label: 'Options',
          defaultValue: {
            calculatedLevel: null,
            selectedLevel: null,
            distribution: []
          }
        }
      }
    });

    // Register Grammar Rules Generator custom field
    app.customFields.register({
      name: 'grammar-rules',
      pluginId: 'article-enhancer',
      type: 'json',
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.grammar-rules.label`,
        defaultMessage: 'Grammar Rules',
      },
      intlDescription: {
        id: `${pluginId}.grammar-rules.description`,
        defaultMessage: 'Generate and manage grammar rules for Chinese text',
      },
      components: {
        Input: GrammarRulesGenerator
      },
      options: {
        advanced: {
          label: 'Options',
          defaultValue: {
            sentences: []
          }
        }
      }
    });

    // Keep the existing menu link registration
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

    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  bootstrap(app: any) { },

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