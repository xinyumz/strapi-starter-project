// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKLevelSelector.tsx
import React from 'react';
import { HSK_LEVELS } from '../../../../utils/constants';

interface HSKLevelSelectorProps {
  calculatedLevel: number | null;
  selectedLevel: number | null;
  hasChanges: boolean;
  isLoading: boolean;
  onLevelChange: (level: string) => void;
  onSave: () => Promise<void>;
}

/**
 * Native HTML component for displaying and selecting HSK level
 */
const HSKLevelSelector: React.FC<HSKLevelSelectorProps> = ({
  calculatedLevel,
  selectedLevel,
  hasChanges,
  isLoading,
  onLevelChange,
  onSave,
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1rem',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Calculated Level Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#212134',
              margin: 0
            }}>
              Calculated HSK Level
            </h3>

            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              backgroundColor: calculatedLevel ? '#e3f2fd' : '#f0f0f0',
              color: calculatedLevel ? '#1976d2' : '#666687',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {calculatedLevel ? `HSK ${calculatedLevel}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Manual Selection Section */}
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#212134',
            margin: '0 0 0.5rem 0'
          }}>
            Manual Selection
          </h3>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: '#4a4a6a',
              marginBottom: '0.25rem'
            }}>
              Select Final HSK Level
            </label>

            <select
              value={selectedLevel?.toString() || "1"}
              onChange={(e) => onLevelChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #dcdce4',
                borderRadius: '4px',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                color: '#212134'
              }}
            >
              {HSK_LEVELS.map((level) => (
                <option key={level} value={level.toString()}>
                  HSK {level}
                </option>
              ))}
            </select>
          </div>

          {hasChanges && (
            <div style={{ marginBottom: '0.75rem' }}>
              <button
                onClick={onSave}
                disabled={!hasChanges || isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: (!hasChanges || isLoading) ? '#f6f6f9' : '#10b981',
                  color: (!hasChanges || isLoading) ? '#666687' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!hasChanges || isLoading) ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (hasChanges && !isLoading) {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }
                }}
                onMouseOut={(e) => {
                  if (hasChanges && !isLoading) {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }
                }}
              >
                <span>✓</span>
                Save HSK Level
              </button>
            </div>
          )}

          <div style={{
            fontSize: '0.75rem',
            color: '#666687',
            lineHeight: '1.4'
          }}>
            {hasChanges
              ? "Click 'Save HSK Level' to save your selection"
              : "The selected HSK level has been saved to the article."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HSKLevelSelector;