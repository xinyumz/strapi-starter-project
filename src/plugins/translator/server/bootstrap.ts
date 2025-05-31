// src/plugins/translator/server/bootstrap.ts

import { Strapi } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Strapi }) => {
  console.log('[Translator Bootstrap] Initializing translator hooks');

  // Check if per-language plugin is available and retry if not
  let retries = 0;
  const maxRetries = 5;
  const checkPerLanguagePlugin = async () => {
    if (strapi.plugin('per-language')?.service('contentService')) {
      console.log('[Translator Bootstrap] per-language plugin is available');
      return true;
    }

    if (retries < maxRetries) {
      retries++;
      console.log(`[Translator Bootstrap] per-language plugin not available yet, retrying (${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkPerLanguagePlugin();
    }

    console.error('[Translator Bootstrap] per-language plugin not available after retries');
    return false;
  };

  const perLanguageAvailable = await checkPerLanguagePlugin();
  if (!perLanguageAvailable) {
    console.error('[Translator Bootstrap] Cannot register hooks without per-language plugin');
    return;
  }

  try {
    if (!strapi.db) {
      console.error('[Translator Bootstrap] strapi.db is not available');
      return;
    }

    console.log('[Translator Bootstrap] Registering lifecycle hooks for articles');

    strapi.db.lifecycles.subscribe({
      models: ['api::article.article'],
      afterCreate: async (event: any) => {
        const article = event.result;
        const inputData = event.params?.data || {};

        console.log('[Translator Hook] afterCreate triggered', {
          hasParams: !!event.params,
          hasData: !!event.params?.data,
          hasResult: !!event.result,
          resultId: event.result?.id,
          hasTranslation: !!article?.translation,
          hasTranslationCap: !!article?.Translation,
          translationLength: (article?.translation || article?.Translation)?.length || 0,
          translationInData: !!inputData?.translation,
          translationInDataCap: !!inputData?.Translation,
          allResultKeys: Object.keys(article || {}),
          allDataKeys: Object.keys(inputData || {})
        });

        if (article) {
          // Check both field name variations
          const translation = article.translation || article.Translation ||
            inputData.translation || inputData.Translation;

          if (translation) {
            console.log('[Translator Hook] Found translation in new article, syncing...');
            const articleWithTranslation = {
              ...article,
              translation: translation  // Normalize to lowercase
            };
            await syncToPerLanguage(articleWithTranslation, strapi);
          } else {
            console.log('[Translator Hook] No translation found in new article');
          }
        }
      },
      afterUpdate: async (event: any) => {
        const article = event.result;
        const inputData = event.params?.data || {};

        console.log('[Translator Hook] afterUpdate triggered', {
          hasParams: !!event.params,
          hasData: !!event.params?.data,
          hasResult: !!event.result,
          resultId: event.result?.id,
          hasTranslation: !!article?.translation,
          hasTranslationCap: !!article?.Translation,  // Add this
          translationLength: (article?.translation || article?.Translation)?.length || 0,
          translationInUpdateData: !!inputData?.translation,
          translationInUpdateDataCap: !!inputData?.Translation  // Add this
        });

        // Handle updated articles - check both field variations
        const translation = article?.translation || article?.Translation ||
          inputData?.translation || inputData?.Translation;

        if (article && translation) {
          const articleWithTranslation = {
            ...article,
            translation: translation  // Normalize to lowercase
          };
          await syncToPerLanguage(articleWithTranslation, strapi);
        }
      },
    });

    console.log('[Translator Bootstrap] Lifecycle hooks registered successfully');
  } catch (error) {
    console.error('[Translator Bootstrap] Error registering hooks:', error);
  }
};

/**
 * Sync article translation data to the per_language table
 */
async function syncToPerLanguage(article: any, strapi: Strapi) {
  console.log('[syncToPerLanguage] Starting with article:', {
    id: article?.id,
    hasTranslation: !!article?.translation,
    hasTranslationCap: !!article?.Translation,  // Check capital T too
    translationLength: (article?.translation || article?.Translation)?.length || 0,
    allKeys: Object.keys(article || {})  // Show all available keys
  });

  // Check both lowercase and uppercase field names
  const translationText = article?.translation || article?.Translation;

  if (!article || !translationText || translationText.trim() === '') {
    console.log('[syncToPerLanguage] Skipping - no article or translation');
    return;
  }
  try {
    // Determine the language - for now assuming Chinese
    const language = 'zh';

    // Check if per-language plugin service is available
    const perLanguagePlugin = strapi.plugin('per-language');
    if (!perLanguagePlugin) {
      console.error('[syncToPerLanguage] per-language plugin not found');
      return;
    }

    const contentService = perLanguagePlugin.service('contentService');
    if (!contentService) {
      console.error('[syncToPerLanguage] contentService not found in per-language plugin');
      return;
    }

    console.log(`[syncToPerLanguage] Syncing article ${article.id} translation to per_language table`);

    // Call the per_language service to create/update entry
    try {
      const result = await contentService.upsertLanguageContent(
        article.id,
        language,
        translationText
      );
      console.log(`[syncToPerLanguage] Successfully synced to per_language, result:`, {
        id: result?.id,
        articleId: result?.article_id,
        language: result?.language
      });

      // If article has access_tier, also sync that
      if (article.access_tier) {
        // Get the content we just created/updated to get its ID
        const perLanguageContent = await contentService.getLanguageContent(article.id, language);

        if (perLanguageContent) {
          try {
            // Update with access_tier
            await strapi.entityService?.update(
              'plugin::per-language.per-language',
              perLanguageContent.id,
              {
                data: {
                  access_tier: article.access_tier,
                } as any
              }
            );
            console.log(`[syncToPerLanguage] Updated access_tier for content ${perLanguageContent.id}`);
          } catch (updateError) {
            console.error('[syncToPerLanguage] Error updating access_tier:', updateError);
          }
        }
      }
    } catch (serviceError) {
      console.error('[syncToPerLanguage] Error in upsertLanguageContent:', serviceError);
    }

    console.log(`[syncToPerLanguage] Successfully synced article ${article.id} to per_language table`);
  } catch (error) {
    // Log error but don't disrupt the main flow
    console.error('[syncToPerLanguage] Error syncing to per_language table:', error);
  }
}