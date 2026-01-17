import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

class BoboShooterGame {
  constructor(container, callbacks) {
    this.callbacks = callbacks;
    this.weaponLevel = callbacks.weaponLevel || 1;

    const config = {
      type: Phaser.AUTO,
      width: GameConfig.gameWidth,
      height: GameConfig.gameHeight,
      parent: container,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this)
      },
      backgroundColor: '#000428'
    };

    this.game = new Phaser.Game(config);
    this.score = 0;
    this.gameTime = 60; // 60 seconds per game
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.comboTimeout = 2000; // 2 seconds to maintain combo
    this.powerUps = [];
    this.enemySpawnDelay = 1000;
    this.bossSpawned = false;
  }

  preload() {
    // In a real game, you'd load actual sprites
    // For now, we'll use Phaser's built-in shapes
  }

  create() {
    const scene = this.game.scene.scenes[0];

    // Create starfield background
    this.createStarfield(scene);

    // Create player (Bobo) - improved visuals
    this.player = scene.add.container(400, 500);
    const playerBody = scene.add.rectangle(0, 0, 40, 40, 0x00ff00);
    const playerGlow = scene.add.circle(0, 0, 25, 0x00ff00, 0.3);
    this.player.add([playerGlow, playerBody]);
    scene.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(40, 40);

    // Player shield indicator
    this.playerShield = scene.add.circle(0, 0, 30, 0x00ffff, 0);
    this.player.add(this.playerShield);
    this.shieldActive = false;

    // Create bullet group
    this.bullets = scene.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 100
    });

    // Create enemy group
    this.enemies = scene.physics.add.group();

    // Create power-up group
    this.powerUpGroup = scene.physics.add.group();

    // Keyboard controls
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceBar = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // UI - Score
    this.scoreText = scene.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    });

    // UI - Timer with color changes
    this.timerText = scene.add.text(16, 56, `Time: ${this.gameTime}s`, {
      fontSize: '24px',
      fill: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    });

    // UI - Weapon level
    this.weaponText = scene.add.text(GameConfig.gameWidth - 200, 16, `Weapon: Lvl ${this.weaponLevel}`, {
      fontSize: '24px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    });

    // UI - Combo counter
    this.comboText = scene.add.text(GameConfig.gameWidth / 2, 16, '', {
      fontSize: '28px',
      fill: '#ff00ff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    });
    this.comboText.setOrigin(0.5, 0);

    // UI - Power-up notification
    this.powerUpText = scene.add.text(GameConfig.gameWidth / 2, 100, '', {
      fontSize: '24px',
      fill: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
      alpha: 0
    });
    this.powerUpText.setOrigin(0.5);

    // Spawn enemies periodically (gets faster over time)
    this.enemySpawnTimer = scene.time.addEvent({
      delay: this.enemySpawnDelay,
      callback: this.spawnEnemy.bind(this),
      callbackScope: this,
      loop: true
    });

    // Game timer with visual feedback
    scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTime--;
        this.timerText.setText(`Time: ${this.gameTime}s`);

        // Change timer color based on remaining time
        if (this.gameTime <= 10) {
          this.timerText.setFill('#ff0000');
          this.timerText.setScale(1.2);
        } else if (this.gameTime <= 30) {
          this.timerText.setFill('#ffff00');
        }

        // Increase difficulty over time
        if (this.gameTime % 15 === 0 && this.enemySpawnDelay > 400) {
          this.enemySpawnDelay -= 100;
          this.enemySpawnTimer.delay = this.enemySpawnDelay;
        }

        // Spawn boss at 30 seconds if not spawned
        if (this.gameTime === 30 && !this.bossSpawned) {
          this.spawnBoss();
        }

        if (this.gameTime <= 0) {
          this.endGame();
        }
      },
      callbackScope: this,
      loop: true
    });

    // Check combo timeout
    scene.time.addEvent({
      delay: 100,
      callback: this.checkCombo.bind(this),
      callbackScope: this,
      loop: true
    });

    // Collision detection - bullets hit enemies
    scene.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );

    // Enemy-player collision
    scene.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHit,
      null,
      this
    );

    // Player collects power-ups
    scene.physics.add.overlap(
      this.player,
      this.powerUpGroup,
      this.collectPowerUp,
      null,
      this
    );
  }

  update() {
    const scene = this.game.scene.scenes[0];

    if (!this.player || !this.player.body) return;

    // Update starfield background
    this.updateStarfield(scene);

    // Player movement
    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(300);
    }

    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-300);
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(300);
    }

    // Shooting
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
      this.shoot();
    }

    // Auto-shoot for higher weapon levels
    if (this.weaponLevel >= 3 && scene.time.now % 10 === 0) {
      this.shoot();
    }
  }

  shoot() {
    const scene = this.game.scene.scenes[0];

    const bulletCount = this.weaponLevel >= 4 ? 3 : this.weaponLevel >= 2 ? 2 : 1;
    const spread = 20;

    for (let i = 0; i < bulletCount; i++) {
      const bullet = scene.add.rectangle(
        this.player.x + (i - Math.floor(bulletCount / 2)) * spread,
        this.player.y - 20,
        5,
        15,
        0xffff00
      );
      scene.physics.add.existing(bullet);
      bullet.body.setVelocityY(-400);
      this.bullets.add(bullet);

      // Remove bullets that go off screen
      scene.time.delayedCall(2000, () => {
        if (bullet) bullet.destroy();
      });
    }
  }

  spawnEnemy() {
    const scene = this.game.scene.scenes[0];

    const x = Phaser.Math.Between(50, GameConfig.gameWidth - 50);
    const enemy = scene.add.rectangle(x, 0, 30, 30, 0xff0000);
    scene.physics.add.existing(enemy);

    const speed = Phaser.Math.Between(100, 200);
    enemy.body.setVelocityY(speed);

    this.enemies.add(enemy);

    // Remove enemies that go off screen
    scene.time.delayedCall(10000, () => {
      if (enemy) enemy.destroy();
    });
  }

  hitEnemy(bullet, enemy) {
    const scene = this.game.scene.scenes[0];

    bullet.destroy();

    // Create explosion effect
    this.createExplosion(scene, enemy.x, enemy.y, enemy.isBoss ? 0xff00ff : 0xff6600);

    // Handle boss health
    if (enemy.isBoss) {
      enemy.health = (enemy.health || 20) - 1;
      if (enemy.health <= 0) {
        enemy.destroy();
        this.score += 500; // Big bonus for killing boss
        this.showPowerUpNotification('BOSS DEFEATED! +500');
      }
    } else {
      enemy.destroy();

      // Combo system
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
      this.lastHitTime = scene.time.now;

      // Score with combo multiplier
      const baseScore = 10 * this.weaponLevel;
      const comboMultiplier = Math.floor(this.combo / 5) + 1;
      const earnedScore = baseScore * comboMultiplier;
      this.score += earnedScore;

      // Update combo display
      if (this.combo >= 5) {
        this.comboText.setText(`COMBO x${this.combo}! (+${earnedScore})`);
      }

      // Random power-up drop (10% chance)
      if (Math.random() < 0.1) {
        this.spawnPowerUp(scene, enemy.x, enemy.y);
      }
    }

    this.scoreText.setText(`Score: ${this.score.toLocaleString()}`);

    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.score);
    }
  }

  playerHit(player, enemy) {
    const scene = this.game.scene.scenes[0];

    // Check if shield is active
    if (this.shieldActive) {
      enemy.destroy();
      this.createExplosion(scene, enemy.x, enemy.y, 0x00ffff);
      this.shieldActive = false;
      this.playerShield.setAlpha(0);
      this.showPowerUpNotification('Shield Blocked!');
      return;
    }

    enemy.destroy();
    this.createExplosion(scene, player.x, player.y, 0xff0000);

    // Flash player red
    scene.tweens.add({
      targets: player,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 3
    });

    // Penalty: lose 5 seconds
    this.gameTime -= 5;
    this.combo = 0; // Reset combo on hit
    this.comboText.setText('');

    if (this.gameTime <= 0) {
      this.endGame();
    }
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;

    const scene = this.game.scene.scenes[0];

    // Show game over text with stats
    const gameOverText = scene.add.text(
      GameConfig.gameWidth / 2,
      GameConfig.gameHeight / 2 - 40,
      `GAME OVER`,
      {
        fontSize: '56px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
      }
    );
    gameOverText.setOrigin(0.5);

    const statsText = scene.add.text(
      GameConfig.gameWidth / 2,
      GameConfig.gameHeight / 2 + 30,
      `Final Score: ${this.score.toLocaleString()}\nMax Combo: x${this.maxCombo}`,
      {
        fontSize: '32px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
        align: 'center'
      }
    );
    statsText.setOrigin(0.5);

    // Pause game
    scene.physics.pause();

    // Callback to parent component
    if (this.callbacks.onGameEnd) {
      setTimeout(() => {
        this.callbacks.onGameEnd(this.score);
        this.destroy();
      }, 3000);
    }
  }

  // Helper Methods

  createStarfield(scene) {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, GameConfig.gameWidth);
      const y = Phaser.Math.Between(0, GameConfig.gameHeight);
      const star = scene.add.circle(x, y, Math.random() * 2, 0xffffff, Math.random());
      star.speed = Math.random() * 2 + 1;
      this.stars.push(star);
    }
  }

  updateStarfield(scene) {
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > GameConfig.gameHeight) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, GameConfig.gameWidth);
      }
    });
  }

  checkCombo() {
    const scene = this.game.scene.scenes[0];
    if (scene.time.now - this.lastHitTime > this.comboTimeout && this.combo > 0) {
      this.combo = 0;
      this.comboText.setText('');
    }
  }

  spawnPowerUp(scene, x, y) {
    const types = ['shield', 'rapidFire', 'scoreBoost'];
    const type = types[Math.floor(Math.random() * types.length)];

    const colors = {
      shield: 0x00ffff,
      rapidFire: 0xffff00,
      scoreBoost: 0xff00ff
    };

    const powerUp = scene.add.circle(x, y, 15, colors[type]);
    scene.physics.add.existing(powerUp);
    powerUp.body.setVelocityY(100);
    powerUp.powerUpType = type;

    // Glow effect
    scene.tweens.add({
      targets: powerUp,
      alpha: 0.5,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.powerUpGroup.add(powerUp);

    // Auto-destroy after 8 seconds
    scene.time.delayedCall(8000, () => {
      if (powerUp) powerUp.destroy();
    });
  }

  collectPowerUp(player, powerUp) {
    const scene = this.game.scene.scenes[0];
    const type = powerUp.powerUpType;

    powerUp.destroy();
    this.createExplosion(scene, powerUp.x, powerUp.y, 0x00ffff);

    if (type === 'shield') {
      this.shieldActive = true;
      this.playerShield.setAlpha(0.5);
      scene.tweens.add({
        targets: this.playerShield,
        alpha: 0.8,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
      this.showPowerUpNotification('Shield Active!');

      // Shield lasts 10 seconds
      scene.time.delayedCall(10000, () => {
        this.shieldActive = false;
        scene.tweens.killTweensOf(this.playerShield);
        this.playerShield.setAlpha(0);
      });

    } else if (type === 'rapidFire') {
      const oldDelay = this.enemySpawnDelay;
      this.enemySpawnDelay = Math.max(200, this.enemySpawnDelay - 300);
      this.enemySpawnTimer.delay = this.enemySpawnDelay;
      this.showPowerUpNotification('Rapid Fire!');

      // Lasts 8 seconds
      scene.time.delayedCall(8000, () => {
        this.enemySpawnDelay = oldDelay;
        this.enemySpawnTimer.delay = oldDelay;
      });

    } else if (type === 'scoreBoost') {
      const bonus = 100;
      this.score += bonus;
      this.scoreText.setText(`Score: ${this.score.toLocaleString()}`);
      this.showPowerUpNotification(`+${bonus} Points!`);

      if (this.callbacks.onScoreUpdate) {
        this.callbacks.onScoreUpdate(this.score);
      }
    }
  }

  spawnBoss() {
    const scene = this.game.scene.scenes[0];
    this.bossSpawned = true;

    const boss = scene.add.rectangle(GameConfig.gameWidth / 2, 50, 80, 80, 0xff00ff);
    scene.physics.add.existing(boss);

    // Boss movement pattern (side to side)
    scene.tweens.add({
      targets: boss,
      x: GameConfig.gameWidth - 100,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    boss.isBoss = true;
    boss.health = 20;

    // Glow effect
    const bossGlow = scene.add.circle(0, 0, 50, 0xff00ff, 0.3);
    scene.tweens.add({
      targets: bossGlow,
      scale: 1.5,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.enemies.add(boss);

    this.showPowerUpNotification('BOSS APPEARED!');
  }

  createExplosion(scene, x, y, color) {
    // Create multiple particles for explosion effect
    for (let i = 0; i < 10; i++) {
      const particle = scene.add.circle(x, y, Math.random() * 5 + 2, color);
      const angle = (Math.PI * 2 * i) / 10;
      const speed = Math.random() * 100 + 50;

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  showPowerUpNotification(text) {
    const scene = this.game.scene.scenes[0];

    this.powerUpText.setText(text);
    this.powerUpText.setAlpha(1);

    scene.tweens.add({
      targets: this.powerUpText,
      alpha: 0,
      y: 80,
      duration: 2000,
      onComplete: () => {
        this.powerUpText.y = 100;
      }
    });
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

export default BoboShooterGame;
