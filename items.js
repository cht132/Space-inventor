// Item system for Space Shooter Game
// Handles item creation, effects, and collection

class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 32;
    this.vy = 2; // Slow fall speed
    this.collected = false;
  }

  update() {
    this.y += this.vy;
  }

  draw(ctx) {
    const itemEmojis = {
      spread: '🔫',
      laser: '⚡',
      ice: '❄️',
      fire: '🔥',
      bomb: '💣',
      missile: '🚀',
      heart: '❤️',
      goldHeart: '💛',
      rainbowBall: '🌈'
    };
    
    const emoji = itemEmojis[this.type] || '❓';
    drawText(emoji, this.x, this.y, 32, '#fff');
  }

  isOffScreen() {
    return this.y > CANVAS.height + 50;
  }

  collidesWith(target) {
    let dx = this.x - target.x;
    let dy = this.y - target.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.size + target.size) / 2;
  }
}

// Item event handling
class ItemEventHandler {
  static setupEventListeners() {
    // Item collected event handler
    gameEvents.on('itemCollected', (data) => {
      const { item, player } = data;
      
      switch (item.type) {
        case 'spread':
          player.weapon.spread = Math.min(3, player.weapon.spread + 1);
          break;
        case 'laser':
          player.weapon.laser = Math.min(3, player.weapon.laser + 1);
          break;
        case 'ice':
          player.weapon.ice = Math.min(3, player.weapon.ice + 1);
          break;
        case 'fire':
          player.weapon.fire = Math.min(3, player.weapon.fire + 1);
          break;
        case 'bomb':
          player.weapon.bomb = Math.min(3, player.weapon.bomb + 1);
          break;
        case 'missile':
          player.weapon.missile = Math.min(3, player.weapon.missile + 1);
          break;
        case 'heart':
          player.lives++;
          // Trigger UI update for lives
          gameEvents.emit('livesChanged', { lives: player.lives });
          break;
        case 'goldHeart':
          if (player.lives <= 3) {
            player.lives = 3; // Restore to max
          }
          // Trigger UI update for lives
          gameEvents.emit('livesChanged', { lives: player.lives });
          break;
        case 'rainbowBall':
          game.rainbowBalls++;
          if (game.rainbowBalls >= 3) {
            game.rainbowReady = true;
          }
          // Trigger UI update for rainbow balls
          gameEvents.emit('rainbowBallsChanged', { 
            count: game.rainbowBalls, 
            ready: game.rainbowReady 
          });
          break;
      }
      
      // Trigger UI update for weapon changes
      gameEvents.emit('weaponChanged', { weapon: player.weapon });
      
      // Visual feedback
      createCollectEffect(item.x, item.y, item.type);
    });
  }
}

// Initialize item event handlers when document is ready
$(document).ready(() => {
  ItemEventHandler.setupEventListeners();
});
