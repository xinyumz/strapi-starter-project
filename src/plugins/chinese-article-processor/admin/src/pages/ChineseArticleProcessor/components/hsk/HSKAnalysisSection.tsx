// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKAnalysisSection.tsx
import React from 'react';
import HSKDistributionChart from './HSKDistributionChart';
import HSKLevelSelector from './HSKLevelSelector';
import { HSKData } from '../../../../utils/types';

interface HSKAnalysisSectionProps {
  hskData: HSKData;
  isCalculatingHSK: boolean;
  hasHskChanges: boolean;
  isLoading: boolean;
  onCalculate: () => Promise<void>;
  onLevelChange: (level: string) => void;
  onSaveLevel: () => Promise<void>;
}

/**
 * Native HTML component for HSK analysis section
 */
const HSKAnalysisSection: React.FC<HSKAnalysisSectionProps> = ({
  hskData,
  isCalculatingHSK,
  hasHskChanges,
  isLoading,
  onCalculate,
  onLevelChange,
  onSaveLevel
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#212134',
          margin: 0
        }}>
          HSK Analysis
        </h2>

        <button
          onClick={onCalculate}
          disabled={isLoading || isCalculatingHSK}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: isLoading || isCalculatingHSK ? '#f6f6f9' : '#4945ff',
            color: isLoading || isCalculatingHSK ? '#666687' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading || isCalculatingHSK ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (!isLoading && !isCalculatingHSK) {
              e.currentTarget.style.backgroundColor = '#3730df';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading && !isCalculatingHSK) {
              e.currentTarget.style.backgroundColor = '#4945ff';
            }
          }}
        >
          {isCalculatingHSK && (
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
          Calculate HSK Level
        </button>
      </div>

      {/* Content */}
      {isCalculatingHSK ? (
        <div style={{
          padding: '1.5rem',
          textAlign: 'center' as const,
          color: '#666687'
        }}>
          <div style={{
            display: 'inline-block',
            width: '24px',
            height: '24px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #4945ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }} />
          <div>Calculating HSK level...</div>
        </div>
      ) : hskData.distribution.length === 0 ? (
        <div style={{
          paddingBottom: '1rem',
          color: '#4a4a6a'
        }}>
          No HSK analysis found. Click "Calculate HSK Level" to analyze the Chinese text.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div>
            <HSKDistributionChart distribution={hskData.distribution} />
          </div>
          <div>
            <HSKLevelSelector
              calculatedLevel={hskData.calculatedLevel}
              selectedLevel={hskData.selectedLevel}
              hasChanges={hasHskChanges}
              isLoading={isLoading}
              onLevelChange={onLevelChange}
              onSave={onSaveLevel}
            />
          </div>
        </div>
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

export default HSKAnalysisSection;