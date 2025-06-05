
function logProfit() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Simulated profit: $12.48`);
}

module.exports = { logProfit };
