// Path: /src/plugins/article-enhancer/server/bootstrap.ts

import { Strapi } from '@strapi/strapi';
import { up as createArticleTables } from './migrations/create-article-tables';

export default async ({ strapi }: { strapi: Strapi }) => {
  // Run migration
  try {
    if (!strapi.db || !strapi.db.connection) {
      strapi.log.error('Database connection not available');
      return;
    }

    await createArticleTables(strapi.db.connection);
    strapi.log.info('Article enhancer tables created successfully');
  } catch (error) {
    strapi.log.error('Error creating article enhancer tables:', error);
    console.error(error);
  }
};