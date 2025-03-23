// Path: /src/plugins/chinese-article-processor/server/migrations/setup-chinese-article-database.ts

export async function up(knex: any): Promise<void> {
    try {
        // Clean up any existing tables to ensure a fresh start
        // Drop tables in the correct order to avoid foreign key constraint issues
        await knex.schema.dropTableIfExists('sentence_grammar_rules');
        await knex.schema.dropTableIfExists('sentence_translations');
        await knex.schema.dropTableIfExists('article_translations'); // In case old table exists
        await knex.schema.dropTableIfExists('article_sentences');

        // Create article_sentences table
        await knex.schema.createTable('article_sentences', (table: any) => {
            table.increments('id').primary();
            table.integer('article_id').unsigned().notNullable();
            table.text('sentence_text').notNullable();
            table.integer('sentence_order').notNullable();
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.datetime('updated_at').defaultTo(knex.fn.now());
            table.foreign('article_id').references('articles.id').onDelete('CASCADE');
        });
        console.log('Created article_sentences table');

        // Create sentence_translations table
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

        // Create sentence_grammar_rules table
        await knex.schema.createTable('sentence_grammar_rules', (table: any) => {
            table.increments('id').primary();
            table.integer('sentence_id').unsigned().notNullable();
            table.string('rule', 255).notNullable();
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.datetime('updated_at').defaultTo(knex.fn.now());

            // Foreign key to article_sentences
            table.foreign('sentence_id').references('article_sentences.id').onDelete('CASCADE');
        });
        console.log('Created sentence_grammar_rules table');

        // Modify articles table if needed
        const hasArticlesTable = await knex.schema.hasTable('articles');
        if (hasArticlesTable) {
            const hasGrammarColumn = await knex.schema.hasColumn('articles', 'grammar');
            if (hasGrammarColumn) {
                await knex.schema.alterTable('articles', (table: any) => {
                    table.dropColumn('grammar');
                });
                console.log('Dropped articles.grammar column');
            }
        }
    } catch (error) {
        console.error('Error in database setup:', error);
        throw error;
    }
}

export async function down(knex: any): Promise<void> {
    // Drop all tables in reverse order
    await knex.schema.dropTableIfExists('sentence_grammar_rules');
    await knex.schema.dropTableIfExists('sentence_translations');
    await knex.schema.dropTableIfExists('article_sentences');
}