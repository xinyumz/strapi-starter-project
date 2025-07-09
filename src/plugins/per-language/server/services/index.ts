// src/plugins/per-language/server/services/index.ts

import languageService from './language-service';
import translationService from './translation-service';
import processingService from './processing-service';

import articleService from './article-service';
import collectionService from './collection-service';

import languageProcessorRegistry from './language-processor-registry';

export default {
  languageService,
  translationService,
  processingService,
  articleService,
  collectionService,
  languageProcessorRegistry,
};