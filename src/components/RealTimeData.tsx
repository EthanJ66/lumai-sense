import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { Panel } from './Layout';
import { theme } from '../styles/theme';
import { experimentData } from '../data/experimentData';
import * as echarts from 'echarts';

const SubHeader = styled.h4`
  color: ${theme.colors.text.accent};
  font-family: ${theme.fonts.display};
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  border-left: 3px solid ${theme.colors.primary};
  padding-left: 8px;
  background: linear-gradient(90deg, rgba(0,240,255,0.1), transparent);
`;

const ModuleContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
  margin-bottom: 8px;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const KPIDisplay = styled.div`
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
`;

const ValueText = styled.div`
  font-family: ${theme.fonts.display};
  font-size: 1.8rem;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const LabelText = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

const RealTimeData: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const [tick, setTick] = useState(0);

  // Update tick every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Helper to get looping data
  const getData = (source: number[], offset: number = 0) => {
    return source[((tick + offset) % source.length + source.length) % source.length];
  };

  const historyLength = 20;
  const labels = Array.from({ length: historyLength }, (_, i) => {
    const d = new Date();
    d.setSeconds(d.getSeconds() - (historyLength - 1 - i) * 2);
    return d.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
  });

  // --- Module A: Storage Pulse Data ---
  const storageHistory = Array.from({ length: historyLength }, (_, i) => 
    getData(experimentData.storagePower, i - historyLength + 1)
  );

  const moduleAOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, bottom: 20, left: 40, right: 10 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 170,
      max: 230,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: theme.colors.text.secondary, fontSize: 10 }
    },
    series: [
      {
        type: 'line',
        data: storageHistory,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: theme.colors.primary,
          width: 2,
          shadowColor: theme.colors.primary,
          shadowBlur: 10
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 240, 255, 0.4)' },
            { offset: 1, color: 'rgba(0, 240, 255, 0)' }
          ])
        },
        markLine: {
          symbol: 'none',
          data: [{ yAxis: 210, label: { show: false } }],
          lineStyle: { color: theme.colors.danger, type: 'dashed', width: 1, opacity: 0.5 }
        }
      }
    ]
  };

  // --- Module B: Wireless Charging Efficiency ---
  const currentWireless = getData(experimentData.wirelessPower);
  const efficiency = ((currentWireless / 15) * 100).toFixed(1); // Mock efficiency based on max power

  const moduleBOption = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 20,
        splitNumber: 4,
        center: ['50%', '70%'],
        radius: '120%',
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.55, 'rgba(255,255,255,0.1)'], // 0-11 range
              [0.75, theme.colors.success],    // 11-15 range (High Efficiency)
              [1, 'rgba(255,255,255,0.1)']     // > 15
            ]
          }
        },
        pointer: { icon: 'triangle', length: '60%', width: 5, offsetCenter: [0, -10], itemStyle: { color: theme.colors.success } },
        axisTick: { show: false },
        splitLine: { length: 8, lineStyle: { color: 'auto', width: 2 } },
        axisLabel: { color: '#666', fontSize: 9, distance: -15 },
        detail: { show: false },
        data: [{ value: currentWireless }]
      },
      // Green Threshold Line at 85% (approx 17kW on 20 scale, but user asked for "Green threshold line at 85% position" visually or logically?
      // User said "11-15 interval" is where the pointer usually is. 
      // User said "draw green threshold line at 85% position, label 'High Efficiency Area'".
      // 85% of 20kW is 17kW. But the data is 11-15. Let's interpret "High Efficiency Area" as the target zone.
      // I will add an annotation/graphic for the "High Efficiency" label.
    ]
  };

  // --- Module C: Snow Melt Power ---
  const snowMeltHistory = Array.from({ length: historyLength }, (_, i) =>
    getData(experimentData.snowMeltingPower, i - historyLength + 1)
  );

  const currentSnowPower = getData(experimentData.snowMeltingPower);

  // --- Module D: Carbon Sequestration ---
  const currentCarbon = getData(experimentData.carbonSequestration);
  const carbonHistory = Array.from({ length: 10 }, (_, i) =>
    getData(experimentData.carbonSequestration, i - 10 + 1)
  );
  const avgCarbon = (carbonHistory.reduce((a, b) => a + b, 0) / carbonHistory.length).toFixed(1);

  const moduleDOption = {
    backgroundColor: 'transparent',
    grid: { top: 5, bottom: 5, left: 10, right: 10 },
    xAxis: {
      type: 'category',
      data: carbonHistory.map((_, i) => i + 1),
      show: false
    },
    yAxis: {
      type: 'value',
      min: 30,
      max: 60,
      show: false
    },
    series: [
      {
        type: 'bar',
        data: carbonHistory.map(v => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#52c41a' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.3)' }
            ])
          }
        })),
        barWidth: '60%',
        backgroundStyle: {
          color: 'rgba(255,255,255,0.05)'
        },
        showBackground: true
      }
    ]
  };

  const moduleCOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, bottom: 20, left: 40, right: 10 },
    tooltip: { 
      trigger: 'axis',
      formatter: (params: any) => {
        const val = params[0].value;
        return `功率: ${val} kW/m²<br/><span style="color:${theme.colors.warning}">●</span> 当前路面温度 2.1°C<br/>融雪进行中`;
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0.8,
      max: 1.2,
      splitLine: { show: false },
      axisLabel: { color: theme.colors.text.secondary, fontSize: 10 }
    },
    series: [
      {
        type: 'line',
        data: snowMeltHistory,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: theme.colors.warning },
            { offset: 1, color: 'rgba(250, 140, 22, 0.1)' }
          ])
        }
      }
    ]
  };

  return (
    <Panel title="实时数据流" style={style}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Module A */}
        <ModuleContainer>
          <SubHeader>A. 储能系统脉搏</SubHeader>
          <div style={{ flex: 1, position: 'relative' }}>
             <ReactECharts option={moduleAOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </ModuleContainer>

        {/* Module B */}
        <ModuleContainer>
          <SubHeader>B. 无线充电效能</SubHeader>
          <div style={{ flex: 1, position: 'relative' }}>
            <ReactECharts option={moduleBOption} style={{ height: '100%', width: '100%' }} />
            <KPIDisplay>
              <ValueText style={{ color: theme.colors.success }}>{currentWireless} <span style={{fontSize: '1rem'}}>kW</span></ValueText>
              <LabelText>转换效率 {efficiency}%</LabelText>
              <LabelText style={{ color: theme.colors.success, marginTop: '4px', fontSize: '0.7rem', border: `1px solid ${theme.colors.success}`, padding: '0 4px', borderRadius: '4px' }}>
                高效区
              </LabelText>
            </KPIDisplay>
          </div>
        </ModuleContainer>

        {/* Module C */}
        <ModuleContainer>
          <SubHeader>C. 融雪功率监测</SubHeader>
          <div style={{ flex: 1 }}>
            <ReactECharts option={moduleCOption} style={{ height: '100%', width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '-15px', position: 'relative', zIndex: 10 }}>
               <span style={{ fontSize: '0.75rem', color: theme.colors.warning }}>实时: {currentSnowPower} kW/m²</span>
               <span style={{ fontSize: '0.75rem', color: '#fff' }}>状态: 运行中</span>
            </div>
          </div>
        </ModuleContainer>

        {/* Module D */}
        <ModuleContainer>
          <SubHeader>D. 固碳量监测</SubHeader>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '60px' }}>
              <ReactECharts option={moduleDOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <div style={{ textAlign: 'right', minWidth: '80px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#52c41a', fontFamily: theme.fonts.display }}>
                {currentCarbon}
              </div>
              <div style={{ fontSize: '0.7rem', color: theme.colors.text.secondary }}>kg CO₂/m³</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                均值: {avgCarbon}
              </div>
            </div>
          </div>
        </ModuleContainer>

      </div>
    </Panel>
  );
};

export default RealTimeData;
