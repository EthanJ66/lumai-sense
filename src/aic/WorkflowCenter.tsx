import { useEffect, useRef, useState } from 'react';
import { Analysis, Finding, Snapshot } from './engine';
import { asAnalysis, localWorkflow, parseWorkflowOutput, WorkflowId, WorkflowResult, workflows } from './workflows';
import { Badge, formatTime, Icon, IconName, SectionTitle, segmentName, severityName } from './ui';
import './workflows.css';
type Status = { configured: boolean; model: string; error?: string };
export default function WorkflowCenter({snapshot, scope, onResult, onCreateTicket}: {snapshot: Snapshot; scope: string; onResult: (analysis: Analysis) => void; onCreateTicket: (finding: Finding) => void}) {
  const [selected, setSelected] = useState<WorkflowId>('risk');
  const [provider, setProvider] = useState<'local'|'openai'>('local');
  const [status, setStatus] = useState<Status>({configured:false, model:'', error:'正在检查本机服务…'});
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<WorkflowResult|null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<WorkflowResult[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const request = useRef<AbortController|null>(null);
  const version = useRef(0);
  const workflow = workflows.find(w => w.id === selected)!;
  const refreshStatus = async () => {
    try { const response = await fetch('/api/ai/status', {signal:AbortSignal.timeout(5000)}); if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error(); const data = await response.json(); setStatus({configured:data.configured === true, model: typeof data.model === 'string' ? data.model : ''}); }
    catch { setStatus({configured:false, model:'', error:'本机 AI 服务暂不可用，请重新启动项目。'}); }
  };
  useEffect(() => { void refreshStatus(); return () => { version.current++; request.current?.abort(); }; }, []);
  useEffect(() => { version.current++; request.current?.abort(); setRunning(false); setResult(null); setError(''); }, [scope, snapshot.source, snapshot.scenario]);
  const cancel = () => { version.current++; request.current?.abort(); setRunning(false); setError('本次工作流已取消。'); };
  const choose = (id: WorkflowId) => { if (running) return; setSelected(id); setResult(null); setError(''); };
  const run = async () => {
    const captured = snapshot; const capturedScope = scope; const capturedId = selected; const capturedProvider = provider;
    const controller = new AbortController(); request.current?.abort(); request.current = controller; const current = ++version.current;
    setRunning(true); setError(''); setResult(null);
    let timer: ReturnType<typeof setTimeout>|undefined;
    try {
      let next: WorkflowResult;
      if (capturedProvider === 'local') next = localWorkflow(capturedId, captured, capturedScope);
      else {
        timer = setTimeout(() => controller.abort(), 60000);
        const response = await fetch('/api/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({workflowId:capturedId, snapshot:captured, scope:capturedScope, question}), signal:controller.signal});
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('分析接口未返回 JSON，请检查本机服务。');
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `请求失败（${response.status}）`);
        if (data.provider !== 'openai' || data.workflowId !== capturedId) throw new Error('分析来源或工作流不匹配。');
        next = {...parseWorkflowOutput(data, capturedScope), id:`WF-${Date.now()}`, workflowId:capturedId, at:new Date().toISOString(), snapshotAt:captured.at, dataSource:captured.source, scope:capturedScope, provider:'openai', model: typeof data.model === 'string' ? data.model : status.model, snapshot:captured};
      }
      if (current !== version.current) return;
      setResult(next); setRecent(items => [next,...items].slice(0, 6)); onResult(asAnalysis(next));
    } catch(e) { if(current === version.current) setError(e instanceof Error ? e.name === 'AbortError' ? '模型请求已超时，请重试。' : e.message : '工作流执行失败。'); }
    finally { clearTimeout(timer); if(current === version.current) setRunning(false); }
  };
  const exportResult = () => {
    if (!result) return;
    const url=URL.createObjectURL(new Blob([JSON.stringify({project:'路脉智感-道路智能感知平台', note:'模型来源与数据来源独立标注；所有建议均需人工复核。', ...result},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`路脉智感-${result.workflowId}-${result.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <div className="workflow-center">
    <section className="workflow-hero"><div className="workflow-logo"><Icon name="analysis" size={33}/></div><div><span className="eyebrow">DEEPSEEK-STYLE WORKSPACE / OPENAI BACKEND</span><h2>道路智能研判 · 工作流中心</h2><p>10 条专业工作流，从监测快照到可追溯的行动建议。</p></div><Badge tone={status.configured ? 'blue' : 'neutral'}>{status.configured ? 'OpenAI 已配置 · 待请求验证' : '本地演练可用'}</Badge></section>
    <div className="provider-bar"><div><span className="provider-dot"/><b>实际分析引擎</b><span>{provider === 'local' ? '本地规则 · 非模型推理' : `OpenAI / ${status.model}`}</span></div><label>运行方式<select aria-label="工作流运行方式" disabled={running} value={provider} onChange={e=>{setProvider(e.target.value as 'local'|'openai');setResult(null);setError('');}}><option value="local">本地演练</option><option value="openai" disabled={!status.configured}>OpenAI 模型{status.configured ? '' : '（待配置密钥）'}</option></select></label><button className="text-button" onClick={()=>setConfigOpen(!configOpen)}>{configOpen ? '收起接入说明' : '模型接入状态'} <Icon name="settings" size={15}/></button></div>
    {configOpen && <section className="panel model-setup"><h3>OpenAI 模型接入</h3><p>{status.error || (status.configured ? `服务端已读取密钥，配置模型 ${status.model}。运行工作流后确认实际可用性。` : '本机尚未配置 API 密钥。当前可完整体验本地演练；密钥配置后，可切换为 OpenAI 模型分析。')}</p><p>在项目根目录创建 <code>.env.local</code>，填写下列服务端变量并重启项目。密钥不要加 VITE_ 前缀，也不要粘贴到聊天或页面中。</p><pre>OPENAI_API_KEY=你的密钥{'\n'}OPENAI_MODEL=gpt-4.1-mini</pre><button className="secondary" onClick={()=>void refreshStatus()}>重新检查配置</button><p className="helper">DeepSeek 风格仅指界面设计。真实推理由 OpenAI API 提供；本地规则不会被标注为模型输出。</p></section>}
    <div className="workflow-grid">{workflows.map((item,index)=><button className={`workflow-card ${selected === item.id ? 'selected' : ''}`} key={item.id} onClick={()=>choose(item.id)} disabled={running}><span className="workflow-card-top"><i><Icon name={item.icon as IconName} size={20}/></i><span>{String(index+1).padStart(2,'0')}</span></span><b>{item.name}</b><p>{item.description}</p><span className="workflow-card-bottom"><span>{item.category}</span><Icon name="arrow" size={15}/></span></button>)}</div>
    <div className="workflow-body"><section className="panel workflow-runner"><SectionTitle eyebrow={`WORKFLOW ${String(workflows.findIndex(w=>w.id===selected)+1).padStart(2,'0')}`} title={workflow.name} action={<Badge tone="blue">{workflow.category}</Badge>}/><p className="workflow-description">{workflow.description}</p><div className="workflow-inputs"><span><small>数据来源</small><b>{snapshot.source === 'demo' ? '模拟传感器' : '采集接口'}</b></span><span><small>分析范围</small><b>{segmentName(scope)}</b></span><span><small>采集快照</small><b>{formatTime(snapshot.at)}</b></span><span><small>输出成果</small><b>{workflow.output}</b></span></div><label className="workflow-question">补充分析要求（可选）<textarea aria-label="补充分析要求" value={question} disabled={running || provider === 'local'} onChange={e=>setQuestion(e.target.value)} maxLength={1000} placeholder={provider === 'local' ? '本地演练按预设判据运行；切换 OpenAI 后可填写补充问题。' : '例如：优先分析桥面应变变化，给出三项现场检查建议。'}/></label><div className="execution-steps">{['冻结数据快照', provider === 'local' ? '执行本地规则' : '请求 OpenAI', '校验结构化结果', '人工复核处置'].map((step,index)=><div className={result && index<3 ? 'complete' : running && index<2 ? 'working' : ''} key={step}><span>{result && index<3 ? '✓' : String(index+1).padStart(2,'0')}</span><small>{step}</small></div>)}</div>{error && <div className="error-box" role="alert">{error}</div>}<div className="runner-actions"><button className="primary" disabled={running || (provider === 'openai' && !status.configured)} onClick={()=>void run()}><Icon name="analysis" size={18}/>{running ? '正在请求模型分析…' : provider === 'local' ? '运行本地演练' : '运行 OpenAI 工作流'}<Icon name="arrow" size={16}/></button>{running && <button className="secondary" onClick={cancel}>取消</button>}</div><p className="workflow-disclosure">{provider === 'local' ? '即时执行预设规则，结果标记为本地演练。' : '将当前快照与补充要求发送至 OpenAI；结果保留实际模型来源。'} 分析仅提供建议，处置需人工确认。</p></section>
    <section className="panel workflow-results"><SectionTitle eyebrow="STRUCTURED RESULT" title="研判结果" action={result ? <button className="secondary" onClick={exportResult}><Icon name="download" size={14}/>导出</button> : <Badge tone="neutral">{running ? '处理中' : '等待执行'}</Badge>}/>{!result ? <div className="workflow-empty"><div className={running ? 'workflow-wait working' : 'workflow-wait'}><Icon name="analysis" size={36}/></div><h3>{running ? '正在分析当前数据快照' : '选择工作流，启动一次研判'}</h3><p>{running ? '等待真实接口响应，完成后展示指标、证据与建议。' : '每次执行保留固定快照、数据来源和实际分析引擎。'}</p></div> : <><div className="result-source"><Badge tone={result.provider === 'openai' ? 'blue' : 'neutral'}>{result.provider === 'openai' ? `OpenAI · ${result.model}` : '本地演练 · 规则结果'}</Badge><span>{formatTime(result.at)} · {result.dataSource === 'demo' ? '模拟数据' : '接口数据'}</span></div><p className="workflow-summary">{result.summary}</p><div className="workflow-observations">{result.observations.map((item,i)=><div key={i}><span>{item.label}</span><b>{item.value}</b><small>{item.interpretation}</small></div>)}</div><h3 className="result-section-label">风险与处置建议 <span>{result.findings.length}</span></h3>{result.findings.length ? result.findings.map(f=><article className="finding" key={f.id}><div className="finding-head"><Badge tone={f.severity === 'high' ? 'amber' : 'blue'}>{severityName[f.severity]}</Badge><span>{segmentName(f.segment)}</span></div><h3>{f.title}</h3><p><b>依据</b> {f.evidence}</p><p><b>建议</b> {f.action}</p><button className="secondary" onClick={()=>onCreateTicket(f)}>创建处置记录 <Icon name="arrow" size={14}/></button></article>) : <div className="workflow-clear">本工作流未返回风险项，仍需结合现场条件复核。</div>}<h3 className="result-section-label">后续行动</h3><ol className="next-steps">{result.nextSteps.map((step,i)=><li key={i}>{step}</li>)}</ol><div className="result-snapshot">固定快照 {formatTime(result.snapshotAt)} · {segmentName(result.scope)} · 查看最新状态请重新执行</div></>}</section></div>
    {recent.length>0 && <section className="panel workflow-history"><SectionTitle eyebrow="SESSION RUNS" title="本次会话执行记录"/><div>{recent.map(item=><button key={item.id} disabled={running} onClick={()=>{setSelected(item.workflowId);setResult(item);onResult(asAnalysis(item));setError('');}}><Icon name="tickets" size={16}/><span><b>{workflows.find(w=>w.id===item.workflowId)?.name}</b><small>{formatTime(item.at)} · {item.provider === 'local' ? '本地演练' : 'OpenAI'} · {item.findings.length} 项风险</small></span><Icon name="arrow" size={14}/></button>)}</div></section>}
  </div>;
}
