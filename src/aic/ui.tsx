import type { ReactNode } from 'react';
import { evaluate, segments, Snapshot } from './engine';
export type IconName = 'search' | 'overview' | 'sensors' | 'analysis' | 'tickets' | 'settings' | 'arrow' | 'download' | 'play' | 'pause' | 'layers' | 'pulse';
const paths: Record<IconName, string> = {
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  sensors: 'M8 16a6 6 0 1 1 8 0 M5 19a10 10 0 1 1 14 0 M12 13v8 M10 21h4',
  analysis: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
  tickets: 'M6 4h12v17H6z M9 2h6v4H9z M9 11h6 M9 15h6',
  settings: 'M4 7h16 M4 17h16 M9 4v6 M15 14v6',
  arrow: 'M5 12h14 M13 6l6 6-6 6', download: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
  play: 'M8 5l11 7-11 7z', pause: 'M8 5v14 M16 5v14', layers: 'M12 3L2 8l10 5 10-5z M2 12l10 5 10-5 M2 16l10 5 10-5',
  pulse: 'M2 12h5l3-8 4 16 3-8h5',
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>; }
export const formatTime = (value: string | number) => new Date(value).toLocaleTimeString('zh-CN', { hour12: false });
export const segmentName = (id: string) => segments.find(s => s.id === id)?.name || '全路段';
export const severityName = { high: '高优先级', medium: '需关注', low: '提示' };
export function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: string }) { return <span className={`badge ${tone}`}><i />{children}</span>; }
export function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) { return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div>; }
export function RoadMap({ snapshot, selected, onSelect, now }: { snapshot: Snapshot; selected: string; onSelect: (id: string) => void; now: number }) {
  const findings = evaluate(snapshot, 'all', now).findings;
  return <div className="road-map">
    <div className="map-caption"><span className="map-tag">DIGITAL ROAD NETWORK</span><span>青岛 · 示范道路场景 / 非地理实测</span></div>
    <svg className="road-svg" viewBox="0 0 800 370" role="img" aria-label="三个监测路段示意图；下方按钮可选择路段">
      <defs><pattern id="map-grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#253b48" strokeWidth=".5" /></pattern><linearGradient id="road-fill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#233e45"/><stop offset="1" stopColor="#122530"/></linearGradient></defs>
      <rect width="800" height="370" fill="url(#map-grid)" />
      <path d="M0 310Q160 250 230 320T500 320T800 260V370H0Z" fill="#133841" opacity=".4"/>
      <g fill="#152630" stroke="#30444e" strokeWidth="1">
        <path d="M55 158l75-40 65 35-73 39z M76 105l38-20 37 20-38 20z M180 84l63-33 75 40-63 34z M277 152l54-29 49 27-54 29z M424 81l65-34 58 31-65 34z M560 120l72-38 59 32-71 38z M644 57l46-25 47 26-46 25z M81 263l45-25 49 26-45 25z M434 274l62-32 58 31-61 32z M583 258l67-36 57 30-66 36z M661 306l45-24 43 23-45 24z" />
        <path d="M130 118v-27l65 35v27l-73 39v-27 M243 51V29l75 40v22l-63 34v-23 M489 47V26l58 31v21l-65 34v-21 M632 82V61l59 32v21l-71 38v-21" opacity=".6"/>
      </g>
      <path d="M-30 254L335 63M328 369L769 129" stroke="#1c323c" strokeWidth="27"/>
      <path d="M-30 254L335 63M328 369L769 129" stroke="#38515a" strokeWidth="1" strokeDasharray="8 10"/>
      <path d="M-45 196L175 274L400 155L621 211L850 89" fill="none" stroke="#0a161f" strokeWidth="72" strokeLinejoin="round"/>
      <path d="M-45 196L175 274L400 155L621 211L850 89" fill="none" stroke="#37545b" strokeWidth="64" strokeLinejoin="round"/>
      <path d="M-45 196L175 274L400 155L621 211L850 89" fill="none" stroke="url(#road-fill)" strokeWidth="60" strokeLinejoin="round"/>
      <path d="M-45 196L175 274L400 155L621 211L850 89" fill="none" stroke="#8faba8" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="10 10"/>
      <path className="road-stream" d="M-45 183L175 261L400 142L621 198L850 76" fill="none" stroke="#66e8c0" strokeWidth="2" strokeDasharray="4 70"/>
      <path d="M45 235L175 280L400 161L621 217L760 143" fill="none" stroke="#50d4aa" strokeOpacity=".55" strokeWidth="2"/>
      {segments.map((seg, i) => {
        const [x, y] = [[225, 248], [432, 163], [654, 188]][i];
        const color = findings.some(f => f.segment === seg.id) ? '#f3b568' : '#62e9bb';
        return <g key={seg.id}><ellipse cx={x} cy={y} rx="28" ry="13" fill={color} fillOpacity=".10" stroke={color} strokeOpacity={selected === seg.id ? 1 : .45}/><ellipse className="node-pulse" cx={x} cy={y} rx="16" ry="7" fill="none" stroke={color}/><path d={`M${x} ${y}v-55`} stroke={color} strokeDasharray="3 3" /><circle cx={x} cy={y - 55} r="5" fill={color}/><rect x={x - 62} y={y - 102} width="124" height="37" rx="5" fill="#11222d" stroke={color} strokeOpacity=".4"/><text x={x} y={y - 79} fill="#e3eee9" textAnchor="middle" fontSize="12">{seg.short}　{seg.name}</text></g>;
      })}
      <text x="28" y="340" fill="#65808a" fontSize="11" letterSpacing="2">RCCM · MULTI-SOURCE SENSING</text><path d="M754 318v-25l-6 10m6-10l6 10" stroke="#8eaaa9" fill="none"/><text x="750" y="285" fill="#8eaaa9" fontSize="12">N</text>
    </svg>
    <div className="map-controls">{segments.map(seg => <button key={seg.id} className={selected === seg.id ? 'selected' : ''} onClick={() => onSelect(selected === seg.id ? 'all' : seg.id)}><span>{seg.short}</span>{seg.name}<i className={findings.some(f => f.segment === seg.id) ? 'warn-dot' : 'ok-dot'}/></button>)}</div>
    <div className="map-legend"><span><i className="ok-dot"/>正常节点</span><span><i className="warn-dot"/>异常 / 数据缺失</span><span>示意范围 1.2 km · 3 个路段 · 18 个设备位</span></div>
  </div>;
}
