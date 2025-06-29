// src/plugins/per-language/admin/src/components/processed-data/LanguageCard.tsx

import React from 'react';
import {
    Refresh,
    Play,
    Eye,
    EyeStriked,
    ExclamationMarkCircle,
    Trash
} from '@strapi/icons';

import { LanguageData, LanguageProcessor } from '../shared/types';
import { ACCESS_TIERS } from '../shared/constants';
import { AccessTierSelect } from '../shared/AccessTierSelect';

interface LanguageCardProps {
    language: LanguageData;
    processor: LanguageProcessor;
    index: number;
    isExpanded: boolean;
    isUpdating: Record<string, boolean>;
    showAllGrammar: Record<number, boolean>;
    showAllTranslations: Record<number, boolean>;
    onToggleExpansion: (languageId: number) => void;
    onClose: (languageId: number) => void;
    onRefresh: (languageId: number, languageCode: string) => void;
    onPublishToggle: (languageId: number, currentPublished: boolean) => void;
    onAccessTierChange: (languageId: number, tier: string) => void;
    onOpenProcessor: (language: string) => void;
    onGrammarExpansionToggle: (languageId: number) => void;
    onTranslationExpansionToggle: (languageId: number) => void;
    onDelete?: (languageId: number, languageName: string) => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
    language: lang,
    processor,
    index,
    isExpanded,
    isUpdating,
    showAllGrammar,
    onToggleExpansion,
    onClose,
    onRefresh,
    onPublishToggle,
    onAccessTierChange,
    onOpenProcessor,
    onGrammarExpansionToggle,
    onDelete
}) => {
    // Helper function to get the correct icon for access tier
    const getAccessTierIcon = (accessTier: string | null) => {
        if (!accessTier) {
            return ExclamationMarkCircle;
        }
        const tier = ACCESS_TIERS.find(t => t.value === accessTier);
        return tier?.icon || ExclamationMarkCircle;
    };

    const getStatusBadge = (lang: LanguageData, processor: LanguageProcessor) => {
        try {
            const hasContent = lang.per_language_text && lang.per_language_text.trim().length > 0;
            const hasProcessedData = lang.processed_data && Object.keys(lang.processed_data).length > 0;

            if (!hasContent) {
                return (
                    <span style={{
                        backgroundColor: "#f6f6f9",
                        color: "#666687",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500"
                    }}>
                        No Content
                    </span>
                );
            }

            if (!processor.hasProcessor) {
                return (
                    <span style={{
                        backgroundColor: "#fdf4dc",
                        color: "#be5d01",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500"
                    }}>
                        Processor Coming Soon
                    </span>
                );
            }

            if (hasProcessedData) {
                return (
                    <span style={{
                        backgroundColor: "#d9f7be",
                        color: "#389e0d",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500"
                    }}>
                        ✅ Processed
                    </span>
                );
            }

            return (
                <span style={{
                    backgroundColor: "#e6f7ff",
                    color: "#32324d",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500"
                }}>
                    Content Ready
                </span>
            );
        } catch (error) {
            console.error('Error in getStatusBadge:', error);
            return (
                <span style={{
                    backgroundColor: "#f6f6f9",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500"
                }}>
                    Unknown
                </span>
            );
        }
    };

    const getMetricsDisplay = (lang: LanguageData, processor: LanguageProcessor) => {
        try {
            const hasContent = lang.per_language_text && lang.per_language_text.trim().length > 0;
            const hasProcessedData = lang.processed_data && typeof lang.processed_data === 'object' && Object.keys(lang.processed_data).length > 0;

            return (
                <div style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "flex-start"
                }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", color: "#666687" }}>Content:</span>
                        <span style={{
                            backgroundColor: hasContent ? "#d9f7be" : "#f6f6f9",
                            color: hasContent ? "#389e0d" : "#666687",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500"
                        }}>
                            {hasContent ? 'Available' : 'None'}
                        </span>
                    </div>

                    {hasProcessedData && (
                        <>
                            {lang.display_skill && (
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <span style={{ fontSize: "14px", color: "#666687" }}>{processor.difficultyLabel}:</span>
                                    <span style={{
                                        backgroundColor: "#e6f7ff",
                                        color: "#32324d",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontWeight: "500"
                                    }}>
                                        {lang.display_skill}
                                    </span>
                                </div>
                            )}

                            {lang.processed_data.grammar?.sentences && (
                                <>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <span style={{ fontSize: "14px", color: "#666687" }}>Grammar Rules:</span>
                                        <span style={{
                                            backgroundColor: "#d9f7be",
                                            color: "#389e0d",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: "500"
                                        }}>
                                            {lang.processed_data.grammar.sentences.reduce((total: number, sentence: any) =>
                                                total + (sentence.rules?.length || 0), 0
                                            )} rules
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <span style={{ fontSize: "14px", color: "#666687" }}>Sentences:</span>
                                        <span style={{
                                            backgroundColor: "#f6f6f9",
                                            color: "#666687",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: "500"
                                        }}>
                                            {lang.processed_data.grammar.sentences.length} processed
                                        </span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            );
        } catch (error) {
            console.error('Error in getMetricsDisplay:', error);
            return (
                <span style={{ fontSize: "14px", color: "#d32f2f" }}>
                    Error displaying metrics
                </span>
            );
        }
    };

    // SIMPLIFIED: Handle delete with simple confirm dialog
    const handleDeleteClick = async () => {
        if (!onDelete) return;

        // Calculate what will be deleted for the warning
        const contentLength = lang.per_language_text?.length || 0;
        const sentenceCount = lang.processed_data?.grammar?.sentences?.length || 0;
        const grammarRuleCount = lang.processed_data?.grammar?.sentences?.reduce((total: number, sentence: any) =>
            total + (sentence.rules?.length || 0), 0
        ) || 0;

        // Create detailed warning message
        const warningMessage = `⚠️ DELETE ${processor.name.toUpperCase()} CONTENT

This will permanently delete:
• Translated content (${contentLength} characters)
• ${sentenceCount} processed sentences
• ${grammarRuleCount} grammar rules
• All processing metadata and settings
• Related sentence data from connected tables

The base article content will remain unchanged.

This action CANNOT be undone!

Are you sure you want to delete all ${processor.name} content?`;

        // Show confirmation dialog
        const confirmed = confirm(warningMessage);

        if (confirmed) {
            try {
                console.log(`[LanguageCard] User confirmed deletion of ${processor.name} content`);
                await onDelete(lang.id, processor.name);
            } catch (error) {
                console.error('Error deleting language content:', error);
                alert(`Failed to delete ${processor.name} content. Please try again.`);
            }
        } else {
            console.log(`[LanguageCard] User canceled deletion of ${processor.name} content`);
        }
    };

    // Handle invalid language data
    if (!lang || typeof lang !== 'object') {
        return (
            <div key={`invalid-${index}`} style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
                <span style={{ fontSize: "14px", color: "#d32f2f" }}>
                    Invalid language data at index {index}
                </span>
            </div>
        );
    }

    const TierIcon = getAccessTierIcon(lang.access_tier);

    // Helper function to get language names
    const getLanguageName = (languageCode: string) => {
        const languageNames: Record<string, string> = {
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'en': 'English'
        };
        return languageNames[languageCode] || languageCode.toUpperCase();
    };

    return (
        <div key={`lang-${lang.id}-${lang.language}-${index}`} style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Card Header */}
            <div style={{
                borderBottom: '1px solid #e0e0e0',
                padding: '20px'
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%"
                }}>
                    <h3 style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#32324d",
                        margin: 0
                    }}>
                        {processor.name}
                    </h3>
                    <button
                        onClick={() => onClose(lang.id)}
                        style={{
                            border: "none",
                            background: "none",
                            padding: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                            color: "#666687",
                            minWidth: "auto",
                            height: "auto"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '16px' }}>
                <div style={{ width: "100%", padding: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Status badges and action buttons - Flex with wrap */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: "12px"
                        }}>
                            <div style={{
                                display: "flex",
                                gap: "12px",
                                alignItems: "center",
                                flexWrap: "wrap",
                                minWidth: "fit-content"
                            }}>
                                {processor.hasProcessor && (
                                    <span style={{
                                        backgroundColor: "#d9f7be",
                                        color: "#389e0d",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontWeight: "500"
                                    }}>
                                        Processor Available
                                    </span>
                                )}
                                {getStatusBadge(lang, processor)}
                                {!lang.access_tier && (
                                    <span style={{
                                        backgroundColor: "#fdf4dc",
                                        color: "#be5d01",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontWeight: "500"
                                    }}>
                                        ⚠️ Access Tier Required
                                    </span>
                                )}
                            </div>

                            <div style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                flexShrink: 0
                            }}>
                                <button
                                    onClick={() => onRefresh(lang.id, lang.language)}
                                    disabled={isUpdating[`refresh_${lang.id}`]}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 12px",
                                        border: "1px solid #dcdce4",
                                        borderRadius: "4px",
                                        backgroundColor: "white",
                                        cursor: isUpdating[`refresh_${lang.id}`] ? "not-allowed" : "pointer",
                                        fontSize: "14px",
                                        opacity: isUpdating[`refresh_${lang.id}`] ? 0.6 : 1
                                    }}
                                >
                                    <Refresh width="16px" height="16px" />
                                    Refresh
                                </button>
                                <button
                                    onClick={() => onOpenProcessor(lang.language)}
                                    disabled={!processor.hasProcessor}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 12px",
                                        border: processor.hasProcessor ? "1px solid #4945ff" : "1px solid #dcdce4",
                                        borderRadius: "4px",
                                        backgroundColor: processor.hasProcessor ? "#4945ff" : "#f6f6f9",
                                        color: processor.hasProcessor ? "white" : "#666687",
                                        cursor: processor.hasProcessor ? "pointer" : "not-allowed",
                                        fontSize: "14px"
                                    }}
                                >
                                    <Play width="16px" height="16px" />
                                    Open Processor
                                </button>
                            </div>
                        </div>

                        {/* Access tier, publish controls, and DELETE BUTTON - Flex with wrap */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: "12px"
                        }}>
                            <div style={{
                                display: "flex",
                                gap: "16px",
                                alignItems: "center",
                                flexWrap: "wrap",
                                minWidth: "fit-content"
                            }}>
                                <div style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                    flexShrink: 0
                                }}>
                                    <TierIcon width="16px" height="16px" />
                                    <AccessTierSelect
                                        value={lang.access_tier}
                                        onChange={(value: string) => onAccessTierChange(lang.id, value)}
                                        disabled={isUpdating[`tier_${lang.id}`]}
                                        size="S"
                                        error={!lang.access_tier ? "Access tier is required" : undefined}
                                    />
                                </div>

                                <div style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                    flexShrink: 0
                                }}>
                                    {lang.published ?
                                        <Eye width="16px" height="16px" /> :
                                        <EyeStriked width="16px" height="16px" />
                                    }
                                    <input
                                        type="checkbox"
                                        checked={lang.published || false}
                                        onChange={() => onPublishToggle(lang.id, lang.published)}
                                        disabled={isUpdating[`publish_${lang.id}`]}
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            cursor: isUpdating[`publish_${lang.id}`] ? "not-allowed" : "pointer"
                                        }}
                                    />
                                    <span style={{
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        whiteSpace: "nowrap",
                                        color: "#32324d"
                                    }}>
                                        {lang.published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                display: "flex",
                                gap: "12px",
                                alignItems: "center",
                                flexShrink: 0
                            }}>
                                <span style={{
                                    fontSize: "14px",
                                    color: "#666687",
                                    whiteSpace: "nowrap"
                                }}>
                                    Last updated: {new Date(lang.updatedAt || lang.updated_at).toLocaleDateString()}
                                </span>

                                {onDelete && (
                                    <button
                                        onClick={handleDeleteClick}
                                        disabled={isUpdating[`delete_${lang.id}`]}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px 12px",
                                            border: "1px solid #d32f2f",
                                            borderRadius: "4px",
                                            backgroundColor: "#ffeaea",
                                            color: "#d32f2f",
                                            cursor: isUpdating[`delete_${lang.id}`] ? "not-allowed" : "pointer",
                                            fontSize: "14px",
                                            opacity: isUpdating[`delete_${lang.id}`] ? 0.6 : 1
                                        }}
                                    >
                                        <Trash width="16px" height="16px" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Metrics display */}
                        {getMetricsDisplay(lang, processor)}

                        {/* Expandable Details Section - Redesigned */}
                        {lang.processed_data && Object.keys(lang.processed_data).length > 0 && (
                            <>
                                <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "16px 0" }} />
                                <div style={{ width: "100%" }}>
                                    <button
                                        onClick={() => onToggleExpansion(lang.id)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #dcdce4",
                                            borderRadius: "4px",
                                            backgroundColor: "white",
                                            cursor: "pointer",
                                            fontSize: "14px"
                                        }}
                                    >
                                        {isExpanded ? 'Hide Sentence Details' : 'Show Sentence Details'}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div style={{
                                        padding: "16px",
                                        backgroundColor: "#fafafa",
                                        borderRadius: "4px"
                                    }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            {/* 1. Difficulty Levels Section - Dynamic */}
                                            {lang.display_skill && (
                                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <h4 style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        margin: 0,
                                                        color: "#32324d"
                                                    }}>
                                                        Difficulty Level:
                                                    </h4>
                                                    <span style={{
                                                        backgroundColor: "#e6f7ff",
                                                        color: "#32324d",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "500"
                                                    }}>
                                                        {lang.display_skill}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Fallback for when display_skill is not available but we have data */}
                                            {!lang.display_skill && lang.processed_data.hsk && (
                                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <h4 style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        margin: 0,
                                                        color: "#32324d"
                                                    }}>
                                                        Difficulty Level:
                                                    </h4>
                                                    <span style={{
                                                        backgroundColor: "#e6f7ff",
                                                        color: "#32324d",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "500"
                                                    }}>
                                                        {processor.difficultyLabel} {lang.processed_data.hsk.selectedLevel || lang.processed_data.hsk.calculatedLevel}
                                                    </span>
                                                </div>
                                            )}

                                            {/* 2. Sentences Section */}
                                            {lang.processed_data.grammar?.sentences && lang.processed_data.grammar.sentences.length > 0 && (
                                                <div>
                                                    <h4 style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        paddingBottom: "12px",
                                                        margin: 0,
                                                        color: "#32324d"
                                                    }}>
                                                        Sentences
                                                    </h4>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                                        {lang.processed_data.grammar.sentences
                                                            .slice(0, showAllGrammar[lang.id] ? undefined : 3)
                                                            .map((sentence: any, index: number) => (
                                                                <div key={index} style={{
                                                                    padding: "12px",
                                                                    backgroundColor: "white",
                                                                    borderRadius: "4px",
                                                                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                                                                }}>
                                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                                        {/* Original sentence */}
                                                                        <h5 style={{
                                                                            fontSize: "16px",
                                                                            fontWeight: "600",
                                                                            margin: 0,
                                                                            color: "#32324d"
                                                                        }}>
                                                                            {sentence.sentence}
                                                                        </h5>

                                                                        {/* English translation */}
                                                                        {sentence.translation && (
                                                                            <p style={{
                                                                                fontSize: "14px",
                                                                                color: "#666687",
                                                                                margin: 0
                                                                            }}>
                                                                                {sentence.translation}
                                                                            </p>
                                                                        )}

                                                                        {/* Other language translations */}
                                                                        {sentence.translations && sentence.translations
                                                                            .filter((trans: any) => trans.language !== 'en')
                                                                            .length > 0 && (
                                                                                <div style={{
                                                                                    display: "flex",
                                                                                    gap: "4px",
                                                                                    alignItems: "center",
                                                                                    flexWrap: "wrap"
                                                                                }}>
                                                                                    <span style={{
                                                                                        fontSize: "14px",
                                                                                        color: "#666687"
                                                                                    }}>
                                                                                        Also available in:
                                                                                    </span>
                                                                                    {sentence.translations
                                                                                        .filter((trans: any) => trans.language !== 'en')
                                                                                        .map((trans: any, transIndex: number) => (
                                                                                            <span
                                                                                                key={transIndex}
                                                                                                style={{
                                                                                                    backgroundColor: "#f0f0f0",
                                                                                                    color: "#666687",
                                                                                                    padding: "2px 6px",
                                                                                                    borderRadius: "4px",
                                                                                                    fontSize: "12px",
                                                                                                    fontWeight: "500"
                                                                                                }}
                                                                                            >
                                                                                                {getLanguageName(trans.language)}
                                                                                            </span>
                                                                                        ))}
                                                                                </div>
                                                                            )}

                                                                        {/* Grammar rules */}
                                                                        {sentence.rules && sentence.rules.length > 0 && (
                                                                            <div style={{ paddingTop: "4px" }}>
                                                                                {sentence.rules.map((rule: string, ruleIndex: number) => (
                                                                                    <p key={ruleIndex} style={{
                                                                                        fontSize: "14px",
                                                                                        color: "#32324d",
                                                                                        margin: "4px 0",
                                                                                        paddingLeft: "8px"
                                                                                    }}>
                                                                                        • {rule}
                                                                                    </p>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                        {/* Show/Hide toggle for sentences */}
                                                        {lang.processed_data.grammar.sentences.length > 3 && (
                                                            <div style={{ paddingTop: "8px" }}>
                                                                <button
                                                                    onClick={() => onGrammarExpansionToggle(lang.id)}
                                                                    style={{
                                                                        padding: "6px 12px",
                                                                        border: "1px solid #dcdce4",
                                                                        borderRadius: "4px",
                                                                        backgroundColor: "white",
                                                                        cursor: "pointer",
                                                                        fontSize: "14px"
                                                                    }}
                                                                >
                                                                    {showAllGrammar[lang.id]
                                                                        ? `Hide ${lang.processed_data.grammar.sentences.length - 3} more sentences`
                                                                        : `Show ${lang.processed_data.grammar.sentences.length - 3} more sentences`
                                                                    }
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};