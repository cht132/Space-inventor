// Space Shooter Game (ES6+ & jQuery)
// Main game logic using separated classes

// Event System for game actions
class GameEventManager {
  constructor() {
    this.listeners = {};
  }

  // Add event listener
  on(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  // Remove event listener
  off(eventType, callback) {
    if (!this.listeners[eventType]) return;
    const index = this.listeners[eventType].indexOf(callback);
    if (index > -1) {
      this.listeners[eventType].splice(index, 1);
    }
  }

  // Trigger event
  emit(eventType, data = {}) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(callback => callback(data));
  }
}

// Global event manager
const gameEvents = new GameEventManager();

const EMOJIS = {
  green: '😂', // easy
  yellow: '😆', // normal
  red: '🤣', // hard
  rainbow: '😹', // super
  boss: '😈', // boss
  heart: '❤️',
  goldHeart: '💛',
  rainbowBall: '🌈',
  items: ['💣','❄️','🔥','🔫','🚀']
};

const FONT = "'Press Start 2P', cursive";
const CANVAS = $('#game-canvas')[0] || document.createElement('canvas');
const ctx = CANVAS.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
CANVAS.width = Math.min(600, W);
CANVAS.height = Math.min(900, H);

let game = {
  running: true,
  score: 0,
  level: 1,
  player: null,
  enemies: [],
  bullets: [],
  enemyBullets: [],
  items: [],
  effects: [], // Visual effects
  enemySpawner: null,
  bulletManager: null,
  rainbowBalls: 0,
  rainbowReady: false,
  touchId: null
};

// Initialize game objects
function initGame() {
  game.player = new Player(CANVAS.width/2, CANVAS.height-80);
  game.enemySpawner = new EnemySpawner();
  game.bulletManager = new BulletManager();
  
  // Set up event listeners
  setupGameEventListeners();
}

// Set up all game event listeners
function setupGameEventListeners() {
  // Enemy hit by bullet
  gameEvents.on('enemyHit', (data) => {
    const { enemy, bullet, damage } = data;
    enemy.takeDamage(damage);
    
    // Add score based on enemy type
    const scoreMap = { green: 10, yellow: 25, red: 50, rainbow: 100, boss: 500 };
    game.score += scoreMap[enemy.type] || 10;
    
    // Trigger UI update for score
    gameEvents.emit('scoreChanged', { score: game.score });
    
    // Create hit effect
    createHitEffect(enemy.x, enemy.y, damage);
    
    // Remove bullet if it's not penetrating
    if (bullet.type !== 'laser' || bullet.penetration <= 0) {
      const bulletIndex = game.bullets.indexOf(bullet);
      if (bulletIndex > -1) {
        game.bullets.splice(bulletIndex, 1);
      }
    }
  });
  
  // Bomb explosion
  gameEvents.on('bombExplosion', (data) => {
    const { x, y, radius, damage } = data;
    
    // Damage all enemies in explosion radius
    for (let enemy of game.enemies) {
      let dx = enemy.x - x;
      let dy = enemy.y - y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius) {
        gameEvents.emit('enemyHit', {
          enemy: enemy,
          bullet: { damage: damage, type: 'bomb' },
          damage: damage
        });
      }
    }
    
    // Create explosion effect
    createExplosionEffect(x, y, 'bomb');
  });
}

function render() {
  ctx.clearRect(0,0,CANVAS.width,CANVAS.height);
  
  // Draw player
  if (game.player) {
    game.player.draw(ctx);
  }
  
  // Draw enemies
  for (let enemy of game.enemies) {
    enemy.draw(ctx);
  }
  
  // Draw bullets
  for (let bullet of game.bullets) {
    bullet.draw(ctx);
  }
  
  // Draw enemy bullets
  for (let bullet of game.enemyBullets) {
    bullet.draw(ctx);
  }
  
  // Draw items
  for (let item of game.items) {
    item.draw(ctx);
  }
  
  // Draw effects
  for (let effect of game.effects) {
    if (effect.draw) {
      effect.draw(ctx);
    }
  }
}

function update() {
  // Update player
  if (game.player) {
    game.player.update();
  }
  
  // Update enemy spawner
  if (game.enemySpawner) {
    game.enemySpawner.update();
  }
  
  // Update enemies
  for (let enemy of game.enemies) {
    enemy.update();
  }
  
  // Remove dead or off-screen enemies
  game.enemies = game.enemies.filter(enemy => !enemy.isDead() && !enemy.isOffScreen());
  
  // Update bullets
  for (let bullet of game.bullets) {
    bullet.update();
  }
  
  // Update enemy bullets
  for (let bullet of game.enemyBullets) {
    bullet.update();
  }
  
  // Update items
  for (let item of game.items) {
    item.update();
  }
  
  // Remove off-screen bullets and items
  game.bullets = game.bullets.filter(bullet => !bullet.isOffScreen());
  game.enemyBullets = game.enemyBullets.filter(bullet => !bullet.isOffScreen());
  game.items = game.items.filter(item => !item.isOffScreen() && !item.collected);
  
  // Update effects (visual effects like explosions)
  for (let effect of game.effects) {
    effect.update();
  }
  game.effects = game.effects.filter(effect => !effect.isDead);
  
  // Collision detection using events
  checkCollisions();
}

// Collision detection with event system
function checkCollisions() {
  // Check player bullets vs enemies
  for (let bullet of game.bullets) {
    for (let enemy of game.enemies) {
      if (bullet.collidesWith(enemy)) {
        // Trigger enemy hit event
        gameEvents.emit('enemyHit', {
          enemy: enemy,
          bullet: bullet,
          damage: bullet.damage
        });
        
        // Handle special bullet effects
        if (bullet.type === 'ice' && bullet.freezeDuration > 0) {
          enemy.frozen = true;
          enemy.frozenTimer = bullet.freezeDuration;
          enemy.originalSpeed = enemy.speed;
          enemy.speed = 0;
        }
        
        if (bullet.type === 'fire' && bullet.burnDuration > 0) {
          enemy.burning = true;
          enemy.burnTimer = bullet.burnDuration;
          enemy.burnDamage = bullet.burnDamage;
        }
        
        if (bullet.type === 'bomb' && !bullet.hasExploded) {
          bullet.hasExploded = true;
          gameEvents.emit('bombExplosion', {
            x: bullet.x,
            y: bullet.y,
            radius: bullet.explosionRadius,
            damage: bullet.damage
          });
        }
        
        // Handle laser penetration
        if (bullet.type === 'laser' && bullet.penetration > 0) {
          bullet.penetration--;
        }
        
        break; // Bullet can only hit one enemy per frame (except laser)
      }
    }
  }
  
  // Check enemy bullets vs player
  if (game.player && !game.player.isDead()) {
    for (let bullet of game.enemyBullets) {
      if (bullet.collidesWith(game.player)) {
        // Trigger player hit event
        gameEvents.emit('playerHit', {
          bullet: bullet,
          damage: bullet.damage
        });
        break;
      }
    }
  }
  
  // Check player vs items
  if (game.player && !game.player.isDead()) {
    for (let item of game.items) {
      if (!item.collected && item.collidesWith(game.player)) {
        item.collected = true;
        gameEvents.emit('itemCollected', {
          item: item,
          player: game.player
        });
      }
    }
  }
  
  // Check for destroyed enemies
  for (let enemy of game.enemies) {
    if (enemy.isDead() && !enemy.destroyEventFired) {
      gameEvents.emit('enemyDestroyed', { enemy: enemy });
      enemy.destroyEventFired = true; // Prevent multiple events
    }
  }
  
  // Check for destroyed player
  if (game.player && game.player.isDead() && !game.player.destroyEventFired) {
    gameEvents.emit('playerDestroyed');
    game.player.destroyEventFired = true;
  }
}

function gameLoop() {
  if (!game.running) return;
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Initialize and start game
initGame();
gameLoop();


