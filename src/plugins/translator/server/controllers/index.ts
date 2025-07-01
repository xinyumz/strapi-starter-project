// src/plugins/translator/server/controllers/index.ts

import translationController from './translation-controller';

console.log('[Controllers Index] Loading controllers...');

export default {
  'translation-controller': translationController,
};

console.log('[Controllers Index] Controllers exported');