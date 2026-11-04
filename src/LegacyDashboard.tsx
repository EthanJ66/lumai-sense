import React from 'react';
import styled, { keyframes } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { DashboardContainer, LeftColumn, CenterColumn, RightColumn } from './components/Layout';
import Header from './components/Header';
import RealTimeData from './components/RealTimeData';
import WarningSystem from './components/WarningSystem';
import UsageRatio from './components/UsageRatio';
import DigitalTwin from './components/DigitalTwin';
import MicroscopicMechanism from './components/MicroscopicMechanism';
import ErrorBoundary from './components/ErrorBoundary';
import CategorySelector from './components/CategorySelector';
import { CategoryProvider, useCategory } from './context/CategoryContext';
import CityManagement from './pages/CityManagement';
import Healthcare from './pages/Healthcare';
import EnergySupply from './pages/Sports';    // 能源供应（原运动健身）
import CarbonSequestration from './pages/IoT'; // 碳封存（原物联网专项）
import DigitalLife from './pages/DigitalLife';
import Industry from './pages/Industry';

// 返回首页按钮动画
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 15px rgba(0,255,255,0.4); }
  50% { box-shadow: 0 0 25px rgba(0,255,255,0.7); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

// 返回首页按钮样式
const HomeButton = styled.button`
  position: fixed;
  bottom: 100px;
  right: 25px;
  z-index: 1000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0,60,100,0.9) 0%, rgba(0,30,50,0.95) 100%);
  border: 2px solid #00ffff;
  color: #00ffff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${slideIn} 0.3s ease-out, ${pulse} 2s infinite;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    background: linear-gradient(135deg, rgba(0,100,150,0.95) 0%, rgba(0,50,80,0.95) 100%);
    border-color: #00ff88;
    color: #00ff88;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
`;

const PageContent: React.FC = () => {
  const { activeCategory } = useCategory();

  // 首页布局
  if (activeCategory === 'home') {
    return (
      <>
        <LeftColumn>
          <RealTimeData style={{ flex: 2 }} />
          <WarningSystem style={{ flex: 1, minHeight: 0 }} />
        </LeftColumn>
        <CenterColumn>
          <ErrorBoundary>
            <DigitalTwin />
          </ErrorBoundary>
        </CenterColumn>
        <RightColumn>
          <UsageRatio style={{ flex: 2, minHeight: '220px' }} />
          <ErrorBoundary>
            <MicroscopicMechanism style={{ flex: 3, minHeight: 0 }} />
          </ErrorBoundary>
        </RightColumn>
      </>
    );
  }

  // 分类页面映射
  // 顺序：城市管理、道路巡检、能源供应、碳封存、数字生活、行业应用
  const pages = {
    city: <CityManagement />,
    health: <Healthcare />,
    energy: <EnergySupply />,
    carbon: <CarbonSequestration />,
    life: <DigitalLife />,
    industry: <Industry />,
  };

  return (
    <div style={{ gridColumn: '1 / -1', minHeight: 0, overflow: 'hidden' }}>
      {pages[activeCategory as keyof typeof pages]}
    </div>
  );
};

// 返回首页按钮组件
const BackToHomeButton: React.FC = () => {
  const { activeCategory, setActiveCategory } = useCategory();
  
  // 首页不显示按钮
  if (activeCategory === 'home') return null;
  
  return (
    <HomeButton onClick={() => setActiveCategory('home')} title="返回首页">
      <svg viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </HomeButton>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GlobalStyles />
      <CategoryProvider>
        <DashboardContainer>
          <Header />
          <PageContent />
          <CategorySelector />
          <BackToHomeButton />
        </DashboardContainer>
      </CategoryProvider>
    </ErrorBoundary>
  );
};

export default App;
