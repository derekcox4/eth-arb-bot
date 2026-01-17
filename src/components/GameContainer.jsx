import React, { useState, useEffect, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import BoboShooterGame from '../game/BoboShooterGame';
import Leaderboard from './Leaderboard';
import HistoricalStats from './HistoricalStats';
import SocialShare from './SocialShare';
import { GameConfig } from '../config/gameConfig';
import { updateLeaderboard, getPlayerRank, shouldResetLeaderboard, archiveLeaderboard } from '../utils/leaderboard';

const GameContainer = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [gameInstance, setGameInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [dailyPot, setDailyPot] = useState(0);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [gamesPlayedThisHour, setGamesPlayedThisHour] = useState(0);
  const [playerRank, setPlayerRank] = useState(null);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const gameContainerRef = useRef(null);

  // Token mint address (will be set after deployment)
  const TOKEN_MINT = new PublicKey(GameConfig.tokenMint);
  const TREASURY_WALLET = new PublicKey(GameConfig.treasuryWallet);

  // Rate limiting - track game plays in localStorage
  const STORAGE_KEY = 'pewGameHistory';

  // Get rate limit status
  const getRateLimitStatus = () => {
    if (!publicKey) return { canPlay: false, gamesLeft: 0, cooldown: 0 };

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const walletHistory = history[publicKey.toString()] || [];

    // Filter games within the last hour
    const now = Date.now();
    const recentGames = walletHistory.filter(timestamp =>
      now - timestamp < GameConfig.rateLimitWindow
    );

    // Check last game time for cooldown
    const lastGameTime = recentGames[recentGames.length - 1] || 0;
    const timeSinceLastGame = now - lastGameTime;
    const cooldown = Math.max(0, GameConfig.minTimeBetweenGames - timeSinceLastGame);

    const gamesLeft = Math.max(0, GameConfig.maxGamesPerHour - recentGames.length);
    const canPlay = gamesLeft > 0 && cooldown === 0;

    return { canPlay, gamesLeft, cooldown, gamesPlayed: recentGames.length };
  };

  // Record a game play
  const recordGamePlay = () => {
    if (!publicKey) return;

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const walletHistory = history[publicKey.toString()] || [];

    walletHistory.push(Date.now());

    // Clean up old entries (older than 1 hour)
    const now = Date.now();
    const cleanedHistory = walletHistory.filter(timestamp =>
      now - timestamp < GameConfig.rateLimitWindow
    );

    history[publicKey.toString()] = cleanedHistory;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    // Update UI state
    setGamesPlayedThisHour(cleanedHistory.length);
  };

  // Update rate limit display
  useEffect(() => {
    if (!publicKey) return;

    const updateCooldown = () => {
      const status = getRateLimitStatus();
      setCooldownRemaining(status.cooldown);
      setGamesPlayedThisHour(status.gamesPlayed);
      setPlayerRank(getPlayerRank(publicKey.toString()));
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [publicKey]);

  // Archive leaderboard daily at midnight UTC
  useEffect(() => {
    const checkForReset = () => {
      if (shouldResetLeaderboard()) {
        archiveLeaderboard();
        console.log('Leaderboard archived for new day');
      }
    };

    // Check immediately
    checkForReset();

    // Check every minute for midnight UTC
    const interval = setInterval(checkForReset, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch balances
  useEffect(() => {
    if (!publicKey) return;

    const fetchBalances = async () => {
      try {
        // Fetch SOL balance
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);

        // Fetch token balance
        try {
          const tokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
          const accountInfo = await getAccount(connection, tokenAccount);
          setTokenBalance(Number(accountInfo.amount) / 1e9);
        } catch (err) {
          setTokenBalance(0);
        }

        // Fetch daily pot (75% of treasury balance, since 75% of fees go to pot)
        const treasuryBalance = await connection.getBalance(TREASURY_WALLET);
        setDailyPot((treasuryBalance / LAMPORTS_PER_SOL) * GameConfig.potAllocationFromEntry);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);

    return () => clearInterval(interval);
  }, [publicKey, connection]);

  // Initialize game
  useEffect(() => {
    if (gameContainerRef.current && !gameInstance && isPlaying) {
      const game = new BoboShooterGame(gameContainerRef.current, {
        onScoreUpdate: (newScore) => setScore(newScore),
        onGameEnd: handleGameEnd,
        weaponLevel
      });
      setGameInstance(game);
    }

    return () => {
      if (gameInstance) {
        gameInstance.destroy();
      }
    };
  }, [isPlaying]);

  const handlePayEntryFee = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    // Check rate limits
    const rateLimitStatus = getRateLimitStatus();
    if (!rateLimitStatus.canPlay) {
      if (rateLimitStatus.cooldown > 0) {
        const seconds = Math.ceil(rateLimitStatus.cooldown / 1000);
        alert(`Please wait ${seconds} seconds before playing again.`);
        return;
      } else {
        alert(`Rate limit reached! You can only play ${GameConfig.maxGamesPerHour} games per hour.`);
        return;
      }
    }

    try {
      // Create transaction to send entry fee
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports: GameConfig.entryFeeLamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Entry fee paid:', signature);

      // Record game play for rate limiting
      recordGamePlay();

      setIsPlaying(true);
    } catch (error) {
      console.error('Error paying entry fee:', error);
      alert('Failed to pay entry fee. Please try again.');
    }
  };

  const handleGameEnd = async (finalScore) => {
    setScore(finalScore);
    setLastScore(finalScore);
    setIsPlaying(false);

    if (!publicKey) return;

    // Calculate token reward based on score (capped)
    const tokensEarned = Math.min(finalScore, GameConfig.maxTokensPerGame);

    // Update leaderboard
    updateLeaderboard(publicKey.toString(), finalScore, tokensEarned);

    // Get updated rank
    const newRank = getPlayerRank(publicKey.toString());
    setPlayerRank(newRank);

    // Show result
    let message = `Game Over! You scored ${finalScore} points and earned ${tokensEarned} ${GameConfig.tokenSymbol} tokens!\n\n`;

    if (newRank && newRank <= GameConfig.leaderboardSize) {
      message += `🏆 You're ranked #${newRank} on the daily leaderboard!\n`;
      message += `Keep playing to secure your spot in the top 10!`;
      // Show social share for top 10
      setShowSocialShare(true);
    } else if (newRank) {
      message += `Current rank: #${newRank}\n`;
      message += `You need to reach top 10 to win daily prizes!`;
    }

    alert(message);

    // In a real implementation, you'd call a Solana program to distribute tokens
    setTokenBalance(prev => prev + tokensEarned);
  };

  const handleUpgradeWeapon = async (level) => {
    const cost = GameConfig.upgradeCosts[level] || 100;

    if (tokenBalance < cost) {
      alert(`Insufficient tokens! You need ${cost} ${GameConfig.tokenSymbol} tokens.`);
      return;
    }

    // In real implementation, transfer tokens back to treasury via Solana program
    setTokenBalance(prev => prev - cost);
    setWeaponLevel(level);
    alert(`Weapon upgraded to Level ${level}!\n\n${cost} ${GameConfig.tokenSymbol} tokens returned to treasury for redistribution.`);
  };

  const rateLimitStatus = getRateLimitStatus();

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🎯 {GameConfig.tokenName} SHOOTER</h1>
        <p>Compete daily, earn {GameConfig.tokenSymbol} tokens, win SOL prizes!</p>
      </div>

      <div className="wallet-section">
        <WalletMultiButton />
        {publicKey && (
          <>
            <div className="balance-display">
              💰 {solBalance.toFixed(4)} SOL
            </div>
            <div className="balance-display">
              🪙 {tokenBalance.toFixed(2)} {GameConfig.tokenSymbol}
            </div>
          </>
        )}
      </div>

      {publicKey && !isPlaying && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button
            className="play-btn"
            onClick={handlePayEntryFee}
            disabled={!rateLimitStatus.canPlay}
          >
            {cooldownRemaining > 0
              ? `⏳ Cooldown: ${Math.ceil(cooldownRemaining / 1000)}s`
              : rateLimitStatus.gamesLeft === 0
              ? `🚫 Rate Limit Reached`
              : `🎯 Play Game (${GameConfig.entryFee} SOL)`
            }
          </button>

          {publicKey && (
            <div style={{ marginTop: '15px', fontSize: '0.9em', opacity: 0.8 }}>
              Games played this hour: {gamesPlayedThisHour} / {GameConfig.maxGamesPerHour}
              {rateLimitStatus.cooldown === 0 && rateLimitStatus.gamesLeft > 0 && (
                <span> • {rateLimitStatus.gamesLeft} games remaining</span>
              )}
            </div>
          )}
        </div>
      )}

      {isPlaying && (
        <div className="game-canvas-wrapper" ref={gameContainerRef}>
          {/* Phaser game will be injected here */}
        </div>
      )}

      {publicKey && (
        <>
          <div className="game-stats">
            <div className="stat-card">
              <h3>Current Score</h3>
              <p>{score}</p>
            </div>
            <div className="stat-card">
              <h3>Weapon Level</h3>
              <p>Level {weaponLevel}</p>
            </div>
            <div className="stat-card">
              <h3>Your Rank</h3>
              <p>{playerRank ? `#${playerRank}` : 'Unranked'}</p>
            </div>
          </div>

          <div className="upgrade-section">
            <h2>⚔️ Weapon Upgrades</h2>
            <p style={{ textAlign: 'center', fontSize: '0.9em', marginBottom: '15px', opacity: 0.9 }}>
              Tokens used for upgrades are recycled back to the treasury!
            </p>
            <div className="upgrade-buttons">
              <button
                className="upgrade-btn"
                onClick={() => handleUpgradeWeapon(2)}
                disabled={weaponLevel >= 2 || tokenBalance < GameConfig.upgradeCosts[2]}
              >
                Level 2 (100 {GameConfig.tokenSymbol})
              </button>
              <button
                className="upgrade-btn"
                onClick={() => handleUpgradeWeapon(3)}
                disabled={weaponLevel >= 3 || tokenBalance < GameConfig.upgradeCosts[3]}
              >
                Level 3 (250 {GameConfig.tokenSymbol})
              </button>
              <button
                className="upgrade-btn"
                onClick={() => handleUpgradeWeapon(4)}
                disabled={weaponLevel >= 4 || tokenBalance < GameConfig.upgradeCosts[4]}
              >
                Level 4 (500 {GameConfig.tokenSymbol})
              </button>
            </div>
          </div>

          {/* Daily Leaderboard */}
          <Leaderboard dailyPot={dailyPot} />

          {/* Social Sharing (shown after top 10 finish) */}
          {showSocialShare && playerRank && playerRank <= GameConfig.leaderboardSize && (
            <SocialShare rank={playerRank} score={lastScore} dailyPot={dailyPot} />
          )}

          {/* Historical Stats */}
          <HistoricalStats />

          <div className="game-info">
            <strong>How to Play:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Pay {GameConfig.entryFee} SOL entry fee to start playing</li>
              <li>Shoot enemies to earn points - each point = 1 {GameConfig.tokenSymbol} token (max {GameConfig.maxTokensPerGame} per game)</li>
              <li>Only your best daily score counts for the leaderboard</li>
              <li>Top 10 players split {(GameConfig.potAllocationFromEntry * 100).toFixed(0)}% of daily entry fees at midnight UTC</li>
              <li>Use tokens to upgrade your weapon (tokens are recycled!)</li>
              <li>Rate limit: {GameConfig.maxGamesPerHour} games per hour with {GameConfig.minTimeBetweenGames / 1000}s cooldown</li>
            </ul>
          </div>
        </>
      )}

      {!publicKey && (
        <div className="loading">
          <p>👆 Connect your Phantom or Solflare wallet to start playing!</p>
        </div>
      )}
    </div>
  );
};

export default GameContainer;
