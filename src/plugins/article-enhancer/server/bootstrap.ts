// Path: /src/plugins/article-enhancer/server/bootstrap.ts

import { Strapi } from '@strapi/strapi';
import { up as setupChineseArticleDatabase } from './migrations/setup-chinese-article-database';

export default async ({ strapi }: { strapi: Strapi }) => {
  try {
    // Check if DB connection is available
    if (!strapi.db || !strapi.db.connection) {
      strapi.log.error('Database connection not available');
      return;
    }

    const knex = strapi.db.connection;

    // Check if migration tracking table exists
    const hasTrackingTable = await knex.schema.hasTable('article_enhancer_migrations');

    if (!hasTrackingTable) {
      // Create migration tracking table if it doesn't exist
      await knex.schema.createTable('article_enhancer_migrations', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.datetime('executed_at').defaultTo(knex.fn.now());
      });
      strapi.log.info('Created migration tracking table');
    }

    // Check if our database setup has been run
    const hasSetupRun = await knex('article_enhancer_migrations')
      .where('name', 'setup-chinese-article-database')
      .first();

    if (!hasSetupRun) {
      // Run the setup
      await setupChineseArticleDatabase(knex);
      await knex('article_enhancer_migrations').insert({
        name: 'setup-chinese-article-database',
        executed_at: knex.fn.now()
      });
      strapi.log.info('Chinese article database tables set up successfully');
    }
  } catch (error) {
    strapi.log.error('Error setting up Chinese article database:', error);
    console.error(error);
  }
};