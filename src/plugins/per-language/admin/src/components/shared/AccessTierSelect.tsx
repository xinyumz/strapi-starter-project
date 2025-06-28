// src/plugins/per-language/admin/src/components/shared/AccessTierSelect.tsx

import React from 'react';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { ACCESS_TIERS } from './constants';

interface AccessTierSelectProps {
    value: string | null;
    onChange: (value: string) => void;
    disabled?: boolean;
    size?: 'S' | 'M' | 'L';
    error?: string;
}

export const AccessTierSelect: React.FC<AccessTierSelectProps> = ({
    value,
    onChange,
    disabled = false,
    size = 'S',
    error
}) => {
    const handleChange = (newValue: string) => {
        // Only trigger onChange for valid tier values
        if (newValue && newValue !== '') {
            onChange(newValue);
        }
    };

    return (
        <SingleSelect
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            size={size}
            error={error}
            hasError={!!error}
        >
            {ACCESS_TIERS.map(tier => (
                <SingleSelectOption
                    key={tier.value}
                    value={tier.value}
                    disabled={tier.disabled}
                >
                    {tier.label}
                </SingleSelectOption>
            ))}
        </SingleSelect>
    );
};