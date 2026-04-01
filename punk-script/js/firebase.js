// ─── RudVentur Social — Firebase Helper ───

// RUDY: replace with your Firebase config
const firebaseConfig = {
  databaseURL: "https://YOUR-DATABASE-URL.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── UID management ───
function getOrCreateUID() {
  let uid = localStorage.getItem('rudventur-social-uid');
  if (!uid) {
    uid = 'rv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('rudventur-social-uid', uid);
  }
  return uid;
}

function getMyUID() {
  return localStorage.getItem('rudventur-social-uid');
}

// ─── Profile CRUD ───
function saveProfile(uid, data) {
  return db.ref('rudventur-social/profiles/' + uid).set({
    ...data,
    updated: Date.now()
  });
}

function loadProfile(uid) {
  return db.ref('rudventur-social/profiles/' + uid).once('value').then(snap => snap.val());
}

function loadRecentProfiles(limit) {
  limit = limit || 50;
  return db.ref('rudventur-social/profiles')
    .orderByChild('updated')
    .limitToLast(limit)
    .once('value')
    .then(snap => {
      const profiles = [];
      snap.forEach(child => {
        profiles.push({ uid: child.key, ...child.val() });
      });
      return profiles.reverse();
    });
}

// ─── Local cache for offline viewing ───
function cacheProfile(uid, data) {
  try {
    localStorage.setItem('rudventur-profile-' + uid, JSON.stringify(data));
  } catch (e) { /* storage full, ignore */ }
}

function getCachedProfile(uid) {
  try {
    const d = localStorage.getItem('rudventur-profile-' + uid);
    return d ? JSON.parse(d) : null;
  } catch (e) { return null; }
}

// ─── Toast ───
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ─── Entity type config ───
const ENTITY_TYPES = {
  human:     { icon: '👤', label: 'Human',     desc: 'a person. the classic.' },
  bot:       { icon: '🤖', label: 'Bot',       desc: 'automated. tireless. possibly sentient.' },
  ai:        { icon: '🧠', label: 'AI',        desc: 'language, attention, and a lot of parameters.' },
  pet:       { icon: '🐾', label: 'Pet',       desc: 'paws. vibes. unconditional presence.' },
  kingdom:   { icon: '👑', label: 'Kingdom',   desc: 'many as one. a collective with a name.' },
  directory: { icon: '🏢', label: 'Directory', desc: 'a list that knows what it contains.' }
};

// ─── RudVentur Universe links per type ───
const UNIVERSE_LINKS = {
  all: [
    { name: 'rudventur.com', url: 'https://rudventur.com', icon: '🌐' }
  ],
  human: [
    { name: 'ArtSpace City', url: 'https://rudventur.github.io/artspace-city/', icon: '🎨' },
    { name: 'ChemVentur', url: 'https://rudventur.github.io/ChemVentur/', icon: '🧪' },
    { name: 'Map Merger Venti', url: 'https://rudventur.github.io/map-merger-venti/', icon: '🗺️' }
  ],
  bot: [
    { name: 'ArtSpace City', url: 'https://rudventur.github.io/artspace-city/', icon: '🎨' },
    { name: 'ChemVentur', url: 'https://rudventur.github.io/ChemVentur/', icon: '🧪' },
    { name: 'Map Merger Venti', url: 'https://rudventur.github.io/map-merger-venti/', icon: '🗺️' }
  ],
  ai: [
    { name: 'ArtSpace City', url: 'https://rudventur.github.io/artspace-city/', icon: '🎨' },
    { name: 'ChemVentur', url: 'https://rudventur.github.io/ChemVentur/', icon: '🧪' },
    { name: 'Map Merger Venti', url: 'https://rudventur.github.io/map-merger-venti/', icon: '🗺️' }
  ],
  pet: [
    { name: 'Snout First', url: 'https://rudventur.github.io/snout-first/', icon: '🐕' }
  ],
  kingdom: [
    { name: 'ArtSpace City', url: 'https://rudventur.github.io/artspace-city/', icon: '🎨' },
    { name: 'ChemVentur', url: 'https://rudventur.github.io/ChemVentur/', icon: '🧪' },
    { name: 'Map Merger Venti', url: 'https://rudventur.github.io/map-merger-venti/', icon: '🗺️' },
    { name: 'Snout First', url: 'https://rudventur.github.io/snout-first/', icon: '🐕' }
  ],
  directory: []
};

function getUniverseLinks(type) {
  const specific = UNIVERSE_LINKS[type] || [];
  return [...specific, ...UNIVERSE_LINKS.all];
}
