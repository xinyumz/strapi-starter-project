// src/plugins/per-language/server/controllers/index.ts

import myController from './my-controller';
import perLanguageController from './per-language-controller';
import migrationController from './migration-controller';
import contentController from './content-controller';

// Export with consistent naming that matches routes
const controllers = {
  myController,
  perLanguage: perLanguageController,
  migration: migrationController,
  content: contentController,  // Add the new content controller
};

export default controllers;