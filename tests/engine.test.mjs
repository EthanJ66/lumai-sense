import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoSnapshot, evaluate, isFresh, parseSnapshot, reading, fetchAnalysis, fetchSnapshot } from '../src/aic/engine.ts';
const now = Date.parse('2026-10-31T02:00:00.000Z');
test('normal readings have 18 unique sensors with no rule events', () => {
  const s = demoSnapshot('normal', 0, now);
  assert.equal(new Set(s.sensors.map(x => x.id)).size, 18);
  assert.equal(evaluate(s, 'all', now).findings.length, 0);
});
test('freeze needs both current temperature and humidity; scope is respected', () => {
  const s = demoSnapshot('freeze', 0, now);
  assert.equal(evaluate(s, 'all', now).findings[0].id, 'S1-ice');
  assert.equal(evaluate(s, 'S2', now).findings.length, 0);
  s.sensors.find(x => x.segment === 'S1' && x.kind === 'humidity').value = 70;
  assert.equal(evaluate(s, 'all', now).findings.length, 0);
});
test('overload yields structural evidence at S3', () => {
  const a = evaluate(demoSnapshot('load', 0, now), 'all', now);
  assert.equal(a.findings[0].id, 'S3-load');
  assert.match(a.findings[0].evidence, /310.0 με/);
});
test('offline and stale readings are excluded instead of shown as healthy', () => {
  const s = demoSnapshot('offline', 0, now);
  assert.equal(s.sensors.filter(x => isFresh(x, now)).length, 12);
  assert.equal(reading(s, 'S3', 'voltage', now), null);
  const next = demoSnapshot('offline', 2, now + 6000);
  assert.deepEqual(next.sensors.filter(x => x.segment === 'S3'), s.sensors.filter(x => x.segment === 'S3'));
  assert.equal(evaluate(s, 'all', now).findings[0].id, 'S3-offline');
  assert.equal(reading(s, 'all', 'temperature', now + 16000), null);
  assert.equal(evaluate(s, 'all', now + 16000).findings.length, 3);
});
test('valid sensor payload accepted; demo, stale, duplicate, future and wrong units rejected', () => {
  const api = { ...demoSnapshot('normal', 0, now), source: 'sensor' };
  assert.equal(parseSnapshot(api, now).sensors.length, 18);
  assert.throws(() => parseSnapshot(demoSnapshot('normal', 0, now), now));
  assert.throws(() => parseSnapshot(api, now + 16000));
  for (const edit of [s => s.sensors[0].unit = 'F', s => s.sensors[0].at = new Date(now + 60000).toISOString(), s => s.sensors[1].id = s.sensors[0].id, s => s.sensors[1].kind = 'toString', s => s.sensors[0].value = NaN]) {
    const invalid = structuredClone(api); edit(invalid); assert.throws(() => parseSnapshot(invalid, now));
  }
});
test('missing telemetry raises coverage event and never substitutes demo readings', () => {
  const s = { ...demoSnapshot('normal', 0, now), source: 'sensor', sensors: [] };
  assert.throws(() => parseSnapshot(s, now));
  assert.equal(evaluate(s, 'all', now).findings.length, 3);
  assert.equal(reading(s, 'S1', 'temperature', now), null);
});
test('service failures reject; successful result retains snapshot provenance', async () => {
  const originalFetch = globalThis.fetch; globalThis.window = { location: { origin: 'http://localhost:5173' } };
  const snapshot = demoSnapshot('freeze', 0, now);
  try {
    globalThis.fetch = async () => new Response('unavailable', { status: 503 });
    await assert.rejects(fetchSnapshot('/api/telemetry', new AbortController().signal), /503/);
    await assert.rejects(fetchAnalysis('/api/analyze', snapshot, 'all', new AbortController().signal), /503/);
    globalThis.fetch = async () => Response.json({ summary: 'test analysis', findings: evaluate(snapshot, 'all', now).findings });
    const result = await fetchAnalysis('/api/analyze', snapshot, 'all', new AbortController().signal);
    assert.equal(result.source, 'service'); assert.equal(result.dataSource, 'demo'); assert.equal(result.snapshotAt, snapshot.at);
    await assert.rejects(fetchAnalysis('/api/analyze', snapshot, 'S2', new AbortController().signal), /路段/);
    globalThis.fetch = async () => Response.json({ summary: 'invalid', findings: [{ title: 'missing evidence' }] });
    await assert.rejects(fetchAnalysis('/api/analyze', snapshot, 'all', new AbortController().signal), /证据/);
  } finally { globalThis.fetch = originalFetch; delete globalThis.window; }
});
