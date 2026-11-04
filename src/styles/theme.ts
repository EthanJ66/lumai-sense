export const theme = {
  colors: {
    background: '#050B14', // Deeper black-blue
    primary: '#00F0FF',    // Cyber Cyan
    secondary: '#7000FF',  // Electric Purple
    success: '#39FF14',    // Neon Green
    info: '#00F0FF',       // Cyan
    warning: '#FFD700',    // Gold/Amber
    danger: '#FF003C',     // Cyber Red
    text: {
      primary: '#E0E6ED',
      secondary: '#94A3B8',
      accent: '#00F0FF',
    },
    panel: {
      background: 'rgba(10, 16, 30, 0.75)',
      border: 'rgba(0, 240, 255, 0.4)',
      activeBorder: 'rgba(0, 240, 255, 0.8)',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  fonts: {
    main: '"Rajdhani", "Roboto", sans-serif', // Rajdhani is great for sci-fi if available, else Roboto
    mono: '"JetBrains Mono", "Courier New", monospace',
    display: '"Orbitron", sans-serif',
  },
  borderRadius: '2px', // Sharper corners for sci-fi look
  shadows: {
    glow: '0 0 10px rgba(0, 240, 255, 0.3), inset 0 0 5px rgba(0, 240, 255, 0.1)',
    card: '0 4px 6px rgba(0, 0, 0, 0.3)',
  }
};