// src/plugins/per-language/admin/src/components/shared/AccessTierSelect.tsx

import React from 'react';
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
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        // Only trigger onChange for valid tier values
        if (newValue && newValue !== '') {
            onChange(newValue);
        }
    };

    // Size mapping for native select
    const getSizeStyles = (size: 'S' | 'M' | 'L') => {
        switch (size) {
            case 'S':
                return {
                    padding: "6px 8px",
                    fontSize: "14px"
                };
            case 'M':
                return {
                    padding: "8px 12px",
                    fontSize: "14px"
                };
            case 'L':
                return {
                    padding: "10px 16px",
                    fontSize: "16px"
                };
            default:
                return {
                    padding: "6px 8px",
                    fontSize: "14px"
                };
        }
    };

    const sizeStyles = getSizeStyles(size);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <select
                value={value || ''}
                onChange={handleChange}
                disabled={disabled}
                style={{
                    minWidth: "120px",
                    border: error ? "1px solid #d32f2f" : "1px solid #dcdce4",
                    borderRadius: "4px",
                    backgroundColor: disabled ? "#f6f6f9" : "white",
                    color: disabled ? "#666687" : "#32324d",
                    cursor: disabled ? "not-allowed" : "pointer",
                    outline: "none",
                    ...sizeStyles,
                    // Focus styles
                    transition: "border-color 0.2s ease"
                }}
                onFocus={(e) => {
                    if (!error) {
                        e.target.style.borderColor = "#4945ff";
                    }
                }}
                onBlur={(e) => {
                    if (!error) {
                        e.target.style.borderColor = "#dcdce4";
                    }
                }}
            >
                {ACCESS_TIERS.map(tier => (
                    <option
                        key={tier.value}
                        value={tier.value}
                        disabled={tier.disabled}
                        style={{
                            color: tier.disabled ? "#666687" : "#32324d"
                        }}
                    >
                        {tier.label}
                    </option>
                ))}
            </select>
            {error && (
                <span style={{
                    fontSize: "12px",
                    color: "#d32f2f",
                    marginTop: "2px"
                }}>
                    {error}
                </span>
            )}
        </div>
    );
};