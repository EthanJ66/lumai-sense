import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700&family=JetBrains+Mono:wght@400&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${theme.colors.background};
    /* Sci-fi grid background */
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px),
      radial-gradient(circle at 50% 50%, #0a1020 0%, #050b14 100%);
    background-size: 50px 50px, 50px 50px, 100% 100%;
    
    color: ${theme.colors.text.primary};
    font-family: ${theme.fonts.main};
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    font-size: 16px;
  }


  #root {
    width: 100%;
    height: 100%;
  }

  /* Scrollbar customization */
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary};
    border-radius: 2px;
  }
`;