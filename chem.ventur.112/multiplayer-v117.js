/* ============================================
   CHEMVENTUR v117 - FIREBASE MULTIPLAYER
   🎃💚 VALENTINE'S DAY MULTIPLAYER! 💚🎃
   Real-time player sync with Firebase!
   ============================================ */

(function() {
  
  CHEMVENTUR.Multiplayer = {
    // Firebase
    db: null,
    playersRef: null,
    myPlayerId: null,
    myPlayerName: 'Pumpkin',
    
    // State
    enabled: false,
    connected: false,
    players: {},
    
    // Colors for different players
    playerColors: [
      '#00ff41', '#ff00ff', '#00ffff', '#ffff00',
      '#ff8800', '#ff0088', '#88ff00', '#0088ff'
    ],
    myColor: '#00ff41',
    
    // Update throttle
    lastUpdate: 0,
    updateInterval: 50, // Update every 50ms (20 times per second)
    
    // ===== INIT =====
    async init() {
      console.log('🔥 Initializing Firebase Multiplayer...');
      
      try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
          console.error('❌ Firebase SDK not loaded!');
          return false;
        }
        
        // Firebase config (from config.js)
        const firebaseConfig = {
          apiKey: "AIzaSyBVViPQjP9f1ZENFNXsCA7rs628FxDayMI",
          authDomain: "chemventurmulti117.firebaseapp.com",
          databaseURL: "https://chemventurmulti117-default-rtdb.europe-west1.firebasedatabase.app",
          projectId: "chemventurmulti117",
          storageBucket: "chemventurmulti117.firebasestorage.app",
          messagingSenderId: "323218594439",
          appId: "1:323218594439:web:5ad5e95e896304de1af622"
        };
        
        // Initialize Firebase
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        this.db = firebase.database();
        this.enabled = true;
        
        console.log('✅ Firebase initialized!');
        return true;
        
      } catch (e) {
        console.error('❌ Firebase init failed:', e);
        return false;
      }
    },
    
    // ===== CONNECT =====
    async connect(playerName) {
      if (!this.enabled) {
        await this.init();
      }
      
      if (!this.enabled) return false;
      
      try {
        // Generate unique player ID
        this.myPlayerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.myPlayerName = playerName || this.myPlayerName;
        this.myColor = this.playerColors[Math.floor(Math.random() * this.playerColors.length)];
        
        console.log('🎃 Connecting as:', this.myPlayerName, this.myPlayerId);
        
        // Reference to players
        this.playersRef = this.db.ref('players');
        
        // Add myself to players list
        const myData = {
          id: this.myPlayerId,
          name: this.myPlayerName,
          color: this.myColor,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          hp: 100,
          gun: 5,
          online: true,
          lastUpdate: firebase.database.ServerValue.TIMESTAMP
        };
        
        await this.playersRef.child(this.myPlayerId).set(myData);
        
        // Listen for other players
        this.playersRef.on('value', (snapshot) => {
          const data = snapshot.val();
          this.players = {};
          
          if (data) {
            for (const [id, player] of Object.entries(data)) {
              if (id !== this.myPlayerId) {
                this.players[id] = player;
              }
            }
          }
          
          // Update UI
          if (CHEMVENTUR.UI && CHEMVENTUR.UI.updatePlayerList) {
            CHEMVENTUR.UI.updatePlayerList(this.getPlayerCount());
          }
        });
        
        // Remove myself on disconnect
        this.playersRef.child(this.myPlayerId).onDisconnect().remove();
        
        this.connected = true;
        console.log('✅ Connected to multiplayer!');
        
        return true;
        
      } catch (e) {
        console.error('❌ Connection failed:', e);
        return false;
      }
    },
    
    // ===== DISCONNECT =====
    disconnect() {
      if (!this.connected) return;
      
      try {
        if (this.playersRef && this.myPlayerId) {
          this.playersRef.child(this.myPlayerId).remove();
        }
        
        if (this.playersRef) {
          this.playersRef.off();
        }
        
        this.connected = false;
        this.players = {};
        
        console.log('👋 Disconnected from multiplayer');
        
      } catch (e) {
        console.error('Error disconnecting:', e);
      }
    },
    
    // ===== UPDATE MY POSITION =====
    updateMyPosition(ship) {
      if (!this.connected || !ship) return;
      
      const now = Date.now();
      if (now - this.lastUpdate < this.updateInterval) return;
      
      this.lastUpdate = now;
      
      try {
        const data = {
          x: Math.round(ship.x),
          y: Math.round(ship.y),
          vx: ship.vx || 0,
          vy: ship.vy || 0,
          hp: ship.hp || 100,
          gun: ship.currentGun || 5,
          lastUpdate: firebase.database.ServerValue.TIMESTAMP
        };
        
        this.playersRef.child(this.myPlayerId).update(data);
        
      } catch (e) {
        console.error('Error updating position:', e);
      }
    },
    
    // ===== GET OTHER PLAYERS =====
    getOtherPlayers() {
      return this.players;
    },
    
    // ===== GET PLAYER COUNT =====
    getPlayerCount() {
      return Object.keys(this.players).length + 1; // +1 for myself
    },
    
    // ===== GET STATUS =====
    getStatus() {
      if (!this.enabled) return 'Disabled';
      if (!this.connected) return 'Not connected';
      return `Connected (${this.getPlayerCount()} players)`;
    }
  };
  
  console.log('🎃 Multiplayer module loaded!');
  
})();
