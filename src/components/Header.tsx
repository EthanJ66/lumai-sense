import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import { weatherService } from '../services/weatherService';
import { WeatherDisplayData } from '../types/weather';

// --- Animations ---
const breathe = keyframes`
  0% { box-shadow: 0 0 5px ${theme.colors.primary}; opacity: 0.5; width: 40%; }
  50% { box-shadow: 0 0 20px ${theme.colors.primary}, 0 0 10px ${theme.colors.success}; opacity: 1; width: 60%; }
  100% { box-shadow: 0 0 5px ${theme.colors.primary}; opacity: 0.5; width: 40%; }
`;

// --- Styled Components ---
const HeaderContainer = styled.header`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: 0 ${theme.spacing.lg};
  background: linear-gradient(180deg, rgba(11,17,32,1) 0%, rgba(11,17,32,0.8) 100%);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  height: 80px;
  position: relative;
  z-index: 100;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${theme.colors.primary} 50%, transparent 100%);
  }
`;

const LeftSection = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: center;
`;

const LocationIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid ${theme.colors.primary};
  border-radius: 4px;

  .icon {
    font-size: 1.5rem;
  }

  .location-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .location-label {
    font-size: 0.7rem;
    color: ${theme.colors.text.secondary};
    text-transform: uppercase;
  }

  .location-name {
    font-family: ${theme.fonts.main};
    font-size: 1rem;
    font-weight: bold;
    color: ${theme.colors.primary};
    letter-spacing: 1px;
  }
`;

const WeatherItem = styled.div`
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.75rem;
    color: ${theme.colors.text.secondary};
    text-transform: uppercase;
  }
  .value {
    font-family: ${theme.fonts.display};
    font-size: 1.25rem;
    font-weight: bold;
    color: ${theme.colors.text.primary};
  }
`;

const CenterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Title = styled.h1`
  font-family: ${theme.fonts.main};
  font-size: 2.2rem;
  letter-spacing: 4px;
  color: #fff;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(0, 240, 255, 0.5);
  margin-bottom: 8px;
  background: linear-gradient(to bottom, #fff 40%, #00F0FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
`;

const BreathingBar = styled.div`
  height: 2px;
  background: ${theme.colors.primary};
  border-radius: 2px;
  animation: ${breathe} 3s infinite ease-in-out;
`;

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
`;

const CarbonLabel = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.text.secondary};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: ${theme.colors.success};
    border-radius: 50%;
    box-shadow: 0 0 5px ${theme.colors.success};
  }
`;

const FlipCounterContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const FlipCard = styled.div`
  background: #1a2235;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.display};
  font-size: 1.5rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 240, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;

  /* Glossy effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(0,0,0,0.5);
  }
`;

// --- Component ---
const Header: React.FC = () => {
  const [carbonValue, setCarbonValue] = useState(1234567);
  const [weather, setWeather] = useState<WeatherDisplayData>({
    temperature: 2,
    humidity: 65,
    weatherText: '多云',
    weatherIcon: '☁️'
  });
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoadingWeather(true);
        const data = await weatherService.getCurrentWeather();
        setWeather(data);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate carbon sequestration increasing
  useEffect(() => {
    const interval = setInterval(() => {
      setCarbonValue(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Format number to array of digits/characters
  const carbonDigits = carbonValue.toLocaleString().split('');

  return (
    <HeaderContainer>
      <LeftSection>
        <LocationIndicator>
          <span className="icon">📍</span>
          <div className="location-info">
            <span className="location-label">Location</span>
            <span className="location-name">青岛·黄岛区</span>
          </div>
        </LocationIndicator>
        <WeatherItem>
          <span className="label">温度</span>
          <span className="value" style={{ color: theme.colors.warning }}>
            {isLoadingWeather ? '--' : `${weather.temperature}°C`}
          </span>
        </WeatherItem>
        <WeatherItem>
          <span className="label">湿度</span>
          <span className="value" style={{ color: theme.colors.info }}>
            {isLoadingWeather ? '--' : `${weather.humidity}%`}
          </span>
        </WeatherItem>
        <WeatherItem>
           <span className="label">天气</span>
           <span className="value">
             {isLoadingWeather ? '⏳ 加载中' : `${weather.weatherIcon} ${weather.weatherText}`}
           </span>
        </WeatherItem>
      </LeftSection>

      <CenterSection>
        <Title>AIC 路脉智感 · 赤泥储能道路</Title>
        <BreathingBar />
      </CenterSection>

      <RightSection>
        <CarbonLabel>累计固碳量 (Total Carbon Sequestration)</CarbonLabel>
        <FlipCounterContainer>
          {carbonDigits.map((digit, index) => (
            <FlipCard key={index}>{digit}</FlipCard>
          ))}
          <FlipCard style={{ fontSize: '1rem', alignSelf: 'flex-end', border: 'none', background: 'transparent', boxShadow: 'none', color: '#fff' }}>kg</FlipCard>
        </FlipCounterContainer>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
