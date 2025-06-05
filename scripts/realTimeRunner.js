require('dotenv').config();
console.log("Starting arbitrage bot...");

const runBot = async () => {
  while (true) {
    try {
      // Simulate checking for arbitrage
      console.log(`[${new Date().toISOString()}] Scanning for arbitrage opportunities...`);
      
      // TODO: Insert your real arbitrage logic here

      // Sleep for 10 seconds
      await new Promise(r => setTimeout(r, 10000));
    } catch (err) {
      console.error("Error in bot loop:", err.message);
    }
  }
};

runBot();
