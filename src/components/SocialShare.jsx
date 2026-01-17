import React, { useState } from 'react';
import { GameConfig } from '../config/gameConfig';

const SocialShare = ({ rank, score, dailyPot }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const getShareText = () => {
    let text = '';

    if (rank === 1) {
      text = `🥇 I'm #1 on the ${GameConfig.tokenName} Shooter Daily Leaderboard!\n\nScore: ${score.toLocaleString()} points\n\nCompete for ${dailyPot.toFixed(4)} SOL in prizes!\n\n#PEWShooter #Solana #PlayToEarn`;
    } else if (rank === 2) {
      text = `🥈 I'm #2 on the ${GameConfig.tokenName} Shooter Daily Leaderboard!\n\nScore: ${score.toLocaleString()} points\n\nComing for that #1 spot!\n\n#PEWShooter #Solana #PlayToEarn`;
    } else if (rank === 3) {
      text = `🥉 I'm #3 on the ${GameConfig.tokenName} Shooter Daily Leaderboard!\n\nScore: ${score.toLocaleString()} points\n\n#PEWShooter #Solana #PlayToEarn`;
    } else if (rank && rank <= GameConfig.leaderboardSize) {
      text = `🏆 I'm ranked #${rank} on the ${GameConfig.tokenName} Shooter Daily Leaderboard!\n\nScore: ${score.toLocaleString()} points\n\nTop 10 split ${dailyPot.toFixed(4)} SOL!\n\n#PEWShooter #Solana #PlayToEarn`;
    } else {
      text = `Just scored ${score.toLocaleString()} points on ${GameConfig.tokenName} Shooter!\n\nCompete for SOL prizes on Solana!\n\n#PEWShooter #Solana #PlayToEarn`;
    }

    return text;
  };

  const shareOnTwitter = () => {
    const text = getShareText();
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    window.open(twitterUrl, '_blank', 'width=550,height=420');
    showNotificationTemporary('Opening Twitter...');
  };

  const shareToDiscord = () => {
    const text = getShareText();

    // Copy to clipboard for Discord sharing
    navigator.clipboard.writeText(text).then(() => {
      showNotificationTemporary('Copied to clipboard! Paste in Discord.');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showNotificationTemporary('Failed to copy to clipboard');
    });
  };

  const copyShareText = () => {
    const text = getShareText();

    navigator.clipboard.writeText(text).then(() => {
      showNotificationTemporary('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showNotificationTemporary('Failed to copy to clipboard');
    });
  };

  const showNotificationTemporary = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div className="social-sharing">
      <h3>Share Your Achievement!</h3>
      <div className="share-buttons">
        <button
          className="share-btn share-btn-twitter"
          onClick={shareOnTwitter}
        >
          <span>🐦</span>
          Share on Twitter
        </button>
        <button
          className="share-btn share-btn-discord"
          onClick={shareToDiscord}
        >
          <span>💬</span>
          Share on Discord
        </button>
        <button
          className="share-btn share-btn-copy"
          onClick={copyShareText}
        >
          <span>📋</span>
          Copy Text
        </button>
      </div>

      {showNotification && (
        <div className="share-notification">
          {notificationMessage}
        </div>
      )}
    </div>
  );
};

export default SocialShare;
