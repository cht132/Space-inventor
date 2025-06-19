// UI Manager for Space Shooter Game
// Handles all user interface related functionality

class UIManager {
  constructor() {
    this.elements = {
      lives: $('#lives'),
      score: $('#score'),
      rainbowLaser: $('#rainbow-laser')
    };
    
    this.setupEventListeners();
    this.setupCanvasEvents();
    this.setupResizeHandler();
    this.startUpdateLoop();
  }

  // Setup canvas resize handler
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
    this.resizeCanvas(); // Initial resize
  }

  // Resize canvas to fit screen
  resizeCanvas() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    CANVAS.width = Math.min(600, W);
    CANVAS.height = Math.min(900, H);
  }

  // Setup canvas touch/mouse events
  setupCanvasEvents() {
    // Touch events
    $('#game-canvas').on('touchstart', (e) => {
      this.handleTouchStart(e);
    });
    
    $('#game-canvas').on('touchmove', (e) => {
      this.handleTouchMove(e);
    });
    
    $('#game-canvas').on('touchend', (e) => {
      this.handleTouchEnd(e);
    });
    
    // Mouse events
    $('#game-canvas').on('mousemove', (e) => {
      this.handleMouseMove(e);
    });
    
    // Prevent scrolling on iPad
    $(document).on('touchmove', (e) => {
      if ($(e.target).is('#game-canvas')) e.preventDefault();
    }, {passive: false});
  }

  // Handle touch start
  handleTouchStart(e) {
    let t = e.originalEvent.touches[0];
    game.touchId = t.identifier;
    let rect = CANVAS.getBoundingClientRect();
    let x = (t.clientX - rect.left) / rect.width * CANVAS.width;
    let y = (t.clientY - rect.top) / rect.height * CANVAS.height;
    if (game.player) {
      game.player.setTarget(x, y);
    }
  }

  // Handle touch move
  handleTouchMove(e) {
    for (let i = 0; i < e.originalEvent.touches.length; i++) {
      let t = e.originalEvent.touches[i];
      if (t.identifier === game.touchId) {
        let rect = CANVAS.getBoundingClientRect();
        let x = (t.clientX - rect.left) / rect.width * CANVAS.width;
        let y = (t.clientY - rect.top) / rect.height * CANVAS.height;
        if (game.player) {
          game.player.setTarget(x, y);
        }
        break;
      }
    }
  }

  // Handle touch end
  handleTouchEnd(e) {
    game.touchId = null;
  }

  // Handle mouse move
  handleMouseMove(e) {
    let rect = CANVAS.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width * CANVAS.width;
    let y = (e.clientY - rect.top) / rect.height * CANVAS.height;
    if (game.player) {
      game.player.setTarget(x, y);
    }
  }

  // Setup UI event listeners
  setupEventListeners() {
    // Rainbow laser button
    this.elements.rainbowLaser.on('click', () => {
      this.handleRainbowLaserClick();
    });
    
    // Listen to game events for UI updates
    gameEvents.on('scoreChanged', (data) => {
      this.updateScore(data.score);
    });
    
    gameEvents.on('livesChanged', (data) => {
      this.updateLives(data.lives);
    });
    
    gameEvents.on('weaponChanged', (data) => {
      this.updateWeaponInfo(data.weapon);
    });
    
    gameEvents.on('rainbowBallsChanged', (data) => {
      this.updateRainbowBalls(data.count, data.ready);
    });
  }

  // Handle rainbow laser button click
  handleRainbowLaserClick() {
    if (game.rainbowReady && game.player && !game.player.isDead()) {
      // Activate rainbow star laser
      const rainbowBullets = createRainbowStarLaser(game.player.x, game.player.y);
      game.bullets.push(...rainbowBullets);
      
      // Reset rainbow balls and hide button
      game.rainbowBalls = 0;
      game.rainbowReady = false;
      
      // Visual feedback
      createExplosionEffect(game.player.x, game.player.y, 'rainbow');
      
      // Trigger UI update event
      gameEvents.emit('rainbowBallsChanged', { 
        count: game.rainbowBalls, 
        ready: game.rainbowReady 
      });
    }
  }

  // Update lives display
  updateLives(playerLives = null) {
    if (playerLives === null) {
      playerLives = game.player ? game.player.lives : 0;
    }
    
    let lives = '';
    for (let i = 0; i < playerLives; i++) {
      lives += EMOJIS.heart + ' ';
    }
    this.elements.lives.html(lives);
  }

  // Update score display
  updateScore(score = null) {
    if (score === null) {
      score = game.score;
    }
    
    // Will be updated as part of full UI update
    this.updateFullUI();
  }

  // Update weapon information display
  updateWeaponInfo(weapon = null) {
    if (!weapon && game.player) {
      weapon = game.player.weapon;
    }
    
    // Will be updated as part of full UI update
    this.updateFullUI();
  }

  // Update rainbow balls counter and button visibility
  updateRainbowBalls(count = null, ready = null) {
    if (count === null) count = game.rainbowBalls;
    if (ready === null) ready = game.rainbowReady;
    
    if (ready) {
      this.elements.rainbowLaser.show();
    } else {
      this.elements.rainbowLaser.hide();
    }
    
    // Will be updated as part of full UI update
    this.updateFullUI();
  }

  // Update all UI elements
  updateFullUI() {
    // Update lives
    this.updateLives();
    
    // Build weapon info string
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
    
    // Build score text with weapon info and rainbow balls
    let scoreText = `Score: ${game.score}`;
    if (weaponInfo) scoreText += `<br>Weapons: ${weaponInfo}`;
    scoreText += `<br>🌈: ${game.rainbowBalls}/3`;
    
    this.elements.score.html(scoreText);
    
    // Show/hide rainbow laser button
    if (game.rainbowReady) this.elements.rainbowLaser.show();
    else this.elements.rainbowLaser.hide();
  }

  // Start the UI update loop
  startUpdateLoop() {
    setInterval(() => {
      this.updateFullUI();
    }, 100);
  }

  // Show game over screen
  showGameOver(finalScore) {
    setTimeout(() => {
      alert(`Game Over! Final Score: ${finalScore}`);
    }, 1000);
  }

  // Reset UI for new game
  reset() {
    this.updateLives(3); // Default starting lives
    this.updateFullUI();
  }

  // Drawing utility functions
  drawText(text, x, y, size = 18, color = '#fff', align = 'center') {
    ctx.save();
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawProgressBar(x, y, w, h, percent, color) {
    ctx.save();
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * percent, h);
    ctx.restore();
  }
}

// Global drawing functions for use by other modules
function drawText(text, x, y, size = 18, color = '#fff', align = 'center') {
  if (window.uiManager) {
    window.uiManager.drawText(text, x, y, size, color, align);
  } else {
    // Fallback if UI manager not ready
    ctx.save();
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

function drawProgressBar(x, y, w, h, percent, color) {
  if (window.uiManager) {
    window.uiManager.drawProgressBar(x, y, w, h, percent, color);
  } else {
    // Fallback if UI manager not ready
    ctx.save();
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * percent, h);
    ctx.restore();
  }
}

// Game over UI functions
function showGameOverUI(finalScore) {
  if (window.uiManager) {
    window.uiManager.showGameOver(finalScore);
  }
}

// Initialize UI Manager when document is ready
$(document).ready(() => {
  window.uiManager = new UIManager();
});
