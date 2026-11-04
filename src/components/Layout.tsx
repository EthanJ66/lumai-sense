import styled from 'styled-components';
import { theme } from '../styles/theme';

export const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(400px, 2fr) minmax(280px, 1fr);
  grid-template-rows: 80px minmax(0, 1fr) auto;
  width: 100vw;
  height: 100vh;
  padding: ${theme.spacing.md};
  gap: ${theme.spacing.md};
  background: radial-gradient(circle at center, #1a1c4b 0%, #0a0b1e 100%);
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
`;

export const HeaderArea = styled.header`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${theme.spacing.xl};
  background: ${theme.colors.panel.background};
  border-bottom: 2px solid ${theme.colors.primary};
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.2);
  min-height: 0;
  
  h1 {
    font-size: 2rem;
    text-transform: uppercase;
    letter-spacing: 4px;
    background: linear-gradient(90deg, #fff, #00f2ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
  }
`;

export const Panel = styled.div<{ title?: string }>`
  background: ${theme.colors.panel.background};
  border: 1px solid ${theme.colors.panel.border};
  border-radius: ${theme.borderRadius};
  padding: ${theme.spacing.md};
  box-shadow: ${theme.shadows.card};
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);

  /* Hover effect for interactivity hint */
  &:hover {
    border-color: ${theme.colors.panel.activeBorder};
    box-shadow: ${theme.shadows.glow};
  }

  /* Header Line with Title */
  &::before {
    content: '${props => props.title || ''}';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 32px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    background: linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, transparent 80%);
    border-bottom: 1px solid ${theme.colors.panel.border};
    font-family: ${theme.fonts.display};
    font-size: 0.9rem;
    letter-spacing: 1px;
    color: ${theme.colors.text.accent};
    text-transform: uppercase;
    z-index: 2;
    pointer-events: none;
  }

  /* Cyber Corners */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    
    /* Top Left Corner */
    background: 
      linear-gradient(to right, ${theme.colors.primary} 2px, transparent 2px) 0 0,
      linear-gradient(to bottom, ${theme.colors.primary} 2px, transparent 2px) 0 0,
      
    /* Top Right Corner */
      linear-gradient(to left, ${theme.colors.primary} 2px, transparent 2px) 100% 0,
      linear-gradient(to bottom, ${theme.colors.primary} 2px, transparent 2px) 100% 0,
      
    /* Bottom Left Corner */
      linear-gradient(to right, ${theme.colors.primary} 2px, transparent 2px) 0 100%,
      linear-gradient(to top, ${theme.colors.primary} 2px, transparent 2px) 0 100%,
      
    /* Bottom Right Corner */
      linear-gradient(to left, ${theme.colors.primary} 2px, transparent 2px) 100% 100%,
      linear-gradient(to top, ${theme.colors.primary} 2px, transparent 2px) 100% 100%;

    background-repeat: no-repeat;
    background-size: 10px 10px;
  }
  
  padding-top: 40px; /* Space for title */
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  height: 100%;
  min-height: 0;
  overflow: hidden;

  & > * {
    min-height: 0;
  }
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  height: 100%;
  min-height: 0;
  overflow: hidden;

  & > * {
    flex: 1;
    min-height: 0;
  }
`;

export const CenterColumn = styled.div`
  position: relative;
  overflow: hidden;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  
  & > * {
    flex: 1;
    min-height: 0;
  }
`;
