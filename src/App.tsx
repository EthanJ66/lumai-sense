import { lazy, Suspense, useState } from 'react';
import Dashboard from './aic/Dashboard';
const LegacyDashboard = lazy(() => import('./LegacyDashboard'));
export default function App() {
  const [legacy, setLegacy] = useState(false);
  if (legacy) return <Suspense fallback={<div className="aic-loading">正在加载道路专题…</div>}>
    <LegacyDashboard />
    <div className="aic-legacy-bar"><button onClick={() => setLegacy(false)}>← 返回路脉智感</button><span>原版道路专题 · 演示数据，未连接现场设备</span></div>
  </Suspense>;
  return <Dashboard onLegacy={() => setLegacy(true)} />;
}
