import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { GameConfig } from '../config/gameConfig';
import {
  getTopPlayers,
  getPlayerRank,
  getTimeUntilReset,
  formatTimeRemaining,
  truncateAddress,
  getPrizeBreakdown
} from '../utils/leaderboard';

const Leaderboard = ({ dailyPot }) => {
  const { publicKey } = useWallet();
  const [topPlayers, setTopPlayers] = useState([]);
  const [playerRank, setPlayerRank] = useState(null);
  const [timeUntilReset, setTimeUntilReset] = useState(0);

  // Update leaderboard data
  useEffect(() => {
    const updateData = () => {
      setTopPlayers(getTopPlayers());
      if (publicKey) {
        setPlayerRank(getPlayerRank(publicKey.toString()));
      }
      setTimeUntilReset(getTimeUntilReset());
    };

    updateData();
    const interval = setInterval(updateData, 1000); // Update every second

    return () => clearInterval(interval);
  }, [publicKey]);

  const prizeBreakdown = getPrizeBreakdown(dailyPot);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Daily Leaderboard</h2>
        <div className="reset-timer">
          ⏰ Resets in: {formatTimeRemaining(timeUntilReset)}
        </div>
      </div>

      <div className="daily-pot-display">
        <div className="pot-label">Today's Prize Pool</div>
        <div className="pot-amount">{dailyPot.toFixed(4)} SOL</div>
        <div className="pot-description">
          Distributed to top 10 players at midnight UTC
        </div>
      </div>

      {playerRank && (
        <div className="player-rank-badge">
          Your Rank: #{playerRank}
          {playerRank <= GameConfig.leaderboardSize && (
            <span className="prize-preview">
              {' '}• Prize: {prizeBreakdown[playerRank - 1]?.amount.toFixed(4)} SOL ({prizeBreakdown[playerRank - 1]?.percentage}%)
            </span>
          )}
        </div>
      )}

      <div className="leaderboard-table">
        <div className="leaderboard-header-row">
          <div className="rank-col">Rank</div>
          <div className="player-col">Player</div>
          <div className="score-col">Best Score</div>
          <div className="games-col">Games</div>
          <div className="prize-col">Prize</div>
        </div>

        {topPlayers.map((player, index) => {
          const rank = index + 1;
          const prize = prizeBreakdown[rank - 1];
          const isCurrentPlayer = publicKey && player.wallet === publicKey.toString();

          return (
            <div
              key={player.wallet}
              className={`leaderboard-row ${isCurrentPlayer ? 'current-player' : ''} ${rank <= 3 ? 'top-three' : ''}`}
            >
              <div className="rank-col">
                {rank === 1 && '🥇'}
                {rank === 2 && '🥈'}
                {rank === 3 && '🥉'}
                {rank > 3 && `#${rank}`}
              </div>
              <div className="player-col">
                {truncateAddress(player.wallet)}
                {isCurrentPlayer && <span className="you-badge">YOU</span>}
              </div>
              <div className="score-col">{player.score.toLocaleString()}</div>
              <div className="games-col">{player.gamesPlayed}</div>
              <div className="prize-col">
                {prize?.amount.toFixed(4)} SOL
                <span className="prize-percentage">({prize?.percentage}%)</span>
              </div>
            </div>
          );
        })}

        {topPlayers.length === 0 && (
          <div className="empty-leaderboard">
            No games played today. Be the first to compete!
          </div>
        )}

        {topPlayers.length > 0 && topPlayers.length < GameConfig.leaderboardSize && (
          <div className="leaderboard-footer">
            {GameConfig.leaderboardSize - topPlayers.length} more spots available in top 10!
          </div>
        )}
      </div>

      <div className="leaderboard-info">
        <h3>How It Works:</h3>
        <ul>
          <li>Play games to get your best daily score</li>
          <li>Only your highest score counts toward the leaderboard</li>
          <li>Top 10 players split {(GameConfig.potAllocationFromEntry * 100).toFixed(0)}% of all entry fees</li>
          <li>Leaderboard resets daily at midnight UTC</li>
          <li>Winners can claim prizes after reset</li>
        </ul>
      </div>
    </div>
  );
};

export default Leaderboard;
