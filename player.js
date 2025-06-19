// Player class and related functions
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.size = 48;
    this.speed = 8;
    this.lives = 3;
    this.maxLives = 3;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.blink = false;
    this.blinkTimer = 0;
    this.weapon = {
      spread: 0,  // Start with 0, no spread initially
      laser: 0,
      ice: 0,
      fire: 0,
      bomb: 0,
      missile: 0
    };
    this.lastFire = 0;
    this.fireInterval = 180;
  }

  update() {
    // Move towards target position
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    this.x += dx * 0.2;
    this.y += dy * 0.2;

    // Update invincibility
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Auto fire bullets
    if (Date.now() - this.lastFire > this.fireInterval) {
      this.fire();
      this.lastFire = Date.now();
    }
  }

  fire() {
    const bullets = [];
    
    // Always fire at least one bullet
    let hasFiredMainBullet = false;
    
    // Spread bullets
    if (this.weapon.spread > 0) {
      const spreadBullets = createSpreadBullets(this.x, this.y - this.size/2, this.weapon.spread, 'player');
      bullets.push(...spreadBullets);
      hasFiredMainBullet = true;
    }
    
    // If no spread weapon, fire normal bullet
    if (!hasFiredMainBullet) {
      bullets.push(new Bullet(this.x, this.y - this.size/2, -8, 1, 'player', 'normal'));
    }
    
    // Laser bullets
    if (this.weapon.laser > 0) {
      const laserBullet = new LaserBullet(this.x, this.y - this.size/2, -10, 1, 'player', this.weapon.laser);
      bullets.push(laserBullet);
    }
    
    // Ice bullets
    if (this.weapon.ice > 0) {
      const iceBullet = new IceBullet(this.x + 20, this.y - this.size/2, -8, 1, 'player', this.weapon.ice);
      bullets.push(iceBullet);
    }
    
    // Fire bullets
    if (this.weapon.fire > 0) {
      const fireBullet = new FireBullet(this.x - 20, this.y - this.size/2, -8, 1, 'player', this.weapon.fire);
      bullets.push(fireBullet);
    }
    
    // Bomb bullets
    if (this.weapon.bomb > 0) {
      const bombBullet = new BombBullet(this.x + 10, this.y - this.size/2, -6, 1, 'player', this.weapon.bomb);
      bullets.push(bombBullet);
    }
    
    // Missile bullets (target nearest enemy)
    if (this.weapon.missile > 0) {
      let nearestEnemy = null;
      let minDistance = Infinity;
      
      for (let enemy of game.enemies) {
        let dx = enemy.x - this.x;
        let dy = enemy.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
        }
      }
      
      if (nearestEnemy) {
        const missileBullet = new MissileBullet(this.x - 10, this.y - this.size/2, -4, 2, 'player', this.weapon.missile, nearestEnemy);
        bullets.push(missileBullet);
      }
    }
    
    // Add all bullets to game
    game.bullets.push(...bullets);
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  takeDamage(damage = 1) {
    if (this.invincible) return false;
    
    this.lives -= damage;
    if (this.lives > 0) {
      this.invincible = true;
      this.invincibleTimer = 180; // 3 seconds at 60fps
    }
    return true;
  }

  draw(ctx) {
    if (this.lives > 0) {
      // Blink effect when invincible
      if (!this.invincible || Math.floor(Date.now()/100) % 2 === 0) {
        drawText('🚀', this.x, this.y, this.size, '#fff');
      }
    }
  }

  isAlive() {
    return this.lives > 0;
  }

  isDead() {
    return this.lives <= 0;
  }
}
