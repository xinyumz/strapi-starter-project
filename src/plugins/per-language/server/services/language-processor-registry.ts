// src/plugins/per-language/server/services/language-processor-registry.ts

interface LanguageProcessorInterface {
    readonly processorId: string;
    readonly languageCodes: string[];
    readonly displayName: string;

    processContent(content: string, options?: any): Promise<any>;
    saveProcessedData(articleId: number, language: string, data: any, displaySkill?: string): Promise<void>;
    getProcessedData(articleId: number, language: string): Promise<any>;
}

export default ({ strapi }: any) => ({
    processors: new Map<string, LanguageProcessorInterface>(),

    /**
     * Register a language processor
     */
    registerProcessor(processor: LanguageProcessorInterface): void {
        console.log(`[Registry] Registering processor: ${processor.processorId}`);
        this.processors.set(processor.processorId, processor);

        // Register by language codes for quick lookup
        processor.languageCodes.forEach(langCode => {
            this.processors.set(`lang:${langCode}`, processor);
        });
    },

    /**
     * Get processor for a specific language
     */
    getProcessorForLanguage(languageCode: string): LanguageProcessorInterface | null {
        return this.processors.get(`lang:${languageCode}`) || null;
    },

    /**
     * Check if processing is available for a language
     */
    canProcess(languageCode: string): boolean {
        return this.processors.has(`lang:${languageCode}`);
    },

    /**
     * Get all supported languages
     */
    getSupportedLanguages(): string[] {
        const languages = new Set<string>();
        this.processors.forEach((processor, key) => {
            if (key.startsWith('lang:')) {
                languages.add(key.replace('lang:', ''));
            }
        });
        return Array.from(languages);
    },

    /**
     * Generic processing method - routes to appropriate processor
     */
    async processContent(
        articleId: number,
        languageCode: string,
        content: string,
        options: any = {}
    ): Promise<any> {
        const processor = this.getProcessorForLanguage(languageCode);

        if (!processor) {
            throw new Error(`No processor available for language: ${languageCode}`);
        }

        console.log(`[Registry] Processing with ${processor.processorId} for ${languageCode}`);
        const result = await processor.processContent(content, options);
        await processor.saveProcessedData(articleId, languageCode, result);
        return result;
    }
});