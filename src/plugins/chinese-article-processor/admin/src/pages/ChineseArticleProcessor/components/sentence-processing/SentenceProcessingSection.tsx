// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/sentence-processing/SentenceProcessingSection.tsx
import React from 'react';
import { GrammarRule, GrammarEngineChoice, SelectedRule } from '../../../../utils/types';

interface SentenceProcessingSectionProps {
  sentences: GrammarRule[];
  engineChoice: GrammarEngineChoice;
  activeLanguage: string;
  supportedLanguages: { code: string, name: string }[];
  hasSupportedLanguages: boolean;
  isLoading: boolean;
  isTranslating: boolean;
  hasTranslationChanges: boolean;
  selectedRulesCount: number;
  selectedRules: SelectedRule[];
  onEngineChange: (engine: GrammarEngineChoice) => void;
  onLanguageChange: (language: string) => void;
  onGenerateClick: () => Promise<void>;
  onTranslateClick: () => Promise<void>;
  onTranslationChange: (sentenceIndex: number, language: string, newTranslation: string) => void;
  onAddBulkTranslation: (language: string) => Promise<void>;
  onRemoveBulkTranslation: (language: string) => Promise<void>;
  onToggleRuleSelection: (sentenceIndex: number, ruleIndex: number) => void;
  onDeleteRuleClick: (sentenceIndex: number, ruleIndex: number) => void;
  onSaveTranslations: () => Promise<void>;
  onDeleteSelected: () => void;
  isRuleSelected: (sentenceIndex: number, ruleIndex: number) => boolean;
  simplified?: boolean;
}

/**
 * Self-contained native HTML component for sentence processing
 * No external Design System dependencies
 */
const SentenceProcessingSection: React.FC<SentenceProcessingSectionProps> = ({
  sentences,
  engineChoice,
  activeLanguage,
  supportedLanguages,
  hasSupportedLanguages,
  isLoading,
  isTranslating,
  hasTranslationChanges,
  selectedRulesCount,
  onEngineChange,
  onLanguageChange,
  onGenerateClick,
  onTranslateClick,
  onTranslationChange,
  onAddBulkTranslation,
  onRemoveBulkTranslation,
  onToggleRuleSelection,
  onDeleteRuleClick,
  onSaveTranslations,
  onDeleteSelected,
  isRuleSelected,
  simplified = true, // Default to simplified
}) => {
  const hasSentences = sentences.length > 0;

  // Get the display name for a language code
  const getLanguageName = (code: string): string => {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  // Get all active languages across all sentences
  const getActiveLanguages = (sentences: GrammarRule[]): string[] => {
    const languagesSet = new Set<string>();
    languagesSet.add('en'); // Always include English

    sentences.forEach(sentence => {
      if (Array.isArray(sentence.translations)) {
        sentence.translations.forEach(translation => {
          languagesSet.add(translation.language);
        });
      }
    });

    return Array.from(languagesSet);
  };

  const activeLanguages = getActiveLanguages(sentences);

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1rem'
    }}>
      {/* Header and Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#212134',
          margin: 0
        }}>
          Sentence Analysis & Translation
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Engine Choice */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#4a4a6a',
              marginBottom: '0.25rem'
            }}>
              Grammar Engine
            </label>
            <select
              value={engineChoice}
              onChange={(e) => onEngineChange(e.target.value as GrammarEngineChoice)}
              disabled={isLoading}
              style={{
                padding: '0.5rem',
                border: '1px solid #dcdce4',
                borderRadius: '4px',
                backgroundColor: isLoading ? '#f6f6f9' : 'white',
                fontSize: '0.875rem',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="stanford">Stanford</option>
              <option value="jieba">Jieba</option>
              <option value="both">Both (Stanford + Jieba)</option>
            </select>
          </div>

          {/* Language Selection */}
          {hasSupportedLanguages && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#4a4a6a',
                marginBottom: '0.25rem'
              }}>
                Target Language
              </label>
              <select
                value={activeLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                disabled={isLoading || isTranslating || !hasSupportedLanguages}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #dcdce4',
                  borderRadius: '4px',
                  backgroundColor: (isLoading || isTranslating || !hasSupportedLanguages) ? '#f6f6f9' : 'white',
                  fontSize: '0.875rem',
                  cursor: (isLoading || isTranslating || !hasSupportedLanguages) ? 'not-allowed' : 'pointer'
                }}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button
              onClick={onGenerateClick}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: isLoading ? '#f6f6f9' : '#4945ff',
                color: isLoading ? '#666687' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#3730df';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#4945ff';
                }
              }}
            >
              {isLoading && !isTranslating && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #666687',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              <span>🔄</span>
              Generate Grammar Rules
            </button>

            {hasSupportedLanguages && (
              <button
                onClick={onTranslateClick}
                disabled={!hasSentences || isLoading || isTranslating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: (!hasSentences || isLoading || isTranslating) ? '#f6f6f9' : '#10b981',
                  color: (!hasSentences || isLoading || isTranslating) ? '#666687' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!hasSentences || isLoading || isTranslating) ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (hasSentences && !isLoading && !isTranslating) {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }
                }}
                onMouseOut={(e) => {
                  if (hasSentences && !isLoading && !isTranslating) {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }
                }}
              >
                {isTranslating && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #666687',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                <span>▶️</span>
                {isTranslating ? 'Translating...' : 'Translate All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Translation Changes Alert */}
      {hasTranslationChanges && (
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          color: '#1565c0',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>You have unsaved translation changes.</span>
        </div>
      )}

      {/* Content */}
      {!hasSentences ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center' as const,
          color: '#666687',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px'
        }}>
          <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>📝</div>
          <div>Click 'Generate Grammar Rules' to analyze the Chinese text.</div>
        </div>
      ) : (
        <>
          {/* Selected Rules Count */}
          {selectedRulesCount > 0 && (
            <div style={{
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#4a4a6a',
              backgroundColor: '#f0f8ff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #e3f2fd'
            }}>
              {selectedRulesCount} grammar rules selected
            </div>
          )}

          {/* Sentences Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {sentences.map((sentence, index) => (
              <div
                key={`sentence-${index}`}
                style={{
                  backgroundColor: '#f9f9f9',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  height: 'fit-content'
                }}
              >
                {/* Sentence Number */}
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#4945ff',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  marginBottom: '0.75rem'
                }}>
                  Sentence {index + 1}
                </div>

                {/* Original Sentence */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#212134',
                  wordBreak: 'break-word' as const,
                  lineHeight: '1.5'
                }}>
                  {sentence?.sentence || 'No sentence text'}
                </div>

                {/* Translations */}
                {sentence.translations && sentence.translations.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    {sentence.translations.map((translation) => (
                      <div key={`${index}-${translation.language}`} style={{ marginBottom: '0.5rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          color: '#4a4a6a',
                          marginBottom: '0.25rem',
                          fontWeight: '500'
                        }}>
                          {getLanguageName(translation.language)} Translation
                        </label>
                        <textarea
                          value={translation.text}
                          onChange={(e) => onTranslationChange(index, translation.language, e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '0.5rem',
                            border: '1px solid #dcdce4',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            resize: 'vertical' as const,
                            fontFamily: 'inherit'
                          }}
                          placeholder={`Translation (${getLanguageName(translation.language)})`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Grammar Rules */}
                {sentence.rules && sentence.rules.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#4a4a6a',
                      marginBottom: '0.5rem'
                    }}>
                      Grammar Rules ({sentence.rules.length}):
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {sentence.rules.map((rule, ruleIndex) => (
                        <div
                          key={`rule-${index}-${ruleIndex}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: isRuleSelected(index, ruleIndex) ? '#e3f2fd' : 'white',
                            border: '1px solid #dcdce4',
                            borderRadius: '4px',
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            maxWidth: '100%'
                          }}
                          onClick={() => onToggleRuleSelection(index, ruleIndex)}
                          onMouseOver={(e) => {
                            if (!isRuleSelected(index, ruleIndex)) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isRuleSelected(index, ruleIndex)) {
                              e.currentTarget.style.backgroundColor = 'white';
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isRuleSelected(index, ruleIndex)}
                            onChange={() => onToggleRuleSelection(index, ruleIndex)}
                            style={{ margin: 0 }}
                          />
                          <span style={{ flex: 1, wordBreak: 'break-word' as const }}>{rule}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRuleClick(index, ruleIndex);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '3px',
                              fontSize: '0.75rem'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffebee';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e0e0e0',
            flexWrap: 'wrap'
          }}>
            <div>
              {hasTranslationChanges && (
                <button
                  onClick={onSaveTranslations}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                >
                  <span>💾</span>
                  Save Translations
                </button>
              )}
            </div>

            <div>
              {selectedRulesCount > 0 && (
                <button
                  onClick={onDeleteSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#c82333';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                  }}
                >
                  <span>🗑️</span>
                  Delete Selected ({selectedRulesCount})
                </button>
              )}
            </div>
          </div>

          {/* Active Languages Management */}
          {activeLanguages.length > 1 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f6f6f9',
              borderRadius: '6px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#212134',
                marginBottom: '0.75rem'
              }}>
                Active Translation Languages
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {activeLanguages.map((lang) => (
                  <div
                    key={lang}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #dcdce4',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span>{getLanguageName(lang)}</span>
                    {lang !== 'en' && (
                      <button
                        onClick={() => onRemoveBulkTranslation(lang)}
                        disabled={isLoading || isTranslating}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: (isLoading || isTranslating) ? 'not-allowed' : 'pointer',
                          padding: '0.25rem',
                          borderRadius: '3px',
                          fontSize: '0.75rem'
                        }}
                        onMouseOver={(e) => {
                          if (!isLoading && !isTranslating) {
                            e.currentTarget.style.backgroundColor = '#ffebee';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SentenceProcessingSection;