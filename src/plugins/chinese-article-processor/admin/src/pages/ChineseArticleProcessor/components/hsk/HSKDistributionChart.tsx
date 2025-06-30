// src/plugins/chinese-article-processor/admin/src/pages/ChineseArticleProcessor/components/hsk/HSKDistributionChart.tsx
import React from 'react';
import { COLORS, COLOR_THRESHOLDS } from '../../../../utils/constants';

interface HSKDistributionChartProps {
    distribution: number[];
}

/**
 * Native HTML component for visualizing HSK level distribution
 */
const HSKDistributionChart: React.FC<HSKDistributionChartProps> = ({ distribution }) => {
    // Helper for HSK level visualization colors
    const getColorForPercentage = (percentage: number): string => {
        if (percentage > COLOR_THRESHOLDS.HIGH) return COLORS.HIGH;
        if (percentage > COLOR_THRESHOLDS.MEDIUM) return COLORS.MEDIUM;
        if (percentage > COLOR_THRESHOLDS.LOW) return COLORS.LOW;
        return COLORS.LOWEST;
    };

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#212134',
                margin: '0 0 1rem 0'
            }}>
                HSK Level Distribution
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {distribution.map((percentage: number, index: number) => (
                    <div key={index} style={{ minWidth: '120px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.25rem'
                        }}>
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#4a4a6a',
                                fontWeight: '500'
                            }}>
                                HSK {index + 1}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#4a4a6a',
                                fontWeight: '500'
                            }}>
                                {percentage}%
                            </span>
                        </div>

                        <div style={{
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            height: '8px',
                            position: 'relative' as const,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                backgroundColor: getColorForPercentage(percentage),
                                height: '100%',
                                width: `${percentage}%`,
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HSKDistributionChart;