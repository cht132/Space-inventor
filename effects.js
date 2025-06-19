// Visual Effects for Space Shooter Game
// Handles all visual effects like explosions, hit effects, etc.

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
