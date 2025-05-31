// src/plugins/translator/server/controllers/index.ts

import translationController from './translation-controller';
import myController from './my-controller';

console.log('[Controllers Index] Loading controllers...');

export default {
  'translation-controller': translationController,
  'my-controller': myController,
};

console.log('[Controllers Index] Controllers exported');