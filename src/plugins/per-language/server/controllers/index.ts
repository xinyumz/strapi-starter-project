// src/plugins/per-language/server/controllers/index.ts

import perLanguageController from './per-language-controller';
import articleController from './article-controller';
import collectionController from './collection-controller';

// Export with consistent naming that matches routes
const controllers = {
  perLanguage: perLanguageController,
  article: articleController,
  collection: collectionController,
};

export default controllers;