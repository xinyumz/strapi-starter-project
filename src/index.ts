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
          await cleanupArticleData(articleIds);
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

          const articlesToDelete = await strapi.entityService.findMany(uid, queryParams);
          const articleIds = Array.isArray(articlesToDelete)
            ? articlesToDelete.map((article: any) => article.id)
            : [];

          if (articleIds.length > 0) {
            await cleanupArticleData(articleIds);
          }
        } catch (error) {
          console.error('[Article Cleanup] Error during bulk delete cleanup:', error);
        }
      }

      return originalDeleteMany.call(this, uid, params);
    };

    // Shared cleanup function for cascading deletes
    async function cleanupArticleData(articleIds: number[]) {
      try {
        const knex = strapi.db.connection;

        for (const articleId of articleIds) {
          // Delete per_languages records (critical for data integrity)
          await knex('per_languages').where('article_id', articleId).del();

          // Get sentence IDs for cascading delete
          const sentenceIds = await knex('article_sentences')
            .where('article_id', articleId)
            .pluck('id');

          if (sentenceIds.length > 0) {
            // Delete related sentence data
            await knex('sentence_grammar_rules').whereIn('sentence_id', sentenceIds).del();
            await knex('sentence_translations').whereIn('sentence_id', sentenceIds).del();
            await knex('article_sentences').where('article_id', articleId).del();
          }
        }
      } catch (error) {
        console.error('[Article Cleanup] Error during cascading delete:', error);
      }
    }
  },
};