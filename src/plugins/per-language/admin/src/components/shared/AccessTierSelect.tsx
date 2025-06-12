// src/plugins/per-language/admin/src/components/shared/AccessTierSelect.tsx

import React from 'react';
import { Select, Option } from '@strapi/design-system';
import { ACCESS_TIERS } from './constants';

interface AccessTierSelectProps {
    value: string | null;
    onChange: (value: string) => void;
    disabled?: boolean;
    size?: 'S' | 'M' | 'L';
    placeholder?: string;
    error?: string;
}

export const AccessTierSelect: React.FC<AccessTierSelectProps> = ({
    value,
    onChange,
    disabled = false,
    size = 'S',
    placeholder = 'Select Access Tier',
    error
}) => {
    const getDisplayValue = (accessTier: string | null) => {
        return accessTier || ''; // Return empty string for null to show placeholder
    };

    const handleChange = (newValue: string) => {
        // Don't allow selection of the placeholder option
        if (newValue !== '') {
            onChange(newValue);
        }
    };

    return (
        <Select
            value={getDisplayValue(value)}
            onChange={handleChange}
            disabled={disabled}
            size={size}
            placeholder={placeholder}
            error={error}
        >
            {ACCESS_TIERS.map(tier => (
                <Option
                    key={tier.value}
                    value={tier.value}
                    disabled={tier.disabled}
                >
                    {tier.label}
                </Option>
            ))}
        </Select>
    );
};