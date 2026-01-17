import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { GameConfig } from '../config/gameConfig';
import { truncateAddress } from '../utils/leaderboard';

const HistoricalStats = () => {
  const { publicKey } = useWallet();
  const [archives, setArchives] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);

  useEffect(() => {
    loadArchives();
  }, []);

  useEffect(() => {
    if (publicKey) {
      calculatePlayerStats();
    }
  }, [publicKey, archives]);

  const loadArchives = () => {
    try {
      const data = localStorage.getItem('pewLeaderboardArchive') || '{}';
      const archiveData = JSON.parse(data);
      setArchives(archiveData);

      // Set most recent date as default
      const dates = Object.keys(archiveData).sort().reverse();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Error loading archives:', error);
    }
  };

  const calculatePlayerStats = () => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();
    let totalGames = 0;
    let totalWins = 0;
    let bestScore = 0;
    let totalPrizesWon = 0;
    let top10Finishes = 0;

    Object.values(archives).forEach(({ leaderboard }) => {
      const playerEntry = leaderboard.find(entry => entry.wallet === walletAddress);
      if (playerEntry) {
        totalGames += playerEntry.gamesPlayed;
        if (playerEntry.score > bestScore) {
          bestScore = playerEntry.score;
        }

        const rank = leaderboard.findIndex(entry => entry.wallet === walletAddress) + 1;
        if (rank <= 10) {
          top10Finishes++;
        }
        if (rank === 1) {
          totalWins++;
        }
      }
    });

    setPlayerStats({
      totalGames,
      totalWins,
      bestScore,
      totalPrizesWon,
      top10Finishes,
      daysPlayed: Object.keys(archives).filter(date => {
        return archives[date].leaderboard.some(entry => entry.wallet === walletAddress);
      }).length
    });
  };

  const availableDates = Object.keys(archives).sort().reverse();
  const selectedLeaderboard = selectedDate ? archives[selectedDate]?.leaderboard || [] : [];

  return (
    <div className="historical-stats-container">
      <div className="historical-header">
        <h2>📊 Historical Stats</h2>
      </div>

      {/* Player Stats Summary */}
      {publicKey && playerStats && (
        <div className="player-stats-summary">
          <h3>Your All-Time Stats</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{playerStats.daysPlayed}</div>
              <div className="stat-label">Days Played</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{playerStats.totalGames}</div>
              <div className="stat-label">Total Games</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{playerStats.bestScore.toLocaleString()}</div>
              <div className="stat-label">Best Score</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{playerStats.totalWins}</div>
              <div className="stat-label">1st Place Wins</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{playerStats.top10Finishes}</div>
              <div className="stat-label">Top 10 Finishes</div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      {availableDates.length > 0 ? (
        <>
          <div className="date-selector">
            <label htmlFor="date-select">View Past Leaderboard:</label>
            <select
              id="date-select"
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-dropdown"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Historical Leaderboard */}
          <div className="historical-leaderboard">
            <h3>Top 10 for {selectedDate}</h3>
            <div className="leaderboard-table">
              <div className="leaderboard-header-row">
                <div className="rank-col">Rank</div>
                <div className="player-col">Player</div>
                <div className="score-col">Score</div>
                <div className="games-col">Games</div>
              </div>

              {selectedLeaderboard.slice(0, 10).map((player, index) => {
                const rank = index + 1;
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
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-historical">
          <p>No historical data available yet.</p>
          <p>Leaderboards are archived daily at midnight UTC.</p>
        </div>
      )}
    </div>
  );
};

export default HistoricalStats;
