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
  const gameContainerRef = useRef(null);

  // Token mint address (will be set after deployment)
  const TOKEN_MINT = new PublicKey(GameConfig.tokenMint);
  const TREASURY_WALLET = new PublicKey(GameConfig.treasuryWallet);

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
    alert(`Game Over! You earned ${tokensEarned} $BOBO tokens!`);

    // In a real implementation, you'd call a Solana program to mint tokens
    // For now, we'll simulate it
    setTokenBalance(prev => prev + tokensEarned);
  };

  const handleUpgradeWeapon = async (level) => {
    const cost = GameConfig.upgradeCosts[level] || 100;

    if (tokenBalance < cost) {
      alert(`Insufficient tokens! You need ${cost} $BOBO tokens.`);
      return;
    }

    // In real implementation, burn tokens via Solana program
    setTokenBalance(prev => prev - cost);
    setWeaponLevel(level);
    alert(`Weapon upgraded to Level ${level}!`);
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
      // In real implementation, call Solana program to burn tokens and enter lottery
      // For demo, simulate lottery (10% chance to win)
      const won = Math.random() < 0.1;

      setTokenBalance(prev => prev - amount);

      if (won) {
        const prize = lotteryPool * 0.1; // Win 10% of pool
        alert(`Congratulations! You won ${prize.toFixed(4)} SOL!`);
        setLotteryPool(prev => prev * 0.9);
      } else {
        alert('Better luck next time! Your tokens were burned.');
      }
    } catch (error) {
      console.error('Error burning for lottery:', error);
      alert('Failed to enter lottery. Please try again.');
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🎮 BOBO SHOOTER</h1>
        <p>Shoot enemies, earn $BOBO tokens, win SOL prizes!</p>
      </div>

      <div className="wallet-section">
        <WalletMultiButton />
        {publicKey && (
          <>
            <div className="balance-display">
              💰 {solBalance.toFixed(4)} SOL
            </div>
            <div className="balance-display">
              🪙 {tokenBalance.toFixed(2)} $BOBO
            </div>
          </>
        )}
      </div>

      {publicKey && !isPlaying && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button className="play-btn" onClick={handlePayEntryFee}>
            🎯 Play Game ({GameConfig.entryFee} SOL)
          </button>
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
            <div className="upgrade-buttons">
              <button
                className="upgrade-btn"
                onClick={() => handleUpgradeWeapon(2)}
                disabled={weaponLevel >= 2}
              >
                Level 2 (100 $BOBO)
              </button>
              <button
                className="upgrade-btn"
                onClick={() => handleUpgradeWeapon(3)}
                disabled={weaponLevel >= 3}
              >
                Level 3 (250 $BOBO)
              </button>
              <button
                className="upgrade-btn"
                onClick={() => handleUpgradeWeapon(4)}
                disabled={weaponLevel >= 4}
              >
                Level 4 (500 $BOBO)
              </button>
            </div>
          </div>

          <div className="lottery-pool">
            <h3>🎰 LOTTERY POOL</h3>
            <div className="prize">{lotteryPool.toFixed(4)} SOL</div>
            <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
              Burn tokens for a chance to win!
            </p>
            <div style={{ marginTop: '15px' }}>
              <button
                className="lottery-btn"
                onClick={() => handleBurnForLottery(100)}
              >
                Burn 100 $BOBO (10% chance)
              </button>
              <button
                className="lottery-btn"
                onClick={() => handleBurnForLottery(500)}
                style={{ marginLeft: '10px' }}
              >
                Burn 500 $BOBO (25% chance)
              </button>
            </div>
          </div>

          <div className="game-info">
            <strong>How to Play:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Pay {GameConfig.entryFee} SOL entry fee to start playing</li>
              <li>Shoot enemies to earn points - each point = 1 $BOBO token (max {GameConfig.maxTokensPerGame} per game)</li>
              <li>Use tokens to upgrade your weapon for better firepower</li>
              <li>Or burn tokens to enter the lottery for SOL prizes</li>
              <li>Token supply is capped at {GameConfig.maxSupply.toLocaleString()} $BOBO</li>
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
