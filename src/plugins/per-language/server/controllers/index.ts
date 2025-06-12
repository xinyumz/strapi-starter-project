// src/plugins/per-language/server/controllers/index.ts

import myController from './my-controller';
import perLanguageController from './per-language-controller';
import contentController from './content-controller';

// Export with consistent naming that matches routes
const controllers = {
  myController,
  perLanguage: perLanguageController,
  content: contentController,
};

export default controllers;