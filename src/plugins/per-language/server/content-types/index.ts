// src/plugins/per-language/server/content-types/index.ts

import perLanguage from './per-language/schema';
import articlePerLanguage from './article-perlanguage/schema';
import collectionPerLanguage from './collection-perlanguage/schema';

export default {
    'per-language': { schema: perLanguage },           // Keep old one temporarily
    'article-perlanguage': { schema: articlePerLanguage },    // New article schema
    'collection-perlanguage': { schema: collectionPerLanguage }, // New collection schema
};