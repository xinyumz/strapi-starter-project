// src/plugins/article-enhancer/admin/src/utils/formUtils.ts
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

export const useFormIntegration = () => {
    const { modifiedData, onChange } = useCMEditViewDataManager();

    // Function to update both component state and Strapi's form data
    const updateFormData = (name: string, value: any) => {
        // Convert value to string for Strapi's form system
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        // Use Strapi's onChange to properly update the form data
        onChange({
            target: {
                name,
                value: stringValue, // Pass as string
            },
        });

        return true;
    };

    return { updateFormData, modifiedData };
};