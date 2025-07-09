// server/services/index.ts
import grammarService from './grammar-service';
import hskService from './hsk-service';
import pinyinService from './pinyin-service';
import translationService from './translation-service';
import articleService from './article-service';
import processService from './process-service';

import processorAdapter from './processor-adapter';

export default {
    grammarService,
    hskService,
    pinyinService,
    translationService,
    articleService,
    processService,
    processorAdapter,
};