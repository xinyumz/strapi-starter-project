
import { Translate } from '@google-cloud/translate/build/src/v2';

let translateClient: Translate;

const initializeTranslateClient = () => {
    if (!translateClient) {
        translateClient = new Translate({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }
};

export default {
    async translate(text: string, targetLanguage: string): Promise<string> {
        try {
            initializeTranslateClient();
            const [translation] = await translateClient.translate(text, targetLanguage);
            return translation;
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('Failed to translate text');
        }
    },

    async listLanguages(): Promise<Array<{ code: string; name: string }>> {
        try {
            initializeTranslateClient();
            const [languages] = await translateClient.getLanguages();
            return languages.map(lang => ({ code: lang.code, name: lang.name }));
        } catch (error) {
            console.error('Error fetching languages:', error);
            throw new Error('Failed to fetch languages');
        }
    },
};