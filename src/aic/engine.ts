export type Scenario = 'normal' | 'freeze' | 'load' | 'offline';
export type Kind = 'temperature' | 'humidity' | 'strain' | 'voltage' | 'current' | 'vibration';
export type Severity = 'high' | 'medium' | 'low';
export const segments = [
  { id: 'S1', name: '滨海示范段', chainage: 'K0+000 — K0+400', short: '01', gateway: 'GW-01' },
  { id: 'S2', name: '储能试验段', chainage: 'K0+400 — K0+800', short: '02', gateway: 'GW-02' },
  { id: 'S3', name: '桥面监测段', chainage: 'K0+800 — K1+200', short: '03', gateway: 'GW-03' },
] as const;
export const metrics: Record<Kind, { name: string; unit: string; base: number; amplitude: number }> = {
  temperature: { name: '路表温度', unit: '°C', base: 18.6, amplitude: 1.1 },
  humidity: { name: '表面湿度', unit: '%', base: 61, amplitude: 3.2 },
  strain: { name: '结构应变', unit: 'με', base: 128, amplitude: 12 },
  voltage: { name: '储能电压', unit: 'V', base: 48.2, amplitude: .4 },
  current: { name: '输出电流', unit: 'A', base: 4.1, amplitude: .25 },
  vibration: { name: '振动加速度', unit: 'g', base: .06, amplitude: .018 },
};
export const scenarios: Record<Scenario, { name: string; description: string }> = {
  normal: { name: '正常运行', description: '所有网关正常，监测指标在演示阈值范围内。' },
  freeze: { name: '低温结冰', description: '滨海示范段降温且湿度升高，触发结冰风险研判。' },
  load: { name: '车辆重载', description: '桥面监测段应变与振动升高，触发结构复核建议。' },
  offline: { name: '网关离线', description: 'GW-03 停止上报，6 个设备进入离线状态。' },
};
export interface Sensor { id: string; segment: string; kind: Kind; value: number; unit: string; status: 'online' | 'offline'; at: string }
export interface Snapshot { source: 'demo' | 'sensor'; scenario?: Scenario; at: string; sensors: Sensor[] }
export interface Finding { id: string; segment: string; severity: Severity; title: string; evidence: string; action: string }
export interface Analysis { id: string; at: string; source: 'rules' | 'service'; dataSource: Snapshot['source']; snapshotAt: string; summary: string; findings: Finding[]; scope: string; snapshot: Snapshot }
export interface Ticket { id: string; finding: Finding; createdAt: string; completedAt?: string; status: 'pending' | 'done'; dataSource: Snapshot['source'] }
export const sensorSpecs: Record<Kind, { model: string; protocol: string; range: [number, number]; precision: string }> = {
  temperature: { model: 'AIC-TH100', protocol: 'RS485 / Modbus RTU', range: [16, 23], precision: '0.1 °C' },
  humidity: { model: 'AIC-RH200', protocol: 'RS485 / Modbus RTU', range: [52, 72], precision: '0.1 %' },
  strain: { model: 'AIC-SG350', protocol: 'RS485 / Modbus RTU', range: [95, 165], precision: '0.1 με' },
  voltage: { model: 'AIC-VM48', protocol: 'CAN / 网关汇聚', range: [47.2, 49.4], precision: '0.1 V' },
  current: { model: 'AIC-CT20', protocol: 'CAN / 网关汇聚', range: [3.4, 4.8], precision: '0.1 A' },
  vibration: { model: 'AIC-VB300', protocol: 'RS485 / Modbus RTU', range: [.025, .095], precision: '0.001 g' },
};
// Reproducible simulation: a time slot always yields the same sample in charts and search.
export function sampleNoise(seed: number) {
  let x = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
export function createDemoTickets(now = Date.now()): Ticket[] {
  const value = (min: number, max: number, salt: number, decimals = 1) => (min + sampleNoise(now + salt) * (max - min)).toFixed(decimals);
  const templates: Omit<Finding, 'id' | 'segment'>[] = [
    { title: '路面低温与结冰风险复核', severity: 'high', evidence: `历史演练读数：路表温度 ${value(-2.8, -.6, 1)} °C，表面湿度 ${value(88, 96, 2)}%，触发低温高湿组合规则。`, action: '核查路面结冰情况与温湿度探头；由值守人员评估防滑提示和融雪措施，记录现场复核结论。' },
    { title: '重载通过后结构应变偏高', severity: 'high', evidence: `历史演练读数：应变峰值 ${value(275, 328, 3)} με，振动峰值 ${value(.21, .27, 4, 3)} g，超过演示复核阈值。`, action: '核查重载车辆通行记录，检查应变计固定点，完成结构巡检并比对恢复后的基线。' },
    { title: '储能单元电压偏低', severity: 'medium', evidence: `历史演练读数：母线电压 ${value(42.1, 43.7, 5)} V，低于 44 V 演示阈值。`, action: '检查储能单元荷电状态、线缆接头及负载；确认供电恢复后复测电压并上传处理记录。' },
    { title: '边缘网关心跳中断', severity: 'medium', evidence: `历史演练记录：连续 ${value(22, 48, 6, 0)} 秒未收到网关心跳，关联 6 个设备位出现短时离线。`, action: '排查网关供电与通信链路，检查网络接头；恢复后确认全部节点连续上报并记录中断原因。' },
    { title: '振动传感器安装点复核', severity: 'medium', evidence: `历史演练读数：振动峰值 ${value(.16, .20, 7, 3)} g，明显高于正常模拟范围 0.025–0.095 g。`, action: '检查探头安装紧固情况，排除附近施工干扰，复测空载基线并确认信号恢复。' },
    { title: '湿度探头持续高值', severity: 'low', evidence: `历史演练读数：湿度 ${value(91, 98, 8)}%，路表温度 ${value(18, 21, 9)} °C；需核查积水或探头结露。`, action: '检查路面排水与探头防护罩，清理积水或凝露，使用参考仪表交叉复核湿度。' },
    { title: '输出电流波动待排查', severity: 'medium', evidence: `历史演练读数：输出电流由 ${value(3.5, 3.9, 10)} A 短时升至 ${value(5.2, 5.8, 11)} A，超出正常模拟区间。`, action: '核对负载切换记录，检查电流采样与接线，观察稳定运行后的电流曲线并记录原因。' },
    { title: '采样时间同步偏差', severity: 'low', evidence: `历史演练记录：设备采样时间与网关时钟相差 ${value(6, 12, 12, 0)} 秒，超过 5 秒时钟校验窗口。`, action: '检查网关校时配置和网络连通性，完成时间同步后复核时间戳与数据顺序。' },
  ];
  const selected = templates.map((item, index) => ({ item, rank: sampleNoise(now + index * 997) })).sort((a, b) => a.rank - b.rank).slice(0, 6);
  return selected.map(({ item }, index) => {
    const createdAt = new Date(now - (10 + index * 13 + Math.floor(sampleNoise(now + index) * 9)) * 60000).toISOString();
    return { id: `DRILL-${now}-${index + 1}`, dataSource: 'demo', status: 'pending', createdAt, finding: { ...item, id: `drill-${now}-${index}`, segment: segments[index % segments.length].id } };
  });
}
export function demoHistory(scenario: Scenario, count = 60, end = Date.now(), step = 3000) {
  const aligned = Math.floor(end / 3000) * 3000;
  return Array.from({ length: count }, (_, i) => demoSnapshot(scenario, i, aligned - (count - 1 - i) * step));
}
export function demoSnapshot(scenario: Scenario, tick: number, now = Date.now()): Snapshot {
  const at = new Date(now).toISOString();
  const sensors = segments.flatMap((seg, si) => (Object.keys(metrics) as Kind[]).map((kind, ki) => {
    const meta = metrics[kind];
    const slot = Math.floor(now / 3000);
    const phase = scenario === 'offline' && si === 2 ? 0 : slot;
    const seed = phase + si * 197 + ki * 1031;
    const [min, max] = sensorSpecs[kind].range;
    const wave = .5 + Math.sin(phase / 12 + si + ki) * .3 + (sampleNoise(seed) - .5) * .3;
    let value = Math.max(min, Math.min(max, min + (max - min) * wave));
    if (scenario === 'freeze' && si === 0) {
      if (kind === 'temperature') value = -1.8 + Math.sin(slot / 4) * .3 + sampleNoise(seed) * .2;
      if (kind === 'humidity') value = 92 + Math.sin(slot / 4) * 2 + sampleNoise(seed);
    }
    if (scenario === 'load' && si === 2) {
      if (kind === 'strain') value = 310 + Math.sin(slot / 4) * 12 + sampleNoise(seed) * 5;
      if (kind === 'vibration') value = .24 + Math.sin(slot / 4) * .02 + sampleNoise(seed) * .005;
    }
    const offline = scenario === 'offline' && si === 2;
    return { id: `AIC-${seg.short}-${String(ki + 1).padStart(2, '0')}`, segment: seg.id, kind, value: Number(value.toFixed(kind === 'vibration' ? 3 : 1)), unit: meta.unit, status: offline ? 'offline' as const : 'online' as const, at: new Date(offline ? now - (tick + 30) * 3000 : now).toISOString() };
  }));
  return { source: 'demo', scenario, at, sensors };
}
export function isFresh(sensor: Sensor, now = Date.now()) {
  const age = now - Date.parse(sensor.at);
  return sensor.status === 'online' && age >= -5000 && age <= 15000;
}
export function reading(snapshot: Snapshot, segment: string, kind: Kind, now = Date.now()) {
  const values = snapshot.sensors.filter(s => (segment === 'all' || s.segment === segment) && s.kind === kind && isFresh(s, now));
  return values.length ? values.reduce((sum, s) => sum + s.value, 0) / values.length : null;
}
export function evaluate(snapshot: Snapshot, scope = 'all', now = Date.now()): Analysis {
  const findings: Finding[] = [];
  for (const seg of segments.filter(s => scope === 'all' || s.id === scope)) {
    const devices = snapshot.sensors.filter(s => s.segment === seg.id);
    const stale = devices.filter(s => !isFresh(s, now));
    const missing = 6 - devices.length;
    if (stale.length || missing) findings.push({ id: `${seg.id}-offline`, segment: seg.id, severity: 'medium', title: '感知链路异常', evidence: `${seg.gateway} 关联设备中 ${stale.length + Math.max(0, missing)} / 6 个未提供有效近期数据。`, action: '检查网关供电与通信链路；恢复采集后重新分析。' });
    const temp = reading(snapshot, seg.id, 'temperature', now);
    const humidity = reading(snapshot, seg.id, 'humidity', now);
    const strain = reading(snapshot, seg.id, 'strain', now);
    const vibration = reading(snapshot, seg.id, 'vibration', now);
    const voltage = reading(snapshot, seg.id, 'voltage', now);
    if (temp !== null && humidity !== null && temp <= 0 && humidity >= 85) findings.push({ id: `${seg.id}-ice`, segment: seg.id, severity: 'high', title: '路面结冰风险', evidence: `路表 ${temp.toFixed(1)} °C ≤ 0 °C，湿度 ${humidity.toFixed(1)}% ≥ 85%，满足双指标演示规则。`, action: '建议现场核验路面，评估融雪与交通提示措施。需人工确认，不自动控制设备。' });
    if (strain !== null && strain >= 250) findings.push({ id: `${seg.id}-load`, segment: seg.id, severity: 'high', title: '结构荷载异常', evidence: `应变 ${strain.toFixed(1)} με ≥ 250 με${vibration === null ? '，振动数据缺失' : `，振动 ${vibration.toFixed(3)} g`}。`, action: '复核车辆荷载与传感器标定，安排结构巡检；演示阈值不作为工程安全判据。' });
    if (voltage !== null && voltage < 44) findings.push({ id: `${seg.id}-energy`, segment: seg.id, severity: 'medium', title: '储能电压偏低', evidence: `电压 ${voltage.toFixed(1)} V 低于 44 V 演示阈值。`, action: '复核储能单元与负载，检查接线及供电状态。' });
  }
  const high = findings.filter(f => f.severity === 'high').length;
  return { id: `AN-${now}`, at: new Date(now).toISOString(), source: 'rules', dataSource: snapshot.source, snapshotAt: snapshot.at, scope, snapshot,
    summary: findings.length ? `发现 ${findings.length} 项需关注事件${high ? `，其中 ${high} 项为高优先级` : ''}。建议按证据逐项复核，并记录处置结果。` : '当前有效读数未触发演示风险规则。持续观察温湿度、结构响应与储能状态；未触发规则不代表已完成安全评估。', findings };
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function validTime(value: unknown) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
export function parseSnapshot(value: unknown, now = Date.now()): Snapshot {
  if (!object(value) || value.source !== 'sensor' || !validTime(value.at) || !Array.isArray(value.sensors) || !value.sensors.length || value.sensors.length > 18) throw new Error('采集接口格式不正确：需要 source=sensor、at 和 1–18 个 sensors。');
  if (Date.parse(value.at as string) > now + 5000 || now - Date.parse(value.at as string) > 15000) throw new Error('采集快照已过期或时间超前，请检查网关时钟。');
  const ids = new Set<string>(); const pairs = new Set<string>();
  for (const s of value.sensors) {
    if (!object(s) || typeof s.id !== 'string' || !s.id || s.id.length > 80 || ids.has(s.id) || !segments.some(seg => seg.id === s.segment) || typeof s.kind !== 'string' || !Object.prototype.hasOwnProperty.call(metrics, s.kind) || typeof s.value !== 'number' || !Number.isFinite(s.value) || s.unit !== metrics[s.kind as Kind].unit || !['online', 'offline'].includes(String(s.status)) || !validTime(s.at) || Date.parse(s.at as string) > now + 5000) throw new Error('设备字段、时间、单位或唯一编号不符合接口约定。');
    const pair = `${s.segment}-${s.kind}`;
    if (pairs.has(pair)) throw new Error('同一路段同类指标重复。');
    if (s.kind === 'humidity' && (s.value < 0 || s.value > 100)) throw new Error('湿度必须在 0–100% 范围内。');
    ids.add(s.id); pairs.add(pair);
  }
  return value as unknown as Snapshot;
}
export function endpointUrl(endpoint: string) {
  const url = new URL(endpoint, window.location.origin);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('请使用不含密码、查询参数或片段的 HTTP(S) 接口地址。');
  return url.toString();
}
export async function fetchSnapshot(endpoint: string, signal: AbortSignal) {
  const response = await fetch(endpointUrl(endpoint), { signal, cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`采集接口返回 HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('采集地址未返回 JSON，请确认后端接口已启动，且地址不是网页。');
  return parseSnapshot(await response.json());
}
export async function fetchAnalysis(endpoint: string, snapshot: Snapshot, scope: string, signal: AbortSignal): Promise<Analysis> {
  const response = await fetch(endpointUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshot, scope }), signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error(`分析服务返回 HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('分析地址未返回 JSON，请确认分析服务已启动。');
  const data: unknown = await response.json();
  if (!object(data) || typeof data.summary !== 'string' || data.summary.length > 5000 || !Array.isArray(data.findings) || data.findings.length > 50) throw new Error('分析服务响应格式不正确。');
  const ids = new Set<string>();
  for (const f of data.findings) {
    if (!object(f) || !['high', 'medium', 'low'].includes(String(f.severity)) || !segments.some(s => s.id === f.segment) || (scope !== 'all' && f.segment !== scope) || !['id', 'title', 'evidence', 'action'].every(k => typeof f[k] === 'string' && (f[k] as string).length > 0 && (f[k] as string).length < 5000) || ids.has(String(f.id))) throw new Error('分析发现缺少证据、建议或有效路段。');
    ids.add(String(f.id));
  }
  const now = Date.now();
  return { id: `AN-${now}`, at: new Date(now).toISOString(), source: 'service', dataSource: snapshot.source, snapshotAt: snapshot.at, scope, snapshot, summary: data.summary, findings: data.findings as Finding[] };
}
