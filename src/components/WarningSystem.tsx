import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Panel } from './Layout';
import { theme } from '../styles/theme';

// --- Animations ---
const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const flash = keyframes`
  0% { background-color: rgba(255, 255, 255, 0.1); }
  50% { background-color: rgba(255, 255, 255, 0.2); }
  100% { background-color: rgba(255, 255, 255, 0.05); }
`;

const breatheRed = keyframes`
  0% { box-shadow: 0 0 2px ${theme.colors.danger} inset; border-color: ${theme.colors.danger}; }
  50% { box-shadow: 0 0 8px ${theme.colors.danger} inset; border-color: #ff8888; }
  100% { box-shadow: 0 0 2px ${theme.colors.danger} inset; border-color: ${theme.colors.danger}; }
`;

const breatheOrange = keyframes`
  0% { box-shadow: 0 0 2px ${theme.colors.warning} inset; border-color: ${theme.colors.warning}; }
  50% { box-shadow: 0 0 8px ${theme.colors.warning} inset; border-color: #ffcc88; }
  100% { box-shadow: 0 0 2px ${theme.colors.warning} inset; border-color: ${theme.colors.warning}; }
`;

// --- Types ---
interface Warning {
  id: number;
  type: 'crack' | 'freeze';
  message: string;
  time: string;
  isNew?: boolean;
}

// --- Styled Components ---
const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
  
  /* Scrollbar Styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const AlertCard = styled.div<{ type: 'crack' | 'freeze'; isNew?: boolean }>`
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border-left: 4px solid ${props => props.type === 'crack' ? theme.colors.danger : theme.colors.warning};
  border: 1px solid transparent; 
  
  // Enter animation
  animation: ${slideIn} 0.5s ease-out;
  
  // Breathing Effect based on type
  animation: ${slideIn} 0.5s ease-out, 
             ${props => props.isNew ? flash : 'none'} 1s ease-out,
             ${props => props.type === 'crack' ? breatheRed : breatheOrange} 2s infinite alternate;

  margin-bottom: 4px;
  flex-shrink: 0;
`;

const IconWrapper = styled.div<{ type: 'crack' | 'freeze' }>`
  color: ${props => props.type === 'crack' ? theme.colors.danger : theme.colors.warning};
  margin-right: 12px;
  display: flex;
  align-items: center;
  margin-top: 2px;
  
  svg {
    width: 24px;
    height: 24px;
    filter: drop-shadow(0 0 5px currentColor);
  }
`;

const Content = styled.div`
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
`;

const TypeLabel = styled.span<{ type: 'crack' | 'freeze' }>`
  font-weight: bold;
  font-size: 0.9rem;
  color: ${props => props.type === 'crack' ? theme.colors.danger : theme.colors.warning};
  text-transform: uppercase;
`;

const TimeLabel = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.text.secondary};
  font-family: ${theme.fonts.mono};
`;

const Message = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.text.primary};
  line-height: 1.4;
`;

// --- Icons ---
const WarningIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const SnowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
     <path d="M22,11h-2V6h-2v3.6l-2.1-2.1l1.4-1.4L15.9,4.7L12,8.6L8.1,4.7L6.7,6.1l1.4,1.4L6,9.6V6H4v5H2v2h2v5h2v-3.6 l2.1,2.1l-1.4,1.4l1.4,1.4l3.9-3.9l3.9,3.9l1.4-1.4l-1.4-1.4l2.1-2.1V20h2v-5h2V11z M12,14c-1.1,0-2-0.9-2-2s0.9-2,2-2 s2,0.9,2,2S13.1,14,12,14z"/>
  </svg>
);

// --- Component ---
const WarningSystem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const [warnings, setWarnings] = useState<Warning[]>([
    { id: 1, type: 'crack', message: 'K12+200处监测到微裂缝，建议维护', time: '10:42:15' },
    { id: 2, type: 'freeze', message: '3号车道存在结冰风险，已自动提升融雪功率至1.2kW/m²', time: '10:30:00' },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (listRef.current) {
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [warnings]);

  // Simulation logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB');
      const isCrack = Math.random() > 0.5; // 50/50 chance
      
      let newWarning: Warning;

      if (isCrack) {
        const location = `K${10 + Math.floor(Math.random() * 5)}+${Math.floor(Math.random() * 900)}`;
        newWarning = {
            id: Date.now(),
            type: 'crack',
            message: `${location}处监测到内部电阻突变 (可能产生微裂缝)，建议维护`,
            time: timeStr,
            isNew: true
        };
      } else {
        const lane = Math.floor(Math.random() * 4) + 1;
        const temp = (5 + Math.random() * 3).toFixed(1);
        newWarning = {
            id: Date.now(),
            type: 'freeze',
            message: `${lane}号车道环境温度 -${temp}°C，已自动提升融雪功率至 1.2kW/m²`,
            time: timeStr,
            isNew: true
        };
      }

      setWarnings(prev => {
        const next = [...prev, newWarning];
        if (next.length > 50) return next.slice(next.length - 50); // Keep history manageable
        return next;
      });

    }, 4000); // New alert every 4 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <Panel title="智能预警系统" style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <ScrollContainer ref={listRef}>
        {warnings.map(w => (
          <AlertCard key={w.id} type={w.type} isNew={w.isNew}>
            <IconWrapper type={w.type}>
              {w.type === 'crack' ? <WarningIcon /> : <SnowIcon />}
            </IconWrapper>
            <Content>
              <TitleRow>
                <TypeLabel type={w.type}>
                  {w.type === 'crack' ? '[警报]' : '[风险]'}
                </TypeLabel>
                <TimeLabel>{w.time}</TimeLabel>
              </TitleRow>
              <Message>{w.message}</Message>
            </Content>
          </AlertCard>
        ))}
      </ScrollContainer>
    </Panel>
  );
};

export default WarningSystem;
