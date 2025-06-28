// src/plugins/chinese-article-processor/server/bootstrap.ts



export default async ({ strapi }: any) => {
  try {
    strapi.log.info('[Chinese Article Processor] Plugin loaded successfully');

    // No migration needed - sentence tables are now proper Strapi content types
    // defined in src/plugins/chinese-article-processor/server/content-types/

  } catch (error) {
    strapi.log.error('[Chinese Article Processor] Error in bootstrap:', error);
  }
};