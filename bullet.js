// Bullet class and related functions
class Bullet {
  constructor(x, y, vy, damage, owner, type = 'normal') {
    this.x = x;
    this.y = y;
    this.vy = vy; // vertical velocity (negative = up, positive = down)
    this.vx = 0; // horizontal velocity for spread bullets
    this.damage = damage;
    this.owner = owner; // 'player' or 'enemy'
    this.size = owner === 'player' ? 16 : 12;
    this.type = type; // normal, laser, ice, fire, bomb, missile
    this.effects = [];
    this.hasExploded = false; // for bomb bullets
    this.burnDuration = 0; // for fire bullets
    this.freezeDuration = 0; // for ice bullets
    this.hasTracked = false; // for missile bullets
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    if (this.owner === 'player') {
      if (this.type === 'laser') {
        // Draw laser as rectangle
        ctx.save();
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x - this.width/2, this.y - 20, this.width, 40);
        ctx.restore();
      } else if (this.type === 'normal') {
        // Draw normal bullet as circle
        ctx.save();
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      } else {
        // Other bullet types use emojis
        const bulletEmojis = {
          ice: '❄️',
          fire: '🔥',
          bomb: '💣',
          missile: '🚀'
        };
        const emoji = bulletEmojis[this.type] || '🔫';
        drawText(emoji, this.x, this.y, 24, '#0ff');
      }
    } else {
      // Enemy bullets - red circles
      ctx.save();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }

  isOffScreen() {
    return this.y < -30 || this.y > CANVAS.height + 30;
  }

  // Check collision with a target (enemy or player)
  collidesWith(target) {
    let dx = this.x - target.x;
    let dy = this.y - target.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.size + target.size) / 2;
  }
}

// Special bullet types
class LaserBullet extends Bullet {
  constructor(x, y, vy, damage, owner, level) {
    super(x, y, vy, damage + level, owner, 'laser');
    this.level = level;
    this.penetration = level; // how many enemies it can pierce
    this.width = 8 + level * 4;
  }

  // LaserBullet uses parent's draw method which handles laser type
}

class IceBullet extends Bullet {
  constructor(x, y, vy, damage, owner, level) {
    super(x, y, vy, damage, owner, 'ice');
    this.level = level;
    this.freezeDuration = 30 + level * 30; // 0.5/1/2 seconds at 60fps
  }
}

class FireBullet extends Bullet {
  constructor(x, y, vy, damage, owner, level) {
    super(x, y, vy, damage, owner, 'fire');
    this.level = level;
    this.burnDamage = level;
    this.burnDuration = 120; // 2 seconds at 60fps
  }
}

class BombBullet extends Bullet {
  constructor(x, y, vy, damage, owner, level) {
    super(x, y, vy, damage + level, owner, 'bomb');
    this.level = level;
    this.explosionRadius = 30 + level * 15; // 1/1.5/2倍 radius
  }
}

class MissileBullet extends Bullet {
  constructor(x, y, vy, damage, owner, level, target) {
    super(x, y, vy, damage, owner, 'missile');
    this.level = level;
    this.target = target;
    this.speed = Math.abs(vy);
    this.maxTurnAngle = 15 + level * 15; // 15°/30°/45°
  }

  update() {
    if (this.target && !this.hasTracked && !this.target.isDead()) {
      // Calculate direction to target
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Calculate angle to target
        let angleToTarget = Math.atan2(dy, dx);
        let currentAngle = Math.atan2(this.vy, this.vx || 0);
        
        // Limit turning angle
        let angleDiff = angleToTarget - currentAngle;
        let maxTurnRad = (this.maxTurnAngle * Math.PI) / 180;
        
        if (Math.abs(angleDiff) > maxTurnRad) {
          angleDiff = Math.sign(angleDiff) * maxTurnRad;
        }
        
        let newAngle = currentAngle + angleDiff;
        this.vx = Math.cos(newAngle) * this.speed;
        this.vy = Math.sin(newAngle) * this.speed;
        this.hasTracked = true; // Can only turn once
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
  }
}

// Spread bullet - creates multiple bullets
function createSpreadBullets(x, y, level, owner) {
  const bulletCounts = [3, 5, 8];
  const count = bulletCounts[level - 1] || 3;
  const bullets = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI / 6) * (i - count/2 + 0.5); // Random spread
    const bullet = new Bullet(x, y, -8, 1, owner, 'normal');
    bullet.vx = Math.sin(angle) * 3;
    bullets.push(bullet);
  }
  
  return bullets;
}

// Rainbow Star Laser - special ability
function createRainbowStarLaser(x, y) {
  const bullets = [];
  const directions = 8; // 8 directions around the player
  
  for (let i = 0; i < directions; i++) {
    const angle = (2 * Math.PI * i) / directions;
    const bullet = new LaserBullet(x, y, 0, 5, 'player', 3);
    bullet.vx = Math.cos(angle) * 6;
    bullet.vy = Math.sin(angle) * 6;
    bullets.push(bullet);
  }
  
  return bullets;
}

// Bullet manager
class BulletManager {
  constructor() {
    this.playerBullets = [];
    this.enemyBullets = [];
  }

  update() {
    // Update player bullets
    for (let bullet of this.playerBullets) {
      bullet.update();
    }
    
    // Update enemy bullets
    for (let bullet of this.enemyBullets) {
      bullet.update();
    }
    
    // Remove off-screen bullets
    this.playerBullets = this.playerBullets.filter(b => !b.isOffScreen());
    this.enemyBullets = this.enemyBullets.filter(b => !b.isOffScreen());
  }

  draw(ctx) {
    // Draw player bullets
    for (let bullet of this.playerBullets) {
      bullet.draw(ctx);
    }
    
    // Draw enemy bullets
    for (let bullet of this.enemyBullets) {
      bullet.draw(ctx);
    }
  }

  addPlayerBullet(bullet) {
    this.playerBullets.push(bullet);
  }

  addEnemyBullet(bullet) {
    this.enemyBullets.push(bullet);
  }

  clear() {
    this.playerBullets = [];
    this.enemyBullets = [];
  }
}
