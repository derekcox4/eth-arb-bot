import { GameConfig } from '../config/gameConfig';

const LEADERBOARD_STORAGE_KEY = 'pewDailyLeaderboard';
const LAST_RESET_KEY = 'pewLastReset';

/**
 * Get current day identifier (YYYY-MM-DD in UTC)
 */
export function getCurrentDay() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Check if we need to reset the leaderboard (new day)
 */
export function shouldResetLeaderboard() {
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  const currentDay = getCurrentDay();
  return lastReset !== currentDay;
}

/**
 * Get current leaderboard data
 */
export function getLeaderboard() {
  try {
    const data = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!data) return [];

    const leaderboard = JSON.parse(data);

    // Reset if it's a new day
    if (shouldResetLeaderboard()) {
      return [];
    }

    return leaderboard;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

/**
 * Update player's score on leaderboard
 */
export function updateLeaderboard(walletAddress, score, tokensEarned) {
  try {
    let leaderboard = getLeaderboard();

    // Find existing entry for this wallet
    const existingIndex = leaderboard.findIndex(entry => entry.wallet === walletAddress);

    if (existingIndex >= 0) {
      // Update if new score is higher
      if (score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex] = {
          wallet: walletAddress,
          score,
          tokensEarned,
          gamesPlayed: leaderboard[existingIndex].gamesPlayed + 1,
          timestamp: Date.now()
        };
      } else {
        // Just increment games played
        leaderboard[existingIndex].gamesPlayed += 1;
      }
    } else {
      // Add new entry
      leaderboard.push({
        wallet: walletAddress,
        score,
        tokensEarned,
        gamesPlayed: 1,
        timestamp: Date.now()
      });
    }

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top players (slightly more than needed for display)
    leaderboard = leaderboard.slice(0, GameConfig.leaderboardSize + 5);

    // Save
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
    localStorage.setItem(LAST_RESET_KEY, getCurrentDay());

    return leaderboard;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return getLeaderboard();
  }
}

/**
 * Get player's rank on leaderboard
 */
export function getPlayerRank(walletAddress) {
  const leaderboard = getLeaderboard();
  const rank = leaderboard.findIndex(entry => entry.wallet === walletAddress);
  return rank >= 0 ? rank + 1 : null; // 1-indexed rank
}

/**
 * Get top N players
 */
export function getTopPlayers(count = GameConfig.leaderboardSize) {
  const leaderboard = getLeaderboard();
  return leaderboard.slice(0, count);
}

/**
 * Calculate prize for a given rank
 */
export function calculatePrize(rank, totalPot) {
  const percentage = GameConfig.prizeDistribution[rank];
  if (!percentage) return 0;

  return (totalPot * percentage) / 100;
}

/**
 * Get all prize amounts for current pot
 */
export function getPrizeBreakdown(totalPot) {
  const breakdown = [];
  for (let rank = 1; rank <= GameConfig.leaderboardSize; rank++) {
    breakdown.push({
      rank,
      percentage: GameConfig.prizeDistribution[rank],
      amount: calculatePrize(rank, totalPot)
    });
  }
  return breakdown;
}

/**
 * Get time until next reset (midnight UTC)
 */
export function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC

  return tomorrow.getTime() - now.getTime(); // milliseconds
}

/**
 * Format time remaining as HH:MM:SS
 */
export function formatTimeRemaining(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address) {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Reset leaderboard (for testing or manual reset)
 */
export function resetLeaderboard() {
  localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  localStorage.setItem(LAST_RESET_KEY, getCurrentDay());
}

/**
 * Archive yesterday's leaderboard (optional - for history tracking)
 */
export function archiveLeaderboard() {
  const leaderboard = getLeaderboard();
  const yesterday = getCurrentDay();

  try {
    const archives = JSON.parse(localStorage.getItem('pewLeaderboardArchive') || '{}');
    archives[yesterday] = {
      leaderboard,
      archivedAt: Date.now()
    };

    // Keep only last 30 days
    const keys = Object.keys(archives).sort().reverse();
    if (keys.length > 30) {
      keys.slice(30).forEach(key => delete archives[key]);
    }

    localStorage.setItem('pewLeaderboardArchive', JSON.stringify(archives));
  } catch (error) {
    console.error('Error archiving leaderboard:', error);
  }
}
