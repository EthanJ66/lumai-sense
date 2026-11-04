import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactECharts from 'echarts-for-react';

// ==================== 动画定义 ====================
const breathe = keyframes`
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
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

const carbonFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

// ==================== 容器样式 ====================
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0d1f17 0%, #050d0a 100%);
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
      linear-gradient(90deg, rgba(34,139,34,0.02) 1px, transparent 1px),
      linear-gradient(rgba(34,139,34,0.02) 1px, transparent 1px);
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
  background: linear-gradient(180deg, rgba(34,80,50,0.6) 0%, rgba(17,40,25,0.3) 100%);
  border-bottom: 1px solid rgba(34,139,34,0.4);
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #228b22, #32cd32, #228b22, transparent);
    animation: ${dataFlow} 4s linear infinite;
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
      border: 2px solid #228b22;
      border-radius: 50%;
      animation: ${rotate} 12s linear infinite;
      border-top-color: transparent;
    }
    
    .leaf {
      position: absolute;
      inset: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #32cd32;
      font-size: 22px;
      animation: ${carbonFloat} 3s ease-in-out infinite;
    }
  }
  
  .title-group {
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 3px;
      text-shadow: 0 0 20px rgba(50,205,50,0.5);
    }
    
    .subtitle {
      font-size: 11px;
      color: #32cd32;
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
    color: #90c090;
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
    text-shadow: 0 0 10px rgba(50,205,50,0.5);
  }
  
  .date {
    font-size: 12px;
    color: #90c090;
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
  background: linear-gradient(135deg, rgba(20,50,30,0.9) 0%, rgba(10,25,15,0.95) 100%);
  border: 1px solid rgba(34,139,34,0.3);
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
    background: linear-gradient(90deg, transparent, #228b22, transparent);
  }
`;

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, rgba(34,139,34,0.15) 0%, transparent 100%);
  border-bottom: 1px solid rgba(34,139,34,0.15);
  
  .icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #32cd32;
  }
  
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #32cd32;
    letter-spacing: 1px;
  }
  
  .status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #32cd32;
    
    .dot {
      width: 6px;
      height: 6px;
      background: #32cd32;
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

// ==================== 碳封存卡片 ====================
const CarbonCardsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
`;

const CarbonCard = styled.div<{ status: 'excellent' | 'good' | 'normal' }>`
  flex: 1;
  background: ${props => 
    props.status === 'excellent' ? 'linear-gradient(135deg, rgba(34,139,34,0.4) 0%, rgba(17,70,17,0.3) 100%)' :
    props.status === 'good' ? 'linear-gradient(135deg, rgba(50,205,50,0.3) 0%, rgba(25,100,25,0.2) 100%)' :
    'linear-gradient(135deg, rgba(107,142,35,0.3) 0%, rgba(50,70,18,0.2) 100%)'
  };
  border: 1px solid ${props =>
    props.status === 'excellent' ? 'rgba(34,139,34,0.6)' :
    props.status === 'good' ? 'rgba(50,205,50,0.5)' :
    'rgba(107,142,35,0.5)'
  };
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: ${breathe} 4s infinite;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 3px;
    background: ${props =>
      props.status === 'excellent' ? '#228b22' :
      props.status === 'good' ? '#32cd32' :
      '#6b8e23'
    };
    border-radius: 2px;
    box-shadow: 0 0 8px currentColor;
  }
`;

const CardHeader = styled.div`
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

const CardMetrics = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: auto;
`;

const CardMetric = styled.div<{ color: string }>`
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
  padding: 8px;
  text-align: center;
  
  .value {
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.color};
    font-family: 'Courier New', monospace;
    
    .unit {
      font-size: 10px;
      opacity: 0.8;
    }
  }
  
  .label {
    font-size: 9px;
    color: #90c090;
    margin-top: 2px;
  }
`;

// ==================== CO2分子可视化 ====================
const MoleculeVisual = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const CO2Molecule = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  animation: ${carbonFloat} 3s ease-in-out infinite;
  
  .carbon {
    width: 40px;
    height: 40px;
    background: radial-gradient(circle at 30% 30%, #555, #222);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 0 15px rgba(50,50,50,0.8);
  }
  
  .oxygen {
    width: 35px;
    height: 35px;
    background: radial-gradient(circle at 30% 30%, #ff6666, #cc0000);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: bold;
    font-size: 12px;
    box-shadow: 0 0 15px rgba(255,0,0,0.5);
  }
  
  .bond {
    width: 20px;
    height: 4px;
    background: linear-gradient(90deg, #888, #aaa, #888);
    border-radius: 2px;
  }
`;

const CaptureArrow = styled.div`
  margin: 15px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #32cd32;
  font-size: 11px;
  
  .arrow {
    font-size: 24px;
    animation: ${pulse} 1s infinite;
  }
`;

const StorageIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #228b22 0%, #145214 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(34,139,34,0.5);
  
  svg {
    width: 30px;
    height: 30px;
    fill: #90ee90;
  }
`;

const StorageText = styled.div`
  margin-top: 10px;
  text-align: center;
  
  .value {
    font-size: 20px;
    font-weight: bold;
    color: #32cd32;
    font-family: 'Courier New', monospace;
  }
  
  .label {
    font-size: 10px;
    color: #90c090;
  }
`;

// ==================== 主组件 ====================
const CarbonSequestration: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [carbonData, setCarbonData] = useState({
    totalCapture: 12856.5,
    dailyCapture: 342.8,
    efficiency: 94.2,
    projects: 29,
    redMud: { capture: 8520, efficiency: 96.5, capacity: 15000 },
    road: { capture: 2180, efficiency: 92.3, length: 186 },
    industrial: { capture: 1456, efficiency: 89.8, sites: 12 },
    research: { capture: 700, efficiency: 97.2, experiments: 45 }
  });

  // 实时更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCarbonData(prev => ({
        ...prev,
        totalCapture: prev.totalCapture + Math.random() * 0.5,
        dailyCapture: 330 + Math.random() * 30,
        efficiency: 92 + Math.random() * 5,
        redMud: { ...prev.redMud, capture: prev.redMud.capture + Math.random() * 0.3 },
        road: { ...prev.road, capture: prev.road.capture + Math.random() * 0.15 },
        industrial: { ...prev.industrial, capture: prev.industrial.capture + Math.random() * 0.1 },
        research: { ...prev.research, capture: prev.research.capture + Math.random() * 0.05 }
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 碳封存来源饼图
  const sourceOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 吨 ({d}%)' },
    legend: { 
      orient: 'vertical', 
      right: 10, 
      top: 'center',
      textStyle: { color: '#90c090', fontSize: 10 }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#0a1a0f', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' }
      },
      data: [
        { value: carbonData.redMud.capture, name: '赤泥固碳', itemStyle: { color: '#228b22' } },
        { value: carbonData.road.capture, name: '道路材料', itemStyle: { color: '#32cd32' } },
        { value: carbonData.industrial.capture, name: '工业副产', itemStyle: { color: '#6b8e23' } },
        { value: carbonData.research.capture, name: '研发试验', itemStyle: { color: '#9acd32' } },
      ]
    }]
  }), [carbonData]);

  // 月度碳封存趋势
  const trendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['封存量', '目标值'], textStyle: { color: '#90c090', fontSize: 10 }, top: 5, right: 10 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#2a4a3a' } },
      axisLabel: { color: '#90c090', fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#90c090', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2a4a3a' } },
      axisLabel: { color: '#90c090', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(50,205,50,0.1)' } },
    },
    series: [
      {
        name: '封存量',
        type: 'bar',
        data: [980, 1050, 1120, 1080, 1150, 1200, 1180, 1250, 1300, 1280, 1350, 1420],
        itemStyle: { 
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#32cd32' }, { offset: 1, color: '#228b22' }]
          },
          borderRadius: [4, 4, 0, 0]
        },
      },
      {
        name: '目标值',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: [1000, 1000, 1100, 1100, 1100, 1200, 1200, 1200, 1300, 1300, 1300, 1400],
        lineStyle: { color: '#ff9900', width: 2, type: 'dashed' },
      }
    ],
  }), []);

  // 效率分析雷达图
  const radarOption = useMemo(() => ({
    radar: {
      indicator: [
        { name: '捕集效率', max: 100 },
        { name: '转化效率', max: 100 },
        { name: '储存稳定', max: 100 },
        { name: '成本效益', max: 100 },
        { name: '环境影响', max: 100 },
        { name: '技术成熟', max: 100 },
      ],
      center: ['50%', '52%'],
      radius: '62%',
      axisName: { color: '#90c090', fontSize: 9 },
      splitArea: { areaStyle: { color: ['rgba(50,205,50,0.02)', 'rgba(50,205,50,0.06)'] } },
      axisLine: { lineStyle: { color: 'rgba(50,205,50,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(50,205,50,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [96.5, 92.3, 98.1, 85.6, 94.8, 91.2],
        name: '当前表现',
        lineStyle: { color: '#32cd32', width: 2 },
        areaStyle: { color: 'rgba(50,205,50,0.35)' },
        itemStyle: { color: '#32cd32' },
      }]
    }],
  }), []);

  // 实时监测曲线
  const realtimeOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 45, right: 15, top: 25, bottom: 25 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 60 }, (_, i) => `${i}s`),
      axisLine: { lineStyle: { color: '#2a4a3a' } },
      axisLabel: { color: '#90c090', fontSize: 9, interval: 9 },
    },
    yAxis: {
      type: 'value',
      name: 'kg/h',
      axisLine: { lineStyle: { color: '#2a4a3a' } },
      axisLabel: { color: '#90c090', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(50,205,50,0.1)' } },
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: Array.from({ length: 60 }, () => 12 + Math.random() * 4),
      lineStyle: { color: '#32cd32', width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(50,205,50,0.5)' }, { offset: 1, color: 'rgba(50,205,50,0)' }]
        }
      },
    }],
  }), []);

  return (
    <PageContainer>
      <Header>
        <Logo>
          <div className="icon-wrapper">
            <div className="leaf">&#127807;</div>
          </div>
          <div className="title-group">
            <h1>碳封存监测管理系统</h1>
            <div className="subtitle">CARBON SEQUESTRATION MONITORING SYSTEM</div>
          </div>
        </Logo>
        
        <HeaderStats>
          <StatItem color="#32cd32">
            <div className="value">{carbonData.totalCapture.toFixed(1)}<span className="unit">吨</span></div>
            <div className="label">累计封存</div>
          </StatItem>
          <StatItem color="#9acd32">
            <div className="value">{carbonData.dailyCapture.toFixed(1)}<span className="unit">吨/日</span></div>
            <div className="label">日均封存</div>
          </StatItem>
          <StatItem color="#6b8e23">
            <div className="value">{carbonData.efficiency.toFixed(1)}<span className="unit">%</span></div>
            <div className="label">封存效率</div>
          </StatItem>
          <StatItem color="#228b22">
            <div className="value">{carbonData.projects}<span className="unit">个</span></div>
            <div className="label">项目数量</div>
          </StatItem>
        </HeaderStats>
        
        <TimeDisplay>
          <div className="time">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
          <div className="date">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</div>
        </TimeDisplay>
      </Header>

      <MainContent>
        {/* 碳封存项目卡片 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>
            <span className="title">碳封存项目状态</span>
            <div className="status"><div className="dot" /> 运行中</div>
          </PanelHeader>
          <PanelBody>
            <CarbonCardsGrid>
              <CarbonCard status="excellent">
                <CardHeader>
                  <span className="name">赤泥固碳工程</span>
                  <span className="badge" style={{ background: '#228b22', color: '#fff' }}>优秀</span>
                </CardHeader>
                <CardMetrics>
                  <CardMetric color="#32cd32">
                    <div className="value">{carbonData.redMud.capture.toFixed(0)}<span className="unit">吨</span></div>
                    <div className="label">累计封存</div>
                  </CardMetric>
                  <CardMetric color="#32cd32">
                    <div className="value">{carbonData.redMud.efficiency}<span className="unit">%</span></div>
                    <div className="label">转化效率</div>
                  </CardMetric>
                  <CardMetric color="#9acd32">
                    <div className="value">{carbonData.redMud.capacity.toLocaleString()}<span className="unit">吨</span></div>
                    <div className="label">设计容量</div>
                  </CardMetric>
                  <CardMetric color="#9acd32">
                    <div className="value">{((carbonData.redMud.capture / carbonData.redMud.capacity) * 100).toFixed(1)}<span className="unit">%</span></div>
                    <div className="label">容量使用</div>
                  </CardMetric>
                </CardMetrics>
              </CarbonCard>
              
              <CarbonCard status="good">
                <CardHeader>
                  <span className="name">道路材料固碳</span>
                  <span className="badge" style={{ background: '#32cd32', color: '#000' }}>良好</span>
                </CardHeader>
                <CardMetrics>
                  <CardMetric color="#32cd32">
                    <div className="value">{carbonData.road.capture.toFixed(0)}<span className="unit">吨</span></div>
                    <div className="label">累计封存</div>
                  </CardMetric>
                  <CardMetric color="#32cd32">
                    <div className="value">{carbonData.road.efficiency}<span className="unit">%</span></div>
                    <div className="label">固化效率</div>
                  </CardMetric>
                  <CardMetric color="#9acd32">
                    <div className="value">{carbonData.road.length}<span className="unit">km</span></div>
                    <div className="label">道路长度</div>
                  </CardMetric>
                  <CardMetric color="#9acd32">
                    <div className="value">{(carbonData.road.capture / carbonData.road.length).toFixed(1)}<span className="unit">吨/km</span></div>
                    <div className="label">单位封存</div>
                  </CardMetric>
                </CardMetrics>
              </CarbonCard>
              
              <CarbonCard status="normal">
                <CardHeader>
                  <span className="name">工业副产固碳</span>
                  <span className="badge" style={{ background: '#6b8e23', color: '#fff' }}>正常</span>
                </CardHeader>
                <CardMetrics>
                  <CardMetric color="#6b8e23">
                    <div className="value">{carbonData.industrial.capture.toFixed(0)}<span className="unit">吨</span></div>
                    <div className="label">累计封存</div>
                  </CardMetric>
                  <CardMetric color="#6b8e23">
                    <div className="value">{carbonData.industrial.efficiency}<span className="unit">%</span></div>
                    <div className="label">处理效率</div>
                  </CardMetric>
                  <CardMetric color="#9acd32">
                    <div className="value">{carbonData.industrial.sites}<span className="unit">个</span></div>
                    <div className="label">生产站点</div>
                  </CardMetric>
                  <CardMetric color="#9acd32">
                    <div className="value">{(carbonData.industrial.capture / carbonData.industrial.sites).toFixed(0)}<span className="unit">吨/站</span></div>
                    <div className="label">站均封存</div>
                  </CardMetric>
                </CardMetrics>
              </CarbonCard>
            </CarbonCardsGrid>
          </PanelBody>
        </Panel>

        {/* CO2封存可视化 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span className="title">CO2捕集过程</span>
          </PanelHeader>
          <PanelBody>
            <MoleculeVisual>
              <CO2Molecule>
                <div className="oxygen">O</div>
                <div className="bond" />
                <div className="carbon">C</div>
                <div className="bond" />
                <div className="oxygen">O</div>
              </CO2Molecule>
              <CaptureArrow>
                <div className="arrow">&#8595;</div>
                <span>矿化固定</span>
              </CaptureArrow>
              <StorageIcon>
                <svg viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 8.5 12 8.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/></svg>
              </StorageIcon>
              <StorageText>
                <div className="value">{carbonData.dailyCapture.toFixed(1)} 吨/日</div>
                <div className="label">实时封存速率</div>
              </StorageText>
            </MoleculeVisual>
          </PanelBody>
        </Panel>

        {/* 封存来源分布 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v9h9c-.47-4.74-4.24-8.52-9-9zm0 11v9c4.75-.48 8.52-4.26 9-9h-9z"/></svg>
            <span className="title">封存来源分布</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={sourceOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 效率雷达 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="title">综合效率评估</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={radarOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 月度趋势 */}
        <Panel colSpan="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
            <span className="title">月度碳封存趋势</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={trendOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>

        {/* 实时监测 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-4h2v14h-2V7z"/></svg>
            <span className="title">实时封存速率</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={realtimeOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>
      </MainContent>
    </PageContainer>
  );
};

export default CarbonSequestration;
