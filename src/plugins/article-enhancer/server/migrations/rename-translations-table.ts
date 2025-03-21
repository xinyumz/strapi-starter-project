// Path: /src/plugins/article-enhancer/server/migrations/rename-translations-table.ts

export async function up(knex: any): Promise<void> {
    try {
        // Check if the old table exists
        const oldTableExists = await knex.schema.hasTable('article_translations');

        if (!oldTableExists) {
            console.log('article_translations table does not exist, nothing to rename');
            return;
        }

        // Check if the new table already exists
        const newTableExists = await knex.schema.hasTable('sentence_translations');

        if (newTableExists) {
            console.log('sentence_translations table already exists, dropping it first');
            await knex.schema.dropTable('sentence_translations');
        }

        // Rename the table
        console.log('Renaming article_translations to sentence_translations');

        // In MySQL, we can use renameTable
        await knex.schema.renameTable('article_translations', 'sentence_translations');

        console.log('Successfully renamed article_translations to sentence_translations');

    } catch (error) {
        console.error('Error renaming translations table:', error);
        throw error;
    }
}

export async function down(knex: any): Promise<void> {
    try {
        // Check if the new table exists
        const newTableExists = await knex.schema.hasTable('sentence_translations');

        if (!newTableExists) {
            console.log('sentence_translations table does not exist, nothing to revert');
            return;
        }

        // Check if the old table already exists
        const oldTableExists = await knex.schema.hasTable('article_translations');

        if (oldTableExists) {
            console.log('article_translations table already exists, dropping it first');
            await knex.schema.dropTable('article_translations');
        }

        // Rename the table back
        console.log('Renaming sentence_translations to article_translations');
        await knex.schema.renameTable('sentence_translations', 'article_translations');

        console.log('Successfully renamed sentence_translations back to article_translations');

    } catch (error) {
        console.error('Error reverting table rename:', error);
        throw error;
    }
}