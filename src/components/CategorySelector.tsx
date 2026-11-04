import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../styles/theme';
import { useCategory, CategoryId } from '../context/CategoryContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: rgba(10, 16, 30, 0.9);
  border: 1px solid ${theme.colors.panel.border};
  border-radius: ${theme.borderRadius};
  backdrop-filter: blur(10px);
  grid-column: 1 / -1;
  animation: ${fadeIn} 0.5s ease-out;
`;

const CategoryItem = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: ${theme.borderRadius};
  transition: all 0.3s ease;
  min-width: 100px;

  ${props => props.active && css`
    border-color: ${theme.colors.primary};
    background: rgba(0, 240, 255, 0.1);
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
    
    & svg {
      color: ${theme.colors.primary};
      filter: drop-shadow(0 0 5px ${theme.colors.primary});
    }
    
    & span {
      color: ${theme.colors.text.accent};
    }
  `}

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    
    ${props => !props.active && css`
      border-color: rgba(255, 255, 255, 0.2);
    `}
  }
`;

const IconWrapper = styled.div`
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.text.secondary};
  transition: all 0.3s ease;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const Label = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.text.secondary};
  transition: all 0.3s ease;
  white-space: nowrap;
`;

// 图标定义
const CityIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M15 11V5l-3-3-3 3v2H2v11h20v-7h-7zM7 16H5v-2h2v2zm0-4H5v-2h2v2zm6 4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>
);
const HealthIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 9v6h-8v6H4V3h16v6zm-2-4H6v14h4v-6h8V5zM8 7h8v2H8V7zm0 4h6v2H8v-2z"/></svg>
);
// 能源供应图标 - 闪电/电池
const EnergyIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>
);
// 碳封存图标 - CO2/叶子
const CarbonIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>
);
const LifeIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
);
const IndustryIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M22 22H2V2h20v20zM13 11V9h-2v2H9v2h2v2h2v-2h2v-2h-2z"/></svg>
);

// 分类配置 - 新顺序：城市管理、道路巡检、能源供应、碳封存、数字生活、行业应用
const categories = [
  { id: 'city', label: '城市管理', icon: CityIcon },
  { id: 'health', label: '道路巡检', icon: HealthIcon },
  { id: 'energy', label: '能源供应', icon: EnergyIcon },
  { id: 'carbon', label: '碳封存', icon: CarbonIcon },
  { id: 'life', label: '数字生活', icon: LifeIcon },
  { id: 'industry', label: '行业应用', icon: IndustryIcon },
];

const CategorySelector: React.FC = () => {
  const { activeCategory, setActiveCategory } = useCategory();

  return (
    <Container>
      {categories.map(cat => (
        <CategoryItem
          key={cat.id}
          active={activeCategory === cat.id}
          onClick={() => setActiveCategory(cat.id as CategoryId)}
        >
          <IconWrapper>
            <cat.icon />
          </IconWrapper>
          <Label>{cat.label}</Label>
        </CategoryItem>
      ))}
    </Container>
  );
};

export default CategorySelector;
