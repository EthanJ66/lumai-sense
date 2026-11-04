import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Panel } from './Layout';
import { theme } from '../styles/theme';

const UsageRatio: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      bottom: '5%',
      left: 'center',
      textStyle: { color: theme.colors.text.primary }
    },
    series: [
      {
        name: '应用占比',
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#0a0b1e',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text.primary
          }
        },
        labelLine: { show: false },
        data: [
          { value: 65, name: '自融雪系统', itemStyle: { color: theme.colors.primary } },
          { value: 35, name: '无线充电', itemStyle: { color: theme.colors.secondary } },
        ]
      }
    ]
  };

  return (
    <Panel title="应用场景占比" style={{ ...style, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </Panel>
  );
};

export default UsageRatio;
