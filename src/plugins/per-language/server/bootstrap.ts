// src/plugins/per-language/server/bootstrap.ts
import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  // Initialize language processors
  const languageService = strapi.plugin('per-language').service('languageService');
  const availableProcessors = languageService.initializeLanguageProcessors();

  strapi.log.info(`Per-language plugin initialized with ${availableProcessors.length} language processors`);

  if (availableProcessors.length > 0) {
    availableProcessors.forEach(processor => {
      strapi.log.info(`  - ${processor.name} (${processor.code}) via ${processor.pluginName}`);
    });
  } else {
    strapi.log.warn('No language processors found');
  }

  // Check for translator plugin availability
  if (strapi.plugins['translator']) {
    strapi.log.info('Translator plugin found');

    // Check for translation service
    const translationService = strapi.plugin('translator').service('translationService');
    if (translationService) {
      strapi.log.info('Translator service found');
      if (typeof translationService.translate === 'function') {
        strapi.log.info('Translator translate method is available');
      } else {
        strapi.log.warn('Translator translate method is NOT available');
      }
    } else {
      strapi.log.warn('Translator service NOT found');
    }
  } else {
    strapi.log.error('Translator plugin NOT found');
  }
};