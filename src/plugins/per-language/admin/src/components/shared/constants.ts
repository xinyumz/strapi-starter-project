// src/plugins/per-language/admin/src/components/shared/constants.ts

import {
    ExclamationMarkCircle,
    Gift,
    CheckCircle,
    Crown
} from '@strapi/icons';

export const SUPPORTED_LANGUAGES = [
    {
        code: 'zh',
        name: 'Chinese (中文)',
        hasProcessor: true,
        processorUrl: '/admin/plugins/chinese-article-processor/chinese-processor',
        difficultyLabel: 'HSK'
    },
    {
        code: 'es',
        name: 'Spanish (Español)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    },
    {
        code: 'fr',
        name: 'French (Français)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    },
    {
        code: 'de',
        name: 'German (Deutsch)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    },
    {
        code: 'ja',
        name: 'Japanese (日本語)',
        hasProcessor: false,
        difficultyLabel: 'JLPT'
    },
    {
        code: 'pt',
        name: 'Portuguese (Português)',
        hasProcessor: false,
        difficultyLabel: 'CEFR'
    }
];

export const ACCESS_TIERS = [
    { value: '', label: 'Select Access Tier', icon: ExclamationMarkCircle, disabled: true },
    { value: 'Free', label: 'Free', icon: Gift, disabled: false },
    { value: 'Login', label: 'Login Required', icon: CheckCircle, disabled: false },
    { value: 'Premium', label: 'Premium', icon: Crown, disabled: false }
];