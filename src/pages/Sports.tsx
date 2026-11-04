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
  50% { transform: scale(1.05); opacity: 0.9; }
`;

const dataFlow = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const energyPulse = keyframes`
  0% { box-shadow: 0 0 5px rgba(0,255,136,0.3), inset 0 0 10px rgba(0,255,136,0.1); }
  50% { box-shadow: 0 0 20px rgba(0,255,136,0.6), inset 0 0 20px rgba(0,255,136,0.2); }
  100% { box-shadow: 0 0 5px rgba(0,255,136,0.3), inset 0 0 10px rgba(0,255,136,0.1); }
`;

// ==================== 容器样式 ====================
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0a1628 0%, #050a12 100%);
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
      linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px),
      linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px);
    background-size: 60px 60px;
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
  background: linear-gradient(180deg, rgba(0,60,40,0.6) 0%, rgba(0,30,20,0.3) 100%);
  border-bottom: 1px solid rgba(0,255,136,0.3);
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff88, #00ffaa, #00ff88, transparent);
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
      border: 2px solid #00ff88;
      border-radius: 50%;
      animation: ${rotate} 8s linear infinite;
      border-top-color: transparent;
      border-right-color: transparent;
    }
    
    .bolt {
      position: absolute;
      inset: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00ff88;
      font-size: 24px;
      animation: ${breathe} 2s infinite;
      text-shadow: 0 0 15px #00ff88;
    }
  }
  
  .title-group {
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 3px;
      text-shadow: 0 0 20px rgba(0,255,136,0.5);
    }
    
    .subtitle {
      font-size: 11px;
      color: #00ff88;
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
    color: #88ccaa;
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
    text-shadow: 0 0 10px rgba(0,255,136,0.5);
  }
  
  .date {
    font-size: 12px;
    color: #88ccaa;
  }
`;

// ==================== 主内容区 ====================
const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 340px 1fr 1fr 300px;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  padding: 15px;
  overflow: hidden;
`;

// ==================== 面板组件 ====================
const Panel = styled.div<{ span?: string; colSpan?: string }>`
  background: linear-gradient(135deg, rgba(0,40,30,0.9) 0%, rgba(0,20,15,0.95) 100%);
  border: 1px solid rgba(0,255,136,0.2);
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
    background: linear-gradient(90deg, transparent, #00ff88, transparent);
  }
`;

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, rgba(0,255,136,0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0,255,136,0.1);
  
  .icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #00ff88;
  }
  
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #00ff88;
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

// ==================== 能源供应卡片 ====================
const EnergyCardsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
`;

const EnergyCard = styled.div<{ type: 'charging' | 'snow' | 'offgrid' | 'storage' }>`
  flex: 1;
  background: ${props => {
    switch(props.type) {
      case 'charging': return 'linear-gradient(135deg, rgba(0,100,200,0.3) 0%, rgba(0,50,100,0.2) 100%)';
      case 'snow': return 'linear-gradient(135deg, rgba(100,200,255,0.3) 0%, rgba(50,100,150,0.2) 100%)';
      case 'offgrid': return 'linear-gradient(135deg, rgba(255,180,0,0.3) 0%, rgba(150,100,0,0.2) 100%)';
      case 'storage': return 'linear-gradient(135deg, rgba(0,255,136,0.3) 0%, rgba(0,150,80,0.2) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.type) {
      case 'charging': return 'rgba(0,150,255,0.5)';
      case 'snow': return 'rgba(100,200,255,0.5)';
      case 'offgrid': return 'rgba(255,180,0,0.5)';
      case 'storage': return 'rgba(0,255,136,0.5)';
    }
  }};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  animation: ${energyPulse} 3s infinite;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 3px;
    background: ${props => {
      switch(props.type) {
        case 'charging': return '#0099ff';
        case 'snow': return '#64c8ff';
        case 'offgrid': return '#ffb400';
        case 'storage': return '#00ff88';
      }
    }};
    border-radius: 2px;
  }
`;

const CardTitle = styled.div`
  font-size: 12px;
  color: #aaddcc;
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

const CardProgress = styled.div<{ percent: number; color: string }>`
  margin-top: auto;
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
    transition: width 0.5s;
  }
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  color: #88aacc;
`;

// ==================== 主组件 ====================
const EnergySupply: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [energyData, setEnergyData] = useState({
    totalGenerate: 1856.5,
    totalConsume: 1234.2,
    netStorage: 622.3,
    efficiency: 92.5,
    charging: { power: 245.6, vehicles: 42, efficiency: 94.2 },
    snow: { power: 128.3, area: 15600, active: true },
    offgrid: { power: 312.8, coverage: 28, uptime: 99.8 },
    storage: { capacity: 5000, current: 3420, rate: 68.4 }
  });

  // 实时更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setEnergyData(prev => ({
        ...prev,
        totalGenerate: 1800 + Math.random() * 100,
        totalConsume: 1200 + Math.random() * 80,
        netStorage: 580 + Math.random() * 80,
        efficiency: 90 + Math.random() * 5,
        charging: { 
          power: 230 + Math.random() * 30, 
          vehicles: Math.floor(38 + Math.random() * 10), 
          efficiency: 92 + Math.random() * 4 
        },
        snow: { power: 120 + Math.random() * 20, area: 15600, active: true },
        offgrid: { power: 300 + Math.random() * 30, coverage: 28, uptime: 99.5 + Math.random() * 0.4 },
        storage: { 
          capacity: 5000, 
          current: 3300 + Math.random() * 300, 
          rate: 66 + Math.random() * 6 
        }
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // 城市能耗分析表格
  const energyAnalysisOption = useMemo(() => ({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,30,20,0.95)', borderColor: '#00ff88' },
    legend: { 
      data: ['产能', '耗能', '净存储'], 
      textStyle: { color: '#88ccaa', fontSize: 10 }, 
      top: 5, right: 10 
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['动态无线充电公路', '自融雪道路', '离网能源供应', '道路储能'],
      axisLine: { lineStyle: { color: '#2a5a4a' } },
      axisLabel: { color: '#88ccaa', fontSize: 10, interval: 0, rotate: 0 },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameTextStyle: { color: '#88ccaa', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2a5a4a' } },
      axisLabel: { color: '#88ccaa', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0,255,136,0.1)' } },
    },
    series: [
      {
        name: '产能',
        type: 'bar',
        data: [520, 180, 680, 450],
        itemStyle: { 
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#00ff88' }, { offset: 1, color: '#00aa55' }]
          },
          borderRadius: [4, 4, 0, 0]
        },
      },
      {
        name: '耗能',
        type: 'bar',
        data: [380, 240, 420, 180],
        itemStyle: { 
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#ff6b6b' }, { offset: 1, color: '#aa4444' }]
          },
          borderRadius: [4, 4, 0, 0]
        },
      },
      {
        name: '净存储',
        type: 'bar',
        data: [140, -60, 260, 270],
        itemStyle: { 
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#00aaff' }, { offset: 1, color: '#0066aa' }]
          },
          borderRadius: [4, 4, 0, 0]
        },
      }
    ],
  }), []);

  // 24小时能源趋势
  const trendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['发电量', '用电量'], textStyle: { color: '#88ccaa', fontSize: 10 }, top: 5, right: 10 },
    grid: { left: 45, right: 15, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: '#2a5a4a' } },
      axisLabel: { color: '#88ccaa', fontSize: 9, interval: 3 },
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      axisLine: { lineStyle: { color: '#2a5a4a' } },
      axisLabel: { color: '#88ccaa', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(0,255,136,0.1)' } },
    },
    series: [
      {
        name: '发电量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 24 }, (_, i) => {
          const base = 60 + Math.sin((i - 6) * Math.PI / 12) * 30;
          return Math.max(20, base + Math.random() * 10);
        }),
        lineStyle: { color: '#00ff88', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(0,255,136,0.4)' }, { offset: 1, color: 'rgba(0,255,136,0)' }]
          }
        },
      },
      {
        name: '用电量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 24 }, (_, i) => {
          const base = 45 + Math.sin((i - 8) * Math.PI / 12) * 20;
          return Math.max(15, base + Math.random() * 8);
        }),
        lineStyle: { color: '#ff6b6b', width: 2 },
      }
    ],
  }), []);

  // 储能状态仪表盘
  const storageGaugeOption = useMemo(() => ({
    series: [{
      type: 'gauge',
      radius: '85%',
      center: ['50%', '55%'],
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLine: {
        lineStyle: {
          width: 20,
          color: [
            [0.3, '#ff4444'],
            [0.6, '#ffaa00'],
            [1, '#00ff88']
          ]
        }
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '60%',
        width: 10,
        offsetCenter: [0, '-10%'],
        itemStyle: { color: '#00ff88' }
      },
      axisTick: { distance: -25, length: 6, lineStyle: { color: '#fff', width: 1 } },
      splitLine: { distance: -30, length: 15, lineStyle: { color: '#fff', width: 2 } },
      axisLabel: { color: '#88ccaa', fontSize: 10, distance: -35 },
      anchor: { show: true, size: 15, itemStyle: { borderColor: '#00ff88', borderWidth: 2 } },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00ff88',
        offsetCenter: [0, '40%'],
        formatter: '{value}%'
      },
      data: [{ value: energyData.storage.rate.toFixed(1), name: '储能率' }]
    }]
  }), [energyData.storage.rate]);

  // 效率雷达图
  const efficiencyRadarOption = useMemo(() => ({
    radar: {
      indicator: [
        { name: '充电效率', max: 100 },
        { name: '融雪效率', max: 100 },
        { name: '离网稳定', max: 100 },
        { name: '储能效率', max: 100 },
        { name: '输配效率', max: 100 },
        { name: '系统可用', max: 100 },
      ],
      center: ['50%', '52%'],
      radius: '60%',
      axisName: { color: '#88ccaa', fontSize: 9 },
      splitArea: { areaStyle: { color: ['rgba(0,255,136,0.02)', 'rgba(0,255,136,0.06)'] } },
      axisLine: { lineStyle: { color: 'rgba(0,255,136,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(0,255,136,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [94.2, 88.5, 96.8, 92.1, 90.5, 99.2],
        name: '当前效率',
        lineStyle: { color: '#00ff88', width: 2 },
        areaStyle: { color: 'rgba(0,255,136,0.35)' },
        itemStyle: { color: '#00ff88' },
      }]
    }],
  }), []);

  return (
    <PageContainer>
      <Header>
        <Logo>
          <div className="icon-wrapper">
            <div className="bolt">&#9889;</div>
          </div>
          <div className="title-group">
            <h1>城市能源供应监测系统</h1>
            <div className="subtitle">URBAN ENERGY SUPPLY MONITORING SYSTEM</div>
          </div>
        </Logo>
        
        <HeaderStats>
          <StatItem color="#00ff88">
            <div className="value">{energyData.totalGenerate.toFixed(1)}<span className="unit">kWh</span></div>
            <div className="label">总发电量</div>
          </StatItem>
          <StatItem color="#ff6b6b">
            <div className="value">{energyData.totalConsume.toFixed(1)}<span className="unit">kWh</span></div>
            <div className="label">总用电量</div>
          </StatItem>
          <StatItem color="#00aaff">
            <div className="value">{energyData.netStorage.toFixed(1)}<span className="unit">kWh</span></div>
            <div className="label">净存储</div>
          </StatItem>
          <StatItem color="#ffaa00">
            <div className="value">{energyData.efficiency.toFixed(1)}<span className="unit">%</span></div>
            <div className="label">系统效率</div>
          </StatItem>
        </HeaderStats>
        
        <TimeDisplay>
          <div className="time">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
          <div className="date">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</div>
        </TimeDisplay>
      </Header>

      <MainContent>
        {/* 左侧能源供应卡片 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51C12.96 17.55 11 21 11 21z"/></svg>
            <span className="title">能源供应模块</span>
            <div className="status"><div className="dot" /> 全部在线</div>
          </PanelHeader>
          <PanelBody>
            <EnergyCardsGrid>
              <EnergyCard type="charging">
                <CardTitle>
                  <svg className="icon" fill="#0099ff" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-4h2v2h-2zm0-2h2V7h-2z"/></svg>
                  动态无线充电公路
                </CardTitle>
                <CardValue color="#0099ff">{energyData.charging.power.toFixed(1)}<span className="unit"> kW</span></CardValue>
                <CardProgress percent={energyData.charging.efficiency} color="#0099ff" />
                <CardMeta>
                  <span>在充车辆: {energyData.charging.vehicles}辆</span>
                  <span>效率: {energyData.charging.efficiency.toFixed(1)}%</span>
                </CardMeta>
              </EnergyCard>
              
              <EnergyCard type="snow">
                <CardTitle>
                  <svg className="icon" fill="#64c8ff" viewBox="0 0 24 24"><path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22z"/></svg>
                  自融雪道路
                </CardTitle>
                <CardValue color="#64c8ff">{energyData.snow.power.toFixed(1)}<span className="unit"> kW</span></CardValue>
                <CardProgress percent={75} color="#64c8ff" />
                <CardMeta>
                  <span>覆盖面积: {energyData.snow.area.toLocaleString()}m2</span>
                  <span>状态: {energyData.snow.active ? '运行中' : '待机'}</span>
                </CardMeta>
              </EnergyCard>
              
              <EnergyCard type="offgrid">
                <CardTitle>
                  <svg className="icon" fill="#ffb400" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.84L18.16 11H17v6H7v-6H5.84L12 5.84zM11 13h2v4h-2z"/></svg>
                  离网能源供应
                </CardTitle>
                <CardValue color="#ffb400">{energyData.offgrid.power.toFixed(1)}<span className="unit"> kW</span></CardValue>
                <CardProgress percent={energyData.offgrid.uptime} color="#ffb400" />
                <CardMeta>
                  <span>覆盖站点: {energyData.offgrid.coverage}个</span>
                  <span>在线率: {energyData.offgrid.uptime.toFixed(1)}%</span>
                </CardMeta>
              </EnergyCard>
              
              <EnergyCard type="storage">
                <CardTitle>
                  <svg className="icon" fill="#00ff88" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/></svg>
                  道路储能
                </CardTitle>
                <CardValue color="#00ff88">{energyData.storage.current.toFixed(0)}<span className="unit"> / {energyData.storage.capacity} kWh</span></CardValue>
                <CardProgress percent={energyData.storage.rate} color="#00ff88" />
                <CardMeta>
                  <span>容量: {energyData.storage.capacity} kWh</span>
                  <span>储能率: {energyData.storage.rate.toFixed(1)}%</span>
                </CardMeta>
              </EnergyCard>
            </EnergyCardsGrid>
          </PanelBody>
        </Panel>

        {/* 城市能耗分析 */}
        <Panel colSpan="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
            <span className="title">能源供应分析</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={energyAnalysisOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 储能状态 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
            <span className="title">储能状态</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={storageGaugeOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 能源趋势 */}
        <Panel colSpan="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
            <span className="title">24小时能源趋势</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={trendOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 效率雷达 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="title">系统效率评估</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={efficiencyRadarOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>
      </MainContent>
    </PageContainer>
  );
};

export default EnergySupply;
