// src/plugins/per-language/admin/src/utils/display-skill-constants.ts

import { HSK_LEVELS } from '../../../../chinese-article-processor/admin/src/utils/constants';

/**
 * Centralized display skill level constants for all language processors
 * 
 * This file manages skill level options for different languages and serves as a roadmap
 * for future language processor integrations.
 */

export interface SkillOption {
    value: string;
    label: string;
}

export interface LanguageSkillConfig {
    processor: string;
    standard: string;
    levels: string;
    importPath?: string;
    constantName?: string;
    status: 'ACTIVE' | 'PLANNED' | 'DEPRECATED';
    getOptions: () => SkillOption[];
}

/**
 * Language skill level configurations
 * 
 * When adding a new language processor:
 * 1. Import the skill level constants from the processor
 * 2. Update the getOptions function to use the imported constants
 * 3. Change status from 'PLANNED' to 'ACTIVE'
 * 4. Update the import path and constant name
 */
export const LANGUAGE_SKILL_CONFIGS: Record<string, LanguageSkillConfig> = {
    // ✅ ACTIVE - Chinese HSK levels from chinese-article-processor
    zh: {
        processor: 'chinese-article-processor',
        standard: 'HSK (Hanyu Shuiping Kaoshi)',
        levels: 'HSK 1-10',
        importPath: '../../../chinese-article-processor/admin/src/utils/constants',
        constantName: 'HSK_LEVELS',
        status: 'ACTIVE',
        getOptions: () => HSK_LEVELS.map(level => ({
            value: `HSK ${level}`,
            label: `HSK ${level}`
        }))
    },

    // 🔄 PLANNED - Spanish DELE levels (will be imported when spanish-article-processor is built)
    es: {
        processor: 'spanish-article-processor',
        standard: 'DELE (Diplomas de Español como Lengua Extranjera)',
        levels: 'A1, A2, B1, B2, C1, C2',
        importPath: '../../../spanish-article-processor/admin/src/utils/constants',
        constantName: 'DELE_LEVELS',
        status: 'PLANNED',
        getOptions: () => [
            { value: 'A1', label: 'A1 (Beginner)' },
            { value: 'A2', label: 'A2 (Elementary)' },
            { value: 'B1', label: 'B1 (Intermediate)' },
            { value: 'B2', label: 'B2 (Upper Intermediate)' },
            { value: 'C1', label: 'C1 (Advanced)' },
            { value: 'C2', label: 'C2 (Proficient)' },
        ]
    },

    // 🔄 PLANNED - French DELF levels
    fr: {
        processor: 'french-article-processor',
        standard: 'DELF/DALF (Diplôme d\'études en langue française)',
        levels: 'A1, A2, B1, B2, C1, C2',
        importPath: '../../../french-article-processor/admin/src/utils/constants',
        constantName: 'DELF_LEVELS',
        status: 'PLANNED',
        getOptions: () => [
            { value: 'A1', label: 'A1 (Beginner)' },
            { value: 'A2', label: 'A2 (Elementary)' },
            { value: 'B1', label: 'B1 (Intermediate)' },
            { value: 'B2', label: 'B2 (Upper Intermediate)' },
            { value: 'C1', label: 'C1 (Advanced)' },
            { value: 'C2', label: 'C2 (Proficient)' },
        ]
    },

    // 🔄 PLANNED - German Goethe levels
    de: {
        processor: 'german-article-processor',
        standard: 'Goethe-Zertifikat',
        levels: 'A1, A2, B1, B2, C1, C2',
        importPath: '../../../german-article-processor/admin/src/utils/constants',
        constantName: 'GOETHE_LEVELS',
        status: 'PLANNED',
        getOptions: () => [
            { value: 'A1', label: 'A1 (Beginner)' },
            { value: 'A2', label: 'A2 (Elementary)' },
            { value: 'B1', label: 'B1 (Intermediate)' },
            { value: 'B2', label: 'B2 (Upper Intermediate)' },
            { value: 'C1', label: 'C1 (Advanced)' },
            { value: 'C2', label: 'C2 (Proficient)' },
        ]
    },

    // 🔄 PLANNED - Japanese JLPT levels
    ja: {
        processor: 'japanese-article-processor',
        standard: 'JLPT (Japanese Language Proficiency Test)',
        levels: 'N5, N4, N3, N2, N1',
        importPath: '../../../japanese-article-processor/admin/src/utils/constants',
        constantName: 'JLPT_LEVELS',
        status: 'PLANNED',
        getOptions: () => [
            { value: 'JLPT N5', label: 'JLPT N5 (Beginner)' },
            { value: 'JLPT N4', label: 'JLPT N4 (Elementary)' },
            { value: 'JLPT N3', label: 'JLPT N3 (Intermediate)' },
            { value: 'JLPT N2', label: 'JLPT N2 (Upper Intermediate)' },
            { value: 'JLPT N1', label: 'JLPT N1 (Advanced)' },
        ]
    },

    // 🔄 PLANNED - Portuguese CAPLE levels
    pt: {
        processor: 'portuguese-article-processor',
        standard: 'CAPLE (Centro de Avaliação de Português Língua Estrangeira)',
        levels: 'A1, A2, B1, B2, C1, C2',
        importPath: '../../../portuguese-article-processor/admin/src/utils/constants',
        constantName: 'CAPLE_LEVELS',
        status: 'PLANNED',
        getOptions: () => [
            { value: 'A1', label: 'A1 (Beginner)' },
            { value: 'A2', label: 'A2 (Elementary)' },
            { value: 'B1', label: 'B1 (Intermediate)' },
            { value: 'B2', label: 'B2 (Upper Intermediate)' },
            { value: 'C1', label: 'C1 (Advanced)' },
            { value: 'C2', label: 'C2 (Proficient)' },
        ]
    }
};

/**
 * Generic skill levels for languages without specific processors
 */
const GENERIC_SKILL_OPTIONS: SkillOption[] = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
];

/**
 * Get skill level options for a specific language
 * 
 * @param languageCode - ISO language code (zh, es, fr, etc.)
 * @returns Array of skill level options for the language
 */
export const getDisplaySkillOptions = (languageCode: string): SkillOption[] => {
    const config = LANGUAGE_SKILL_CONFIGS[languageCode];

    if (config) {
        return config.getOptions();
    }

    // Return generic options for languages without specific processors
    return GENERIC_SKILL_OPTIONS;
};

/**
 * Get language skill configuration info
 * 
 * @param languageCode - ISO language code
 * @returns Configuration object with processor info, or null if not found
 */
export const getLanguageSkillConfig = (languageCode: string): LanguageSkillConfig | null => {
    return LANGUAGE_SKILL_CONFIGS[languageCode] || null;
};

/**
 * Get all supported languages with their skill configurations
 * 
 * @returns Array of language codes with active skill configurations
 */
export const getSupportedLanguagesWithSkills = (): string[] => {
    return Object.keys(LANGUAGE_SKILL_CONFIGS);
};

/**
 * Get active language processors (those with imported constants)
 * 
 * @returns Array of language codes with active processors
 */
export const getActiveLanguageProcessors = (): string[] => {
    return Object.keys(LANGUAGE_SKILL_CONFIGS).filter(
        lang => LANGUAGE_SKILL_CONFIGS[lang].status === 'ACTIVE'
    );
};

/**
 * Development helper: Get roadmap information for planned processors
 * 
 * @returns Object with planned processor information
 */
export const getProcessorRoadmap = () => {
    const planned = Object.entries(LANGUAGE_SKILL_CONFIGS)
        .filter(([_, config]) => config.status === 'PLANNED')
        .map(([lang, config]) => ({
            language: lang,
            processor: config.processor,
            standard: config.standard,
            importPath: config.importPath,
            constantName: config.constantName
        }));

    return {
        planned,
        totalPlanned: planned.length,
        totalActive: getActiveLanguageProcessors().length
    };
};