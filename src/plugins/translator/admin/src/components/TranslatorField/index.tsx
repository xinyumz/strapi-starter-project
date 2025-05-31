//admin/src/components/TranslatorField/index.tsx

import React, { useState } from 'react';
import { Stack, Textarea, Button, Select, Option } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

interface TranslatorFieldProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    intlLabel: { id: string; defaultMessage: string };
    required: boolean;
}

const TranslatorField: React.FC<TranslatorFieldProps> = ({
    name,
    value,
    onChange,
    intlLabel,
    required,
}) => {
    const { formatMessage } = useIntl();
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);
    const { modifiedData } = useCMEditViewDataManager();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'zh', name: 'Chinese' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'pt', name: 'Portuguese' },
    ];

    const handleTranslate = async () => {
        const sourceText = modifiedData.Base || modifiedData.base;
        const articleId = modifiedData.id;

        console.log('[TranslatorField] Starting translation:', {
            hasSourceText: !!sourceText,
            sourceTextLength: sourceText?.length || 0,
            articleId,
            targetLanguage,
            modifiedDataKeys: Object.keys(modifiedData),
            currentTranslationValue: value, // Current value of translation field
            fieldName: name // What field are we updating
        });

        if (!sourceText) {
            console.error('Base field is empty');
            return;
        }

        setIsTranslating(true);
        try {
            const requestBody = {
                text: sourceText,
                targetLanguage,
                articleId: articleId
            };

            console.log('[TranslatorField] Request body:', requestBody);

            const response = await fetch('/translator/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Translation failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const { translatedText } = await response.json();

            console.log('[TranslatorField] Before onChange:', {
                fieldName: name,
                translatedText: translatedText.substring(0, 100) + '...',
                translatedTextLength: translatedText.length
            });

            onChange({ target: { name, value: translatedText } });

            console.log('[TranslatorField] After onChange - field should be updated');

            // Add a delay and check if the field was actually updated
            setTimeout(() => {
                console.log('[TranslatorField] Delayed check:', {
                    currentValue: value,
                    valueLength: value?.length || 0
                });
            }, 100);

        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ target: { name, value: e.target.value } });
    };



    return (
        <Stack spacing={2}>
            <Textarea
                label={formatMessage(intlLabel)}
                name={name}
                onChange={handleManualEdit}
                value={value}
                required={required}
            />
            <Select
                label="Translation Language"
                value={targetLanguage}
                onChange={(value: string) => setTargetLanguage(value)}
            >
                {languages.map((lang) => (
                    <Option key={lang.code} value={lang.code}>
                        {lang.name}
                    </Option>
                ))}
            </Select>
            <Button onClick={handleTranslate} disabled={isTranslating}>
                {isTranslating ? 'Translating...' : 'Translate'}
            </Button>
        </Stack>
    );
};

export default TranslatorField;