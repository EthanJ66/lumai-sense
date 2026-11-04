# 赤泥基复合储能材料多功能道路系统可视化监控平台

## 项目简介

本项目是一款面向赤泥基复合储能材料(RCCM)多功能道路系统的智能可视化监控平台，用于展示智能道路的储能、无线充电、融雪除冰、碳封存等功能。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **3D渲染**: Three.js + @react-three/fiber
- **数据可视化**: ECharts 5
- **样式方案**: styled-components

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── components/           # 可视化组件
│   ├── DigitalTwin.tsx      # 数字孪生3D场景
│   ├── RealTimeData.tsx     # 实时数据面板
│   ├── MicroscopicMechanism.tsx  # 微观机理
│   ├── WarningSystem.tsx    # 预警系统
│   ├── UsageRatio.tsx       # 使用占比
│   ├── Header.tsx           # 顶部导航
│   ├── Layout.tsx           # 布局组件
│   └── CategorySelector.tsx # 分类选择器
├── data/
│   └── experimentData.ts    # 实验数据
├── pages/                # 应用场景页面
│   ├── CityManagement.tsx   # 城市管理
│   ├── Healthcare.tsx       # 医药卫生
│   ├── Sports.tsx           # 运动健身
│   ├── DigitalLife.tsx      # 数字生活
│   ├── Industry.tsx         # 行业应用
│   ├── IoT.tsx              # 物联网专项
│   └── IoTInnovation.tsx    # 物联网创新
├── context/              # 状态管理
│   └── CategoryContext.tsx
├── styles/               # 样式主题
│   ├── theme.ts
│   └── GlobalStyles.ts
└── App.tsx               # 主应用入口
```

## 功能特性

### 主页面
- **数字孪生场景**: 3D可视化展示智能道路运行状态
- **实时数据监控**: 储能、充电、融雪、固碳四大指标
- **微观机理展示**: 双电层/赝电容协同效应动画
- **预警系统**: 智能监测异常并预警

### 应用场景
- 城市管理、医药卫生、运动健身
- 数字生活、行业应用
- 物联网专项、物联网创新转化

## 数据说明

实验数据来源于实验室实测：

| 指标 | 范围 | 单位 |
|-----|------|-----|
| 储能功率 | 180-220 | W/(m·h) |
| 无线充电 | 11-15 | kW |
| 融雪功率 | 0.8-1.2 | kW/m² |
| 固碳量 | 35-55 | kg CO₂/m³ |

## 许可证

MIT License
