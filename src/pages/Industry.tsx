import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactECharts from 'echarts-for-react';

// ==================== 动画定义 ====================
const breathe = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
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

const gearRotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ==================== 容器样式 ====================
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #151a28 0%, #080a10 100%);
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
      linear-gradient(90deg, rgba(255,165,0,0.02) 1px, transparent 1px),
      linear-gradient(rgba(255,165,0,0.02) 1px, transparent 1px);
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
  background: linear-gradient(180deg, rgba(100,60,0,0.5) 0%, rgba(50,30,0,0.3) 100%);
  border-bottom: 1px solid rgba(255,165,0,0.4);
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ffa500, #ffcc00, #ffa500, transparent);
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
    
    .gear {
      position: absolute;
      inset: 5px;
      border: 3px solid #ffa500;
      border-radius: 50%;
      animation: ${gearRotate} 8s linear infinite;
      
      &::before, &::after {
        content: '';
        position: absolute;
        background: #ffa500;
      }
      
      &::before {
        width: 4px;
        height: 100%;
        left: 50%;
        transform: translateX(-50%);
      }
      
      &::after {
        width: 100%;
        height: 4px;
        top: 50%;
        transform: translateY(-50%);
      }
    }
    
    .center {
      position: absolute;
      inset: 15px;
      background: radial-gradient(circle, #ffa500 0%, #cc8400 100%);
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
      text-shadow: 0 0 20px rgba(255,165,0,0.5);
    }
    
    .subtitle {
      font-size: 11px;
      color: #ffa500;
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
    color: #ccaa88;
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
    text-shadow: 0 0 10px rgba(255,165,0,0.5);
  }
  
  .date {
    font-size: 12px;
    color: #ccaa88;
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
  background: linear-gradient(135deg, rgba(60,40,10,0.8) 0%, rgba(30,20,5,0.9) 100%);
  border: 1px solid rgba(255,165,0,0.3);
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
    background: linear-gradient(90deg, transparent, #ffa500, transparent);
  }
`;

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, rgba(255,165,0,0.15) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255,165,0,0.15);
  
  .icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #ffa500;
  }
  
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #ffa500;
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

// ==================== 企业卡片 ====================
const EnterpriseGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,165,0,0.3);
    border-radius: 2px;
  }
`;

const EnterpriseCard = styled.div<{ type: 'aluminum' | 'chemical' | 'building' | 'logistics' | 'manufacturing' }>`
  background: ${props => {
    switch(props.type) {
      case 'aluminum': return 'linear-gradient(135deg, rgba(192,192,192,0.3) 0%, rgba(100,100,100,0.2) 100%)';
      case 'chemical': return 'linear-gradient(135deg, rgba(0,191,255,0.3) 0%, rgba(0,96,128,0.2) 100%)';
      case 'building': return 'linear-gradient(135deg, rgba(139,69,19,0.4) 0%, rgba(70,35,10,0.3) 100%)';
      case 'logistics': return 'linear-gradient(135deg, rgba(50,205,50,0.3) 0%, rgba(25,100,25,0.2) 100%)';
      case 'manufacturing': return 'linear-gradient(135deg, rgba(255,165,0,0.3) 0%, rgba(128,82,0,0.2) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.type) {
      case 'aluminum': return 'rgba(192,192,192,0.5)';
      case 'chemical': return 'rgba(0,191,255,0.5)';
      case 'building': return 'rgba(139,69,19,0.6)';
      case 'logistics': return 'rgba(50,205,50,0.5)';
      case 'manufacturing': return 'rgba(255,165,0,0.5)';
    }
  }};
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 15%;
    bottom: 15%;
    width: 3px;
    background: ${props => {
      switch(props.type) {
        case 'aluminum': return '#c0c0c0';
        case 'chemical': return '#00bfff';
        case 'building': return '#8b4513';
        case 'logistics': return '#32cd32';
        case 'manufacturing': return '#ffa500';
      }
    }};
    border-radius: 2px;
  }
`;

const EnterpriseIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: ${props => props.color};
`;

const EnterpriseInfo = styled.div`
  flex: 1;
  
  .name {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }
  
  .detail {
    font-size: 10px;
    color: #ccaa88;
  }
`;

const EnterpriseStats = styled.div`
  text-align: right;
  
  .value {
    font-size: 16px;
    font-weight: bold;
    color: #ffa500;
    font-family: 'Courier New', monospace;
  }
  
  .label {
    font-size: 9px;
    color: #aa8866;
  }
`;

// ==================== 产线状态 ====================
const ProductionLines = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 10px;
  height: 100%;
`;

const LineCard = styled.div<{ status: 'running' | 'standby' | 'maintenance' }>`
  background: ${props => 
    props.status === 'running' ? 'linear-gradient(135deg, rgba(0,255,136,0.2) 0%, rgba(0,100,50,0.15) 100%)' :
    props.status === 'standby' ? 'linear-gradient(135deg, rgba(255,200,0,0.2) 0%, rgba(128,100,0,0.15) 100%)' :
    'linear-gradient(135deg, rgba(255,80,80,0.2) 0%, rgba(128,40,40,0.15) 100%)'
  };
  border: 1px solid ${props =>
    props.status === 'running' ? 'rgba(0,255,136,0.4)' :
    props.status === 'standby' ? 'rgba(255,200,0,0.4)' :
    'rgba(255,80,80,0.4)'
  };
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .name {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: bold;
      background: ${props =>
        props.status === 'running' ? '#00ff88' :
        props.status === 'standby' ? '#ffc800' :
        '#ff5050'
      };
      color: #000;
    }
  }
  
  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: auto;
    
    .metric {
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      padding: 6px;
      text-align: center;
      
      .value {
        font-size: 14px;
        font-weight: bold;
        color: ${props =>
          props.status === 'running' ? '#00ff88' :
          props.status === 'standby' ? '#ffc800' :
          '#ff5050'
        };
        font-family: 'Courier New', monospace;
      }
      
      .label {
        font-size: 8px;
        color: #aa8866;
        margin-top: 2px;
      }
    }
  }
`;

// ==================== 主组件 ====================
const Industry: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    enterprises: 56,
    energy: 15680,
    savings: 1256,
    efficiency: 89.5,
    production: {
      aluminum: { power: 5200, output: 2850, efficiency: 92.3 },
      chemical: { power: 3800, output: 1560, efficiency: 88.5 },
      building: { power: 2100, output: 980, efficiency: 91.2 },
      logistics: { power: 1800, output: 0, efficiency: 85.6 },
      manufacturing: { power: 2780, output: 1420, efficiency: 90.1 }
    }
  });

  const [productionLines] = useState([
    { name: '铝电解A线', status: 'running' as const, output: 98.5, power: 1250 },
    { name: '铝电解B线', status: 'running' as const, output: 96.2, power: 1180 },
    { name: '化工精馏', status: 'running' as const, output: 92.8, power: 860 },
    { name: '建材压制', status: 'standby' as const, output: 0, power: 120 },
    { name: '物流仓储', status: 'running' as const, output: 88.5, power: 450 },
    { name: '设备检修', status: 'maintenance' as const, output: 0, power: 50 },
  ]);

  // 实时更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setStats(prev => ({
        ...prev,
        energy: 15500 + Math.random() * 300,
        savings: 1200 + Math.random() * 100,
        efficiency: 88 + Math.random() * 4,
        production: {
          aluminum: { ...prev.production.aluminum, power: 5100 + Math.random() * 200, efficiency: 91 + Math.random() * 3 },
          chemical: { ...prev.production.chemical, power: 3700 + Math.random() * 200, efficiency: 87 + Math.random() * 3 },
          building: { ...prev.production.building, power: 2000 + Math.random() * 200, efficiency: 90 + Math.random() * 3 },
          logistics: { ...prev.production.logistics, power: 1700 + Math.random() * 200, efficiency: 84 + Math.random() * 3 },
          manufacturing: { ...prev.production.manufacturing, power: 2700 + Math.random() * 160, efficiency: 89 + Math.random() * 3 }
        }
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 能耗分布
  const energyDistOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: '#ccaa88', fontSize: 9 } },
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#1a1510', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: stats.production.aluminum.power, name: '铝业', itemStyle: { color: '#c0c0c0' } },
        { value: stats.production.chemical.power, name: '化工', itemStyle: { color: '#00bfff' } },
        { value: stats.production.building.power, name: '建材', itemStyle: { color: '#8b4513' } },
        { value: stats.production.logistics.power, name: '物流', itemStyle: { color: '#32cd32' } },
        { value: stats.production.manufacturing.power, name: '制造', itemStyle: { color: '#ffa500' } },
      ]
    }]
  }), [stats.production]);

  // 产能趋势
  const outputTrendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['产能', '能耗'], textStyle: { color: '#ccaa88', fontSize: 10 }, top: 5, right: 10 },
    grid: { left: 50, right: 45, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#4a3a2a' } },
      axisLabel: { color: '#ccaa88', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: '产能(吨)',
        nameTextStyle: { color: '#ccaa88', fontSize: 10 },
        axisLine: { lineStyle: { color: '#4a3a2a' } },
        axisLabel: { color: '#ccaa88', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(255,165,0,0.1)' } },
      },
      {
        type: 'value',
        name: '能耗(MWh)',
        nameTextStyle: { color: '#ccaa88', fontSize: 10 },
        axisLine: { lineStyle: { color: '#4a3a2a' } },
        axisLabel: { color: '#ccaa88', fontSize: 9 },
      }
    ],
    series: [
      {
        name: '产能',
        type: 'bar',
        data: [820, 932, 901, 934, 1290, 1130, 1320],
        itemStyle: { 
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#ffa500' }, { offset: 1, color: '#cc8400' }]
          },
          borderRadius: [4, 4, 0, 0]
        },
      },
      {
        name: '能耗',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: [12.5, 14.2, 13.8, 14.5, 18.2, 16.8, 19.5],
        lineStyle: { color: '#00bfff', width: 2 },
        itemStyle: { color: '#00bfff' },
      }
    ],
  }), []);

  // 效率仪表盘
  const efficiencyGaugeOption = useMemo(() => ({
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
            [0.6, '#ff4444'],
            [0.8, '#ffaa00'],
            [1, '#00ff88']
          ]
        }
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '60%',
        width: 10,
        offsetCenter: [0, '-10%'],
        itemStyle: { color: '#ffa500' }
      },
      axisTick: { distance: -25, length: 6, lineStyle: { color: '#fff', width: 1 } },
      splitLine: { distance: -30, length: 15, lineStyle: { color: '#fff', width: 2 } },
      axisLabel: { color: '#ccaa88', fontSize: 10, distance: -35 },
      anchor: { show: true, size: 15, itemStyle: { borderColor: '#ffa500', borderWidth: 2 } },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffa500',
        offsetCenter: [0, '40%'],
        formatter: '{value}%'
      },
      data: [{ value: stats.efficiency.toFixed(1), name: '能效比' }]
    }]
  }), [stats.efficiency]);

  // 节能效益
  const savingsOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 25, bottom: 25 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#4a3a2a' } },
      axisLabel: { color: '#ccaa88', fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      name: '万元',
      axisLine: { lineStyle: { color: '#4a3a2a' } },
      axisLabel: { color: '#ccaa88', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(255,165,0,0.1)' } },
    },
    series: [{
      type: 'bar',
      data: [85, 92, 88, 105, 112, 98, 125, 118, 132, 128, 145, 156],
      itemStyle: { 
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#00ff88' }, { offset: 1, color: '#00aa55' }]
        },
        borderRadius: [4, 4, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        color: '#00ff88',
        fontSize: 9,
        formatter: '{c}'
      }
    }],
  }), []);

  return (
    <PageContainer>
      <Header>
        <Logo>
          <div className="icon-wrapper">
            <div className="gear" />
            <div className="center" />
          </div>
          <div className="title-group">
            <h1>工业能源管理平台</h1>
            <div className="subtitle">INDUSTRIAL ENERGY MANAGEMENT PLATFORM</div>
          </div>
        </Logo>
        
        <HeaderStats>
          <StatItem color="#ffa500">
            <div className="value">{stats.enterprises}<span className="unit">家</span></div>
            <div className="label">服务企业</div>
          </StatItem>
          <StatItem color="#00bfff">
            <div className="value">{(stats.energy / 1000).toFixed(1)}<span className="unit">MWh</span></div>
            <div className="label">日供电量</div>
          </StatItem>
          <StatItem color="#00ff88">
            <div className="value">{stats.savings.toFixed(0)}<span className="unit">万</span></div>
            <div className="label">年节约成本</div>
          </StatItem>
          <StatItem color="#c0c0c0">
            <div className="value">{stats.efficiency.toFixed(1)}<span className="unit">%</span></div>
            <div className="label">综合能效</div>
          </StatItem>
        </HeaderStats>
        
        <TimeDisplay>
          <div className="time">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
          <div className="date">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</div>
        </TimeDisplay>
      </Header>

      <MainContent>
        {/* 企业列表 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <span className="title">服务企业</span>
            <div className="status"><div className="dot" /> 全部在线</div>
          </PanelHeader>
          <PanelBody>
            <EnterpriseGrid>
              <EnterpriseCard type="aluminum">
                <EnterpriseIcon color="#c0c0c0">&#9881;</EnterpriseIcon>
                <EnterpriseInfo>
                  <div className="name">山东魏桥铝电集团</div>
                  <div className="detail">铝业生产 | 5条产线</div>
                </EnterpriseInfo>
                <EnterpriseStats>
                  <div className="value">{stats.production.aluminum.power.toFixed(0)}</div>
                  <div className="label">kWh/h</div>
                </EnterpriseStats>
              </EnterpriseCard>
              
              <EnterpriseCard type="chemical">
                <EnterpriseIcon color="#00bfff">&#9883;</EnterpriseIcon>
                <EnterpriseInfo>
                  <div className="name">滨华新材料有限公司</div>
                  <div className="detail">化工生产 | 3条产线</div>
                </EnterpriseInfo>
                <EnterpriseStats>
                  <div className="value">{stats.production.chemical.power.toFixed(0)}</div>
                  <div className="label">kWh/h</div>
                </EnterpriseStats>
              </EnterpriseCard>
              
              <EnterpriseCard type="building">
                <EnterpriseIcon color="#8b4513">&#9878;</EnterpriseIcon>
                <EnterpriseInfo>
                  <div className="name">中铝齐鲁工业园</div>
                  <div className="detail">建材生产 | 2条产线</div>
                </EnterpriseInfo>
                <EnterpriseStats>
                  <div className="value">{stats.production.building.power.toFixed(0)}</div>
                  <div className="label">kWh/h</div>
                </EnterpriseStats>
              </EnterpriseCard>
              
              <EnterpriseCard type="logistics">
                <EnterpriseIcon color="#32cd32">&#9992;</EnterpriseIcon>
                <EnterpriseInfo>
                  <div className="name">滨州北海物流港</div>
                  <div className="detail">仓储物流 | 智能调度</div>
                </EnterpriseInfo>
                <EnterpriseStats>
                  <div className="value">{stats.production.logistics.power.toFixed(0)}</div>
                  <div className="label">kWh/h</div>
                </EnterpriseStats>
              </EnterpriseCard>
              
              <EnterpriseCard type="manufacturing">
                <EnterpriseIcon color="#ffa500">&#9874;</EnterpriseIcon>
                <EnterpriseInfo>
                  <div className="name">邹平伊文华源金属</div>
                  <div className="detail">金属加工 | 4条产线</div>
                </EnterpriseInfo>
                <EnterpriseStats>
                  <div className="value">{stats.production.manufacturing.power.toFixed(0)}</div>
                  <div className="label">kWh/h</div>
                </EnterpriseStats>
              </EnterpriseCard>
            </EnterpriseGrid>
          </PanelBody>
        </Panel>

        {/* 能耗分布 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v9h9c-.47-4.74-4.24-8.52-9-9zm0 11v9c4.75-.48 8.52-4.26 9-9h-9z"/></svg>
            <span className="title">行业能耗分布</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={energyDistOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 产线状态 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M22 22H2V2h20v20zM13 11V9h-2v2H9v2h2v2h2v-2h2v-2h-2z"/></svg>
            <span className="title">产线实时状态</span>
          </PanelHeader>
          <PanelBody>
            <ProductionLines>
              {productionLines.map((line, i) => (
                <LineCard key={i} status={line.status}>
                  <div className="header">
                    <span className="name">{line.name}</span>
                    <span className="status-badge">
                      {line.status === 'running' ? '运行' : line.status === 'standby' ? '待机' : '维护'}
                    </span>
                  </div>
                  <div className="metrics">
                    <div className="metric">
                      <div className="value">{line.output}%</div>
                      <div className="label">产能</div>
                    </div>
                    <div className="metric">
                      <div className="value">{line.power}</div>
                      <div className="label">功率kW</div>
                    </div>
                  </div>
                </LineCard>
              ))}
            </ProductionLines>
          </PanelBody>
        </Panel>

        {/* 能效仪表 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
            <span className="title">综合能效比</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={efficiencyGaugeOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 产能趋势 */}
        <Panel colSpan="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
            <span className="title">产能与能耗趋势</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={outputTrendOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 节能效益 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            <span className="title">月度节能效益</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={savingsOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>
      </MainContent>
    </PageContainer>
  );
};

export default Industry;
