// server/services/pinyin-service.ts


interface PinyinResult {
    json: {
        results: Array<{
            characters?: string;
            chinese?: number;
            to_dictionary?: {
                simplified: string;
                pinyin: string;
                definition: string;
                // ... other fields
            };
            // ... other fields
        }>;
    };
}

export default ({ strapi }: any) => ({
    async generatePinyin(text: string): Promise<PinyinResult> {
        try {
            const response = await fetch('https://api.pandaist.com/api/v1/generatepinyin/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chinese: text })
            });

            if (!response.ok) {
                throw new Error(`Pinyin generation failed: ${response.statusText}`);
            }

            return (await response.json()) as PinyinResult;
        } catch (error) {
            console.error('Pinyin generation error:', error);
            throw error;
        }
    }
});

