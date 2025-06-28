export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    // Register cascading delete for articles (individual deletes)
    strapi.db.lifecycles.subscribe({
      models: ['api::article.article'],

      async beforeDelete(event) {
        const { where } = event.params;
        let articleIds = [];

        if (where.id) {
          if (Array.isArray(where.id)) {
            articleIds = where.id;
          } else if (typeof where.id === 'object' && where.id.$in) {
            articleIds = where.id.$in;
          } else {
            articleIds = [where.id];
          }
        } else if (where.$and) {
          where.$and.forEach(clause => {
            if (clause.id) {
              if (Array.isArray(clause.id)) {
                articleIds.push(...clause.id);
              } else if (typeof clause.id === 'object' && clause.id.$in) {
                articleIds.push(...clause.id.$in);
              } else {
                articleIds.push(clause.id);
              }
            }
          });
        }

        if (articleIds.length > 0) {
          console.log(`[Article Cleanup] Processing cascading delete for articles: [${articleIds.join(', ')}]`);
          await cleanupArticleData(articleIds);
        }
      }
    });

    // Register cascading delete for collections
    strapi.db.lifecycles.subscribe({
      models: ['api::collection.collection'],

      async beforeDelete(event) {
        const { where } = event.params;
        let collectionIds = [];

        if (where.id) {
          if (Array.isArray(where.id)) {
            collectionIds = where.id;
          } else if (typeof where.id === 'object' && where.id.$in) {
            collectionIds = where.id.$in;
          } else {
            collectionIds = [where.id];
          }
        } else if (where.$and) {
          where.$and.forEach(clause => {
            if (clause.id) {
              if (Array.isArray(clause.id)) {
                collectionIds.push(...clause.id);
              } else if (typeof clause.id === 'object' && clause.id.$in) {
                collectionIds.push(...clause.id.$in);
              } else {
                collectionIds.push(clause.id);
              }
            }
          });
        }

        if (collectionIds.length > 0) {
          console.log(`[Collection Cleanup] Processing cascading delete for collections: [${collectionIds.join(', ')}]`);
          await cleanupCollectionData(collectionIds);
        }
      }
    });

    // Hook into entity service for bulk deletes
    const originalDeleteMany = strapi.entityService.deleteMany;

    strapi.entityService.deleteMany = async function (uid: string, params: any = {}) {
      // Handle article bulk deletions
      if (uid === 'api::article.article') {
        try {
          const queryParams: any = { fields: ['id'] };

          if (params && params.filters) {
            queryParams.filters = params.filters;
          }

          const articlesToDelete = await strapi.documents(uid).findMany(queryParams);
          const articleIds = Array.isArray(articlesToDelete)
            ? articlesToDelete.map((article: any) => article.id)
            : [];

          if (articleIds.length > 0) {
            console.log(`[Article Cleanup] Processing bulk delete for articles: [${articleIds.join(', ')}]`);
            await cleanupArticleData(articleIds);
          }
        } catch (error) {
          console.error('[Article Cleanup] Error during bulk delete cleanup:', error);
        }
      }

      // Handle collection bulk deletions
      if (uid === 'api::collection.collection') {
        try {
          const queryParams: any = { fields: ['id'] };

          if (params && params.filters) {
            queryParams.filters = params.filters;
          }

          const collectionsToDelete = await strapi.documents(uid).findMany(queryParams);
          const collectionIds = Array.isArray(collectionsToDelete)
            ? collectionsToDelete.map((collection: any) => collection.id)
            : [];

          if (collectionIds.length > 0) {
            console.log(`[Collection Cleanup] Processing bulk delete for collections: [${collectionIds.join(', ')}]`);
            await cleanupCollectionData(collectionIds);
          }
        } catch (error) {
          console.error('[Collection Cleanup] Error during bulk delete cleanup:', error);
        }
      }

      return originalDeleteMany.call(this, uid, params);
    };

    // Updated cleanup function for cascading deletes (articles)
    async function cleanupArticleData(articleIds: number[]) {
      try {
        const knex = strapi.db.connection;

        for (const articleId of articleIds) {
          console.log(`[Article Cleanup] Cleaning up data for article ID: ${articleId}`);

          const deletedPerLanguageRows = await knex('article_perlanguages')
            .where('article_id', articleId)
            .del();

          console.log(`[Article Cleanup] ✅ Deleted ${deletedPerLanguageRows} article per-language records for article ${articleId}`);

          // Get sentence IDs for cascading delete (these table names should be correct)
          const sentenceIds = await knex('article_sentences')
            .where('article_id', articleId)
            .pluck('id');

          if (sentenceIds.length > 0) {
            console.log(`[Article Cleanup] Found ${sentenceIds.length} sentences to clean up for article ${articleId}`);

            // Delete related sentence data
            const deletedGrammarRules = await knex('sentence_grammar_rules')
              .whereIn('sentence_id', sentenceIds)
              .del();

            const deletedTranslations = await knex('sentence_translations')
              .whereIn('sentence_id', sentenceIds)
              .del();

            const deletedSentences = await knex('article_sentences')
              .where('article_id', articleId)
              .del();

            console.log(`[Article Cleanup] ✅ Deleted ${deletedGrammarRules} grammar rules, ${deletedTranslations} translations, ${deletedSentences} sentences for article ${articleId}`);
          } else {
            console.log(`[Article Cleanup] No sentences found for article ${articleId}`);
          }
        }

        console.log(`[Article Cleanup] ✅ Successfully completed cascading delete for ${articleIds.length} article(s)`);
      } catch (error) {
        console.error('[Article Cleanup] Error during cascading delete:', error);
        throw error; // Re-throw to prevent the deletion if cleanup fails
      }
    }

    // Shared cleanup function for cascading deletes (collections)
    async function cleanupCollectionData(collectionIds: number[]) {
      try {
        const knex = strapi.db.connection;

        for (const collectionId of collectionIds) {
          console.log(`[Collection Cleanup] Cleaning up data for collection ID: ${collectionId}`);

          // Delete collection_perlanguages records (critical for data integrity)
          const deletedRows = await knex('collection_perlanguages')
            .where('collection_id', collectionId)
            .del();

          console.log(`[Collection Cleanup] ✅ Deleted ${deletedRows} collection per-language records for collection ${collectionId}`);

          // NOTE: We don't need to clean up article relations here because:
          // 1. The collection-article relation is handled by Strapi's relation system
          // 2. Articles themselves are not deleted when collections are deleted
          // 3. Only the collection_perlanguages table has collection_id foreign key references
        }

        console.log(`[Collection Cleanup] ✅ Successfully completed cascading delete for ${collectionIds.length} collection(s)`);
      } catch (error) {
        console.error('[Collection Cleanup] Error during cascading delete:', error);
        throw error; // Re-throw to prevent the deletion if cleanup fails
      }
    }
  },
};