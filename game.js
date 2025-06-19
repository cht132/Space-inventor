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

// Item system
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
  
  // Enemy destroyed
  gameEvents.on('enemyDestroyed', (data) => {
    const { enemy } = data;
    
    // Bonus score for destroying enemy
    game.score += Math.floor(enemy.maxHp * 5);
    
    // Create destruction effect
    createExplosionEffect(enemy.x, enemy.y, enemy.type);
    
    // Item drop chances (10% base chance)
    if (Math.random() < 0.1) {
      let itemType;
      
      // Rainbow enemy always drops rainbow ball
      if (enemy.type === 'rainbow') {
        itemType = 'rainbowBall';
      } else {
        // Random item drop
        const itemTypes = ['spread', 'laser', 'ice', 'fire', 'bomb', 'missile', 'heart', 'goldHeart'];
        itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      }
      
      const item = new Item(enemy.x, enemy.y, itemType);
      game.items.push(item);
    }
  });
  
  // Player hit by bullet
  gameEvents.on('playerHit', (data) => {
    const { bullet, damage } = data;
    game.player.takeDamage(damage);
    
    // Create hit effect on player
    createHitEffect(game.player.x, game.player.y, damage, '#ff4444');
    
    // Remove enemy bullet
    const bulletIndex = game.enemyBullets.indexOf(bullet);
    if (bulletIndex > -1) {
      game.enemyBullets.splice(bulletIndex, 1);
    }
  });
  
  // Player destroyed (game over)
  gameEvents.on('playerDestroyed', () => {
    game.running = false;
    createExplosionEffect(game.player.x, game.player.y, 'player');
    // TODO: Show game over screen
    setTimeout(() => {
      alert(`遊戲結束！最終得分: ${game.score}`);
    }, 1000);
  });
  
  // Item collected
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
        break;
      case 'goldHeart':
        if (player.lives <= 3) {
          player.lives = 3; // Restore to max
        }
        break;
      case 'rainbowBall':
        game.rainbowBalls++;
        if (game.rainbowBalls >= 3) {
          game.rainbowReady = true;
        }
        break;
    }
    
    // Visual feedback
    createCollectEffect(item.x, item.y, item.type);
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

function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  CANVAS.width = Math.min(600, W);
  CANVAS.height = Math.min(900, H);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawText(text, x, y, size=18, color='#fff', align='center') {
  ctx.save();
  ctx.font = `${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawProgressBar(x, y, w, h, percent, color) {
  ctx.save();
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w*percent, h);
  ctx.restore();
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

// Effect creation functions
function createHitEffect(x, y, damage, color = '#ffff00') {
  const effect = {
    x: x,
    y: y,
    damage: damage,
    color: color,
    timer: 30,
    isDead: false,
    update() {
      this.timer--;
      this.y -= 2;
      if (this.timer <= 0) this.isDead = true;
    },
    draw(ctx) {
      if (this.timer > 0) {
        const alpha = this.timer / 30;
        ctx.save();
        ctx.globalAlpha = alpha;
        drawText(`-${this.damage}`, this.x, this.y, 16, this.color);
        ctx.restore();
      }
    }
  };
  game.effects.push(effect);
}

function createExplosionEffect(x, y, type) {
  const effect = {
    x: x,
    y: y,
    type: type,
    timer: 60,
    isDead: false,
    update() {
      this.timer--;
      if (this.timer <= 0) this.isDead = true;
    },
    draw(ctx) {
      if (this.timer > 0) {
        const alpha = this.timer / 60;
        const size = 48 + (60 - this.timer) * 2;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        let emoji = '💥';
        if (type === 'bomb') emoji = '💥';
        else if (type === 'player') emoji = '💀';
        
        drawText(emoji, this.x, this.y, size, '#fff');
        ctx.restore();
      }
    }
  };
  game.effects.push(effect);
}

function createCollectEffect(x, y, itemType) {
  const effect = {
    x: x,
    y: y,
    itemType: itemType,
    timer: 45,
    isDead: false,
    update() {
      this.timer--;
      this.y -= 3;
      if (this.timer <= 0) this.isDead = true;
    },
    draw(ctx) {
      if (this.timer > 0) {
        const alpha = this.timer / 45;
        ctx.save();
        ctx.globalAlpha = alpha;
        drawText('✨', this.x, this.y, 24, '#ffff00');
        ctx.restore();
      }
    }
  };
  game.effects.push(effect);
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

// Touch/Mouse controls
$('#game-canvas').on('touchstart', function(e){
  let t = e.originalEvent.touches[0];
  game.touchId = t.identifier;
  let rect = CANVAS.getBoundingClientRect();
  let x = (t.clientX-rect.left)/rect.width*CANVAS.width;
  let y = (t.clientY-rect.top)/rect.height*CANVAS.height;
  if (game.player) {
    game.player.setTarget(x, y);
  }
});
$('#game-canvas').on('touchmove', function(e){
  for (let i=0;i<e.originalEvent.touches.length;i++) {
    let t = e.originalEvent.touches[i];
    if (t.identifier===game.touchId) {
      let rect = CANVAS.getBoundingClientRect();
      let x = (t.clientX-rect.left)/rect.width*CANVAS.width;
      let y = (t.clientY-rect.top)/rect.height*CANVAS.height;
      if (game.player) {
        game.player.setTarget(x, y);
      }
      break;
    }
  }
});
$('#game-canvas').on('touchend', function(e){
  game.touchId = null;
});
$('#game-canvas').on('mousemove', function(e){
  let rect = CANVAS.getBoundingClientRect();
  let x = (e.clientX-rect.left)/rect.width*CANVAS.width;
  let y = (e.clientY-rect.top)/rect.height*CANVAS.height;
  if (game.player) {
    game.player.setTarget(x, y);
  }
});

// Prevent scrolling on iPad
$(document).on('touchmove', function(e){
  if ($(e.target).is('#game-canvas')) e.preventDefault();
},{passive:false});

// Rainbow laser button
$('#rainbow-laser').on('click', function() {
  if (game.rainbowReady && game.player && !game.player.isDead()) {
    // Activate rainbow star laser
    const rainbowBullets = createRainbowStarLaser(game.player.x, game.player.y);
    game.bullets.push(...rainbowBullets);
    
    // Reset rainbow balls and hide button
    game.rainbowBalls = 0;
    game.rainbowReady = false;
    
    // Visual feedback
    createExplosionEffect(game.player.x, game.player.y, 'rainbow');
  }
});

// UI update
function updateUI() {
  let lives = '';
  let playerLives = game.player ? game.player.lives : 0;
  for (let i=0; i<playerLives; i++) lives += EMOJIS.heart+' ';
  $('#lives').html(lives);
  
  // Show score and weapon info
  let weaponInfo = '';
  if (game.player) {
    const w = game.player.weapon;
    if (w.spread > 0) weaponInfo += `🔫${w.spread} `;
    if (w.laser > 0) weaponInfo += `⚡${w.laser} `;
    if (w.ice > 0) weaponInfo += `❄️${w.ice} `;
    if (w.fire > 0) weaponInfo += `🔥${w.fire} `;
    if (w.bomb > 0) weaponInfo += `💣${w.bomb} `;
    if (w.missile > 0) weaponInfo += `🚀${w.missile} `;
  }
  
  let scoreText = `得分: ${game.score}`;
  if (weaponInfo) scoreText += `<br>武器: ${weaponInfo}`;
  scoreText += `<br>🌈: ${game.rainbowBalls}/3`;
  
  $('#score').html(scoreText);
  
  if (game.rainbowReady) $('#rainbow-laser').show();
  else $('#rainbow-laser').hide();
}
setInterval(updateUI, 100);
