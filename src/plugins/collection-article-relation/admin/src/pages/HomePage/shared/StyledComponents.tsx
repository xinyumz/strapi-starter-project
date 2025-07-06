// src/plugins/collection-article-relation/admin/src/pages/HomePage/shared/StyledComponents.tsx

import { Box } from '@strapi/design-system';
import styled from 'styled-components';

// ====================================
// LAYOUT COMPONENTS
// ====================================

export const ContentWrapper = styled(Box)`
  max-width: 1200px;
  margin: 0 auto;
`;

// ====================================
// CARD COMPONENTS
// ====================================

export const WhiteCard = styled(Box)`
  padding: 3rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

export const InfoCard = styled(Box)`
  padding: 3rem;
  border-radius: 12px;
  width: 100%;
`;

export const FeatureCard = styled(Box)`
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
`;

export const InsightCard = styled(Box)`
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  cursor: default;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

// ====================================
// STEP/PROCESS COMPONENTS
// ====================================

export const StepCard = styled(Box)`
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
`;

export const StepNumber = styled(Box)`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
`;

// ====================================
// STATS/METRICS COMPONENTS
// ====================================

export const StatsCard = styled(Box)`
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  cursor: default;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const MetricNumber = styled(Box)`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
`;

// ====================================
// BENEFIT/HIGHLIGHT COMPONENTS - ENHANCED FOR RESPONSIVE GRID
// ====================================

export const BenefitCard = styled(Box)`
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  height: 100%;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const BenefitMetric = styled(Box)`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
`;

// ====================================
// RESPONSIVE GRID FOR BENEFITS
// ====================================

export const BenefitsGrid = styled(Box)`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// ====================================
// INTERACTIVE COMPONENTS
// ====================================

export const QuickActionButton = styled(Box)`
  margin-top: 1rem;
  width: 100%;
`;

// ====================================
// BADGE/STATUS COMPONENTS
// ====================================

export const ReadyBadge = styled(Box)`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const StatusBadge = styled(Box)`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 0.25rem;
`;

// ====================================
// PROGRESS/LOADING COMPONENTS
// ====================================

export const ProgressRing = styled(Box) <{
    $percentage: number;
    $color: string;
    $backgroundColor?: string;
}>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.$color} ${props => props.$percentage * 3.6}deg,
    ${props => props.$backgroundColor || '#e9ecef'} 0deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  
  &::before {
    content: '';
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: white;
    position: absolute;
  }
`;

export const MetricText = styled(Box)`
  position: relative;
  z-index: 1;
  font-weight: bold;
`;

// ====================================
// CONTAINER/WRAPPER VARIANTS
// ====================================

export const TabContentContainer = styled(Box)`
  padding-top: 1rem;
  min-height: 400px;
`;

export const SectionContainer = styled(Box)`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const GridContainer = styled(Box)`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
`;

// ====================================
// UTILITY COMPONENTS
// ====================================

export const FlexCenter = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FlexBetween = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FlexStart = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const TextCenter = styled(Box)`
  text-align: center;
`;

// ====================================
// ENHANCED VARIANTS FOR SPECIFIC USE CASES
// ====================================

export const DashboardCard = styled(WhiteCard)`
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

// ====================================
// RESPONSIVE GRID LAYOUTS
// ====================================

export const ResponsiveGrid = styled(Box) <{ $columns?: number }>`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(${props => props.$columns || 2}, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(${props => Math.min(props.$columns || 3, 4)}, 1fr);
  }
`;

export const StatsGrid = styled(ResponsiveGrid)`
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const FeatureGrid = styled(ResponsiveGrid)`
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: 2fr 1fr;
  }
`;

// ====================================
// ANIMATION COMPONENTS
// ====================================

export const FadeInCard = styled(Box)`
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
  
  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ScaleOnHover = styled(Box)`
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

// ====================================
// ACCESSIBILITY HELPERS
// ====================================

export const ScreenReaderOnly = styled(Box)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const FocusVisible = styled(Box)`
  &:focus-visible {
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

// ====================================
// EXPORT ALL COMPONENTS
// ====================================

export {
    // Re-export for easier imports
    Box
} from '@strapi/design-system';