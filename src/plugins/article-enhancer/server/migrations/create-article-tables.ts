// Path: /src/plugins/article-enhancer/server/migrations/create-article-tables.ts

export async function up(knex: any): Promise<void> {
  // Check if tables already exist
  const articleSentencesExists = await knex.schema.hasTable('article_sentences');
  const sentenceGrammarRulesExists = await knex.schema.hasTable('sentence_grammar_rules');

  // Create article_sentences table if it doesn't exist
  if (!articleSentencesExists) {
    await knex.schema.createTable('article_sentences', (table: any) => {
      table.increments('id').primary();
      table.integer('article_id').unsigned().notNullable();
      table.text('sentence_text').notNullable();
      table.integer('sentence_order').notNullable();
      table.text('translation');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
      table.foreign('article_id').references('articles.id').onDelete('CASCADE');
    });
    console.log('Created article_sentences table');
  }

  // Create sentence_grammar_rules table if it doesn't exist
  if (!sentenceGrammarRulesExists) {
    await knex.schema.createTable('sentence_grammar_rules', (table: any) => {
      table.increments('id').primary();
      table.integer('sentence_id').notNullable();
      table.string('rule_text', 255).notNullable();
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
      table.foreign('sentence_id').references('article_sentences.id').onDelete('CASCADE');
    });
    console.log('Created sentence_grammar_rules table');
  }

  // Modify articles table
  const hasHskColumn = await knex.schema.hasColumn('articles', 'hsk');
  const hasGrammarColumn = await knex.schema.hasColumn('articles', 'grammar');

  if (hasHskColumn) {
    await knex.schema.alterTable('articles', (table: any) => {
      table.string('hsk', 255).alter();
    });
    console.log('Modified articles.hsk column');
  }

  if (hasGrammarColumn) {
    await knex.schema.alterTable('articles', (table: any) => {
      table.dropColumn('grammar');
    });
    console.log('Dropped articles.grammar column');
  }
}

export async function down(knex: any): Promise<void> {
  // Revert changes if needed
  await knex.schema.dropTableIfExists('sentence_grammar_rules');
  await knex.schema.dropTableIfExists('article_sentences');
}