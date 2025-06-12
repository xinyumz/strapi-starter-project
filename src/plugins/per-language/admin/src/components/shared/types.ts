// src/plugins/per-language/admin/src/components/shared/types.ts

export interface LanguageData {
    id: number;
    language: string;
    per_language_text: string;
    processed_data: ProcessedData;
    difficulty_data: any;
    display_skill: string;
    published: boolean;
    access_tier: string | null;
    created_at: string;
    updated_at: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProcessedData {
    hsk?: HSKData;
    grammar?: GrammarData;
}

export interface HSKData {
    calculatedLevel: number;
    selectedLevel: number;
    distribution: number[];
}

export interface GrammarData {
    sentences: GrammarSentence[];
}

export interface GrammarSentence {
    sentence: string;
    translation: string;
    rules: string[];
    translations?: Translation[];
}

export interface Translation {
    text: string;
    language: string;
}

export interface LanguageProcessor {
    code: string;
    name: string;
    hasProcessor: boolean;
    processorUrl?: string;
    difficultyLabel: string;
}