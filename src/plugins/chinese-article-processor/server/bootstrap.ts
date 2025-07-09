// src/plugins/chinese-article-processor/server/bootstrap.ts

export default ({ strapi }: any) => {
  // Attempt registration with per-language registry
  const attemptRegistration = () => {
    const registry = strapi.plugin('per-language')?.service('languageProcessorRegistry');
    const adapter = strapi.plugin('chinese-article-processor').service('processorAdapter');

    if (registry && adapter) {
      registry.registerProcessor(adapter);
      strapi.log.info('[Chinese Processor] ✅ Registered with language processor registry');
      return true;
    }
    return false;
  };

  // Try immediate registration
  if (!attemptRegistration()) {
    // Retry with delay if per-language plugin not ready
    setTimeout(() => {
      if (attemptRegistration()) {
        strapi.log.info('[Chinese Processor] ✅ Registration successful on retry');
      } else {
        strapi.log.error('[Chinese Processor] ❌ Registration failed - per-language plugin unavailable');
      }
    }, 1000);
  }
};