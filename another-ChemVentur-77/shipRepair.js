/* ============================================
   CHEMVENTUR - SHIP REPAIR SYSTEM 🛠️
   THE GARAGE! Fix your ship from string damage!
   
   🛠️ THE MAGIC HAMMER AND SPANNER! 🛠️
   ============================================ */

(function() {
  
  CHEMVENTUR.ShipRepair = {
    // 🛠️ Repair costs and options
    REPAIR_OPTIONS: {
      patch: {
        name: '🩹 Quick Patch',
        icon: '🩹',
        cost: 10,        // Cost in captured particles
        repairAmount: 15,
        time: 1000,      // ms
        description: 'Slap some duct tape on it!'
      },
      weld: {
        name: '🔧 Weld Repair', 
        icon: '🔧',
        cost: 25,
        repairAmount: 35,
        time: 2500,
        description: 'Proper welding job'
      },
      overhaul: {
        name: '🛠️ Full Overhaul',
        icon: '🛠️',
        cost: 50,
        repairAmount: 100,  // Full repair!
        time: 5000,
        description: 'Good as new! The magic hammer and spanner!'
      },
      upgrade: {
        name: '⚡ Hull Upgrade',
        icon: '⚡',
        cost: 100,
        repairAmount: 100,
        time: 8000,
        bonus: 'maxHP+25',  // Increases max HP!
        description: 'Reinforced hull - more damage resistance!'
      }
    },
    
    // Ship stats
    ship: {
      maxHP: 100,
      currentHP: 100,
      armor: 0,           // Damage reduction %
      shields: 0,         // Regenerating shield
      shieldMax: 0,
      shieldRegenRate: 0,
      upgrades: []
    },
    
    // Repair resources (earned from gameplay)
    resources: {
      scrapMetal: 0,      // From destroyed particles
      energyCells: 0,     // From captured electrons
      fusionCores: 0,     // From successful fusions
      stringEssence: 0    // From Stage 0 string combinations
    },
    
    // Garage state
    garageOpen: false,
    isRepairing: false,
    repairProgress: 0,
    currentRepairType: null,
    
    // 🛠️ Initialize the repair system
    init() {
      this.ship.currentHP = 100 - (CHEMVENTUR.StringSystem?.shipDamage || 0);
      this.createGarageUI();
      console.log('🛠️ Ship Repair System initialized!');
    },
    
    // 🛠️ Open the garage
    openGarage() {
      this.garageOpen = true;
      this.updateGarageUI();
      const garage = document.getElementById('garage-panel');
      if (garage) {
        garage.classList.add('visible');
      }
      CHEMVENTUR.UI?.showStatus('🛠️ Welcome to the Garage!');
    },
    
    // Close the garage
    closeGarage() {
      this.garageOpen = false;
      const garage = document.getElementById('garage-panel');
      if (garage) {
        garage.classList.remove('visible');
      }
    },
    
    // 🛠️ Start a repair
    startRepair(repairType) {
      const option = this.REPAIR_OPTIONS[repairType];
      if (!option) return false;
      
      // Check if we can afford it
      if (this.resources.scrapMetal < option.cost) {
        CHEMVENTUR.UI?.showStatus(`❌ Need ${option.cost} scrap metal! (Have: ${this.resources.scrapMetal})`);
        return false;
      }
      
      // Check if already at full HP (unless it's an upgrade)
      if (this.ship.currentHP >= this.ship.maxHP && !option.bonus) {
        CHEMVENTUR.UI?.showStatus('✅ Ship already at full health!');
        return false;
      }
      
      // Start repair!
      this.isRepairing = true;
      this.currentRepairType = repairType;
      this.repairProgress = 0;
      this.resources.scrapMetal -= option.cost;
      
      CHEMVENTUR.UI?.showStatus(`${option.icon} Starting ${option.name}...`);
      
      // Animate repair progress
      this.animateRepair(option);
      
      return true;
    },
    
    // 🛠️ Animate the repair process
    animateRepair(option) {
      const startTime = Date.now();
      const duration = option.time;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        this.repairProgress = Math.min(100, (elapsed / duration) * 100);
        
        this.updateRepairProgressUI();
        
        if (elapsed < duration) {
          requestAnimationFrame(animate);
        } else {
          this.completeRepair(option);
        }
      };
      
      requestAnimationFrame(animate);
    },
    
    // 🛠️ Complete the repair
    completeRepair(option) {
      this.isRepairing = false;
      this.repairProgress = 0;
      this.currentRepairType = null;
      
      // Apply repair
      this.ship.currentHP = Math.min(this.ship.maxHP, this.ship.currentHP + option.repairAmount);
      
      // Apply bonus if any
      if (option.bonus === 'maxHP+25') {
        this.ship.maxHP += 25;
        this.ship.upgrades.push('reinforced-hull');
        CHEMVENTUR.UI?.showStatus('⚡ Hull upgraded! +25 Max HP!');
      }
      
      // Sync with StringSystem
      if (CHEMVENTUR.StringSystem) {
        CHEMVENTUR.StringSystem.shipDamage = this.ship.maxHP - this.ship.currentHP;
      }
      
      CHEMVENTUR.UI?.showStatus(`${option.icon} Repair complete! HP: ${this.ship.currentHP}/${this.ship.maxHP}`);
      this.updateGarageUI();
      
      // Play repair sound
      CHEMVENTUR.Audio?.repair?.();
    },
    
    // 🛠️ Add resources from gameplay
    addResource(type, amount) {
      if (this.resources.hasOwnProperty(type)) {
        this.resources[type] += amount;
        return true;
      }
      return false;
    },
    
    // 🛠️ Create the Garage UI
    createGarageUI() {
      // Check if already exists
      if (document.getElementById('garage-panel')) return;
      
      const panel = document.createElement('div');
      panel.id = 'garage-panel';
      panel.className = 'garage-panel';
      panel.innerHTML = `
        <div class="garage-header">
          <h2>🛠️ THE GARAGE 🛠️</h2>
          <button class="garage-close" onclick="CHEMVENTUR.ShipRepair.closeGarage()">✕</button>
        </div>
        
        <div class="garage-ship-status">
          <div class="ship-visual">🚀</div>
          <div class="ship-hp-display">
            <div class="hp-label">HULL INTEGRITY</div>
            <div class="hp-bar-container">
              <div class="hp-bar" id="garage-hp-bar"></div>
              <span class="hp-text" id="garage-hp-text">100/100</span>
            </div>
          </div>
        </div>
        
        <div class="garage-resources">
          <h3>📦 Resources</h3>
          <div class="resource-grid">
            <div class="resource-item">
              <span class="resource-icon">🔩</span>
              <span class="resource-name">Scrap Metal</span>
              <span class="resource-amount" id="res-scrap">0</span>
            </div>
            <div class="resource-item">
              <span class="resource-icon">⚡</span>
              <span class="resource-name">Energy Cells</span>
              <span class="resource-amount" id="res-energy">0</span>
            </div>
            <div class="resource-item">
              <span class="resource-icon">☢️</span>
              <span class="resource-name">Fusion Cores</span>
              <span class="resource-amount" id="res-fusion">0</span>
            </div>
            <div class="resource-item">
              <span class="resource-icon">🎻</span>
              <span class="resource-name">String Essence</span>
              <span class="resource-amount" id="res-string">0</span>
            </div>
          </div>
        </div>
        
        <div class="garage-repair-options">
          <h3>🔧 Repair Options</h3>
          <div class="repair-grid" id="repair-options-grid"></div>
        </div>
        
        <div class="garage-progress" id="repair-progress-container" style="display:none;">
          <div class="progress-label">🛠️ Repairing...</div>
          <div class="progress-bar-container">
            <div class="progress-bar" id="repair-progress-bar"></div>
          </div>
          <div class="progress-text" id="repair-progress-text">0%</div>
        </div>
        
        <div class="garage-upgrades">
          <h3>⬆️ Upgrades</h3>
          <div class="upgrades-list" id="upgrades-list">
            <div class="no-upgrades">No upgrades installed</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
      this.populateRepairOptions();
      this.addGarageStyles();
    },
    
    // Populate repair option buttons
    populateRepairOptions() {
      const grid = document.getElementById('repair-options-grid');
      if (!grid) return;
      
      grid.innerHTML = '';
      
      Object.entries(this.REPAIR_OPTIONS).forEach(([key, option]) => {
        const btn = document.createElement('button');
        btn.className = 'repair-option-btn';
        btn.innerHTML = `
          <div class="repair-icon">${option.icon}</div>
          <div class="repair-name">${option.name}</div>
          <div class="repair-cost">🔩 ${option.cost}</div>
          <div class="repair-amount">+${option.repairAmount} HP</div>
          <div class="repair-desc">${option.description}</div>
        `;
        btn.onclick = () => this.startRepair(key);
        grid.appendChild(btn);
      });
    },
    
    // Update garage UI
    updateGarageUI() {
      // Update HP bar
      const hpBar = document.getElementById('garage-hp-bar');
      const hpText = document.getElementById('garage-hp-text');
      const hpPercent = (this.ship.currentHP / this.ship.maxHP) * 100;
      
      if (hpBar) {
        hpBar.style.width = hpPercent + '%';
        hpBar.style.background = hpPercent > 70 ? 'linear-gradient(90deg, #00ff41, #88ff00)' :
                                  hpPercent > 40 ? 'linear-gradient(90deg, #ffff00, #ff8800)' :
                                  'linear-gradient(90deg, #ff8800, #ff0000)';
      }
      if (hpText) {
        hpText.textContent = `${Math.round(this.ship.currentHP)}/${this.ship.maxHP}`;
      }
      
      // Update resources
      document.getElementById('res-scrap').textContent = this.resources.scrapMetal;
      document.getElementById('res-energy').textContent = this.resources.energyCells;
      document.getElementById('res-fusion').textContent = this.resources.fusionCores;
      document.getElementById('res-string').textContent = this.resources.stringEssence;
      
      // Update upgrades list
      const upgradesList = document.getElementById('upgrades-list');
      if (upgradesList) {
        if (this.ship.upgrades.length > 0) {
          upgradesList.innerHTML = this.ship.upgrades.map(u => 
            `<div class="upgrade-item">✅ ${u}</div>`
          ).join('');
        } else {
          upgradesList.innerHTML = '<div class="no-upgrades">No upgrades installed</div>';
        }
      }
    },
    
    // Update repair progress UI
    updateRepairProgressUI() {
      const container = document.getElementById('repair-progress-container');
      const bar = document.getElementById('repair-progress-bar');
      const text = document.getElementById('repair-progress-text');
      
      if (this.isRepairing) {
        container.style.display = 'block';
        bar.style.width = this.repairProgress + '%';
        text.textContent = Math.round(this.repairProgress) + '%';
      } else {
        container.style.display = 'none';
      }
    },
    
    // 🛠️ Add CSS styles for the garage
    addGarageStyles() {
      if (document.getElementById('garage-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'garage-styles';
      style.textContent = `
        .garage-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          width: 500px;
          max-height: 80vh;
          background: linear-gradient(135deg, #0a1a0a 0%, #001100 50%, #0a0a1a 100%);
          border: 3px solid #00ff41;
          border-radius: 15px;
          padding: 20px;
          z-index: 10000;
          overflow-y: auto;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease;
          box-shadow: 0 0 50px rgba(0, 255, 65, 0.3), inset 0 0 30px rgba(0, 255, 65, 0.1);
        }
        
        .garage-panel.visible {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, -50%) scale(1);
        }
        
        .garage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #00ff41;
          padding-bottom: 10px;
        }
        
        .garage-header h2 {
          color: #00ff41;
          margin: 0;
          font-family: monospace;
          text-shadow: 0 0 10px #00ff41;
        }
        
        .garage-close {
          background: transparent;
          border: 2px solid #ff3333;
          color: #ff3333;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .garage-close:hover {
          background: #ff3333;
          color: #000;
        }
        
        .garage-ship-status {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(0, 255, 65, 0.1);
          border-radius: 10px;
        }
        
        .ship-visual {
          font-size: 48px;
          animation: shipFloat 2s ease-in-out infinite;
        }
        
        @keyframes shipFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .ship-hp-display {
          flex: 1;
        }
        
        .hp-label {
          color: #888;
          font-size: 12px;
          margin-bottom: 5px;
          font-family: monospace;
        }
        
        .hp-bar-container {
          background: #333;
          border-radius: 10px;
          height: 25px;
          position: relative;
          overflow: hidden;
        }
        
        .hp-bar {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s, background 0.3s;
        }
        
        .hp-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-weight: bold;
          font-family: monospace;
          text-shadow: 0 0 5px #000;
        }
        
        .garage-resources h3,
        .garage-repair-options h3,
        .garage-upgrades h3 {
          color: #00ff41;
          font-family: monospace;
          margin: 15px 0 10px 0;
          font-size: 14px;
        }
        
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .resource-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 5px;
        }
        
        .resource-icon {
          font-size: 20px;
        }
        
        .resource-name {
          color: #888;
          font-size: 11px;
          flex: 1;
        }
        
        .resource-amount {
          color: #00ff41;
          font-weight: bold;
          font-family: monospace;
        }
        
        .repair-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .repair-option-btn {
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00ff41;
          border-radius: 10px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .repair-option-btn:hover {
          background: rgba(0, 255, 65, 0.2);
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
        }
        
        .repair-icon {
          font-size: 32px;
          margin-bottom: 5px;
        }
        
        .repair-name {
          color: #00ff41;
          font-weight: bold;
          font-family: monospace;
          margin-bottom: 5px;
        }
        
        .repair-cost {
          color: #ffff00;
          font-size: 12px;
          margin-bottom: 3px;
        }
        
        .repair-amount {
          color: #00ff41;
          font-size: 14px;
          font-weight: bold;
        }
        
        .repair-desc {
          color: #666;
          font-size: 10px;
          margin-top: 5px;
        }
        
        .garage-progress {
          margin: 20px 0;
          padding: 15px;
          background: rgba(255, 136, 0, 0.1);
          border: 2px solid #ff8800;
          border-radius: 10px;
        }
        
        .progress-label {
          color: #ff8800;
          font-family: monospace;
          margin-bottom: 10px;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .progress-bar-container {
          background: #333;
          border-radius: 5px;
          height: 20px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ff8800, #ffff00);
          border-radius: 5px;
          transition: width 0.1s;
        }
        
        .progress-text {
          text-align: center;
          color: #fff;
          font-family: monospace;
          margin-top: 5px;
        }
        
        .upgrades-list {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 5px;
        }
        
        .upgrade-item {
          color: #00ff41;
          padding: 5px;
          font-family: monospace;
        }
        
        .no-upgrades {
          color: #666;
          font-style: italic;
        }
      `;
      
      document.head.appendChild(style);
    },
    
    // 🛠️ Sync with StringSystem damage
    syncWithStringSystem() {
      if (CHEMVENTUR.StringSystem) {
        const damage = CHEMVENTUR.StringSystem.shipDamage || 0;
        this.ship.currentHP = Math.max(0, this.ship.maxHP - damage);
      }
    },
    
    // 🛠️ Take damage (called from StringSystem)
    takeDamage(amount, source) {
      // Apply armor reduction
      const actualDamage = amount * (1 - this.ship.armor / 100);
      
      // Shields absorb first
      if (this.ship.shields > 0) {
        const shieldAbsorb = Math.min(this.ship.shields, actualDamage);
        this.ship.shields -= shieldAbsorb;
        const hullDamage = actualDamage - shieldAbsorb;
        this.ship.currentHP = Math.max(0, this.ship.currentHP - hullDamage);
      } else {
        this.ship.currentHP = Math.max(0, this.ship.currentHP - actualDamage);
      }
      
      // Sync back to StringSystem
      if (CHEMVENTUR.StringSystem) {
        CHEMVENTUR.StringSystem.shipDamage = this.ship.maxHP - this.ship.currentHP;
      }
      
      return actualDamage;
    }
  };
  
  console.log('🛠️ Ship Repair System loaded! The magic hammer and spanner awaits!');
})();
