import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactECharts from 'echarts-for-react';

// ==================== 动画定义 ====================
const breathe = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const dataFlow = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const wave = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// ==================== 容器样式 ====================
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0a1525 0%, #050a12 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(90deg, rgba(138,43,226,0.02) 1px, transparent 1px),
      linear-gradient(rgba(138,43,226,0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
  }
`;

// ==================== 顶部标题栏 ====================
const Header = styled.div`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  background: linear-gradient(180deg, rgba(80,40,120,0.5) 0%, rgba(40,20,60,0.3) 100%);
  border-bottom: 1px solid rgba(138,43,226,0.4);
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #8a2be2, #da70d6, #8a2be2, transparent);
    animation: ${dataFlow} 3s linear infinite;
    background-size: 200% 100%;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon-wrapper {
    width: 50px;
    height: 50px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #8a2be2;
      border-radius: 12px;
      animation: ${rotate} 10s linear infinite;
      border-top-color: transparent;
      border-right-color: transparent;
    }
    
    .home {
      position: absolute;
      inset: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #da70d6;
      font-size: 22px;
      animation: ${breathe} 2s infinite;
    }
  }
  
  .title-group {
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 3px;
      text-shadow: 0 0 20px rgba(138,43,226,0.5);
    }
    
    .subtitle {
      font-size: 11px;
      color: #da70d6;
      letter-spacing: 2px;
      margin-top: 2px;
    }
  }
`;

const HeaderStats = styled.div`
  display: flex;
  gap: 50px;
`;

const StatItem = styled.div<{ color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    width: 80px;
    height: 3px;
    background: ${props => props.color};
    border-radius: 2px;
    box-shadow: 0 0 10px ${props => props.color};
  }
  
  .value {
    font-size: 28px;
    font-weight: bold;
    color: ${props => props.color};
    text-shadow: 0 0 15px ${props => props.color};
    font-family: 'Courier New', monospace;
    
    .unit {
      font-size: 12px;
      opacity: 0.8;
      margin-left: 3px;
    }
  }
  
  .label {
    font-size: 11px;
    color: #b088cc;
    margin-top: 2px;
  }
`;

const TimeDisplay = styled.div`
  text-align: right;
  
  .time {
    font-size: 28px;
    font-weight: bold;
    color: #fff;
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 10px rgba(138,43,226,0.5);
  }
  
  .date {
    font-size: 12px;
    color: #b088cc;
  }
`;

// ==================== 主内容区 ====================
const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr 1fr 300px;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  padding: 15px;
  overflow: hidden;
`;

// ==================== 面板组件 ====================
const Panel = styled.div<{ span?: string; colSpan?: string }>`
  background: linear-gradient(135deg, rgba(50,25,75,0.8) 0%, rgba(25,12,38,0.9) 100%);
  border: 1px solid rgba(138,43,226,0.3);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.5s ease-out;
  
  ${props => props.span && css`grid-row: ${props.span};`}
  ${props => props.colSpan && css`grid-column: ${props.colSpan};`}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #8a2be2, transparent);
  }
`;

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, rgba(138,43,226,0.15) 0%, transparent 100%);
  border-bottom: 1px solid rgba(138,43,226,0.15);
  
  .icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #da70d6;
  }
  
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #da70d6;
    letter-spacing: 1px;
  }
  
  .status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #00ff88;
    
    .dot {
      width: 6px;
      height: 6px;
      background: #00ff88;
      border-radius: 50%;
      animation: ${pulse} 1.5s infinite;
    }
  }
`;

const PanelBody = styled.div`
  flex: 1;
  padding: 10px;
  overflow: hidden;
`;

// ==================== 服务卡片 ====================
const ServiceCardsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
`;

const ServiceCard = styled.div<{ type: 'home' | 'ev' | 'community' | 'app' }>`
  flex: 1;
  background: ${props => {
    switch(props.type) {
      case 'home': return 'linear-gradient(135deg, rgba(138,43,226,0.4) 0%, rgba(69,22,113,0.3) 100%)';
      case 'ev': return 'linear-gradient(135deg, rgba(0,200,150,0.4) 0%, rgba(0,100,75,0.3) 100%)';
      case 'community': return 'linear-gradient(135deg, rgba(255,140,0,0.4) 0%, rgba(150,80,0,0.3) 100%)';
      case 'app': return 'linear-gradient(135deg, rgba(30,144,255,0.4) 0%, rgba(15,72,128,0.3) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.type) {
      case 'home': return 'rgba(138,43,226,0.5)';
      case 'ev': return 'rgba(0,200,150,0.5)';
      case 'community': return 'rgba(255,140,0,0.5)';
      case 'app': return 'rgba(30,144,255,0.5)';
    }
  }};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 3px;
    background: ${props => {
      switch(props.type) {
        case 'home': return '#8a2be2';
        case 'ev': return '#00c896';
        case 'community': return '#ff8c00';
        case 'app': return '#1e90ff';
      }
    }};
    border-radius: 2px;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: ${wave} 3s infinite;
  }
`;

const CardTitle = styled.div`
  font-size: 12px;
  color: #ccaaee;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .icon {
    width: 16px;
    height: 16px;
  }
`;

const CardValue = styled.div<{ color: string }>`
  font-size: 22px;
  font-weight: bold;
  color: ${props => props.color};
  text-shadow: 0 0 10px ${props => props.color};
  font-family: 'Courier New', monospace;
  
  .unit {
    font-size: 11px;
    opacity: 0.8;
  }
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  font-size: 10px;
  color: #aa88cc;
`;

const CardProgress = styled.div<{ percent: number; color: string }>`
  margin-top: 8px;
  height: 4px;
  background: rgba(0,0,0,0.3);
  border-radius: 2px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.percent}%;
    height: 100%;
    background: ${props => props.color};
    box-shadow: 0 0 10px ${props => props.color};
  }
`;

// ==================== 设备状态网格 ====================
const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  height: 100%;
`;

const DeviceItem = styled.div<{ active: boolean; type: string }>`
  background: ${props => props.active ? 
    'linear-gradient(135deg, rgba(0,255,136,0.2) 0%, rgba(0,100,50,0.15) 100%)' :
    'linear-gradient(135deg, rgba(100,100,100,0.2) 0%, rgba(50,50,50,0.15) 100%)'
  };
  border: 1px solid ${props => props.active ? 'rgba(0,255,136,0.4)' : 'rgba(100,100,100,0.3)'};
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px ${props => props.active ? 'rgba(0,255,136,0.4)' : 'rgba(100,100,100,0.3)'};
  }
  
  .icon {
    font-size: 20px;
    margin-bottom: 4px;
    filter: ${props => props.active ? 'drop-shadow(0 0 5px #00ff88)' : 'grayscale(1)'};
  }
  
  .name {
    font-size: 9px;
    color: ${props => props.active ? '#00ff88' : '#888'};
    text-align: center;
  }
  
  .status {
    font-size: 8px;
    color: ${props => props.active ? '#00ff88' : '#666'};
    margin-top: 2px;
  }
`;

// ==================== 主组件 ====================
const DigitalLife: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    users: 32580,
    devices: 156420,
    energy: 2856.5,
    satisfaction: 98.2,
    smartHome: { count: 8520, online: 8456, saving: 32.5 },
    evStations: { count: 145, charging: 89, power: 1256.8 },
    community: { count: 68, members: 15600, events: 234 },
    app: { downloads: 125000, active: 45600, rating: 4.8 }
  });

  const [devices] = useState([
    { icon: '💡', name: '智能灯', active: true },
    { icon: '❄️', name: '空调', active: true },
    { icon: '📺', name: '电视', active: false },
    { icon: '🔌', name: '插座', active: true },
    { icon: '🚪', name: '门锁', active: true },
    { icon: '📷', name: '摄像头', active: true },
    { icon: '🌡️', name: '温控器', active: true },
    { icon: '🔔', name: '门铃', active: false },
    { icon: '🎵', name: '音箱', active: true },
    { icon: '🧹', name: '扫地机', active: false },
    { icon: '💧', name: '净水器', active: true },
    { icon: '🛡️', name: '报警器', active: true },
  ]);

  // 实时更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setStats(prev => ({
        ...prev,
        users: prev.users + Math.floor(Math.random() * 3),
        devices: prev.devices + Math.floor(Math.random() * 10),
        energy: 2800 + Math.random() * 100,
        smartHome: { ...prev.smartHome, online: 8400 + Math.floor(Math.random() * 100), saving: 30 + Math.random() * 5 },
        evStations: { ...prev.evStations, charging: 80 + Math.floor(Math.random() * 20), power: 1200 + Math.random() * 100 },
        app: { ...prev.app, active: 45000 + Math.floor(Math.random() * 1000) }
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 智能家居分布
  const homeDistOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#b088cc', fontSize: 10 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#1a0d25', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 3200, name: '照明系统', itemStyle: { color: '#8a2be2' } },
        { value: 2100, name: '空调系统', itemStyle: { color: '#da70d6' } },
        { value: 1800, name: '安防系统', itemStyle: { color: '#9370db' } },
        { value: 1420, name: '娱乐系统', itemStyle: { color: '#ba55d3' } },
      ]
    }]
  }), []);

  // EV充电趋势
  const evTrendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['充电量', '充电次数'], textStyle: { color: '#b088cc', fontSize: 10 }, top: 5, right: 10 },
    grid: { left: 45, right: 40, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: '#3a2a4a' } },
      axisLabel: { color: '#b088cc', fontSize: 9, interval: 3 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { color: '#b088cc', fontSize: 10 },
        axisLine: { lineStyle: { color: '#3a2a4a' } },
        axisLabel: { color: '#b088cc', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(138,43,226,0.1)' } },
      },
      {
        type: 'value',
        name: '次数',
        nameTextStyle: { color: '#b088cc', fontSize: 10 },
        axisLine: { lineStyle: { color: '#3a2a4a' } },
        axisLabel: { color: '#b088cc', fontSize: 9 },
      }
    ],
    series: [
      {
        name: '充电量',
        type: 'bar',
        data: Array.from({ length: 24 }, (_, i) => {
          const peak = Math.exp(-Math.pow(i - 10, 2) / 20) * 80 + Math.exp(-Math.pow(i - 19, 2) / 15) * 100;
          return Math.max(20, peak + Math.random() * 15);
        }),
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#00c896' }, { offset: 1, color: '#006448' }] }, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: '充电次数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 24 }, (_, i) => {
          const peak = Math.exp(-Math.pow(i - 10, 2) / 25) * 30 + Math.exp(-Math.pow(i - 19, 2) / 20) * 40;
          return Math.max(5, peak + Math.random() * 5);
        }),
        lineStyle: { color: '#ff8c00', width: 2 },
      }
    ],
  }), []);

  // 用户增长
  const userGrowthOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 25, bottom: 25 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#3a2a4a' } },
      axisLabel: { color: '#b088cc', fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#3a2a4a' } },
      axisLabel: { color: '#b088cc', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(138,43,226,0.1)' } },
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: [12000, 15000, 18500, 21000, 24000, 26500, 28000, 29500, 30800, 31500, 32000, 32580],
      lineStyle: { color: '#8a2be2', width: 3 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(138,43,226,0.5)' }, { offset: 1, color: 'rgba(138,43,226,0)' }]
        }
      },
      itemStyle: { color: '#da70d6', borderWidth: 2, borderColor: '#fff' },
    }],
  }), []);

  // 满意度雷达
  const satisfactionOption = useMemo(() => ({
    radar: {
      indicator: [
        { name: '响应速度', max: 100 },
        { name: '稳定性', max: 100 },
        { name: '易用性', max: 100 },
        { name: '功能性', max: 100 },
        { name: '安全性', max: 100 },
        { name: '性价比', max: 100 },
      ],
      center: ['50%', '52%'],
      radius: '62%',
      axisName: { color: '#b088cc', fontSize: 9 },
      splitArea: { areaStyle: { color: ['rgba(138,43,226,0.02)', 'rgba(138,43,226,0.06)'] } },
      axisLine: { lineStyle: { color: 'rgba(138,43,226,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(138,43,226,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [96, 98, 94, 92, 99, 88],
        lineStyle: { color: '#da70d6', width: 2 },
        areaStyle: { color: 'rgba(218,112,214,0.35)' },
        itemStyle: { color: '#da70d6' },
      }]
    }],
  }), []);

  return (
    <PageContainer>
      <Header>
        <Logo>
          <div className="icon-wrapper">
            <div className="home">&#127968;</div>
          </div>
          <div className="title-group">
            <h1>数字生活服务平台</h1>
            <div className="subtitle">DIGITAL LIFE SERVICE PLATFORM</div>
          </div>
        </Logo>
        
        <HeaderStats>
          <StatItem color="#da70d6">
            <div className="value">{stats.users.toLocaleString()}<span className="unit">户</span></div>
            <div className="label">服务用户</div>
          </StatItem>
          <StatItem color="#00c896">
            <div className="value">{stats.devices.toLocaleString()}<span className="unit">台</span></div>
            <div className="label">接入设备</div>
          </StatItem>
          <StatItem color="#ff8c00">
            <div className="value">{stats.energy.toFixed(0)}<span className="unit">MWh</span></div>
            <div className="label">月供电量</div>
          </StatItem>
          <StatItem color="#1e90ff">
            <div className="value">{stats.satisfaction.toFixed(1)}<span className="unit">%</span></div>
            <div className="label">用户满意度</div>
          </StatItem>
        </HeaderStats>
        
        <TimeDisplay>
          <div className="time">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
          <div className="date">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</div>
        </TimeDisplay>
      </Header>

      <MainContent>
        {/* 服务模块卡片 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="title">数字生活服务</span>
            <div className="status"><div className="dot" /> 运行正常</div>
          </PanelHeader>
          <PanelBody>
            <ServiceCardsGrid>
              <ServiceCard type="home">
                <CardTitle>
                  <svg className="icon" fill="#8a2be2" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  智能家居服务
                </CardTitle>
                <CardValue color="#8a2be2">{stats.smartHome.count.toLocaleString()}<span className="unit"> 户</span></CardValue>
                <CardProgress percent={(stats.smartHome.online / stats.smartHome.count) * 100} color="#8a2be2" />
                <CardMeta>
                  <span>在线: {stats.smartHome.online}</span>
                  <span>节能: {stats.smartHome.saving.toFixed(1)}%</span>
                </CardMeta>
              </ServiceCard>
              
              <ServiceCard type="ev">
                <CardTitle>
                  <svg className="icon" fill="#00c896" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                  EV充电网络
                </CardTitle>
                <CardValue color="#00c896">{stats.evStations.count}<span className="unit"> 站</span></CardValue>
                <CardProgress percent={(stats.evStations.charging / stats.evStations.count) * 100} color="#00c896" />
                <CardMeta>
                  <span>充电中: {stats.evStations.charging}辆</span>
                  <span>功率: {stats.evStations.power.toFixed(0)}kW</span>
                </CardMeta>
              </ServiceCard>
              
              <ServiceCard type="community">
                <CardTitle>
                  <svg className="icon" fill="#ff8c00" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  社区服务
                </CardTitle>
                <CardValue color="#ff8c00">{stats.community.count}<span className="unit"> 个社区</span></CardValue>
                <CardProgress percent={85} color="#ff8c00" />
                <CardMeta>
                  <span>居民: {stats.community.members.toLocaleString()}</span>
                  <span>活动: {stats.community.events}场</span>
                </CardMeta>
              </ServiceCard>
              
              <ServiceCard type="app">
                <CardTitle>
                  <svg className="icon" fill="#1e90ff" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                  移动应用
                </CardTitle>
                <CardValue color="#1e90ff">{(stats.app.downloads / 1000).toFixed(0)}K<span className="unit"> 下载</span></CardValue>
                <CardProgress percent={(stats.app.active / stats.app.downloads) * 100} color="#1e90ff" />
                <CardMeta>
                  <span>活跃: {stats.app.active.toLocaleString()}</span>
                  <span>评分: {stats.app.rating}&#9733;</span>
                </CardMeta>
              </ServiceCard>
            </ServiceCardsGrid>
          </PanelBody>
        </Panel>

        {/* 智能设备分布 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.84L18.16 11H17v6H7v-6H5.84L12 4.84zM11 13h2v4h-2z"/></svg>
            <span className="title">智能家居分布</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={homeDistOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 设备状态 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
            <span className="title">设备实时状态</span>
          </PanelHeader>
          <PanelBody>
            <DeviceGrid>
              {devices.map((device, i) => (
                <DeviceItem key={i} active={device.active} type={device.name}>
                  <div className="icon">{device.icon}</div>
                  <div className="name">{device.name}</div>
                  <div className="status">{device.active ? '在线' : '离线'}</div>
                </DeviceItem>
              ))}
            </DeviceGrid>
          </PanelBody>
        </Panel>

        {/* 用户满意度 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="title">用户满意度</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={satisfactionOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* EV充电趋势 */}
        <Panel colSpan="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/></svg>
            <span className="title">EV充电24小时趋势</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={evTrendOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 用户增长 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
            <span className="title">用户增长趋势</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={userGrowthOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>
      </MainContent>
    </PageContainer>
  );
};

export default DigitalLife;
