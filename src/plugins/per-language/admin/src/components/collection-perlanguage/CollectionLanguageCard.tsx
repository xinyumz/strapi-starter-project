// src/plugins/per-language/admin/src/components/collection-perlanguage/CollectionLanguageCard.tsx

import React from 'react';
import { SUPPORTED_LANGUAGES } from '../shared';
import {
    getDisplaySkillOptions,
    getLanguageSkillConfig,
} from '../../utils/display-skill-constants';
import { CollectionLanguageData } from '../hooks';

interface CollectionLanguageCardProps {
    language: CollectionLanguageData;
    isSaving: boolean;
    hasChanges: boolean;
    getCurrentValue: (lang: CollectionLanguageData, field: keyof CollectionLanguageData) => any;
    onFieldChange: (field: string, value: any) => void;
    onSave: () => void;
    onDelete: () => void;
}

/**
 * Individual collection language card component
 * 
 * Features:
 * - Language header with title and status badges
 * - Description textarea
 * - Published/Access Tier/Skill Level controls
 * - Save and delete functionality
 * - Responsive layout that adapts to screen size
 */
export const CollectionLanguageCard: React.FC<CollectionLanguageCardProps> = ({
    language,
    isSaving,
    hasChanges,
    getCurrentValue,
    onFieldChange,
    onSave,
    onDelete
}) => {
    // Helper functions
    const getLanguageInfo = (languageCode: string) => {
        return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || {
            code: languageCode,
            name: languageCode.toUpperCase(),
            hasProcessor: false
        };
    };

    const getSkillLabel = (languageCode: string) => {
        const config = getLanguageSkillConfig(languageCode);
        if (!config) return 'Skill Level';

        switch (languageCode) {
            case 'zh': return 'HSK';
            case 'ja': return 'JLPT';
            case 'es':
            case 'fr':
            case 'de':
            case 'pt': return 'CEFR';
            default: return 'Level';
        }
    };

    const langInfo = getLanguageInfo(language.language);
    const skillOptions = getDisplaySkillOptions(language.language);
    const skillLabel = getSkillLabel(language.language);

    const cardStyle: React.CSSProperties = {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '400px'
    };

    const headerStyle: React.CSSProperties = {
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px'
    };

    const bodyStyle: React.CSSProperties = {
        padding: '16px'
    };

    const badgeStyle = (backgroundColor: string, textColor: string): React.CSSProperties => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor,
        color: textColor,
        marginRight: '4px'
    });

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={headerStyle}>
                {/* Centered Title */}
                <div style={{ paddingBottom: '8px', textAlign: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#424242' }}>
                        {langInfo.name} ({langInfo.code})
                    </h4>
                </div>

                {/* Badges and Delete Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={badgeStyle(
                            getCurrentValue(language, 'published') ? '#e8f5e8' : '#f5f5f5',
                            getCurrentValue(language, 'published') ? '#2e7d32' : '#666'
                        )}>
                            {getCurrentValue(language, 'published') ? 'PUBLISHED' : 'DRAFT'}
                        </span>

                        {getCurrentValue(language, 'access_tier') && (
                            <span style={badgeStyle('#e3f2fd', '#1976d2')}>
                                {getCurrentValue(language, 'access_tier')}
                            </span>
                        )}

                        {getCurrentValue(language, 'display_skill') && (
                            <span style={badgeStyle('#f3e5f5', '#7b1fa2')}>
                                {skillLabel} {getCurrentValue(language, 'display_skill')}
                            </span>
                        )}

                        {hasChanges && (
                            <span style={badgeStyle('#fff3e0', '#f57c00')}>
                                Unsaved Changes
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onDelete}
                        style={{
                            padding: '4px 8px',
                            border: '1px solid #f44336',
                            borderRadius: '4px',
                            backgroundColor: '#ffebee',
                            color: '#f44336',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={bodyStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Description Field */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#424242', fontSize: '14px' }}>
                            Description
                        </label>
                        <textarea
                            value={getCurrentValue(language, 'description') || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                onFieldChange('description', e.target.value);
                            }}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                        <small style={{ color: '#666', fontSize: '12px' }}>
                            Collection description for this language (optional for single-article collections)
                        </small>
                    </div>

                    {/* Controls Layout */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Skill Level */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#424242', fontSize: '14px' }}>
                                {skillLabel}
                            </label>
                            <select
                                value={getCurrentValue(language, 'display_skill') as string || ''}
                                onChange={(e) => onFieldChange('display_skill', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select level</option>
                                {skillOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Access Tier */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#424242', fontSize: '14px' }}>
                                Access Tier
                            </label>
                            <select
                                value={getCurrentValue(language, 'access_tier') as string || ''}
                                onChange={(e) => onFieldChange('access_tier', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select tier</option>
                                <option value="Free">Free</option>
                                <option value="Login">Login Required</option>
                                <option value="Premium">Premium</option>
                            </select>
                        </div>

                        {/* Published Toggle */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id={`published-${language.id}`}
                                    checked={Boolean(getCurrentValue(language, 'published')) || false}
                                    onChange={() => {
                                        const currentValue = Boolean(getCurrentValue(language, 'published'));
                                        onFieldChange('published', !currentValue);
                                    }}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <label
                                    htmlFor={`published-${language.id}`}
                                    style={{ fontWeight: '500', color: '#424242', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    Published
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    {hasChanges && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #4caf50',
                                    borderRadius: '4px',
                                    backgroundColor: isSaving ? '#f5f5f5' : '#4caf50',
                                    color: isSaving ? '#999' : 'white',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                {isSaving ? '⌛' : '✓'} {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};