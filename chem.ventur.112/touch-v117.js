/* ============================================
   CHEMVENTUR v117 - MOBILE TOUCH CONTROLS
   📱 TAP & DRAG = SHIP FOLLOWS! 📱
   ============================================ */

(function() {
  
  CHEMVENTUR.TouchControls = {
    enabled: false,
    touching: false,
    touchX: 0,
    touchY: 0,
    touchId: null,
    
    // Settings
    smoothing: 0.15,
    driftFactor: 0.98,
    minDistance: 10,
    
    init(canvas) {
      // Detect if mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
                       'ontouchstart' in window;
      
      if (!isMobile) {
        console.log('📱 Not mobile device, touch controls disabled');
        return;
      }
      
      this.canvas = canvas;
      this.enabled = true;
      
      // Prevent default behaviors
      canvas.style.touchAction = 'none';
      
      // Touch events
      canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
      canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
      
      console.log('📱 Touch controls enabled!');
    },
    
    onTouchStart(e) {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchX = touch.clientX - rect.left;
        this.touchY = touch.clientY - rect.top;
        this.touchId = touch.identifier;
        this.touching = true;
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    },
    
    onTouchMove(e) {
      e.preventDefault();
      
      if (!this.touching) return;
      
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === this.touchId) {
          const rect = this.canvas.getBoundingClientRect();
          this.touchX = touch.clientX - rect.left;
          this.touchY = touch.clientY - rect.top;
          break;
        }
      }
    },
    
    onTouchEnd(e) {
      e.preventDefault();
      
      let touchEnded = true;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          touchEnded = false;
          break;
        }
      }
      
      if (touchEnded) {
        this.touching = false;
        this.touchId = null;
      }
    },
    
    // Update ship based on touch
    updateShip(ship) {
      if (!this.enabled || !this.touching || !ship) return;
      
      const dx = this.touchX - ship.x;
      const dy = this.touchY - ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > this.minDistance) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        ship.vx += dirX * this.smoothing;
        ship.vy += dirY * this.smoothing;
      }
    },
    
    // Apply drift when not touching
    applyDrift(ship) {
      if (!this.enabled || this.touching || !ship) return;
      
      ship.vx *= this.driftFactor;
      ship.vy *= this.driftFactor;
      
      if (Math.abs(ship.vx) < 0.01) ship.vx = 0;
      if (Math.abs(ship.vy) < 0.01) ship.vy = 0;
    },
    
    // Get touch position for rendering
    getTouchPos() {
      if (!this.touching) return null;
      return { x: this.touchX, y: this.touchY };
    }
  };
  
  console.log('📱 Touch controls module loaded!');
  
})();
