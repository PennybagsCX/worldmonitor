// The relay holds a Jev-labelled critical/high below its pAlert gate. The
// classify-event RPC reads the same cache row and its only channel to the
// client is the level (threat-classifier.ts rebuilds isAlert from it), so a
// held row must not leave the RPC at an alert level.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { levelServedToCallers } from '../server/worldmonitor/intelligence/v1/classify-event';

describe('classify-event: levelServedToCallers', () => {
  it('serves an LLM row (no src) unchanged', () => {
    assert.equal(levelServedToCallers({ level: 'critical', category: 'conflict', timestamp: 1 }), 'critical');
    assert.equal(levelServedToCallers({ level: 'low', category: 'diplomatic', timestamp: 1 }), 'low');
  });

  it('serves a Jev alert at or above the gate unchanged', () => {
    assert.equal(levelServedToCallers({ level: 'high', category: 'conflict', timestamp: 1, src: 'jev', pAlert: 0.7 }), 'high');
  });

  it('serves a held Jev alert as medium', () => {
    assert.equal(levelServedToCallers({ level: 'high', category: 'disaster', timestamp: 1, src: 'jev', pAlert: 0.55 }), 'medium');
    assert.equal(levelServedToCallers({ level: 'critical', category: 'health', timestamp: 1, src: 'jev' }), 'medium');
  });

  it('leaves a non-alert Jev level alone whatever its pAlert', () => {
    assert.equal(levelServedToCallers({ level: 'info', category: 'general', timestamp: 1, src: 'jev', pAlert: 0.01 }), 'info');
  });
});
