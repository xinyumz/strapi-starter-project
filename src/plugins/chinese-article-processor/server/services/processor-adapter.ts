// src/plugins/chinese-article-processor/server/services/processor-adapter.ts

export default ({ strapi }: any) => ({
    processorId: 'chinese-hsk-processor',
    languageCodes: ['zh', 'zh-CN', 'zh-TW'],
    displayName: 'Chinese HSK Processor',

    /**
     * Process Chinese content using existing article service
     */
    async processContent(content: string, options: any = {}): Promise<any> {
        const targetLanguages = options.targetLanguages || ['en'];

        const articleService = strapi.plugin('chinese-article-processor').service('articleService');
        return await articleService.processArticle(content, targetLanguages);
    },

    /**
     * Save processed data using existing process service
     */
    async saveProcessedData(
        articleId: number,
        language: string,
        data: any,
        displaySkill?: string
    ): Promise<void> {
        const processService = strapi.plugin('chinese-article-processor').service('processService');
        await processService.saveProcessedData(articleId, language, data, displaySkill);
    },

    /**
     * Get processed data using existing process service
     */
    async getProcessedData(articleId: number, language: string): Promise<any> {
        const processService = strapi.plugin('chinese-article-processor').service('processService');
        return await processService.getProcessedData(articleId, language);
    }
});