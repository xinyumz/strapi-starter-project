// src/plugins/per-language/server/controllers/index.ts
import myController from './my-controller';
import perLanguageController from './per-language-controller';

export default {
  myController,
  perLanguage: perLanguageController
};