// Path: /src/plugins/article-enhancer/server/bootstrap.ts

import { Strapi } from '@strapi/strapi';
import { up as createArticleTables } from './migrations/create-article-tables';
import { up as renameTranslationsTable } from './migrations/rename-translations-table';

export default async ({ strapi }: { strapi: Strapi }) => {
  // Run migrations
  try {
    // Check if DB connection is available
    if (!strapi.db || !strapi.db.connection) {
      strapi.log.error('Database connection not available');
      return;
    }

    const knex = strapi.db.connection;

    // First, make sure any old tables are dropped if they exist
    // We're doing this first since the foreign key constraints can cause issues
    try {
      if (await knex.schema.hasTable('sentence_grammar_rules')) {
        // Drop foreign key constraints first to avoid issues
        const foreignKeys = await knex.raw(
          `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
           WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
           AND TABLE_NAME = 'sentence_grammar_rules'`
        );

        if (foreignKeys && foreignKeys[0] && foreignKeys[0].length > 0) {
          for (const fk of foreignKeys[0]) {
            await knex.schema.alterTable('sentence_grammar_rules', (table: any) => {
              table.dropForeign([], fk.CONSTRAINT_NAME);
            });
          }
        }

        await knex.schema.dropTable('sentence_grammar_rules');
        strapi.log.info('Dropped obsolete sentence_grammar_rules table');
      }

      if (await knex.schema.hasTable('article_translation')) {
        // Drop foreign key constraints first to avoid issues
        const foreignKeys = await knex.raw(
          `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
           WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
           AND TABLE_NAME = 'article_translation'`
        );

        if (foreignKeys && foreignKeys[0] && foreignKeys[0].length > 0) {
          for (const fk of foreignKeys[0]) {
            await knex.schema.alterTable('article_translation', (table: any) => {
              table.dropForeign([], fk.CONSTRAINT_NAME);
            });
          }
        }

        await knex.schema.dropTable('article_translation');
        strapi.log.info('Dropped obsolete article_translation table');
      }
    } catch (err) {
      strapi.log.warn('Error removing obsolete tables:', err);
      // Continue with the migration process even if this fails
    }

    // Check if migration tracking table exists
    const hasTrackingTable = await knex.schema.hasTable('article_enhancer_migrations');

    if (!hasTrackingTable) {
      // Create migration tracking table if it doesn't exist
      await knex.schema.createTable('article_enhancer_migrations', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.datetime('executed_at').defaultTo(knex.fn.now());
      });
      strapi.log.info('Created migration tracking table');
    }

    // Check for the current version of our tables migration
    const currentTableVersion = await knex('article_enhancer_migrations')
      .select('version')
      .where('name', 'create-article-tables')
      .first();

    // Current structure is version 2 (with grammar_rules column and without sentence_grammar_rules table)
    const CURRENT_TABLE_VERSION = 2;

    if (!currentTableVersion) {
      // First time running this migration
      await createArticleTables(knex);
      await knex('article_enhancer_migrations').insert({
        name: 'create-article-tables',
        version: CURRENT_TABLE_VERSION,
        executed_at: knex.fn.now()
      });
      strapi.log.info('Article enhancer tables created successfully');
    } else if (currentTableVersion.version < CURRENT_TABLE_VERSION) {
      // We need to update the tables to the latest structure
      await createArticleTables(knex);
      await knex('article_enhancer_migrations')
        .where('name', 'create-article-tables')
        .update({
          version: CURRENT_TABLE_VERSION,
          executed_at: knex.fn.now()
        });
      strapi.log.info(`Updated article enhancer tables to version ${CURRENT_TABLE_VERSION}`);
    }

    // Check for the rename migration
    const hasRenameRun = await knex('article_enhancer_migrations')
      .where('name', 'rename-translations-table')
      .first();

    if (!hasRenameRun) {
      // Run the rename migration
      await renameTranslationsTable(knex);
      await knex('article_enhancer_migrations').insert({
        name: 'rename-translations-table',
        version: 1,
        executed_at: knex.fn.now()
      });
      strapi.log.info('Renamed article_translations to sentence_translations successfully');
    }

  } catch (error) {
    strapi.log.error('Error running article enhancer migrations:', error);
    console.error(error);
  }
};