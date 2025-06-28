// src/plugins/translator/server/bootstrap.ts



export default async ({ strapi }: any) => {
  console.log('[Translator Bootstrap] Translator plugin initialized');

  // The translator plugin is now a pure service provider:
  // - Provides translation API endpoint (/translator/translate)
  // - Provides language listing API (/translator/languages)  
  // - Called by per-language plugin when needed
  // - No direct database operations or lifecycle hooks

  console.log('[Translator Bootstrap] Translation service ready');
};