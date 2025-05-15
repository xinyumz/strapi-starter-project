// src/plugins/per-language/server/services/index.ts
import myService from './my-service';
import languageService from './language-service';
import contentService from './content-service';
import translationService from './translation-service';
import processingService from './processing-service';

export default {
  myService,
  languageService,
  contentService,
  translationService,
  processingService
};