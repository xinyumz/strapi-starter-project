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
        const sourceText = modifiedData.Base;

        if (!sourceText) {
            console.error('Base field is empty');
            return;
        }

        setIsTranslating(true);
        try {
            const response = await fetch('/translator/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({
                    text: sourceText,
                    targetLanguage,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Translation failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const { translatedText } = await response.json();
            onChange({ target: { name, value: translatedText } });
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
                label="Target Language"
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