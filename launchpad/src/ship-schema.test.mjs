import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMBLEMS, validateConfig, toRenderParams, DEFAULTS } from './ship-schema.js';

test('validateConfig accepts a well-formed config', () => {
  const r = validateConfig({ shipName: 'Nebula Runner', color: '#22d3ee', emblem: 'comet' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('validateConfig rejects a bad colour', () => {
  const r = validateConfig({ shipName: 'X', color: 'blue', emblem: 'comet' });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /colour|color/i);
});

test('validateConfig rejects an unknown emblem', () => {
  const r = validateConfig({ shipName: 'X', color: '#000000', emblem: 'banana' });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /emblem/);
});

test('validateConfig rejects an over-long shipName', () => {
  const r = validateConfig({ shipName: 'x'.repeat(25), color: '#000000', emblem: 'comet' });
  assert.equal(r.ok, false);
});

test('validateConfig accepts a 24-char name padded with whitespace (agrees with toRenderParams)', () => {
  const padded = '  ' + 'x'.repeat(24) + '  ';
  assert.equal(validateConfig({ shipName: padded, color: '#000000', emblem: 'comet' }).ok, true);
  assert.equal(toRenderParams({ shipName: padded, color: '#000000', emblem: 'comet' }).shipName, 'x'.repeat(24));
});

test('validateConfig rejects a non-object', () => {
  assert.equal(validateConfig(null).ok, false);
  assert.equal(validateConfig([]).ok, false);
});

test('toRenderParams falls back to DEFAULTS on garbage', () => {
  assert.deepEqual(toRenderParams({ shipName: '', color: 'nope', emblem: 'x' }), DEFAULTS);
  assert.deepEqual(toRenderParams(null), DEFAULTS);
});

test('toRenderParams keeps valid values and trims shipName', () => {
  const p = toRenderParams({ shipName: '  Comet  ', color: '#ABCDEF', emblem: 'bolt' });
  assert.deepEqual(p, { shipName: 'Comet', color: '#ABCDEF', emblem: 'bolt' });
});

test('all EMBLEMS are lowercase words', () => {
  for (const e of EMBLEMS) assert.match(e, /^[a-z]+$/);
});
