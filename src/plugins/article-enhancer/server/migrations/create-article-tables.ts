// Path: /src/plugins/article-enhancer/server/migrations/create-article-tables.ts

export async function up(knex: any): Promise<void> {
  // Check if tables already exist
  const articleSentencesExists = await knex.schema.hasTable('article_sentences');

  // Create article_sentences table if it doesn't exist
  if (!articleSentencesExists) {
    await knex.schema.createTable('article_sentences', (table: any) => {
      table.increments('id').primary();
      table.integer('article_id').unsigned().notNullable();
      table.text('sentence_text').notNullable();
      table.integer('sentence_order').notNullable();
      table.json('grammar_rules');  // Add grammar_rules JSON column from the start
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
      table.foreign('article_id').references('articles.id').onDelete('CASCADE');
    });
    console.log('Created article_sentences table');
  }

  // Add grammar_rules column if it doesn't exist
  if (articleSentencesExists) {
    const hasGrammarRulesColumn = await knex.schema.hasColumn('article_sentences', 'grammar_rules');
    if (!hasGrammarRulesColumn) {
      await knex.schema.alterTable('article_sentences', (table: any) => {
        table.json('grammar_rules');
      });
      console.log('Added grammar_rules JSON column to article_sentences table');
    }
  }

  // Check if translations table exists (use sentence_translations if it exists, otherwise create article_translations)
  const sentenceTranslationsExists = await knex.schema.hasTable('sentence_translations');

  if (sentenceTranslationsExists) {
    console.log('Using existing sentence_translations table');
  } else {
    // Check for article_translations as well
    const articleTranslationsExists = await knex.schema.hasTable('article_translations');

    if (!articleTranslationsExists) {
      // Neither table exists, create the sentence_translations table
      await knex.schema.createTable('sentence_translations', (table: any) => {
        table.increments('id').primary();
        table.integer('sentence_id').unsigned().notNullable();
        table.string('translation_language', 255).notNullable();
        table.text('translation_text').notNullable();
        table.datetime('created_at').defaultTo(knex.fn.now());
        table.datetime('updated_at').defaultTo(knex.fn.now());

        // Foreign key relationship
        table.foreign('sentence_id').references('article_sentences.id').onDelete('CASCADE');

        // Add a unique constraint on sentence_id and language
        table.unique(['sentence_id', 'translation_language']);
      });
      console.log('Created sentence_translations table');
    } else {
      console.log('Using existing article_translations table (will be renamed later)');
    }
  }

  // Modify articles table
  const hasArticlesTable = await knex.schema.hasTable('articles');
  if (hasArticlesTable) {
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
}

export async function down(knex: any): Promise<void> {
  // Revert changes if needed
  await knex.schema.dropTableIfExists('sentence_translations');
  await knex.schema.dropTableIfExists('article_translations');
  await knex.schema.dropTableIfExists('article_sentences');
}