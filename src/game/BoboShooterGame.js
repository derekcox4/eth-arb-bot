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
  }

  preload() {
    // In a real game, you'd load actual sprites
    // For now, we'll use Phaser's built-in shapes
  }

  create() {
    const scene = this.game.scene.scenes[0];

    // Create player (Bobo)
    this.player = scene.add.rectangle(400, 500, 40, 40, 0x00ff00);
    scene.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Create bullet group
    this.bullets = scene.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 50
    });

    // Create enemy group
    this.enemies = scene.physics.add.group();

    // Keyboard controls
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceBar = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Score text
    this.scoreText = scene.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff'
    });

    // Timer text
    this.timerText = scene.add.text(16, 56, `Time: ${this.gameTime}s`, {
      fontSize: '24px',
      fill: '#fff'
    });

    // Weapon level text
    this.weaponText = scene.add.text(GameConfig.gameWidth - 200, 16, `Weapon: Lvl ${this.weaponLevel}`, {
      fontSize: '24px',
      fill: '#ffff00'
    });

    // Spawn enemies periodically
    scene.time.addEvent({
      delay: 1000,
      callback: this.spawnEnemy.bind(this),
      callbackScope: this,
      loop: true
    });

    // Game timer
    scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTime--;
        this.timerText.setText(`Time: ${this.gameTime}s`);

        if (this.gameTime <= 0) {
          this.endGame();
        }
      },
      callbackScope: this,
      loop: true
    });

    // Collision detection
    scene.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );

    // Enemy-player collision (game over)
    scene.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHit,
      null,
      this
    );
  }

  update() {
    const scene = this.game.scene.scenes[0];

    if (!this.player || !this.player.body) return;

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
    bullet.destroy();
    enemy.destroy();

    this.score += 10 * this.weaponLevel; // Higher weapon = more points
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.score);
    }
  }

  playerHit(player, enemy) {
    enemy.destroy();
    this.gameTime -= 5; // Penalty: lose 5 seconds

    if (this.gameTime <= 0) {
      this.endGame();
    }
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;

    const scene = this.game.scene.scenes[0];

    // Show game over text
    const gameOverText = scene.add.text(
      GameConfig.gameWidth / 2,
      GameConfig.gameHeight / 2,
      `GAME OVER\nFinal Score: ${this.score}`,
      {
        fontSize: '48px',
        fill: '#fff',
        align: 'center'
      }
    );
    gameOverText.setOrigin(0.5);

    // Pause game
    scene.physics.pause();

    // Callback to parent component
    if (this.callbacks.onGameEnd) {
      setTimeout(() => {
        this.callbacks.onGameEnd(this.score);
        this.destroy();
      }, 2000);
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

export default BoboShooterGame;
