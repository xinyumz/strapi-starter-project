// src/plugins/chinese-article-processor/server/content-types/index.ts
// Define the sentence tables as proper Strapi content types

import articleSentence from './article-sentence/schema';
import sentenceTranslation from './sentence-translation/schema';
import sentenceGrammarRule from './sentence-grammar-rule/schema';

export default {
    'article-sentence': { schema: articleSentence },
    'sentence-translation': { schema: sentenceTranslation },
    'sentence-grammar-rule': { schema: sentenceGrammarRule },
};