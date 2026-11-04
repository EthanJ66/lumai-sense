import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactECharts from 'echarts-for-react';

// ==================== 动画定义 ====================
const breathe = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

const scanLine = keyframes`
  0% { top: 0%; }
  100% { top: 100%; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const dataFlow = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ==================== 全局容器 ====================
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0d2137 0%, #060d1a 100%);
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
      linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px),
      linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px);
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
  background: linear-gradient(180deg, rgba(0,40,80,0.8) 0%, rgba(0,20,40,0.4) 100%);
  border-bottom: 1px solid rgba(0,255,255,0.3);
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ffff, #00ff88, #00ffff, transparent);
    animation: ${dataFlow} 3s linear infinite;
    background-size: 200% 100%;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon-wrapper {
    width: 48px;
    height: 48px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #00ffff;
      border-radius: 50%;
      animation: ${rotate} 10s linear infinite;
      border-top-color: transparent;
      border-right-color: transparent;
    }
    
    &::after {
      content: '';
      position: absolute;
      inset: 4px;
      border: 2px solid #00ff88;
      border-radius: 50%;
      animation: ${rotate} 8s linear infinite reverse;
      border-bottom-color: transparent;
      border-left-color: transparent;
    }
    
    .core {
      position: absolute;
      inset: 10px;
      background: radial-gradient(circle, #00ffff 0%, transparent 70%);
      border-radius: 50%;
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
      text-shadow: 0 0 20px rgba(0,255,255,0.5);
    }
    
    .subtitle {
      font-size: 11px;
      color: #00ffff;
      letter-spacing: 2px;
      margin-top: 2px;
    }
  }
`;

const TimeDisplay = styled.div`
  text-align: right;
  
  .time {
    font-size: 28px;
    font-weight: bold;
    color: #fff;
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 10px rgba(0,255,255,0.5);
  }
  
  .date {
    font-size: 12px;
    color: #88aacc;
  }
`;

const MetricsBar = styled.div`
  display: flex;
  gap: 40px;
`;

const MetricItem = styled.div<{ color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    width: 60px;
    height: 3px;
    background: ${props => props.color};
    border-radius: 2px;
    box-shadow: 0 0 10px ${props => props.color};
  }
  
  .value {
    font-size: 26px;
    font-weight: bold;
    color: ${props => props.color};
    text-shadow: 0 0 15px ${props => props.color};
    font-family: 'Courier New', monospace;
    
    .unit {
      font-size: 12px;
      opacity: 0.8;
      margin-left: 2px;
    }
  }
  
  .label {
    font-size: 11px;
    color: #88aacc;
    margin-top: 2px;
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
const Panel = styled.div<{ span?: string }>`
  background: linear-gradient(135deg, rgba(0,30,60,0.9) 0%, rgba(0,15,30,0.95) 100%);
  border: 1px solid rgba(0,255,255,0.2);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.5s ease-out;
  
  ${props => props.span && css`grid-row: ${props.span};`}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00ffff, transparent);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,255,255,0.3), transparent);
  }
`;

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, rgba(0,255,255,0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0,255,255,0.1);
  
  .icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #00ffff;
  }
  
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #00ffff;
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

// ==================== 3D传感器网格 ====================
const SensorGridWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Grid3DContainer = styled.div`
  flex: 1;
  perspective: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Grid3D = styled.div`
  width: 90%;
  height: 80%;
  transform: rotateX(50deg) rotateZ(-5deg);
  transform-style: preserve-3d;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
  background: rgba(0,50,100,0.2);
  border: 1px solid rgba(0,255,255,0.3);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 
    0 30px 60px rgba(0,0,0,0.5),
    inset 0 0 30px rgba(0,255,255,0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ffff, transparent);
    animation: ${scanLine} 2s linear infinite;
    filter: blur(1px);
    z-index: 100;
  }
`;

const SensorCell = styled.div<{ type: string; value: number }>`
  border-radius: 2px;
  position: relative;
  transition: all 0.3s;
  
  background: ${props => {
    if (props.type === 'empty') return 'rgba(30,50,80,0.3)';
    const v = props.value;
    if (props.type === 'piezo') return `rgba(0,${150 + v * 105},${200 + v * 55},${0.4 + v * 0.4})`;
    if (props.type === 'thermal') return `rgba(${200 + v * 55},${80 - v * 40},${80 - v * 40},${0.4 + v * 0.4})`;
    if (props.type === 'strain') return `rgba(${200 + v * 55},${180 + v * 75},0,${0.4 + v * 0.4})`;
    return 'rgba(30,50,80,0.3)';
  }};
  
  border: 1px solid ${props => {
    if (props.type === 'piezo') return 'rgba(0,255,255,0.6)';
    if (props.type === 'thermal') return 'rgba(255,100,100,0.6)';
    if (props.type === 'strain') return 'rgba(255,200,0,0.6)';
    return 'rgba(100,150,200,0.2)';
  }};
  
  ${props => props.type !== 'empty' && css`
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      transform: translate(-50%, -50%);
      background: ${props.type === 'piezo' ? '#00ffff' : props.type === 'thermal' ? '#ff6464' : '#ffc800'};
      border-radius: 50%;
      box-shadow: 0 0 6px currentColor;
    }
  `}
  
  &:hover {
    transform: translateZ(8px) scale(1.3);
    z-index: 10;
    box-shadow: 0 5px 15px rgba(0,255,255,0.4);
  }
`;

const GridLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 25px;
  padding: 10px;
  
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #aaccee;
    
    .indicator {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        inset: 3px;
        background: inherit;
        border-radius: 50%;
        filter: brightness(1.5);
      }
    }
  }
`;

// ==================== 诊断卡片 ====================
const DiagnosticsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0,255,255,0.3);
    border-radius: 2px;
  }
`;

const DiagCard = styled.div<{ status: 'good' | 'warn' | 'bad' }>`
  background: ${props => 
    props.status === 'good' ? 'linear-gradient(135deg, rgba(0,60,40,0.6) 0%, rgba(0,30,20,0.6) 100%)' :
    props.status === 'warn' ? 'linear-gradient(135deg, rgba(60,50,0,0.6) 0%, rgba(30,25,0,0.6) 100%)' :
    'linear-gradient(135deg, rgba(60,20,20,0.6) 0%, rgba(30,10,10,0.6) 100%)'
  };
  border: 1px solid ${props =>
    props.status === 'good' ? 'rgba(0,255,136,0.4)' :
    props.status === 'warn' ? 'rgba(255,200,0,0.4)' :
    'rgba(255,80,80,0.4)'
  };
  border-radius: 8px;
  padding: 12px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 3px;
    background: ${props =>
      props.status === 'good' ? '#00ff88' :
      props.status === 'warn' ? '#ffc800' :
      '#ff5050'
    };
    border-radius: 2px;
    box-shadow: 0 0 10px ${props =>
      props.status === 'good' ? '#00ff88' :
      props.status === 'warn' ? '#ffc800' :
      '#ff5050'
    };
  }
`;

const DiagHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  .name {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }
  
  .badge {
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
  }
`;

const DiagContent = styled.div`
  font-size: 11px;
  color: #aaccee;
  line-height: 1.5;
  margin-bottom: 8px;
`;

const DiagMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const DiagMetric = styled.div<{ color: string }>`
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
  padding: 6px;
  text-align: center;
  
  .value {
    font-size: 16px;
    font-weight: bold;
    color: ${props => props.color};
  }
  
  .label {
    font-size: 9px;
    color: #88aacc;
    margin-top: 2px;
  }
`;

// ==================== 主组件 ====================
const RoadInspection: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState({
    temp: 28.5,
    pressure: 1.35,
    vibration: 42,
    strength: 45.2,
  });
  const [sensorData, setSensorData] = useState<{ type: string; value: number }[][]>([]);

  // 初始化传感器
  useEffect(() => {
    const grid: { type: string; value: number }[][] = [];
    for (let i = 0; i < 8; i++) {
      const row: { type: string; value: number }[] = [];
      for (let j = 0; j < 12; j++) {
        let type = 'empty';
        if ((i + j) % 3 === 0) type = 'piezo';
        else if ((i * 2 + j) % 5 === 0) type = 'thermal';
        else if ((i + j * 2) % 7 === 0) type = 'strain';
        row.push({ type, value: Math.random() });
      }
      grid.push(row);
    }
    setSensorData(grid);
  }, []);

  // 实时更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setMetrics({
        temp: 25 + Math.random() * 10,
        pressure: 1.0 + Math.random() * 0.8,
        vibration: 35 + Math.random() * 20,
        strength: 40 + Math.random() * 15,
      });
      setSensorData(prev => prev.map(row =>
        row.map(cell => ({ ...cell, value: cell.type !== 'empty' ? Math.random() : 0 }))
      ));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // 振动频谱图
  const vibrationOption = useMemo(() => ({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,20,40,0.9)', borderColor: '#00ffff' },
    grid: { left: 45, right: 15, top: 30, bottom: 25 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 60 }, (_, i) => `${100 + i * 8}`),
      name: '频率(kHz)',
      nameTextStyle: { color: '#88aacc', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#88aacc', fontSize: 9, interval: 9 },
    },
    yAxis: {
      type: 'value',
      name: '阻抗(Ω)',
      min: 0,
      max: 0.15,
      nameTextStyle: { color: '#88aacc', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#88aacc', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(0,255,255,0.1)' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 60 }, (_, i) => {
          const base = 0.03 + Math.sin(i * 0.2) * 0.015;
          const peak1 = Math.exp(-Math.pow(i - 20, 2) / 50) * 0.08;
          const peak2 = Math.exp(-Math.pow(i - 40, 2) / 80) * 0.05;
          return base + peak1 + peak2 + Math.random() * 0.005;
        }),
        lineStyle: { color: '#00ffff', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,255,255,0.5)' },
              { offset: 1, color: 'rgba(0,255,255,0)' }
            ]
          }
        },
      },
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 60 }, () => 0.025),
        lineStyle: { color: '#ff6464', width: 1, type: 'dashed' },
      }
    ],
  }), []);

  // 热力图
  const heatmapOption = useMemo(() => ({
    tooltip: {
      formatter: (p: any) => `位置: (${p.data[0]+1}, ${p.data[1]+1})<br/>压力: ${p.data[2].toFixed(2)} MPa`
    },
    grid: { left: 40, right: 60, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 14 }, (_, i) => `${i + 1}`),
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#88aacc', fontSize: 9 },
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: 10 }, (_, i) => `${i + 1}`),
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#88aacc', fontSize: 9 },
    },
    visualMap: {
      min: 0, max: 2.5,
      orient: 'vertical',
      right: 5, top: 'center',
      itemHeight: 100,
      text: ['高', '低'],
      textStyle: { color: '#88aacc', fontSize: 9 },
      inRange: { color: ['#00ff88', '#88ff00', '#ffff00', '#ff8800', '#ff0000'] },
    },
    series: [{
      type: 'heatmap',
      data: (() => {
        const data: [number, number, number][] = [];
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 14; j++) {
            let v = 0.2 + Math.random() * 0.3;
            if ((j === 3 || j === 4 || j === 9 || j === 10) && i >= 2 && i <= 7) v = 1.2 + Math.random() * 1.2;
            data.push([j, i, v]);
          }
        }
        return data;
      })(),
      itemStyle: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
    }],
  }), []);

  // 雷达图
  const radarOption = useMemo(() => ({
    radar: {
      indicator: [
        { name: '抗压', max: 100 },
        { name: '抗拉', max: 100 },
        { name: '弹性', max: 100 },
        { name: '耐久', max: 100 },
        { name: '抗裂', max: 100 },
        { name: '稳定', max: 100 },
      ],
      center: ['50%', '52%'],
      radius: '65%',
      axisName: { color: '#88aacc', fontSize: 10 },
      splitArea: { areaStyle: { color: ['rgba(0,255,255,0.02)', 'rgba(0,255,255,0.06)'] } },
      axisLine: { lineStyle: { color: 'rgba(0,255,255,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(0,255,255,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [88, 82, 85, 92, 78, 90],
          name: '当前',
          lineStyle: { color: '#00ffff', width: 2 },
          areaStyle: { color: 'rgba(0,255,255,0.35)' },
          itemStyle: { color: '#00ffff' },
        },
        {
          value: [70, 70, 70, 70, 70, 70],
          name: '标准',
          lineStyle: { color: '#ffaa00', width: 1, type: 'dashed' },
          itemStyle: { color: '#ffaa00' },
        }
      ]
    }],
  }), []);

  // 温度曲线
  const tempOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['表面', '内部'], textStyle: { color: '#88aacc', fontSize: 10 }, top: 5, right: 10 },
    grid: { left: 40, right: 15, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#88aacc', fontSize: 9, interval: 3 },
    },
    yAxis: {
      type: 'value',
      min: 15, max: 50,
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#88aacc', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(0,255,255,0.1)' } },
    },
    series: [
      {
        name: '表面',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 24 }, (_, i) => 25 + Math.sin((i - 6) * Math.PI / 12) * 12 + Math.random() * 2),
        lineStyle: { color: '#ff6464', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(255,100,100,0.4)' }, { offset: 1, color: 'rgba(255,100,100,0)' }]
          }
        },
      },
      {
        name: '内部',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: Array.from({ length: 24 }, (_, i) => 22 + Math.sin((i - 8) * Math.PI / 12) * 6 + Math.random() * 1),
        lineStyle: { color: '#00ff88', width: 2 },
      }
    ],
  }), []);

  return (
    <PageContainer>
      <Header>
        <Logo>
          <div className="icon-wrapper">
            <div className="core" />
          </div>
          <div className="title-group">
            <h1>道路结构健康监测系统</h1>
            <div className="subtitle">ROAD STRUCTURE HEALTH MONITORING SYSTEM</div>
          </div>
        </Logo>
        
        <MetricsBar>
          <MetricItem color="#ff6464">
            <div className="value">{metrics.temp.toFixed(1)}<span className="unit">°C</span></div>
            <div className="label">路面温度</div>
          </MetricItem>
          <MetricItem color="#00ffff">
            <div className="value">{metrics.pressure.toFixed(2)}<span className="unit">MPa</span></div>
            <div className="label">承载压力</div>
          </MetricItem>
          <MetricItem color="#ffc800">
            <div className="value">{metrics.vibration.toFixed(0)}<span className="unit">Hz</span></div>
            <div className="label">振动频率</div>
          </MetricItem>
          <MetricItem color="#00ff88">
            <div className="value">{metrics.strength.toFixed(1)}<span className="unit">MPa</span></div>
            <div className="label">结构强度</div>
          </MetricItem>
        </MetricsBar>
        
        <TimeDisplay>
          <div className="time">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
          <div className="date">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</div>
        </TimeDisplay>
      </Header>

      <MainContent>
        {/* 传感器阵列 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
            <span className="title">传感器阵列布局</span>
            <div className="status"><div className="dot" /> 在线 96/96</div>
          </PanelHeader>
          <PanelBody>
            <SensorGridWrapper>
              <Grid3DContainer>
                <Grid3D>
                  {sensorData.map((row, i) =>
                    row.map((cell, j) => (
                      <SensorCell key={`${i}-${j}`} type={cell.type} value={cell.value} />
                    ))
                  )}
                </Grid3D>
              </Grid3DContainer>
              <GridLegend>
                <div className="item"><div className="indicator" style={{ background: '#00ffff' }} /> 压电传感器 (32)</div>
                <div className="item"><div className="indicator" style={{ background: '#ff6464' }} /> 热电偶 (28)</div>
                <div className="item"><div className="indicator" style={{ background: '#ffc800' }} /> 应变片 (36)</div>
              </GridLegend>
            </SensorGridWrapper>
          </PanelBody>
        </Panel>

        {/* 振动频谱 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-4h2v14h-2V7z"/></svg>
            <span className="title">振动频谱分析</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={vibrationOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 结构性能 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="title">结构性能评估</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={radarOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 诊断面板 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span className="title">结构健康诊断</span>
          </PanelHeader>
          <PanelBody>
            <DiagnosticsGrid>
              <DiagCard status="good">
                <DiagHeader>
                  <span className="name">裂纹检测</span>
                  <span className="badge" style={{ background: '#00ff88', color: '#000' }}>正常</span>
                </DiagHeader>
                <DiagContent>AI视觉检测未发现表面裂纹，声波探测结构完整。</DiagContent>
                <DiagMetrics>
                  <DiagMetric color="#00ff88"><div className="value">0</div><div className="label">裂纹数</div></DiagMetric>
                  <DiagMetric color="#00ff88"><div className="value">98.5%</div><div className="label">置信度</div></DiagMetric>
                  <DiagMetric color="#00ff88"><div className="value">A</div><div className="label">等级</div></DiagMetric>
                </DiagMetrics>
              </DiagCard>
              
              <DiagCard status="warn">
                <DiagHeader>
                  <span className="name">沉降监测</span>
                  <span className="badge" style={{ background: '#ffc800', color: '#000' }}>轻微</span>
                </DiagHeader>
                <DiagContent>检测到局部沉降0.3mm，在允许范围内，建议持续监测。</DiagContent>
                <DiagMetrics>
                  <DiagMetric color="#ffc800"><div className="value">0.3</div><div className="label">沉降(mm)</div></DiagMetric>
                  <DiagMetric color="#ffc800"><div className="value">5.0</div><div className="label">允许值</div></DiagMetric>
                  <DiagMetric color="#ffc800"><div className="value">B</div><div className="label">等级</div></DiagMetric>
                </DiagMetrics>
              </DiagCard>
              
              <DiagCard status="good">
                <DiagHeader>
                  <span className="name">材料老化</span>
                  <span className="badge" style={{ background: '#00ff88', color: '#000' }}>良好</span>
                </DiagHeader>
                <DiagContent>赤泥基材料性能稳定，预计剩余使用寿命充足。</DiagContent>
                <DiagMetrics>
                  <DiagMetric color="#00ff88"><div className="value">92%</div><div className="label">性能保持</div></DiagMetric>
                  <DiagMetric color="#00ff88"><div className="value">15</div><div className="label">预计寿命(年)</div></DiagMetric>
                  <DiagMetric color="#00ff88"><div className="value">A</div><div className="label">等级</div></DiagMetric>
                </DiagMetrics>
              </DiagCard>
              
              <DiagCard status="good">
                <DiagHeader>
                  <span className="name">承载能力</span>
                  <span className="badge" style={{ background: '#00ff88', color: '#000' }}>优秀</span>
                </DiagHeader>
                <DiagContent>当前承载能力超过设计要求28%，储能功能正常运行。</DiagContent>
                <DiagMetrics>
                  <DiagMetric color="#00ff88"><div className="value">45.2</div><div className="label">实测(MPa)</div></DiagMetric>
                  <DiagMetric color="#00ff88"><div className="value">35</div><div className="label">设计值</div></DiagMetric>
                  <DiagMetric color="#00ff88"><div className="value">A+</div><div className="label">等级</div></DiagMetric>
                </DiagMetrics>
              </DiagCard>
            </DiagnosticsGrid>
          </PanelBody>
        </Panel>

        {/* 压力热力图 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
            <span className="title">路面受压分布</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={heatmapOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 温度曲线 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2V5z"/></svg>
            <span className="title">温度场监测</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={tempOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>
      </MainContent>
    </PageContainer>
  );
};

export default RoadInspection;
