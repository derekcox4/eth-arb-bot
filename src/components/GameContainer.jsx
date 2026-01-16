import React, { useState, useEffect, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import BoboShooterGame from '../game/BoboShooterGame';
import { GameConfig } from '../config/gameConfig';

const GameContainer = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [gameInstance, setGameInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [lotteryPool, setLotteryPool] = useState(0);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [gamesPlayedThisHour, setGamesPlayedThisHour] = useState(0);
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
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [publicKey]);

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
          setTokenBalance(Number(accountInfo.amount) / 1e9); // Assuming 9 decimals
        } catch (err) {
          // Token account doesn't exist yet
          setTokenBalance(0);
        }

        // Fetch lottery pool
        const treasuryBalance = await connection.getBalance(TREASURY_WALLET);
        setLotteryPool((treasuryBalance / LAMPORTS_PER_SOL) * 0.5); // 50% goes to lottery
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // Update every 10 seconds

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
    setIsPlaying(false);

    if (!publicKey) return;

    // Calculate token reward based on score (capped)
    const tokensEarned = Math.min(finalScore, GameConfig.maxTokensPerGame);

    console.log(`Game ended! Score: ${finalScore}, Tokens earned: ${tokensEarned}`);
    alert(`Game Over! You earned ${tokensEarned} ${GameConfig.tokenSymbol} tokens!`);

    // In a real implementation, you'd call a Solana program to mint tokens
    // For now, we'll simulate it
    setTokenBalance(prev => prev + tokensEarned);
  };

  const handleUpgradeWeapon = async (level) => {
    const cost = GameConfig.upgradeCosts[level] || 100;

    if (tokenBalance < cost) {
      alert(`Insufficient tokens! You need ${cost} ${GameConfig.tokenSymbol} tokens.`);
      return;
    }

    // In real implementation, transfer tokens back to treasury via Solana program
    // Tokens are recycled, not burned!
    setTokenBalance(prev => prev - cost);
    setWeaponLevel(level);
    alert(`Weapon upgraded to Level ${level}!\n\n${cost} ${GameConfig.tokenSymbol} tokens returned to treasury for redistribution.`);
  };

  const handleBurnForLottery = async (amount) => {
    if (tokenBalance < amount) {
      alert('Insufficient tokens!');
      return;
    }

    if (amount < GameConfig.minBurnForLottery) {
      alert(`Minimum burn amount is ${GameConfig.minBurnForLottery} tokens`);
      return;
    }

    try {
      // In real implementation, call Solana program with Chainlink VRF for provably fair lottery
      // For demo, simulate lottery (will be replaced with VRF)
      const won = Math.random() < 0.1;

      setTokenBalance(prev => prev - amount);

      if (won) {
        const prize = lotteryPool * 0.1; // Win 10% of pool
        alert(`🎉 Congratulations! You won ${prize.toFixed(4)} SOL!\n\nIn production, this uses Chainlink VRF for provably fair randomness.`);
        setLotteryPool(prev => prev * 0.9);
      } else {
        alert('Better luck next time! Your tokens were burned.\n\n(Production version uses Chainlink VRF for verifiable randomness)');
      }
    } catch (error) {
      console.error('Error burning for lottery:', error);
      alert('Failed to enter lottery. Please try again.');
    }
  };

  const rateLimitStatus = getRateLimitStatus();

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🎯 {GameConfig.tokenName} SHOOTER</h1>
        <p>Shoot enemies, earn {GameConfig.tokenSymbol} tokens, win SOL prizes!</p>
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
              <h3>Max Tokens/Game</h3>
              <p>{GameConfig.maxTokensPerGame}</p>
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

          <div className="lottery-pool">
            <h3>🎰 LOTTERY POOL</h3>
            <div className="prize">{lotteryPool.toFixed(4)} SOL</div>
            <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
              Burn tokens for a chance to win!
            </p>
            <p style={{ marginTop: '5px', fontSize: '0.8em', opacity: 0.7 }}>
              Production uses Chainlink VRF for provably fair lottery
            </p>
            <div style={{ marginTop: '15px' }}>
              <button
                className="lottery-btn"
                onClick={() => handleBurnForLottery(100)}
                disabled={tokenBalance < 100}
              >
                Burn 100 {GameConfig.tokenSymbol} (10% chance)
              </button>
              <button
                className="lottery-btn"
                onClick={() => handleBurnForLottery(500)}
                disabled={tokenBalance < 500}
                style={{ marginLeft: '10px' }}
              >
                Burn 500 {GameConfig.tokenSymbol} (25% chance)
              </button>
            </div>
          </div>

          <div className="game-info">
            <strong>How to Play:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Pay {GameConfig.entryFee} SOL entry fee to start playing</li>
              <li>Shoot enemies to earn points - each point = 1 {GameConfig.tokenSymbol} token (max {GameConfig.maxTokensPerGame} per game)</li>
              <li>Use tokens to upgrade your weapon (tokens are recycled, not burned!)</li>
              <li>Or burn tokens to enter the lottery for SOL prizes</li>
              <li>Rate limit: {GameConfig.maxGamesPerHour} games per hour with {GameConfig.minTimeBetweenGames / 1000}s cooldown</li>
              <li>Token supply is capped at {GameConfig.maxSupply.toLocaleString()} {GameConfig.tokenSymbol}</li>
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
