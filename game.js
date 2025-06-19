// Space Shooter Game (ES6+ & jQuery)
// Basic structure: player, enemies, bullets, touch/mouse control

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
  lives: 3,
  maxLives: 3,
  invincible: false,
  invincibleTimer: 0,
  rainbowBalls: 0,
  rainbowReady: false,
  player: {
    x: CANVAS.width/2,
    y: CANVAS.height-80,
    size: 48,
    speed: 8,
    targetX: CANVAS.width/2,
    targetY: CANVAS.height-80,
    blink: false,
    blinkTimer: 0,
    weapon: {
      spread: 1,
      laser: 0,
      ice: 0,
      fire: 0,
      bomb: 0,
      missile: 0
    }
  },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  items: [],
  lastFire: 0,
  fireInterval: 180,
  lastEnemy: 0,
  enemyInterval: 900,
  touchId: null
};

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
  if (game.lives > 0) {
    if (!game.invincible || Math.floor(Date.now()/100)%2===0) {
      drawText('🚀', game.player.x, game.player.y, game.player.size, '#fff');
    }
  }
  // Draw bullets
  for (let b of game.bullets) {
    drawText('🔫', b.x, b.y, 24, '#0ff');
  }
  // Draw enemies
  for (let e of game.enemies) {
    let color = '#0f0';
    if (e.type==='yellow') color='#ff0';
    if (e.type==='red') color='#f00';
    if (e.type==='rainbow') color='#0ff';
    if (e.type==='boss') color='#fff';
    drawText(e.emoji, e.x, e.y, e.size, color);
    drawText(e.hp, e.x, e.y+e.size/2, 12, '#fff');
    drawProgressBar(e.x-e.size/2, e.y+e.size/2+8, e.size, 6, e.hp/e.maxHp, color);
  }
  // Draw enemy bullets
  for (let eb of game.enemyBullets) {
    drawText('🔴', eb.x, eb.y, 18, '#f00');
  }
  // Draw items
  for (let it of game.items) {
    drawText(it.emoji, it.x, it.y, 24, '#fff');
  }
}

function update() {
  // Player movement
  let dx = game.player.targetX - game.player.x;
  let dy = game.player.targetY - game.player.y;
  game.player.x += dx*0.2;
  game.player.y += dy*0.2;

  // 敵人生成
  if (Date.now() - game.lastEnemy > game.enemyInterval && game.enemies.length < 20) {
    let types = ['green','yellow','red','rainbow'];
    let type = types[Math.min(game.level-1, types.length-1)];
    let hp = 1 + Math.floor(Math.random()*5) + game.level-1;
    let speed = 1 + Math.random()*0.5 + (game.level-1)*0.2;
    if (type==='yellow') {hp+=2; speed+=0.3;}
    if (type==='red') {hp+=4; speed+=0.6;}
    if (type==='rainbow') {hp+=8; speed+=1;}
    let x = 40 + Math.random()*(CANVAS.width-80);
    game.enemies.push({
      x, y: -40, size: 32+hp*4, hp, maxHp: hp, type, emoji: EMOJIS[type], speed,
      fireTimer: 0, fireInterval: 120 + Math.random()*100
    });
    game.lastEnemy = Date.now();
  }

  // 敵人移動與發射子彈
  for (let e of game.enemies) {
    e.y += e.speed;
    // 發射子彈（黃、紅、彩色敵人才會射）
    if (["yellow","red","rainbow"].includes(e.type)) {
      e.fireTimer = (e.fireTimer||0) + 1;
      let fireRate = e.fireInterval - game.level*5;
      if (e.fireTimer > fireRate) {
        e.fireTimer = 0;
        // 子彈向下
        game.enemyBullets.push({x: e.x, y: e.y+e.size/2, vy: 3+game.level*0.2, size: 12, deadly: false});
      }
    }
  }
  // 移除超出畫面的敵人
  game.enemies = game.enemies.filter(e => e.y < CANVAS.height+60 && e.hp > 0);

  // 敵人子彈移動
  for (let eb of game.enemyBullets) {
    eb.y += eb.vy;
  }
  // 移除超出畫面的敵人子彈
  game.enemyBullets = game.enemyBullets.filter(eb => eb.y < CANVAS.height+30);

  // ...existing code...
  // TODO: add bullets, collision, items, etc.
}

function gameLoop() {
  if (!game.running) return;
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Touch/Mouse controls
$('#game-canvas').on('touchstart', function(e){
  let t = e.originalEvent.touches[0];
  game.touchId = t.identifier;
  let rect = CANVAS.getBoundingClientRect();
  game.player.targetX = (t.clientX-rect.left)/rect.width*CANVAS.width;
  game.player.targetY = (t.clientY-rect.top)/rect.height*CANVAS.height;
});
$('#game-canvas').on('touchmove', function(e){
  for (let i=0;i<e.originalEvent.touches.length;i++) {
    let t = e.originalEvent.touches[i];
    if (t.identifier===game.touchId) {
      let rect = CANVAS.getBoundingClientRect();
      game.player.targetX = (t.clientX-rect.left)/rect.width*CANVAS.width;
      game.player.targetY = (t.clientY-rect.top)/rect.height*CANVAS.height;
      break;
    }
  }
});
$('#game-canvas').on('touchend', function(e){
  game.touchId = null;
});
$('#game-canvas').on('mousemove', function(e){
  let rect = CANVAS.getBoundingClientRect();
  game.player.targetX = (e.clientX-rect.left)/rect.width*CANVAS.width;
  game.player.targetY = (e.clientY-rect.top)/rect.height*CANVAS.height;
});

// Prevent scrolling on iPad
$(document).on('touchmove', function(e){
  if ($(e.target).is('#game-canvas')) e.preventDefault();
},{passive:false});

// UI update
function updateUI() {
  let lives = '';
  for (let i=0;i<game.lives;i++) lives += EMOJIS.heart+' ';
  $('#lives').html(lives);
  $('#score').text('Score: '+game.score);
  if (game.rainbowReady) $('#rainbow-laser').show();
  else $('#rainbow-laser').hide();
}
setInterval(updateUI, 100);
