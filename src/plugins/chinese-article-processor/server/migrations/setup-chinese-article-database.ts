// src/plugins/chinese-article-processor/server/migrations/setup-chinese-article-database.ts

export async function up(knex: any): Promise<void> {
    try {
        console.log('[Migration] Starting safe database setup...');



        // Create article_sentences table (only if missing)
        const hasArticleSentences = await knex.schema.hasTable('article_sentences');
        if (!hasArticleSentences) {
            await knex.schema.createTable('article_sentences', (table: any) => {
                table.increments('id').primary();
                table.integer('article_id').unsigned().notNullable();
                table.longtext('sentence_text').notNullable(); // Use LONGTEXT to prevent length issues
                table.integer('sentence_order').notNullable();
                table.datetime('created_at', { precision: 6 }).defaultTo(knex.fn.now());
                table.datetime('updated_at', { precision: 6 }).defaultTo(knex.fn.now());

                // Add indexes for performance
                table.index('article_id');
                table.index('sentence_order');
            });
            console.log('✅ Created article_sentences table');
        } else {
            console.log('📋 article_sentences table already exists, preserving data');
        }

        // Create sentence_translations table (only if missing)
        const hasSentenceTranslations = await knex.schema.hasTable('sentence_translations');
        if (!hasSentenceTranslations) {
            await knex.schema.createTable('sentence_translations', (table: any) => {
                table.increments('id').primary();
                table.integer('sentence_id').unsigned().notNullable();
                table.string('translation_language', 255).notNullable();
                table.longtext('translation_text').notNullable(); // Use LONGTEXT for long translations
                table.datetime('created_at', { precision: 6 }).defaultTo(knex.fn.now());
                table.datetime('updated_at', { precision: 6 }).defaultTo(knex.fn.now());

                // Add indexes
                table.index('sentence_id');
                table.index('translation_language');

                // Unique constraint
                table.unique(['sentence_id', 'translation_language']);
            });
            console.log('✅ Created sentence_translations table');
        } else {
            console.log('📋 sentence_translations table already exists, preserving data');
        }

        // Create sentence_grammar_rules table (only if missing)
        const hasSentenceGrammarRules = await knex.schema.hasTable('sentence_grammar_rules');
        if (!hasSentenceGrammarRules) {
            await knex.schema.createTable('sentence_grammar_rules', (table: any) => {
                table.increments('id').primary();
                table.integer('sentence_id').unsigned().notNullable();
                table.text('rule').notNullable(); // TEXT should be enough for grammar rules
                table.datetime('created_at', { precision: 6 }).defaultTo(knex.fn.now());
                table.datetime('updated_at', { precision: 6 }).defaultTo(knex.fn.now());

                // Add index
                table.index('sentence_id');
            });
            console.log('✅ Created sentence_grammar_rules table');
        } else {
            console.log('📋 sentence_grammar_rules table already exists, preserving data');
        }

        // Ensure articles table has proper column size (safe ALTER)
        const hasArticlesTable = await knex.schema.hasTable('articles');
        if (hasArticlesTable) {
            try {
                await knex.schema.alterTable('articles', (table: any) => {
                    table.longtext('translation').alter(); // Ensure translation is LONGTEXT
                });
                console.log('✅ Updated articles.translation to LONGTEXT');
            } catch (alterError) {
                console.log('⚠️  Articles table alteration skipped (may already be correct)');
            }
        }

        console.log('🎉 Safe database setup completed successfully');

    } catch (error) {
        console.error('❌ Error in safe database setup:', error);
        throw error;
    }
}