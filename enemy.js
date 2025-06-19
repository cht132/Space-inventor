// Enemy class and related functions
class Enemy {
  constructor(x, y, type, level) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.emoji = EMOJIS[type];
    
    // Base stats
    this.hp = 1 + Math.floor(Math.random() * 5) + level - 1;
    this.speed = 1 + Math.random() * 0.5 + (level - 1) * 0.2;
    
    // Type-specific modifications
    if (type === 'yellow') {
      this.hp += 2;
      this.speed += 0.3;
    } else if (type === 'red') {
      this.hp += 4;
      this.speed += 0.6;
    } else if (type === 'rainbow') {
      this.hp += 8;
      this.speed += 1;
    } else if (type === 'boss') {
      this.hp += 20;
      this.speed += 0.5;
    }
    
    this.maxHp = this.hp;
    this.size = 32 + this.hp * 4;
    this.fireTimer = 0;
    this.fireInterval = 120 + Math.random() * 100;
    this.canFire = ['yellow', 'red', 'rainbow', 'boss'].includes(type);
    
    // Status effects
    this.frozen = false;
    this.frozenTimer = 0;
    this.originalSpeed = this.speed;
    this.burning = false;
    this.burnTimer = 0;
    this.burnDamage = 0;
  }

  update() {
    // Handle frozen effect
    if (this.frozen) {
      this.frozenTimer--;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
        this.speed = this.originalSpeed;
      }
    }
    
    // Handle burning effect
    if (this.burning) {
      this.burnTimer--;
      if (this.burnTimer <= 0) {
        this.burning = false;
      } else {
        // Take burn damage every 60 frames (1 second)
        if (this.burnTimer % 60 === 0) {
          this.takeDamage(this.burnDamage);
        }
      }
    }
    
    // Move down
    this.y += this.speed;
    
    // Fire bullets if capable and not frozen
    if (this.canFire && !this.frozen) {
      this.fireTimer++;
      let fireRate = this.fireInterval - game.level * 5;
      if (this.fireTimer > fireRate) {
        this.fireTimer = 0;
        this.fire();
      }
    }
  }

  fire() {
    // Create enemy bullet
    let bullet = new Bullet(this.x, this.y + this.size/2, 3 + game.level * 0.2, 1, 'enemy', 'normal');
    game.enemyBullets.push(bullet);
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
  }

  draw(ctx) {
    let color = '#0f0'; // green
    if (this.type === 'yellow') color = '#ff0';
    if (this.type === 'red') color = '#f00';
    if (this.type === 'rainbow') color = '#0ff';
    if (this.type === 'boss') color = '#fff';
    
    // Apply status effect color overlay
    if (this.frozen) {
      color = '#87ceeb'; // Light blue for frozen
    } else if (this.burning) {
      color = '#ff4500'; // Orange red for burning
    }
    
    // Draw enemy emoji
    drawText(this.emoji, this.x, this.y, this.size, color);
    
    // Draw status effect indicators
    if (this.frozen) {
      drawText('❄️', this.x + this.size/3, this.y - this.size/3, 16, '#87ceeb');
    }
    if (this.burning) {
      drawText('🔥', this.x - this.size/3, this.y - this.size/3, 16, '#ff4500');
    }
    
    // Draw HP number
    drawText(this.hp.toString(), this.x, this.y + this.size/2, 12, '#fff');
    
    // Draw HP bar
    drawProgressBar(
      this.x - this.size/2, 
      this.y + this.size/2 + 8, 
      this.size, 
      6, 
      this.hp / this.maxHp, 
      color
    );
  }

  isOffScreen() {
    return this.y > CANVAS.height + 60;
  }

  isDead() {
    return this.hp <= 0;
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
  }
}

// Enemy spawning system
class EnemySpawner {
  constructor() {
    this.lastSpawn = 0;
    this.spawnInterval = 900;
    this.minEnemies = 5;
    this.maxEnemies = 20;
  }

  update() {
    if (Date.now() - this.lastSpawn > this.spawnInterval && 
        game.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.lastSpawn = Date.now();
    }
  }

  spawnEnemy() {
    // Determine available enemy types based on level
    let types = ['green'];
    if (game.level >= 2) types.push('yellow');
    if (game.level >= 3) types.push('red');
    if (game.level >= 4) types.push('rainbow');
    
    // Boss every 10 levels
    if (game.level % 10 === 0 && Math.random() < 0.3) {
      types = ['boss'];
    }
    
    let type = types[Math.floor(Math.random() * types.length)];
    let x = 40 + Math.random() * (CANVAS.width - 80);
    
    game.enemies.push(new Enemy(x, -40, type, game.level));
  }
}

// Enemy event handling
class EnemyEventHandler {
  static setupEventListeners() {
    // Enemy destroyed event handler
    gameEvents.on('enemyDestroyed', (data) => {
      const { enemy } = data;
      
      // Bonus score for destroying enemy
      game.score += Math.floor(enemy.maxHp * 5);
      
      // Trigger UI update for score
      gameEvents.emit('scoreChanged', { score: game.score });
      
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
  }
}

// Initialize enemy event handlers when document is ready
$(document).ready(() => {
  EnemyEventHandler.setupEventListeners();
});
