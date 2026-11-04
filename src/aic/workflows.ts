import { Analysis, evaluate, Finding, isFresh, Kind, metrics, reading, segments, Snapshot } from './engine';
export const workflows = [
  { id: 'health', name: '感知链路巡检', category: '设备诊断', icon: 'sensors', description: '校验设备心跳、采样时效与路段覆盖，定位异常网关。', kinds: [] as Kind[], output: '设备健康清单' },
  { id: 'icing', name: '路面结冰预警', category: '环境安全', icon: 'layers', description: '联合温湿度与路段位置，识别低温高湿风险。', kinds: ['temperature', 'humidity'] as Kind[], output: '结冰风险与复核建议' },
  { id: 'structure', name: '结构荷载评估', category: '结构监测', icon: 'pulse', description: '关联应变与振动读数，筛查重载引发的结构响应。', kinds: ['strain', 'vibration'] as Kind[], output: '结构响应分析' },
  { id: 'energy', name: '储能运行诊断', category: '能源管理', icon: 'pulse', description: '评估电压、电流与估算功率，识别供能异常。', kinds: ['voltage', 'current'] as Kind[], output: '储能状态与检查项' },
  { id: 'vibration', name: '振动异常识别', category: '结构监测', icon: 'pulse', description: '检查异常振幅，区分需复核的安装与载荷因素。', kinds: ['vibration'] as Kind[], output: '振动异常检查单' },
  { id: 'moisture', name: '路表湿度研判', category: '环境安全', icon: 'layers', description: '检查高湿与积水线索，生成排水及探头复核建议。', kinds: ['temperature', 'humidity'] as Kind[], output: '环境风险提示' },
  { id: 'crosscheck', name: '多源数据交叉校验', category: '数据质量', icon: 'search', description: '核对各路段多类传感器的覆盖、范围与数据一致性。', kinds: ['temperature', 'humidity', 'strain', 'voltage', 'current', 'vibration'] as Kind[], output: '质量核验清单' },
  { id: 'risk', name: '全路段风险扫描', category: '综合研判', icon: 'analysis', description: '汇总当前范围内的风险证据，按优先级安排复核。', kinds: ['temperature', 'humidity', 'strain', 'voltage', 'current', 'vibration'] as Kind[], output: '分级风险清单' },
  { id: 'dispatch', name: '运维处置建议', category: '运维协同', icon: 'tickets', description: '将异常证据转为检查任务，生成可跟踪的处理建议。', kinds: ['temperature', 'humidity', 'strain', 'voltage', 'current', 'vibration'] as Kind[], output: '运维任务建议' },
  { id: 'briefing', name: '运行简报生成', category: '运营报告', icon: 'download', description: '整理当前快照、关键指标和风险，生成结构化简报。', kinds: ['temperature', 'humidity', 'strain', 'voltage', 'current', 'vibration'] as Kind[], output: '路网运行简报' },
] as const;
export type WorkflowId = typeof workflows[number]['id'];
export interface Observation { label: string; value: string; interpretation: string }
export interface WorkflowOutput { summary: string; observations: Observation[]; findings: Finding[]; nextSteps: string[] }
export interface WorkflowResult extends WorkflowOutput { id: string; workflowId: WorkflowId; at: string; snapshotAt: string; dataSource: Snapshot['source']; scope: string; provider: 'local' | 'openai'; model: string; snapshot: Snapshot }
export function localWorkflow(id: WorkflowId, snapshot: Snapshot, scope: string, now = Date.now()): WorkflowResult {
  const workflow = workflows.find(w => w.id === id)!;
  const assessment = evaluate(snapshot, scope, now);
  const devices = snapshot.sensors.filter(s => scope === 'all' || s.segment === scope);
  const valid = devices.filter(s => isFresh(s, now));
  const expected = scope === 'all' ? 18 : 6;
  const picked = segments.filter(s => scope === 'all' || s.id === scope);
  const observations: Observation[] = [{ label: '有效在线设备', value: `${valid.length} / ${expected}`, interpretation: `覆盖 ${picked.length} 个路段，超过 15 秒未上报的读数不参与计算。` }];
  for (const kind of workflow.kinds) {
    const value = reading(snapshot, scope, kind, now);
    observations.push({ label: metrics[kind].name, value: value === null ? '无有效读数' : `${value.toFixed(kind === 'vibration' ? 3 : 1)} ${metrics[kind].unit}`, interpretation: '当前范围内有效读数的均值；逐路段检查用于生成风险提示。' });
  }
  const suffixes: Record<WorkflowId, string[]> = { health: ['offline'], icing: ['ice', 'offline'], structure: ['load', 'offline'], energy: ['energy', 'offline'], vibration: ['offline'], moisture: ['ice', 'offline'], crosscheck: ['offline'], risk: ['ice','load','energy','offline'], dispatch: ['ice','load','energy','offline'], briefing: ['ice','load','energy','offline'] };
  const findings = assessment.findings.filter(f => suffixes[id].some(s => f.id.endsWith(`-${s}`)));
  for (const seg of picked) {
    if (id === 'vibration') {
      const v = reading(snapshot, seg.id, 'vibration', now);
      if (v !== null && v > .15) findings.push({ id: `${seg.id}-vibration`, segment: seg.id, severity: 'medium', title: '振动幅值需要复核', evidence: `当前振动 ${v.toFixed(3)} g，高于 0.15 g 演示关注阈值。`, action: '核查安装紧固、周边施工与通行载荷，复测振动基线。' });
    }
    if (id === 'moisture') {
      const h = reading(snapshot, seg.id, 'humidity', now);
      if (h !== null && h >= 85) findings.push({ id: `${seg.id}-humidity`, segment: seg.id, severity: 'medium', title: '高湿读数待核实', evidence: `当前湿度 ${h.toFixed(1)}%，达到 85% 演示关注阈值。`, action: '检查排水、路面积水与探头凝露；单次湿度读数不能确认积水。' });
    }
    if (id === 'crosscheck') {
      const bad = snapshot.sensors.filter(s => s.segment === seg.id && isFresh(s, now) && (s.kind === 'humidity' ? s.value < 0 || s.value > 100 : s.kind === 'voltage' || s.kind === 'vibration' ? s.value < 0 : false));
      if (bad.length) findings.push({ id: `${seg.id}-range`, segment: seg.id, severity: 'medium', title: '传感器读数范围异常', evidence: bad.map(s => `${s.id}: ${s.value} ${s.unit}`).join('；'), action: '检查单位、接线、零点与数据转换，不直接用异常读数生成工程结论。' });
    }
  }
  if (id === 'energy') {
    const powers = picked.map(s => { const v = reading(snapshot, s.id, 'voltage', now); const a = reading(snapshot, s.id, 'current', now); return v === null || a === null ? null : v * a; });
    observations.push({ label: '估算输出功率', value: powers.some(p => p === null) ? '数据不足' : `${powers.reduce<number>((sum, p) => sum + (p || 0), 0).toFixed(1)} W`, interpretation: '逐路段电压 × 电流后求和；非能量或储能容量测量。' });
  }
  const notes: Record<WorkflowId, string> = {
    health: '链路巡检已完成；在线状态以当前心跳为准。', icing: '温湿度交叉检查已完成；未触发组合规则不代表路面无结冰。', structure: '应变与振动检查已完成；单次快照不能推断结构寿命或承载能力。', energy: '储能电参量检查已完成；当前快照不包含电池容量和荷电状态。', vibration: '振动幅值检查已完成；故障原因需要现场复测。', moisture: '路表湿度检查已完成；积水情况需要现场确认。', crosscheck: '数据质量检查已完成；跨传感器相关性需要更长的时间序列。', risk: '当前范围风险扫描已完成；结果来自演示阈值与有效读数。', dispatch: '运维建议已整理；仅生成任务建议，不自动派单或控制设备。', briefing: '已整理本轮路网运行简报；仅覆盖选定快照与监测范围。',
  };
  return { id: `WF-${now}`, workflowId: id, at: new Date(now).toISOString(), snapshotAt: snapshot.at, dataSource: snapshot.source, scope, provider: 'local', model: '本地规则 v2', snapshot, summary: `${notes[id]} ${findings.length ? `发现 ${findings.length} 项需关注事项。` : '未发现此工作流规则触发项。'}`, observations, findings, nextSteps: findings.length ? findings.slice(0, 5).map(f => f.action) : ['保持采集并观察后续读数。', '结合现场巡检和设备标定记录进行人工复核。'] };
}
export function asAnalysis(result: WorkflowResult): Analysis { return { id: result.id, at: result.at, source: result.provider === 'openai' ? 'service' : 'rules', dataSource: result.dataSource, snapshotAt: result.snapshotAt, scope: result.scope, snapshot: result.snapshot, summary: result.summary, findings: result.findings }; }
export function parseWorkflowOutput(value: unknown, scope: string): WorkflowOutput {
  if (!value || typeof value !== 'object') throw new Error('分析结果格式不正确。');
  const data = value as WorkflowOutput;
  const text = (v: unknown, max = 5000): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
  if (!text(data.summary) || !Array.isArray(data.observations) || data.observations.length > 20 || !Array.isArray(data.findings) || data.findings.length > 30 || !Array.isArray(data.nextSteps) || data.nextSteps.length > 15) throw new Error('分析结果缺少必要字段或超出长度限制。');
  if (!data.observations.every(o => o && text(o.label, 200) && text(o.value, 500) && text(o.interpretation)) || !data.nextSteps.every(s => text(s))) throw new Error('分析指标或建议格式不正确。');
  const ids = new Set<string>();
  for (const f of data.findings) {
    if (!f || !text(f.id, 100) || ids.has(f.id) || !segments.some(s => s.id === f.segment) || (scope !== 'all' && f.segment !== scope) || !['high','medium','low'].includes(f.severity) || !text(f.title, 300) || !text(f.evidence) || !text(f.action)) throw new Error('风险项缺少有效证据、路段或处理建议。');
    ids.add(f.id);
  }
  return data;
}
export const workflowSchema = {
  type: 'object', additionalProperties: false, required: ['summary','observations','findings','nextSteps'], properties: {
    summary: { type: 'string' }, observations: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label','value','interpretation'], properties: { label: {type:'string'}, value: {type:'string'}, interpretation: {type:'string'} } } },
    findings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id','segment','severity','title','evidence','action'], properties: { id:{type:'string'}, segment:{type:'string',enum:['S1','S2','S3']}, severity:{type:'string',enum:['high','medium','low']}, title:{type:'string'}, evidence:{type:'string'}, action:{type:'string'} } } }, nextSteps: { type:'array', items:{type:'string'} },
  },
};
