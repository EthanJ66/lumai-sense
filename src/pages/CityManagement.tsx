import React, { useEffect, useRef, useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { MONITOR_PROJECTS, Project } from '../data/projects';

// --- 配置高德地图 Key ---
const AMAP_KEY = 'c93840d1946f2652c741dc614e5e7177'; 
const AMAP_SECURITY_CODE = '937341f9638cdae918a20d7527c7b8c2';

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

// ==================== 容器样式 ====================
const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0a1828 0%, #050a12 100%);
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
      linear-gradient(90deg, rgba(0,200,255,0.02) 1px, transparent 1px),
      linear-gradient(rgba(0,200,255,0.02) 1px, transparent 1px);
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
  background: linear-gradient(180deg, rgba(0,60,100,0.6) 0%, rgba(0,30,50,0.3) 100%);
  border-bottom: 1px solid rgba(0,200,255,0.3);
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00c8ff, #00ffff, #00c8ff, transparent);
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
      border: 2px solid #00c8ff;
      border-radius: 8px;
      animation: ${rotate} 12s linear infinite;
      border-top-color: transparent;
    }
    
    .city {
      position: absolute;
      inset: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00ffff;
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
      text-shadow: 0 0 20px rgba(0,200,255,0.5);
    }
    
    .subtitle {
      font-size: 11px;
      color: #00c8ff;
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
    color: #88bbcc;
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
    text-shadow: 0 0 10px rgba(0,200,255,0.5);
  }
  
  .date {
    font-size: 12px;
    color: #88bbcc;
  }
`;

// ==================== 主内容区 ====================
const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 260px;
  grid-template-rows: auto 1fr;
  gap: 12px;
  padding: 12px;
  overflow: hidden;
`;

// ==================== 面板组件 ====================
const Panel = styled.div<{ span?: string; colSpan?: string }>`
  background: linear-gradient(135deg, rgba(0,40,60,0.8) 0%, rgba(0,20,30,0.9) 100%);
  border: 1px solid rgba(0,200,255,0.25);
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
    background: linear-gradient(90deg, transparent, #00c8ff, transparent);
  }
`;

const PanelHeader = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, rgba(0,200,255,0.12) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0,200,255,0.12);
  
  .icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #00c8ff;
  }
  
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #00c8ff;
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

// ==================== 项目列表 ====================
const ProjectList = styled.div`
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
    background: rgba(0,200,255,0.3);
    border-radius: 2px;
  }
`;

const ProjectCard = styled.div<{ active?: boolean; type: string }>`
  background: ${props => props.active ? 
    'linear-gradient(135deg, rgba(0,200,255,0.2) 0%, rgba(0,100,128,0.15) 100%)' :
    'linear-gradient(135deg, rgba(0,40,60,0.5) 0%, rgba(0,20,30,0.4) 100%)'
  };
  border: 1px solid ${props => props.active ? 'rgba(0,200,255,0.5)' : 'rgba(0,200,255,0.15)'};
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 15%;
    bottom: 15%;
    width: 3px;
    background: ${props => props.type === 'highway' ? '#00ff88' : '#ffaa00'};
    border-radius: 2px;
    opacity: ${props => props.active ? 1 : 0.5};
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(0,200,255,0.15) 0%, rgba(0,100,128,0.1) 100%);
    border-color: rgba(0,200,255,0.4);
  }
  
  .name {
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
    line-height: 1.3;
  }
  
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: #88bbcc;
    
    .tag {
      padding: 2px 6px;
      border-radius: 3px;
      background: ${props => props.type === 'highway' ? 'rgba(0,255,136,0.2)' : 'rgba(255,170,0,0.2)'};
      color: ${props => props.type === 'highway' ? '#00ff88' : '#ffaa00'};
    }
  }
`;

// ==================== 地图容器 ====================
const MapContainerFull = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0,200,255,0.3);
  background: #000;
  box-shadow: 0 0 20px rgba(0,200,255,0.15);
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a1628 0%, #000000 100%);
  color: #00ffff;
  text-align: center;
  padding: 20px;
  
  .icon { font-size: 40px; margin-bottom: 10px; }
  h3 { margin: 0 0 10px 0; font-size: 14px; }
  p { color: #88bbcc; font-size: 11px; line-height: 1.5; }
`;

// ==================== 统计卡片 - 超紧凑网格 ====================
const StatsCompactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
`;

const StatCompactCard = styled.div<{ color: string }>`
  background: linear-gradient(135deg, rgba(0,40,60,0.6) 0%, rgba(0,20,30,0.5) 100%);
  border-left: 2px solid ${props => props.color};
  border-radius: 4px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .label {
    font-size: 9px;
    color: #88bbcc;
  }
  
  .value {
    font-size: 14px;
    font-weight: bold;
    color: ${props => props.color};
    font-family: 'Courier New', monospace;
  }
`;

// ==================== 右侧上部面板 ====================
const RightTopPanel = styled.div`
  background: linear-gradient(135deg, rgba(0,40,60,0.8) 0%, rgba(0,20,30,0.9) 100%);
  border: 1px solid rgba(0,200,255,0.25);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00c8ff, transparent);
  }
`;

const MiniSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MiniTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #00c8ff;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0,200,255,0.15);
`;

const TypeRow = styled.div`
  display: flex;
  gap: 8px;
`;

const TypeItem = styled.div<{ color: string }>`
  flex: 1;
  text-align: center;
  padding: 10px 8px;
  background: linear-gradient(135deg, ${props => props.color}20 0%, transparent 100%);
  border-radius: 6px;
  border: 1px solid ${props => props.color}40;
  
  .value {
    font-size: 22px;
    font-weight: bold;
    color: ${props => props.color};
    font-family: 'Courier New', monospace;
    display: block;
  }
  
  .label {
    font-size: 9px;
    color: #88bbcc;
    margin-top: 4px;
    display: block;
  }
`;

// ==================== 主组件 ====================
const CityManagement: React.FC = () => {
  const mapRef = useRef<any>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 统计数据
  const stats = useMemo(() => {
    const highway = MONITOR_PROJECTS.filter(p => p.type === 'highway').length;
    const municipal = MONITOR_PROJECTS.filter(p => p.type === 'municipal').length;
    return {
      total: MONITOR_PROJECTS.length,
      highway,
      municipal,
      qingdao: MONITOR_PROJECTS.filter(p => p.location.includes('青岛') || p.location.includes('黄岛')).length,
      binzhou: MONITOR_PROJECTS.filter(p => p.location.includes('滨州')).length,
      other: MONITOR_PROJECTS.length - MONITOR_PROJECTS.filter(p => p.location.includes('青岛') || p.location.includes('黄岛') || p.location.includes('滨州')).length,
      totalLength: 186.5,
      completion: 78.5
    };
  }, []);

  // 时间更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!AMAP_KEY || AMAP_KEY.includes('YOUR_')) return;

    (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };

    const loader = new Promise((resolve, reject) => {
      if ((window as any).AMap) {
        resolve((window as any).AMap);
        return;
      }
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
      script.onerror = reject;
      script.onload = () => resolve((window as any).AMap);
      document.head.appendChild(script);
    });

    loader.then((AMap: any) => {
      if (!mapRef.current) {
        const map = new AMap.Map('amap-container', {
          zoom: 7,
          center: [118.5, 36.5],
          mapStyle: 'amap://styles/dark',
          layers: [new AMap.TileLayer.Satellite(), new AMap.TileLayer.RoadNet()]
        });

        MONITOR_PROJECTS.forEach((project) => {
          if (project.coordinates) {
            const marker = new AMap.Marker({
              position: project.coordinates,
              title: project.name,
            });
            marker.on('click', () => {
              setActiveProject(project);
              map.setZoomAndCenter(14, project.coordinates);
            });
            map.add(marker);
          }
        });

        mapRef.current = map;
        setIsMapLoaded(true);
      }
    }).catch(e => console.error('地图加载失败', e));

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const handleProjectClick = (project: Project) => {
    setActiveProject(project);
    if (mapRef.current && project.coordinates) {
      mapRef.current.setZoomAndCenter(14, project.coordinates);
    }
  };

  // 月度进展
  const monthlyOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 45, right: 15, top: 20, bottom: 25 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#2a4a5a' } },
      axisLabel: { color: '#88bbcc', fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2a4a5a' } },
      axisLabel: { color: '#88bbcc', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(0,200,255,0.1)' } },
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: [12, 18, 25, 35, 48, 62],
      lineStyle: { color: '#00ff88', width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(0,255,136,0.4)' }, { offset: 1, color: 'rgba(0,255,136,0)' }]
        }
      },
      itemStyle: { color: '#00ff88' },
    }]
  }), []);

  return (
    <PageContainer>
      <Header>
        <Logo>
          <div className="icon-wrapper">
            <div className="city">&#127961;</div>
          </div>
          <div className="title-group">
            <h1>城市基础设施管理平台</h1>
            <div className="subtitle">URBAN INFRASTRUCTURE MANAGEMENT PLATFORM</div>
          </div>
        </Logo>
        
        <HeaderStats>
          <StatItem color="#00ffff">
            <div className="value">{stats.total}<span className="unit">个</span></div>
            <div className="label">监测项目</div>
          </StatItem>
          <StatItem color="#00ff88">
            <div className="value">{stats.totalLength}<span className="unit">km</span></div>
            <div className="label">道路总长</div>
          </StatItem>
          <StatItem color="#ffaa00">
            <div className="value">{stats.completion}<span className="unit">%</span></div>
            <div className="label">完工进度</div>
          </StatItem>
          <StatItem color="#ff6b6b">
            <div className="value">2<span className="unit">个</span></div>
            <div className="label">重点区域</div>
          </StatItem>
        </HeaderStats>
        
        <TimeDisplay>
          <div className="time">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
          <div className="date">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}</div>
        </TimeDisplay>
      </Header>

      <MainContent>
        {/* 项目列表 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            <span className="title">工程项目列表</span>
            <div className="status"><div className="dot" /> {stats.total}个项目</div>
          </PanelHeader>
          <PanelBody>
            <ProjectList>
              {MONITOR_PROJECTS.map(project => (
                <ProjectCard 
                  key={project.id} 
                  active={activeProject?.id === project.id}
                  type={project.type}
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="name">{project.name}</div>
                  <div className="meta">
                    <span>{project.location}</span>
                    <span className="tag">{project.type === 'highway' ? '高速' : '市政'}</span>
                  </div>
                </ProjectCard>
              ))}
            </ProjectList>
          </PanelBody>
        </Panel>

        {/* 卫星地图 - 跨两行 */}
        <Panel span="span 2">
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span className="title">项目卫星分布图</span>
            <div className="status"><div className="dot" /> 实时定位</div>
          </PanelHeader>
          <PanelBody>
            <MapContainerFull id="amap-container">
              {!isMapLoaded && (!AMAP_KEY || AMAP_KEY.includes('YOUR_')) && (
                <Placeholder>
                  <div className="icon">&#127757;</div>
                  <h3>地图待配置</h3>
                  <p>请配置高德地图API Key</p>
                </Placeholder>
              )}
            </MapContainerFull>
          </PanelBody>
        </Panel>

        {/* 右侧上部：项目类型 + 关键指标 */}
        <RightTopPanel>
          {/* 项目类型 */}
          <MiniSection>
            <MiniTitle>项目类型分布</MiniTitle>
            <TypeRow>
              <TypeItem color="#00ff88">
                <span className="value">{stats.highway}</span>
                <span className="label">高速工程</span>
              </TypeItem>
              <TypeItem color="#ffaa00">
                <span className="value">{stats.municipal}</span>
                <span className="label">市政道路</span>
              </TypeItem>
            </TypeRow>
          </MiniSection>
          
          {/* 关键指标 */}
          <MiniSection>
            <MiniTitle>关键指标</MiniTitle>
            <StatsCompactGrid>
              <StatCompactCard color="#00ffff">
                <span className="label">项目总数</span>
                <span className="value">{stats.total}</span>
              </StatCompactCard>
              <StatCompactCard color="#ff6b6b">
                <span className="label">滨州项目</span>
                <span className="value">{stats.binzhou}</span>
              </StatCompactCard>
              <StatCompactCard color="#da70d6">
                <span className="label">青岛项目</span>
                <span className="value">{stats.qingdao}</span>
              </StatCompactCard>
              <StatCompactCard color="#00c8ff">
                <span className="label">其他区域</span>
                <span className="value">{stats.other}</span>
              </StatCompactCard>
            </StatsCompactGrid>
          </MiniSection>
        </RightTopPanel>

        {/* 右侧下部：月度进展 */}
        <Panel>
          <PanelHeader>
            <svg className="icon" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
            <span className="title">月度进展</span>
          </PanelHeader>
          <PanelBody>
            <ReactECharts option={monthlyOption} style={{ height: '100%' }} />
          </PanelBody>
        </Panel>
      </MainContent>
    </PageContainer>
  );
};

export default CityManagement;
