// src/plugins/per-language/server/content-types/index.ts

import articlePerLanguage from './article-perlanguage/schema';
import collectionPerLanguage from './collection-perlanguage/schema';

export default {
    'article-perlanguage': { schema: articlePerLanguage },    // New article schema
    'collection-perlanguage': { schema: collectionPerLanguage }, // New collection schema
};