import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { demoHistory, evaluate, isFresh, Kind, metrics, sampleNoise, Scenario, scenarios, segments, sensorSpecs, Snapshot } from './engine';
import { Badge, formatTime, Icon, SectionTitle, segmentName, severityName } from './ui';

export function GatewayPanel({ snapshot, now, paused, compact = false, onScenario }: { snapshot: Snapshot; now: number; paused: boolean; compact?: boolean; onScenario?: (scenario: Scenario) => void }) {
  const demo = snapshot.source === 'demo';
  const online = snapshot.sensors.filter(s => isFresh(s, now)).length;
  const healthy = segments.filter(seg => snapshot.sensors.filter(s => s.segment === seg.id && isFresh(s, now)).length === 6).length;
  return <section className={`connection-console ${compact ? 'compact-console' : ''}`}>
    <div className="connection-hero">
      <div className="connection-emblem"><Icon name="sensors" size={32}/><i/><i/></div>
      <div className="connection-title"><span className="eyebrow">EDGE NETWORK / {demo ? 'SIMULATION' : 'API TELEMETRY'}</span><h2>{paused ? '数据流已暂停' : healthy === 3 ? '感知网络已就绪' : '感知网络需要关注'}<Badge tone={paused || healthy < 3 ? 'amber' : 'green'}>{demo ? '模拟接入' : '采集接口'}</Badge></h2><p>{demo ? '18 个传感器 · 3 台边缘网关 · 本地模拟器持续推送' : '已校验接口快照 · 根据设备心跳展示实际覆盖状态'}</p></div>
      <div className="connection-score"><strong>{online}<small>/18</small></strong><span>有效在线节点</span></div>
    </div>
    {!compact && <div className="data-path"><div><Icon name="sensors"/><b>传感器阵列</b><small>温湿度 / 结构 / 储能</small></div><span className="path-line"/><div><Icon name="layers"/><b>边缘网关</b><small>{demo ? 'Modbus / CAN · 模拟' : 'HTTP 采集接口'}</small></div><span className="path-line"/><div><Icon name="pulse"/><b>数据处理</b><small>每 3 秒更新 · 心跳校验</small></div><span className="path-line"/><div><Icon name="analysis"/><b>路脉智感</b><small>可视化 / 检索 / 研判</small></div></div>}
    <div className="gateway-grid">{segments.map((seg, i) => {
      const devices = snapshot.sensors.filter(s => s.segment === seg.id);
      const count = devices.filter(s => isFresh(s, now)).length;
      const connected = count === 6;
      const noise = sampleNoise(Math.floor(Date.parse(snapshot.at) / 3000) + i * 93);
      return <article className={`gateway-card ${connected ? '' : 'gateway-warning'}`} key={seg.id}>
        <div className="gateway-head"><span className="gateway-icon"><Icon name="sensors"/></span><div><b>{seg.gateway}</b><small>{seg.name}</small></div><Badge tone={connected && !paused ? 'green' : 'amber'}>{paused ? '已暂停' : connected ? '在线' : '链路异常'}</Badge></div>
        <div className="gateway-metrics"><div><span>节点覆盖</span><b>{count}<small> / 6</small></b></div><div><span>{demo ? '模拟延迟' : '网络延迟'}</span><b>{demo && connected && !paused ? Math.round(18 + noise * 24) : '—'}<small> ms</small></b></div><div><span>{demo ? '模拟信号' : '信号强度'}</span><b>{demo && connected && !paused ? -Math.round(54 + noise * 13) : '—'}<small> dBm</small></b></div></div>
        {!compact && <dl className="gateway-details"><dt>网关型号</dt><dd>{demo ? 'AIC Edge G200 · 示例' : '接口未提供'}</dd><dt>传输链路</dt><dd>{demo ? '工业以太网 / MQTT · 模拟' : 'HTTP API'}</dd><dt>Topic</dt><dd>{demo ? `aic/road/${seg.id.toLowerCase()}/telemetry` : '不适用'}</dd><dt>路段桩号</dt><dd>{seg.chainage}</dd><dt>最近快照</dt><dd>{formatTime(snapshot.at)}</dd></dl>}
        <div className="gateway-track">{Array.from({ length: 20 }, (_, index) => <i key={index} style={{ height: `${connected && !paused ? 20 + sampleNoise(index + i * 93) * 75 : 8}%` }}/>)}</div>
      </article>;
    })}</div>
    {!compact && demo && <div className="scenario-control"><div><span className="eyebrow">SCENARIO LAB</span><h3>场景与异常演练</h3><p>正常模式有界波动；异常模式联动设备、地图与研判。</p></div><div className="scenario-buttons">{(Object.entries(scenarios) as [Scenario, typeof scenarios[Scenario]][]).map(([id, item]) => <button key={id} className={snapshot.scenario === id ? 'selected' : ''} onClick={() => onScenario?.(id)} title={item.description}><i className={id === 'normal' ? 'ok-dot' : 'warn-dot'}/>{item.name}</button>)}</div></div>}
  </section>;
}

type QueryResult = { frames: Snapshot[]; segment: string; kind: Kind; source: 'demo' | 'sensor'; scenario: Scenario; queriedAt: number; hours: number };
export function DataExplorer({ source, scenario, history, scope }: { source: 'demo' | 'sensor'; scenario: Scenario; history: Snapshot[]; scope: string }) {
  const [segment, setSegment] = useState(scope);
  const [kind, setKind] = useState<Kind>('temperature');
  const [hours, setHours] = useState(.25);
  const [mode, setMode] = useState<'readings' | 'events'>('readings');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<QueryResult>(() => ({ frames: source === 'demo' ? demoHistory(scenario, 101, Date.now(), 9000) : history, segment: scope, kind: 'temperature', source, scenario, queriedAt: Date.now(), hours: .25 }));
  const execute = () => {
    const time = Date.now();
    const frames = source === 'demo' ? demoHistory(scenario, 101, time, hours * 3600000 / 100) : history.filter(h => Date.parse(h.at) >= time - hours * 3600000);
    setResult({ frames, segment, kind, source, scenario, queriedAt: time, hours }); setPage(0);
  };
  const rows = useMemo(() => result.frames.flatMap(frame => frame.sensors.filter(s => (result.segment === 'all' || s.segment === result.segment) && s.kind === result.kind).map(s => ({ ...s, valid: isFresh(s, Date.parse(frame.at)), sampledAt: frame.at }))).reverse(), [result]);
  const events = useMemo(() => result.frames.flatMap(frame => evaluate(frame, result.segment, Date.parse(frame.at)).findings.map(f => ({ ...f, at: frame.at }))).reverse(), [result]);
  const valid = rows.filter(r => r.valid).map(r => r.value);
  const meta = metrics[result.kind];
  const fixed = (value: number) => value.toFixed(result.kind === 'vibration' ? 3 : 1);
  const total = mode === 'readings' ? rows.length : events.length;
  const pageCount = Math.max(1, Math.ceil(total / 12));
  const exportCsv = () => {
    const label = result.source === 'demo' ? `模拟数据-${scenarios[result.scenario].name}` : '采集接口';
    const content = mode === 'readings'
      ? [['时间', '设备', '路段', '指标', '读数', '单位', '状态', '来源'], ...rows.map(r => [r.sampledAt, r.id, segmentName(r.segment), metrics[r.kind].name, r.valid ? r.value : '', r.unit, r.valid ? '有效' : '离线或过期', label])]
      : [['时间', '路段', '事件', '优先级', '证据', '建议', '来源'], ...events.map(e => [e.at, segmentName(e.segment), e.title, severityName[e.severity], e.evidence, e.action, label])];
    const csv = content.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `路脉智感-${label}-${mode}-${result.queriedAt}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const dirty = segment !== result.segment || kind !== result.kind || hours !== result.hours;
  return <div className="explorer">
    <section className="panel query-panel"><SectionTitle eyebrow="TELEMETRY ARCHIVE" title="数据检索中心" action={<Badge tone="blue">{source === 'demo' ? '模拟历史库' : '会话采集记录'}</Badge>}/><div className="query-form"><label>监测路段<select aria-label="检索路段" value={segment} onChange={e => setSegment(e.target.value)}><option value="all">全部路段</option>{segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>监测指标<select aria-label="检索指标" value={kind} onChange={e => setKind(e.target.value as Kind)}>{Object.entries(metrics).map(([id, m]) => <option key={id} value={id}>{m.name}</option>)}</select></label><label>时间范围<select aria-label="检索时间范围" value={hours} onChange={e => setHours(Number(e.target.value))}><option value={.25}>最近 15 分钟</option><option value={1}>最近 1 小时</option><option value={24}>最近 24 小时</option></select></label><button className="primary" onClick={execute}><Icon name="search" size={17}/>检索数据</button><button className="secondary" disabled={!total} onClick={exportCsv}><Icon name="download" size={16}/>导出 CSV</button></div><p className="query-note" role="status">{dirty ? '筛选条件已改变，点击“检索数据”更新结果。' : `检索完成 · ${result.frames.length} 个采样时刻 · ${formatTime(result.queriedAt)}`}<span>{source === 'demo' ? `当前场景：${scenarios[result.scenario].name} · 按时间种子生成，可复现；非实测历史记录。` : '仅检索当前会话中实际收到的快照，不补造历史记录。'}</span></p></section>
    <div className="query-stats">{[['有效读数', String(valid.length), '条'], ['平均值', valid.length ? fixed(valid.reduce((a, b) => a + b, 0) / valid.length) : '—', meta.unit], ['最小值', valid.length ? fixed(Math.min(...valid)) : '—', meta.unit], ['最大值', valid.length ? fixed(Math.max(...valid)) : '—', meta.unit]].map(([title, value, unit]) => <div className="panel" key={title}><span>{title}</span><b>{value}<small>{unit}</small></b></div>)}</div>
    <section className="panel"><SectionTitle eyebrow="HISTORICAL SIGNAL" title={`${meta.name} · 历史趋势`} action={<span className="muted">{segmentName(result.segment)}</span>}/><ReactECharts style={{ height: 260 }} option={{ animation: false, tooltip: { trigger: 'axis' }, legend: { textStyle: { color: '#86a9bd' }, bottom: 0 }, grid: { top: 24, bottom: 65, left: 55, right: 22 }, xAxis: { type: 'category', data: result.frames.map(f => formatTime(f.at)), axisLabel: { color: '#698da3' }, axisLine: { lineStyle: { color: '#1c3a50' } } }, yAxis: { type: 'value', scale: true, name: meta.unit, nameTextStyle: { color: '#698da3' }, axisLabel: { color: '#698da3' }, splitLine: { lineStyle: { color: '#163145', type: 'dashed' } } }, series: segments.filter(s => result.segment === 'all' || s.id === result.segment).map((s, i) => ({ name: s.name, type: 'line', showSymbol: false, smooth: .25, connectNulls: false, lineStyle: { width: 2 }, itemStyle: { color: ['#4de1ff', '#8c8aff', '#44e4bb'][i] }, data: result.frames.map(f => { const sensor = f.sensors.find(v => v.segment === s.id && v.kind === result.kind); return sensor && isFresh(sensor, Date.parse(f.at)) ? sensor.value : null; }) })) }} notMerge/></section>
    <section className="panel result-panel"><div className="result-heading"><div className="tab-switch"><button className={mode === 'readings' ? 'selected' : ''} onClick={() => { setMode('readings'); setPage(0); }}>采样记录 <span>{rows.length}</span></button><button className={mode === 'events' ? 'selected' : ''} onClick={() => { setMode('events'); setPage(0); }}>异常检索 <span>{events.length}</span></button></div><span className="muted">{result.source === 'demo' ? 'SIMULATED DATA' : 'API DATA'} · 时间倒序</span></div><div className="table-scroll"><table>{mode === 'readings' ? <><thead><tr><th>采样时间</th><th>设备编号</th><th>路段 / 指标</th><th>读数</th><th>采样质量</th></tr></thead><tbody>{rows.slice(page * 12, page * 12 + 12).map(r => <tr key={`${r.sampledAt}-${r.id}`}><td>{new Date(r.sampledAt).toLocaleString('zh-CN', { hour12: false })}</td><td className="mono">{r.id}</td><td>{segmentName(r.segment)} · {meta.name}</td><td className="reading-value">{r.valid ? fixed(r.value) : '—'} <small>{r.unit}</small></td><td><Badge tone={r.valid ? 'green' : 'amber'}>{r.valid ? '有效' : '无有效读数'}</Badge></td></tr>)}</tbody></> : <><thead><tr><th>发生时间</th><th>路段</th><th>事件</th><th>等级</th><th>关联证据</th></tr></thead><tbody>{events.slice(page * 12, page * 12 + 12).map(e => <tr key={`${e.at}-${e.id}`}><td>{new Date(e.at).toLocaleString('zh-CN', { hour12: false })}</td><td>{segmentName(e.segment)}</td><td>{e.title}</td><td><Badge tone={e.severity === 'high' ? 'amber' : 'blue'}>{severityName[e.severity]}</Badge></td><td className="evidence-cell">{e.evidence}</td></tr>)}</tbody></>}</table></div>{!total && <div className="empty-state"><Icon name="search" size={28}/><p>{mode === 'events' ? '当前时段未检索到异常事件' : '当前条件没有采样记录'}</p><small>{source === 'demo' ? '可切换低温、重载或离线场景，再进行检索。' : '等待采集数据或调整筛选条件。'}</small></div>}<div className="pagination"><span>共 {total} 条 · 第 {page + 1} / {pageCount} 页</span><div><button className="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>上一页</button><button className="secondary" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>下一页</button></div></div></section>
    {source === 'demo' && <section className="panel range-panel"><SectionTitle eyebrow="SIMULATION PARAMETERS" title="正常场景数据范围" action={<Badge tone="neutral">演示参数 · 非工程限值</Badge>}/><div className="range-grid">{Object.entries(sensorSpecs).map(([key, spec]) => <div key={key}><span>{metrics[key as Kind].name}</span><b>{spec.range[0]} – {spec.range[1]} <small>{metrics[key as Kind].unit}</small></b></div>)}</div></section>}
  </div>;
}
