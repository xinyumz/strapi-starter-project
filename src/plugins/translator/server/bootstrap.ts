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
          hasTranslationCap: !!article?.Translation,
          translationLength: (article?.translation || article?.Translation)?.length || 0,
          translationInUpdateData: !!inputData?.translation,
          translationInUpdateDataCap: !!inputData?.Translation,
          hasChineseProcessor: !!article?.chinese_processor || !!inputData?.chinese_processor,
          hasChineseProcessorCap: !!article?.ChineseProcessor || !!inputData?.ChineseProcessor
        });

        // Handle translation sync (existing)
        const translation = article?.translation || article?.Translation ||
          inputData?.translation || inputData?.Translation;

        if (article && translation) {
          const articleWithTranslation = {
            ...article,
            translation: translation
          };
          await syncToPerLanguage(articleWithTranslation, strapi);
        }

        // NEW: Handle chinese_processor sync with BOTH field name variations
        const chineseProcessor = article?.chinese_processor || article?.ChineseProcessor ||
          inputData?.chinese_processor || inputData?.ChineseProcessor;

        if (article && chineseProcessor) {
          console.log('[Translator Hook] Syncing processed data to per_language table');
          await syncProcessedDataToPerLanguage(article.id, chineseProcessor, strapi);
        }
      },
    });

    console.log('[Translator Bootstrap] Lifecycle hooks registered successfully');
  } catch (error) {
    console.error('[Translator Bootstrap] Error registering hooks:', error);
  }
};

async function syncProcessedDataToPerLanguage(articleId: number, processedData: any, strapi: Strapi) {
  try {
    console.log(`\n=== [syncProcessedData] DIAGNOSTIC START for article ${articleId} ===`);
    console.log(`[syncProcessedData] Raw processed data type:`, typeof processedData);
    console.log(`[syncProcessedData] Raw processed data:`, JSON.stringify(processedData, null, 2));

    const perLanguagePlugin = strapi.plugin('per-language');
    const contentService = perLanguagePlugin?.service('contentService');

    if (!contentService) {
      console.log('[syncProcessedData] ❌ per-language service not available');
      return;
    }

    // Check if per_language entry exists
    const existingContent = await contentService.getLanguageContent(articleId, 'zh');

    if (!existingContent) {
      console.log(`[syncProcessedData] ❌ No per_language entry found for article ${articleId}, skipping processed data sync`);
      return;
    }

    console.log(`[syncProcessedData] ✅ Found existing per_language content with ID: ${existingContent.id}`);

    // **DETAILED VALIDATION DIAGNOSTICS**
    console.log(`\n--- VALIDATION DIAGNOSTICS ---`);

    // Check basic structure
    const isObject = processedData && typeof processedData === 'object';
    console.log(`[syncProcessedData] Is object: ${isObject}`);

    const hasHsk = isObject && processedData.hsk;
    console.log(`[syncProcessedData] Has HSK: ${hasHsk}`);
    if (hasHsk) {
      console.log(`[syncProcessedData] HSK data:`, JSON.stringify(processedData.hsk, null, 2));
    }

    const hasGrammar = isObject && processedData.grammar;
    console.log(`[syncProcessedData] Has grammar: ${hasGrammar}`);
    if (hasGrammar) {
      console.log(`[syncProcessedData] Grammar structure:`, {
        hasSentences: !!processedData.grammar.sentences,
        sentencesIsArray: Array.isArray(processedData.grammar.sentences),
        sentencesLength: processedData.grammar.sentences ? processedData.grammar.sentences.length : 0
      });
    }

    const isAdminFormat = isObject && hasHsk && hasGrammar;
    console.log(`[syncProcessedData] Is admin format: ${isAdminFormat}`);

    // Check sentence completeness
    let hasCompleteSentences = false;
    if (isAdminFormat && processedData.grammar.sentences) {
      const sentences = processedData.grammar.sentences;
      console.log(`[syncProcessedData] Checking ${sentences.length} sentences...`);

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        console.log(`[syncProcessedData] Sentence ${i}:`, {
          hasSentence: !!sentence.sentence,
          hasRules: !!sentence.rules,
          rulesLength: sentence.rules ? sentence.rules.length : 0,
          sentence: sentence.sentence ? sentence.sentence.substring(0, 50) + '...' : 'MISSING'
        });
      }

      hasCompleteSentences = sentences.length > 0 &&
        sentences.every((s: any) => s.sentence && s.rules && s.rules.length >= 0); // Allow empty rules

      console.log(`[syncProcessedData] Has complete sentences: ${hasCompleteSentences}`);
    }

    // Check if method exists
    const hasNewMethod = typeof contentService.updateCompleteProcessedData === 'function';
    console.log(`[syncProcessedData] Has updateCompleteProcessedData method: ${hasNewMethod}`);

    console.log(`--- END VALIDATION DIAGNOSTICS ---\n`);

    // **RELAXED VALIDATION - Let's see what happens if we proceed anyway**
    if (!hasCompleteSentences) {
      console.log('[syncProcessedData] ⚠️  Data appears incomplete, but proceeding anyway for diagnostics');

      // Still try to update display_skill if HSK is available
      if (processedData.hsk?.selectedLevel) {
        const displaySkill = `HSK ${processedData.hsk.selectedLevel}`;
        console.log('[syncProcessedData] 🔄 Updating display_skill only:', displaySkill);
        try {
          await contentService.updateProcessedData(existingContent.id, existingContent.processed_data, displaySkill);
          console.log('[syncProcessedData] ✅ Successfully updated display_skill');
        } catch (error) {
          console.log('[syncProcessedData] ❌ Error updating display_skill:', error);
        }
      }

      // FOR DIAGNOSTICS: Also try the complete update even if validation fails
      console.log('[syncProcessedData] 🧪 DIAGNOSTIC: Attempting complete update anyway...');
    }

    // **ALWAYS ATTEMPT COMPLETE UPDATE FOR DIAGNOSTICS**
    console.log('[syncProcessedData] 🔄 Proceeding with complete data preservation');

    // 2. Complete data preservation (100% preservation)
    const completeProcessedData = processedData; // Full metadata

    // 3. Extract difficulty data for performance
    const difficultyData = processedData.hsk ? {
      hsk: {
        distribution: processedData.hsk.distribution,
        selectedLevel: processedData.hsk.selectedLevel,
        calculatedLevel: processedData.hsk.calculatedLevel
      }
    } : null;

    console.log('[syncProcessedData] 📊 Extracted difficulty data:', JSON.stringify(difficultyData, null, 2));

    // 4. Extract display skill for UI
    const displaySkill = processedData.hsk?.selectedLevel ?
      `HSK ${processedData.hsk.selectedLevel}` :
      (processedData.hsk?.calculatedLevel ? `HSK ${processedData.hsk.calculatedLevel}` : null);

    console.log('[syncProcessedData] 🏷️  Extracted display skill:', displaySkill);

    // 5. Update all three fields using the new method
    if (hasNewMethod) {
      console.log('[syncProcessedData] 🚀 Using updateCompleteProcessedData method');
      try {
        await contentService.updateCompleteProcessedData(
          existingContent.id,
          completeProcessedData,  // processed_data: Complete metadata
          difficultyData,         // difficulty_data: Extracted difficulty  
          displaySkill           // display_skill: UI display
        );
        console.log(`[syncProcessedData] ✅ Successfully updated all three data fields for article ${articleId}`);
      } catch (error) {
        console.log(`[syncProcessedData] ❌ Error with updateCompleteProcessedData:`, error);
      }
    } else {
      // Fallback to old method if new method not available yet
      console.log('[syncProcessedData] 🔄 Using fallback updateProcessedData method');
      try {
        await contentService.updateProcessedData(existingContent.id, completeProcessedData, displaySkill);
        console.log(`[syncProcessedData] ✅ Fallback update successful`);
      } catch (error) {
        console.log(`[syncProcessedData] ❌ Error with fallback method:`, error);
      }
    }

    console.log(`=== [syncProcessedData] DIAGNOSTIC END for article ${articleId} ===\n`);

  } catch (error) {
    console.error('[syncProcessedData] ❌ CRITICAL ERROR:', error);
  }
}
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