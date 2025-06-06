import test from 'node:test';
import assert from 'node:assert/strict';
import { runArbitrageStrategies } from '../utils/arbEngine.js';

test('runArbitrageStrategies triggers sub-strategies', async () => {
  const chains = [];
  const dexMock = async (chain) => {
    chains.push(chain);
  };
  let lendingCalled = 0;
  const lendingMock = async () => {
    lendingCalled++;
  };

  await runArbitrageStrategies({
    runDEXStrategy: dexMock,
    runLendingStrategy: lendingMock,
  });

  assert.deepStrictEqual(chains, ['ethereum', 'base', 'arbitrum']);
  assert.equal(lendingCalled, 1);
});
