import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Analysis, createDemoTickets, demoHistory, demoSnapshot, endpointUrl, evaluate, fetchAnalysis, fetchSnapshot, Finding, isFresh, Kind, metrics, reading, Scenario, scenarios, segments, sensorSpecs, Snapshot, Ticket } from './engine';
import { Badge, formatTime, Icon, RoadMap, SectionTitle, segmentName, severityName } from './ui';
import { DataExplorer, GatewayPanel } from './Connected';
import WorkflowCenter from './WorkflowCenter';
import './dashboard.css';
import './technology.css';
type View = 'overview' | 'sensors' | 'analysis' | 'tickets' | 'settings' | 'search';
const nav: { id: View; label: string }[] = [{ id: 'overview', label: '感知总览' }, { id: 'sensors', label: '设备网络' }, { id: 'search', label: '数据检索' }, { id: 'analysis', label: 'AI 研判中心' }, { id: 'tickets', label: '事件处置' }];
function loadTickets(): Ticket[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem('aic-tickets-v1') || '[]');
    return Array.isArray(data) ? data.filter((x): x is Ticket => !!x && typeof x.id === 'string' && ['pending', 'done'].includes(x.status) && ['demo', 'sensor'].includes(x.dataSource) && typeof x.createdAt === 'string' && x.finding && typeof x.finding.title === 'string' && typeof x.finding.action === 'string' && ['high', 'medium', 'low'].includes(x.finding.severity) && segments.some(s => s.id === x.finding.segment)).slice(0, 200) : [];
  } catch { return []; }
}
export default function Dashboard({ onLegacy }: { onLegacy: () => void }) {
  const [view, setView] = useState<View>('overview');
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [mode, setMode] = useState<'demo' | 'sensor'>('demo');
  const [snapshot, setSnapshot] = useState<Snapshot>(() => demoSnapshot('normal', 0));
  const [history, setHistory] = useState<Snapshot[]>(() => demoHistory('normal'));
  const [scope, setScope] = useState('all');
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [feedError, setFeedError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [sensorEndpoint, setSensorEndpoint] = useState('/api/telemetry');
  const [aiEndpoint, setAiEndpoint] = useState('/api/analyze');
  const [activeEndpoint, setActiveEndpoint] = useState('');
  const [serviceAI, setServiceAI] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [query, setQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [chartKind, setChartKind] = useState<Kind>('temperature');
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [confirmTicket, setConfirmTicket] = useState<Ticket | null>(null);
  const [toast, setToast] = useState('');
  const analysisController = useRef<AbortController | null>(null);
  const connectController = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);
  const sampleTick = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { setTickets(current => current.length ? current : createDemoTickets()); }, []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { try { localStorage.setItem('aic-tickets-v1', JSON.stringify(tickets)); } catch { setToast('浏览器存储不可用，处置记录仅保留在本次会话。'); } }, [tickets]);
  useEffect(() => { mainRef.current?.scrollTo(0, 0); }, [view]);
  useEffect(() => () => { analysisController.current?.abort(); connectController.current?.abort(); requestVersion.current++; }, []);
  useEffect(() => {
    if (paused) return;
    let disposed = false; let busy = false; let controller: AbortController | null = null;
    const sample = async () => {
      if (busy) return;
      busy = true; let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        let next: Snapshot;
        if (mode === 'demo') next = demoSnapshot(scenario, sampleTick.current++);
        else { controller = new AbortController(); timeout = setTimeout(() => controller?.abort(), 8000); next = await fetchSnapshot(activeEndpoint, controller.signal); }
        if (disposed) return;
        setSnapshot(next); setFeedError(''); setHistory(h => [...h, next].slice(-60));
      } catch (e) { if (!disposed) setFeedError(e instanceof Error ? (e.name === 'AbortError' ? '采集请求超时，保留最后快照；不回填模拟数据。' : e.message) : '采集失败'); }
      finally { clearTimeout(timeout); busy = false; }
    };
    void sample(); const timer = setInterval(sample, 3000);
    return () => { disposed = true; clearInterval(timer); controller?.abort(); };
  }, [mode, scenario, paused, activeEndpoint]);
  useEffect(() => {
    if (!selectedSensor && !confirmTicket) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedSensor(null); setConfirmTicket(null); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [selectedSensor, confirmTicket]);
  const invalidateAnalysis = () => { requestVersion.current++; analysisController.current?.abort(); setAnalyzing(false); setAnalysis(null); setAnalysisError(''); };
  const changeScope = (id: string) => { setScope(id); invalidateAnalysis(); setSelectedSensor(null); };
  const changeScenario = (next: Scenario) => {
    connectController.current?.abort(); connectController.current = null; setConnecting(false); invalidateAnalysis(); sampleTick.current = 0; setScenario(next); setMode('demo'); setPaused(false); setFeedError(''); setConnectionError(''); setHistory(demoHistory(next)); setSnapshot(demoSnapshot(next, 0)); setSelectedSensor(null);
  };
  const runAnalysis = async () => {
    analysisController.current?.abort(); const controller = new AbortController(); analysisController.current = controller;
    const version = ++requestVersion.current; const captured = snapshot; const selectedScope = scope;
    setAnalyzing(true); setAnalysisError(''); let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      timer = setTimeout(() => controller.abort(), 20000);
      const result = serviceAI ? await fetchAnalysis(aiEndpoint, captured, selectedScope, controller.signal) : evaluate(captured, selectedScope);
      if (version !== requestVersion.current) return;
      setAnalysis(result); setToast(serviceAI ? '分析服务已返回结果。' : '已完成本地规则研判，可查看证据与处置建议。');
    } catch (e) { if (version === requestVersion.current) setAnalysisError(e instanceof Error ? (e.name === 'AbortError' ? '分析超时，请检查服务。' : e.message) : '分析失败'); }
    finally { clearTimeout(timer); if (version === requestVersion.current) setAnalyzing(false); }
  };
  const connect = async () => {
    connectController.current?.abort(); const controller = new AbortController(); connectController.current = controller; let timer: ReturnType<typeof setTimeout> | undefined;
    setConnecting(true); setConnectionError('');
    try { const endpoint = endpointUrl(sensorEndpoint); timer = setTimeout(() => controller.abort(), 8000); const next = await fetchSnapshot(endpoint, controller.signal);
      if (controller !== connectController.current) return;
      invalidateAnalysis(); setSnapshot(next); setHistory([]); setMode('sensor'); setPaused(false); setActiveEndpoint(endpoint); setToast('已收到并校验采集接口快照，开始每 3 秒轮询。');
    } catch (e) { if (controller === connectController.current) setConnectionError(e instanceof Error ? (e.name === 'AbortError' ? '连接超时，请检查接口地址。' : e.message) : '连接失败'); }
    finally { clearTimeout(timer); if (controller === connectController.current) setConnecting(false); }
  };
  const createTicket = (finding: Finding) => {
    const dataSource = analysis?.dataSource || snapshot.source;
    if (tickets.some(t => t.finding.id === finding.id && t.status === 'pending' && t.dataSource === dataSource)) { setToast('该事件已有待处理记录，请前往事件处置。'); return; }
    const ticket: Ticket = { id: `WO-${Date.now()}`, finding, createdAt: new Date().toISOString(), status: 'pending', dataSource };
    setTickets(t => [ticket, ...t].slice(0, 200)); setToast('已创建本机处置记录，未向现场设备或人员发送指令。');
  };
  const exportReport = () => {
    if (!analysis) return;
    const report = { project: '路脉智感-道路智能感知平台', exportedAt: new Date().toISOString(), disclaimer: '演示数据与本地规则不代表实测结果或真实 AI 模型推理。建议需人工复核，不自动控制道路设备。', analysis, tickets: tickets.filter(t => t.dataSource === analysis.dataSource) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `路脉智感-研判报告-${analysis.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setToast('已导出带数据来源和分析时间的 JSON 报告。');
  };
  const devices = snapshot.sensors.filter(s => scope === 'all' || s.segment === scope);
  const online = devices.filter(s => isFresh(s, now)).length;
  const expected = scope === 'all' ? 18 : 6;
  const currentFindings = evaluate(snapshot, scope, now).findings;
  const high = currentFindings.filter(f => f.severity === 'high').length;
  const sensor = snapshot.sensors.find(s => s.id === selectedSensor);
  const displayedDevices = devices.filter(s => `${s.id} ${metrics[s.kind].name} ${segmentName(s.segment)}`.toLowerCase().includes(query.toLowerCase()) && (deviceFilter === 'all' || (deviceFilter === 'online' ? isFresh(s, now) : !isFresh(s, now))));
  const watts = segments.filter(s => scope === 'all' || s.id === scope).map(s => { const v = reading(snapshot, s.id, 'voltage', now); const a = reading(snapshot, s.id, 'current', now); return v === null || a === null ? null : v * a; });
  const power = watts.every(x => x !== null) ? (watts as number[]).reduce((a, b) => a + b, 0) : null;
  const heroTitle = view === 'overview' ? '让每一段道路，都有感知。' : view === 'search' ? '每一帧数据，都有迹可循。' : view === 'sensors' ? '从一个节点，看见整条道路。' : view === 'analysis' ? '从多源数据，到可追溯研判。' : view === 'tickets' ? '让风险有回应，让处置有记录。' : '感知网络，连接每一个节点。';
  const age = Math.max(0, Math.floor((now - Date.parse(snapshot.at)) / 1000));
  const chartOption = {
    backgroundColor: 'transparent', animation: false,
    tooltip: { trigger: 'axis', backgroundColor: '#172331', borderColor: '#354957', textStyle: { color: '#d9e8e4' }, valueFormatter: (v: unknown) => v == null ? '无有效数据' : `${Number(v).toFixed(chartKind === 'vibration' ? 3 : 1)} ${metrics[chartKind].unit}` },
    grid: { left: 50, right: 20, top: 24, bottom: 30 },
    xAxis: { type: 'category', data: history.map(h => formatTime(h.at)), boundaryGap: false, axisLine: { lineStyle: { color: '#293744' } }, axisTick: { show: false }, axisLabel: { color: '#7f939e', fontSize: 10 } },
    yAxis: { type: 'value', scale: true, name: metrics[chartKind].unit, nameTextStyle: { color: '#7f939e' }, splitLine: { lineStyle: { color: '#202f3a', type: 'dashed' } }, axisLabel: { color: '#7f939e', fontSize: 10 } },
    series: segments.filter(s => scope === 'all' || s.id === scope).map((seg, i) => ({ name: seg.name, type: 'line', smooth: .25, showSymbol: history.length < 3, symbolSize: 5, connectNulls: false, lineStyle: { width: 2 }, itemStyle: { color: ['#62dfb8', '#79a8ef', '#e9b575'][i] }, data: history.map(h => reading(h, seg.id, chartKind, Date.parse(h.at))), areaStyle: { opacity: .025 } })),
  };
  const analysisPanel = (full = false) => <section className={`panel intelligence ${full ? 'full-analysis' : ''}`}>
    <SectionTitle eyebrow="AIC INTELLIGENCE" title="道路智能研判" action={<span className="ai-mark"><Icon name="analysis" size={16}/> AI</span>}/>
    <div className="engine-label"><i className="ok-dot"/>{serviceAI ? '外部分析服务 · 按需请求' : '演示分析引擎 · 本地规则'}</div>
    <div className="ai-orb"><Icon name="analysis" size={32}/><span/></div>
    <h3>{analysis ? (analysis.findings.length ? '已识别需关注事件' : '本轮研判已完成') : '多源融合，提前发现风险'}</h3>
    <p className="analysis-summary">{analysis ? analysis.summary : '关联温湿度、结构响应与储能读数，生成带证据的风险提示与处置建议。点击下方按钮分析当前快照。'}</p>
    <div className="analysis-pipeline"><span>01 数据采集</span><b>→</b><span>02 交叉研判</span><b>→</b><span>03 人工复核</span></div>
    {analysis && <div className="analysis-meta">{analysis.source === 'rules' ? '本地规则分析，非 AI 模型推理' : '外部服务返回，结果需人工复核'}<br/>数据：{analysis.dataSource === 'demo' ? '模拟传感器' : '采集接口'} · 快照 {formatTime(analysis.snapshotAt)} · {segmentName(analysis.scope)}{analysis.snapshotAt !== snapshot.at && <span className="historical-note">固定快照报告；查看最新状态请重新研判</span>}</div>}
    {analysisError && <div role="alert" className="error-box">{analysisError}</div>}
    <button className="primary analyze-button" onClick={runAnalysis} disabled={analyzing}><Icon name="analysis" size={17}/>{analyzing ? '正在请求分析服务…' : analysis ? '重新研判当前快照' : '生成智能研判'}<Icon name="arrow" size={17}/></button>
    {full && analysis && <div className="finding-list">{analysis.findings.map(f => <article className="finding" key={f.id}><div className="finding-head"><Badge tone={f.severity === 'high' ? 'amber' : 'blue'}>{severityName[f.severity]}</Badge><span>{segmentName(f.segment)}</span></div><h3>{f.title}</h3><p><b>依据</b> {f.evidence}</p><p><b>建议</b> {f.action}</p><button className="secondary" onClick={() => createTicket(f)}>创建处置记录 <Icon name="arrow" size={15}/></button></article>)}{!analysis.findings.length && <div className="empty-state">本轮没有触发规则的事件。仍需结合现场状况判断。</div>}</div>}
    {!full && <button className="text-button" onClick={() => setView('analysis')}>进入研判中心 <Icon name="arrow" size={14}/></button>}
  </section>;
  return <div className="aic-app">
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="路脉智感-道路智能感知平台" onClick={e => { e.preventDefault(); setView('overview'); }}><span className="brand-symbol"><svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M10 33L17 8M30 33L23 8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/><path d="M20 30v-5m0-5v-4" stroke="#d9f8ff" strokeWidth="2" strokeLinecap="round"/><path d="M5 16a19 19 0 0 1 4-7M35 16a19 19 0 0 0-4-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55"/><circle cx="20" cy="7" r="2.5" fill="#aff7ff"/></svg></span><span className="brand-copy"><b>路脉智感</b><small>道路智能感知平台</small></span></a>
      <div className="workspace-label"><span>核心工作台</span><small>WORKSPACE</small></div>
      <nav aria-label="主导航">{nav.map(n => <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => setView(n.id)} aria-current={view === n.id ? 'page' : undefined}><Icon name={n.id}/><span>{n.label}</span>{n.id === 'tickets' && tickets.some(t => t.status === 'pending') && <em>{tickets.filter(t => t.status === 'pending').length}</em>}</button>)}</nav>
      <div className="sidebar-divider"/><div className="workspace-label service-label"><span>平台服务</span><small>SERVICES</small></div>
      <button className="sidebar-link" onClick={onLegacy}><Icon name="layers"/><span>道路专题展示</span><span className="external-arrow">↗</span></button>
      <button className={`sidebar-link ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}><Icon name="settings"/><span>接入管理</span></button>
      <div className="sidebar-bottom"><div className="project-mini"><div className="project-card-head"><span className="project-chip"><Icon name="layers" size={15}/> ROAD NETWORK</span><span className="version">V3.0</span></div><b>路网感知中枢</b><p>多源感知 · 智能研判 · 协同处置</p><div className="sidebar-network"><span><i className={paused || snapshot.sensors.filter(s => isFresh(s, now)).length < 18 ? 'warn-dot' : 'ok-dot'}/>{paused ? '数据流已暂停' : mode === 'demo' ? '模拟网络运行中' : '采集接口运行中'}</span><b>{snapshot.sensors.filter(s => isFresh(s, now)).length}<small> / 18</small></b></div></div><div className="operator"><div><Icon name="pulse" size={18}/></div><span>路脉智感控制台<small>本地会话 · {mode === 'demo' ? '模拟接入' : '采集接口'}</small></span><span className="operator-status">LOCAL</span></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">路脉智感 <span>/</span><b>{nav.find(n => n.id === view)?.label || '接入管理'}</b></div><div className="top-status"><Badge tone={paused || feedError || age > 15 ? 'amber' : 'green'}>{mode === 'demo' ? (paused ? '模拟采样已暂停' : '模拟接入运行中') : feedError || age > 15 ? '采集异常' : '采集接口已连接'}</Badge><span className="top-clock">{new Date(now).toLocaleDateString('zh-CN')} <b>{formatTime(now)}</b></span><div className="avatar">A</div></div></header>
      <main ref={mainRef}>
        <div className="page-heading"><div><div className="eyebrow">LUMAI SENSE / ROAD INTELLIGENCE</div><h1>{heroTitle}</h1><p>多源感知 · 赤泥储能 · 道路智能分析 <span className="heading-divider">/</span> 道路智能感知平台</p></div><button className="secondary export-button" onClick={exportReport} disabled={!analysis} title={!analysis ? '请先生成智能研判，再导出报告' : '导出当前研判报告'}><Icon name="download" size={16}/>导出研判报告</button></div>
        <div className="data-banner"><span className="banner-icon"><Icon name="pulse" size={16}/></span><span>{mode === 'demo' ? '模拟接入' : '采集接口数据源'}<b> · </b>{mode === 'demo' ? '本地模拟器已启用 · 18 个设备位 / 3 台网关 · 读数与链路指标均为模拟数据。' : '仅展示通过格式校验的接口读数；设备真实性与标定由接入方负责。'}</span><button onClick={() => setView('settings')}>网络状态 ↗</button></div>
        <div className="toolbar"><div className="toolbar-left"><label className="select-label">监测范围<select value={scope} onChange={e => changeScope(e.target.value)}><option value="all">全部示范路段</option>{segments.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>{mode === 'demo' && <label className="select-label">演示场景<select value={scenario} onChange={e => changeScenario(e.target.value as Scenario)}>{Object.entries(scenarios).map(([id, s]) => <option value={id} key={id}>{s.name}</option>)}</select></label>}</div><div className="sampling-status"><span><i className={paused || feedError || age > 15 ? 'warn-dot' : 'ok-dot'}/>{paused ? '采样已暂停' : feedError ? '采样异常' : '每 3 秒采样'} · {age} 秒前</span><button className="icon-button" onClick={() => setPaused(!paused)} aria-label={paused ? '继续采样' : '暂停采样'} title={paused ? '继续采样' : '暂停采样'}><Icon name={paused ? 'play' : 'pause'} size={15}/></button></div></div>
        {feedError && <div role="alert" className="error-box feed-error">{feedError} {mode === 'demo' ? '当前仍为演示模式。' : '显示最后快照；过期数据不会参与指标计算。'}</div>}
        {view === 'overview' && <>
          <div className="kpi-grid">
            <div className="kpi"><div className="kpi-label">有效在线设备 <Icon name="sensors" size={18}/></div><div className="kpi-value">{online}<small>/ {expected}</small><span className="kpi-unit">台</span></div><div className="kpi-foot"><span className={online === expected ? 'green-text' : 'amber-text'}>{(online / expected * 100).toFixed(1)}% 覆盖率</span><span>心跳有效期 15 秒</span></div><div className="meter"><span style={{ width: `${online / expected * 100}%` }}/></div></div>
            <div className="kpi"><div className="kpi-label">监测覆盖长度 <Icon name="layers" size={18}/></div><div className="kpi-value">{scope === 'all' ? '1.20' : '0.40'}<span className="kpi-unit">km</span></div><div className="kpi-foot"><span>{scope === 'all' ? '3 个' : '1 个'}示范路段</span><span>空间布局示意</span></div><div className="coverage-strip"><i/><i/><i/></div></div>
            <div className="kpi"><div className="kpi-label">储能输出功率 <Icon name="pulse" size={18}/></div><div className="kpi-value">{power === null ? '—' : power.toFixed(0)}<span className="kpi-unit">W</span></div><div className="kpi-foot"><span className="green-text">{power === null ? '存在缺失读数' : '电压 × 电流'}</span><span>当前范围合计</span></div><div className="risk-caption">随当前有效采样更新</div></div>
            <div className="kpi risk-kpi"><div className="kpi-label">当前风险事件 <Icon name="analysis" size={18}/></div><div className="kpi-value">{currentFindings.length.toString().padStart(2, '0')}<span className="kpi-unit">项</span></div><div className="kpi-foot"><span className="amber-text">{high} 项高优先级</span><button className="inline-link" onClick={() => setView('analysis')}>查看研判 →</button></div><div className="risk-caption">本地阈值筛查 · 需人工复核</div></div>
          </div>
          <div className="overview-main"><section className="panel map-panel"><SectionTitle eyebrow="CONNECTED INFRASTRUCTURE" title="道路感知网络" action={<Badge tone="neutral">{mode === 'demo' ? '模拟链路' : '接口链路'}</Badge>}/><RoadMap snapshot={snapshot} selected={scope} onSelect={changeScope} now={now}/></section>{analysisPanel()}</div>
          <div className="overview-bottom"><section className="panel trend-panel"><SectionTitle eyebrow="TELEMETRY STREAM" title="多源监测趋势" action={<select aria-label="趋势指标" value={chartKind} onChange={e => setChartKind(e.target.value as Kind)}>{Object.entries(metrics).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select>}/><div className="chart-legend">{segments.filter(s => scope === 'all' || s.id === scope).map((s, i) => <span key={s.id}><i style={{ background: ['#62dfb8', '#79a8ef', '#e9b575'][i] }}/>{s.name}</span>)}<span>{mode === 'demo' ? '模拟时序' : '本次会话'} · 最近 {history.length} 帧</span></div><ReactECharts option={chartOption} notMerge style={{ height: 210 }}/></section><section className="panel event-panel"><SectionTitle eyebrow="LIVE EVENTS" title="实时事件流" action={<span className="count-tag">{currentFindings.length}</span>}/>{currentFindings.length ? currentFindings.slice(0, 3).map(f => <div className="event-item" key={f.id}><span className="event-dot"/><div><div><b>{f.title}</b><span>{formatTime(snapshot.at)}</span></div><p>{segmentName(f.segment)} · {f.evidence}</p><Badge tone={f.severity === 'high' ? 'amber' : 'blue'}>{severityName[f.severity]}</Badge></div></div>) : <div className="empty-state"><Icon name="pulse" size={28}/><p>暂无触发规则的事件</p><small>持续监测有效读数</small></div>}<button className="text-button" onClick={() => { setView('analysis'); void runAnalysis(); }}>研判当前事件 <Icon name="arrow" size={14}/></button></section></div>
        </>}
        {view === 'sensors' && <GatewayPanel snapshot={snapshot} now={now} paused={paused} compact/>}
        {view === 'search' && <DataExplorer key={`${mode}-${scenario}-${scope}`} source={mode} scenario={scenario} history={history} scope={scope}/>}
        {view === 'sensors' && <section className="panel sensors-panel"><SectionTitle eyebrow="DEVICE REGISTRY" title="传感器设备台账" action={<Badge tone={online === expected ? 'green' : 'amber'}>{online} / {expected} 在线</Badge>}/><div className="table-toolbar"><input aria-label="搜索设备" placeholder="搜索设备编号、类型或路段…" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="设备状态" value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)}><option value="all">全部状态</option><option value="online">在线</option><option value="offline">离线 / 过期</option></select><span>点击设备查看采集详情</span></div><div className="table-scroll"><table><thead><tr><th>设备编号 / 类型</th><th>所属路段</th><th>当前读数</th><th>连接状态</th><th>最近上报</th><th>数据来源</th></tr></thead><tbody>{displayedDevices.map(s => <tr key={s.id}><td><button className="device-name" onClick={() => setSelectedSensor(s.id)}>{s.id}<small>{metrics[s.kind].name}</small></button></td><td>{segmentName(s.segment)}</td><td className="numeric">{isFresh(s, now) ? s.value : '—'} <small>{s.unit}</small></td><td><Badge tone={isFresh(s, now) ? 'green' : 'amber'}>{isFresh(s, now) ? '在线' : s.status === 'offline' ? '离线' : '数据过期'}</Badge></td><td>{formatTime(s.at)}</td><td className="muted">{snapshot.source === 'demo' ? '模拟传感器' : '采集接口'}</td></tr>)}</tbody></table>{!displayedDevices.length && <div className="empty-state">没有符合筛选条件的设备。</div>}</div><div className="table-footer">显示 {displayedDevices.length} 台设备 · 六类感知指标<span>缺失与过期读数不参与实时指标计算</span></div></section>}
        {view === 'analysis' && <WorkflowCenter snapshot={snapshot} scope={scope} onResult={setAnalysis} onCreateTicket={createTicket}/>}
        {view === 'tickets' && <section className="panel tickets-panel"><SectionTitle eyebrow="HUMAN IN THE LOOP" title="事件处置记录" action={<Badge tone="neutral">{tickets.filter(t => t.status === 'pending').length} 项待处理</Badge>}/><p className="helper">演练事件为随机生成的历史处置任务，不代表当前实时告警。记录保存在此浏览器，确认完成仅更新本机状态。</p><div className="ticket-summary"><div><span>任务总数</span><b>{tickets.filter(t => scope === 'all' || t.finding.segment === scope).length.toString().padStart(2, '0')}</b></div><div><span>待人工处理</span><b className="amber-text">{tickets.filter(t => t.status === 'pending' && (scope === 'all' || t.finding.segment === scope)).length.toString().padStart(2, '0')}</b></div><div><span>已记录完成</span><b className="green-text">{tickets.filter(t => t.status === 'done' && (scope === 'all' || t.finding.segment === scope)).length.toString().padStart(2, '0')}</b></div><button className="secondary" onClick={() => { setTickets(items => [...createDemoTickets(), ...items].slice(0, 200)); setToast('已新增 6 项随机演练事件，原有记录保留。'); }}>+ 生成 6 项演练事件</button></div>{!tickets.length ? <div className="empty-state large-empty"><Icon name="tickets" size={40}/><h3>还没有处置记录</h3><p>先生成智能研判，再为需要跟进的事件创建记录。</p><button className="primary" onClick={() => setView('analysis')}>前往研判中心 <Icon name="arrow" size={16}/></button></div> : <div className="ticket-list">{tickets.filter(t => scope === 'all' || t.finding.segment === scope).map(t => <article className="ticket" key={t.id}><div className="ticket-symbol"><Icon name="tickets"/></div><div className="ticket-content"><div><Badge tone={t.status === 'done' ? 'green' : 'amber'}>{t.status === 'done' ? '已记录完成' : '待人工处理'}</Badge><span className="muted">{t.id} · {t.id.startsWith('DRILL-') ? '随机演练' : t.dataSource === 'demo' ? '演示事件' : '接口事件'}</span></div><h3>{t.finding.title} <small>{segmentName(t.finding.segment)}</small></h3><p className="ticket-evidence"><Badge tone={t.finding.severity === 'high' ? 'amber' : 'blue'}>{severityName[t.finding.severity]}</Badge><span>{t.finding.evidence}</span></p><p><b className="action-label">处理建议</b>{t.finding.action}</p><small>创建：{new Date(t.createdAt).toLocaleString('zh-CN')}{t.completedAt && ` · 完成：${new Date(t.completedAt).toLocaleString('zh-CN')}`}</small></div>{t.status === 'pending' && <button className="secondary" onClick={() => setConfirmTicket(t)}>记录处置完成</button>}</article>)}{tickets.length > 0 && !tickets.some(t => scope === 'all' || t.finding.segment === scope) && <div className="empty-state">当前路段没有处置记录。</div>}</div>}</section>}
        {view === 'settings' && connectionError && <div role="alert" className="error-box">{connectionError} 当前数据源未切换。</div>}
        {view === 'settings' && <GatewayPanel snapshot={snapshot} now={now} paused={paused} onScenario={changeScenario}/>}
        {view === 'settings' && <details className="integration-advanced"><summary>真实接口与分析服务配置 <span>展开以切换至外部数据源</span></summary><div className="settings-grid"><section className="panel settings-card"><SectionTitle eyebrow="DATA CONNECTION" title="真实传感器接口"/><Badge tone={mode === 'demo' ? 'amber' : 'green'}>{mode === 'demo' ? '模拟数据源运行中' : '已选择采集接口'}</Badge><p className="helper">由现场网关汇聚 MQTT / Modbus 等设备数据，再通过 HTTP 接口供本工作台读取。页面只在收到有效快照后切换数据源。</p><label className="form-label">采集接口地址<input value={sensorEndpoint} onChange={e => setSensorEndpoint(e.target.value)} placeholder="http://127.0.0.1:8080/api/telemetry"/></label><div className="setting-actions"><button className="primary" onClick={connect} disabled={connecting}>{connecting ? '正在校验连接…' : '校验并连接'}</button><button className="secondary" onClick={() => changeScenario(scenario)}>切回演示数据</button></div><p className="helper">轮询周期 3 秒，超时 8 秒。断连后保留最后快照并提示异常，不自动切换成模拟数据。</p><details><summary>查看采集接口约定</summary><pre>{JSON.stringify({ source: 'sensor', at: '<ISO 8601 当前时间>', sensors: [{ id: 'AIC-01-01', segment: 'S1', kind: 'temperature', value: 18.6, unit: '°C', status: 'online', at: '<ISO 8601 采样时间>' }] }, null, 2)}</pre><p className="helper">GET 返回 JSON；路段 S1/S2/S3，每路段六类指标。单位需与台账一致，每个路段和指标组合唯一。缺失设备显示为覆盖不足。</p></details></section><section className="panel settings-card"><SectionTitle eyebrow="INTELLIGENCE CONNECTION" title="AI 分析服务"/><label className="checkbox-row"><input type="checkbox" checked={serviceAI} onChange={e => { setServiceAI(e.target.checked); invalidateAnalysis(); }}/><span>通过后端调用真实分析服务</span></label><p className="helper">默认使用本地规则。启用后点击“生成智能研判”会将当前快照发送至你配置的后端；模型密钥由后端保管，不填写在网页中。</p><label className="form-label">分析接口地址<input value={aiEndpoint} onChange={e => { setAiEndpoint(e.target.value); invalidateAnalysis(); }} placeholder="/api/analyze"/></label><div className="model-row"><span>请求方式</span><b>POST · JSON</b></div><div className="model-row"><span>分析超时</span><b>20 秒</b></div><details><summary>查看分析接口约定</summary><pre>{JSON.stringify({ request: { snapshot: '<采集快照对象>', scope: 'all | S1 | S2 | S3' }, response: { summary: '分析摘要', findings: [{ id: 'S1-ice', segment: 'S1', severity: 'high', title: '风险标题', evidence: '关联读数与依据', action: '待人工复核的建议' }] } }, null, 2)}</pre></details><div className="connection-note">接入地址需允许此页面访问（同源或正确配置 CORS）。接口配置仅保存在本次会话，不保存密钥。仅启用开关不代表模型已连接。</div></section></div></details>}
        <footer><span><b>路脉智感</b> 道路智能感知平台 <span>© {new Date(now).getFullYear()} · 赤泥基复合储能道路项目</span></span><span>{snapshot.source === 'demo' ? 'DEMO DATA' : 'API DATA'}<i/> HUMAN-VERIFIED DECISIONS</span></footer>
      </main>
    </div>
    {toast && <div className="toast" role="status"><span>✓</span>{toast}<button onClick={() => setToast('')} aria-label="关闭提示">×</button></div>}
    {sensor && <div className="modal-backdrop" onClick={() => setSelectedSensor(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="sensor-title" onClick={e => e.stopPropagation()}><button autoFocus className="modal-close" onClick={() => setSelectedSensor(null)} aria-label="关闭设备详情">×</button><span className="eyebrow">DEVICE DETAIL</span><h2 id="sensor-title">{metrics[sensor.kind].name}</h2><p className="muted">{sensor.id} · {segmentName(sensor.segment)}</p><div className="sensor-reading">{isFresh(sensor, now) ? sensor.value : '—'}<small>{sensor.unit}</small></div><Badge tone={isFresh(sensor, now) ? 'green' : 'amber'}>{isFresh(sensor, now) ? '当前有效读数' : '无有效近期读数'}</Badge><div className="model-row"><span>最近上报</span><b>{formatTime(sensor.at)}</b></div><div className="model-row"><span>数据来源</span><b>{snapshot.source === 'demo' ? '模拟传感器' : '采集接口'}</b></div><div className="model-row"><span>关联网关</span><b>{segments.find(s => s.id === sensor.segment)?.gateway}</b></div>{snapshot.source === 'demo' && <><div className="model-row"><span>设备型号（示例）</span><b>{sensorSpecs[sensor.kind].model}</b></div><div className="model-row"><span>接入协议（模拟）</span><b>{sensorSpecs[sensor.kind].protocol}</b></div><div className="model-row"><span>正常模拟范围</span><b>{sensorSpecs[sensor.kind].range.join(' – ')} {sensor.unit}</b></div><div className="model-row"><span>数据分辨率</span><b>{sensorSpecs[sensor.kind].precision}</b></div></>}<p className="helper">{!isFresh(sensor, now) && `最后读数 ${sensor.value} ${sensor.unit}。`}设备台账与研判中心共享同一数据快照。</p></section></div>}
    {confirmTicket && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="eyebrow">MANUAL CONFIRMATION</span><h2 id="confirm-title">记录处置完成</h2><p>{confirmTicket.finding.title} · {segmentName(confirmTicket.finding.segment)}</p><p className="helper">此操作仅更新本机记录，不代表传感器告警已解除，也不会执行任何设备控制。</p><div className="setting-actions"><button className="secondary" autoFocus onClick={() => setConfirmTicket(null)}>取消</button><button className="primary" onClick={() => { setTickets(items => items.map(t => t.id === confirmTicket.id ? { ...t, status: 'done', completedAt: new Date().toISOString() } : t)); setConfirmTicket(null); setToast('已保存人工处置完成记录。'); }}>确认记录完成</button></div></section></div>}
  </div>;
}
