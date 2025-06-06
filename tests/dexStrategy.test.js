import test from 'node:test';
import assert from 'node:assert/strict';
import { runDEXStrategy } from '../utils/dexStrategy.js';

test('runDEXStrategy uses provided provider', async () => {
  let called = false;
  const provider = {
    getBlockNumber: async () => {
      called = true;
      return 42;
    },
  };

  await runDEXStrategy('test', { provider });
  assert.ok(called, 'provider.getBlockNumber was not called');
});
