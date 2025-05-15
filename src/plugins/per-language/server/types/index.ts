// src/plugins/per-language/server/types/index.ts
export interface PerLanguageContentType {
    id: number;
    article_id: number;
    language: string;
    per_language_text: string;
    processed_data?: any;
    display_skill?: string;
    published: boolean;
    access_tier?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ArticleContentType {
    id: number;
    title: string;
    date?: Date;
    base?: string;
    translation?: string;
    select_category?: any;
    access_tier?: string;
    created_at?: Date;
    updated_at?: Date;
}