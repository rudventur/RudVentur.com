// ═══════════════════════════════════════════════════════════════
//  game.js — State, loop, controls, movement, boot
// ═══════════════════════════════════════════════════════════════

const G = {
  pos: { lat: 51.5155, lng: -0.0922 },
  dir: 'up', keys: {}, frameN: 0, veh: 'walk', zoomIdx: 6,
  pinMode: false, curTileLayer: 'dark',
  overlays: { grid: true, pins: true, transit: true, compass: true },
  listings: [...DEMO], selectedCountry: null,
  showOffersOnly: false, showRedStrings: false, commentMode: false,
  comments: [
    { lat:51.51, lng:-0.13, text:"This kiln is amazing", from:"NeonWanderer42", timestamp:"2026-03-12" },
    { lat:52.52, lng:13.40, text:"Collab on large-scale prints?", from:"CosmicNomad7", timestamp:"2026-03-14" },
    { lat:48.86, lng:2.35, text:"Darkroom available this weekend", from:"ElectricSeeker12", timestamp:"2026-03-10" },
  ],
};

// Boat water detection state
let boatNearWater = false;
let boatWaterChecked = null;

const cv = document.getElementById('world');
const ctx = cv.getContext('2d');
function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

// ── CONTROLS ──
document.addEventListener('keydown', e => {
  G.keys[e.key] = true;
  if (e.key === 'Escape') { closeModal(); document.getElementById('layersMenu')?.classList.remove('show'); document.getElementById('countryPanel')?.classList.remove('show'); }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if (e.key === '=' || e.key === '+') zoomIn();
  if (e.key === '-') zoomOut();
});
document.addEventListener('keyup', e => { G.keys[e.key] = false; });

const DM = { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight' };
document.querySelectorAll('.db[data-dir]').forEach(btn => {
  const k = DM[btn.dataset.dir];
  btn.addEventListener('pointerdown', () => { G.keys[k] = true; btn.classList.add('pressed'); });
  btn.addEventListener('pointerup', () => { G.keys[k] = false; btn.classList.remove('pressed'); });
  btn.addEventListener('pointerleave', () => { G.keys[k] = false; btn.classList.remove('pressed'); });
});
function centerPlayer() {}

// ── SEARCH ──
document.getElementById('goBtn').addEventListener('click', goCity);
document.getElementById('CI').addEventListener('keydown', e => { if (e.key === 'Enter') goCity(); });
async function goCity() {
  const name = document.getElementById('CI').value.trim(); if (!name) return;
  showToast('Finding ' + name + '...', '#00bfff');
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(name) + '&format=json&limit=1', { headers: { 'User-Agent': 'ArtSpaceCity/1.0' } });
    const d = await r.json();
    if (d[0]) {
      G.pos.lat = parseFloat(d[0].lat); G.pos.lng = parseFloat(d[0].lon);
      showToast('Welcome to ' + name + '!', '#00ff41');
      detectCountryFromCoords(G.pos.lat, G.pos.lng);
      if (G.veh === 'train') trainLoadAround();
      if (G.veh === 'bus') loadBusData();
      if (G.veh === 'plane') flyLoadAirports();
      if (showFlights) fetchFlights();
    } else showToast('Not found!', '#ff4444');
  } catch (e) { showToast('Network error', '#ff4444'); }
}

// ── PIN / CONSPIRACY ──
function togglePin() {
  G.pinMode = !G.pinMode; const pb = document.getElementById('pinBtn');
  if (G.pinMode) { pb.innerHTML = '\u{1F4CC} PINNING...'; pb.style.background = '#ff6600'; pb.style.color = '#000'; cv.style.cursor = 'crosshair'; showToast('Click to pin!', '#ff6600'); }
  else { pb.innerHTML = '\u{1F4CC} PIN'; pb.style.cssText = ''; cv.style.cursor = ''; }
}
function toggleOfferFilter() {
  G.showOffersOnly = !G.showOffersOnly; const b = document.getElementById('offerFilterBtn');
  if (G.showOffersOnly) { b.style.background = '#ffe600'; b.style.color = '#000'; G.zoomIdx = 0; updateZoomUI(); }
  else b.style.cssText = '';
  showToast(G.showOffersOnly ? 'OFFERS only' : 'All spaces', '#ffe600');
}
function toggleRedStrings() {
  G.showRedStrings = !G.showRedStrings; const b = document.getElementById('redStringBtn');
  if (G.showRedStrings) { b.style.background = '#ff2244'; b.style.color = '#fff'; showToast('Red strings \u{1F441}', '#ff2244'); }
  else { b.style.cssText = ''; showToast('Strings off', '#00ff41'); }
}
function toggleCommentMode() {
  G.commentMode = !G.commentMode; const b = document.getElementById('commentBtn');
  if (G.commentMode) { b.style.background = '#ffe600'; b.style.color = '#000'; cv.style.cursor = 'text'; }
  else { b.style.cssText = ''; cv.style.cursor = ''; }
}

// ── CANVAS CLICK ──
cv.addEventListener('click', e => {
  const w = screenToWorld(e.clientX, e.clientY);
  if (G.commentMode) { G.commentMode = false; cv.style.cursor = ''; document.getElementById('commentBtn').style.cssText = ''; const t = prompt('Drop your note:'); if (t) { G.comments.push({ lat:w.lat, lng:w.lng, text:t, from:'Anonymous', timestamp:new Date().toISOString().split('T')[0] }); showToast('Note dropped!', '#ffe600'); } return; }
  if (G.pinMode) { G.pinMode = false; document.getElementById('pinBtn').innerHTML = '\u{1F4CC} PIN'; document.getElementById('pinBtn').style.cssText = ''; cv.style.cursor = ''; openNewPin(w.lat, w.lng); return; }
  let clicked = false;
  G.listings.forEach(l => { const s = worldToScreen(l.lat, l.lng); if (Math.abs(e.clientX - s.x) < 15 && Math.abs(e.clientY - s.y + 10) < 20) { openView(l); clicked = true; } });
  if (!clicked && !(G.veh === 'plane' && planeAirborne)) { G.pos.lat = w.lat; G.pos.lng = w.lng; }
});

// ── VEHICLE CHANGE ──
function setV(btn) {
  const nv = btn.dataset.v; if (nv === G.veh) return;
  G.veh = nv; planeAirborne = false; boatNearWater = false;
  document.querySelectorAll('.vbtn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  const v = VEH[G.veh];
  if (nv === 'plane') { document.getElementById('SPD').innerHTML = '\u2708<br>' + curAircraft.kmh + ' km/h'; }
  else { document.getElementById('SPD').innerHTML = v.em + '<br>' + v.kmh; }
  document.getElementById('VS').innerHTML = v.em + ' ' + v.lbl;
  showToast('Vehicle: ' + v.em + ' ' + v.lbl, '#ffe600');
  // Show aircraft selector for plane
  if (nv === 'plane') setTimeout(openAircraftSelector, 300);
  trainClear(); busStops = []; flyClear(); document.getElementById('transitInfo').style.display = 'none';
  if (nv === 'train') trainLoadAround();
  if (nv === 'bus') loadBusData();
  if (nv === 'plane') { flyLoadAirports(); if (!showFlights) toggleFlights(); }
}

// ── BOAT WATER CHECK ──
async function checkBoatWater() {
  if (G.veh !== 'boat') return;
  boatWaterChecked = { lat: G.pos.lat, lng: G.pos.lng };
  try {
    const pad = 0.005;
    const bbox = (G.pos.lat - pad) + ',' + (G.pos.lng - pad) + ',' + (G.pos.lat + pad) + ',' + (G.pos.lng + pad);
    const q = '[out:json][timeout:8];(way["natural"="water"]('+bbox+');way["waterway"]('+bbox+');relation["natural"="water"]('+bbox+'););out count;';
    const data = await overpassQuery(q);
    const count = data.elements?.[0]?.tags?.total || data.elements?.length || 0;
    boatNearWater = count > 0;
  } catch (e) { boatNearWater = false; }
}

// ── MOVEMENT ──
function updateMovement() {
  const k = G.keys;
  const up = k.ArrowUp || k.w || k.W;
  const dn = k.ArrowDown || k.s || k.S;
  const lt = k.ArrowLeft || k.a || k.A;
  const rt = k.ArrowRight || k.d || k.D;
  const mv = up || dn || lt || rt;

  if (G.veh === 'plane') {
    const ac = curAircraft;
    const spd = planeAirborne ? ac.spd : VEH.walk.spd;
    if (up) { G.pos.lat += spd; G.dir = 'up'; }
    if (dn) { G.pos.lat -= spd; G.dir = 'down'; }
    if (lt) { G.pos.lng -= spd; G.dir = 'left'; }
    if (rt) { G.pos.lng += spd; G.dir = 'right'; }
    // Constant flight — drift forward when airborne with no input
    if (planeAirborne && !mv) {
      const drift = ac.spd * 0.6;
      const hr = planeHeading * Math.PI / 180;
      G.pos.lat += Math.cos(hr) * drift;
      G.pos.lng += Math.sin(hr) * drift;
    }
  } else if (G.veh === 'train' && trainTracks.length > 0 && mv) {
    const s = VEH.train.spd;
    let nl = G.pos.lat, ng = G.pos.lng;
    if (up) { nl += s; G.dir = 'up'; } if (dn) { nl -= s; G.dir = 'down'; }
    if (lt) { ng -= s; G.dir = 'left'; } if (rt) { ng += s; G.dir = 'right'; }
    const sn = snapToTrack(nl, ng);
    if (sn.snapped) { G.pos.lat = sn.lat; G.pos.lng = sn.lng; }
    else { const slow = VEH.walk.spd * 0.4; if (up) G.pos.lat += slow; if (dn) G.pos.lat -= slow; if (lt) G.pos.lng -= slow; if (rt) G.pos.lng += slow; }
  } else if (G.veh === 'boat') {
    // Boat moves at full speed on water, slow on land
    const spd = boatNearWater ? VEH.boat.spd : VEH.walk.spd * 0.3;
    if (up) { G.pos.lat += spd; G.dir = 'up'; } if (dn) { G.pos.lat -= spd; G.dir = 'down'; }
    if (lt) { G.pos.lng -= spd; G.dir = 'left'; } if (rt) { G.pos.lng += spd; G.dir = 'right'; }
  } else {
    const s = VEH[G.veh]?.spd || VEH.walk.spd;
    if (up) { G.pos.lat += s; G.dir = 'up'; } if (dn) { G.pos.lat -= s; G.dir = 'down'; }
    if (lt) { G.pos.lng -= s; G.dir = 'left'; } if (rt) { G.pos.lng += s; G.dir = 'right'; }
  }
}

// ── MAIN LOOP ──
function loop() {
  G.frameN++;
  updateMovement();
  if (G.veh === 'plane') flyUpdatePhysics();

  // Periodic
  if (G.frameN % 20 === 0 && G.veh === 'plane') checkAirportProximity();
  if (G.frameN % 90 === 0 && G.veh === 'train') trainCheckProgressiveLoad();
  if (G.frameN % 180 === 0 && G.veh === 'boat') {
    if (!boatWaterChecked || haversine(G.pos.lat, G.pos.lng, boatWaterChecked.lat, boatWaterChecked.lng) > 0.5) checkBoatWater();
  }

  // ── RENDER ──
  ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, cv.width, cv.height);
  drawTiles();
  drawRailTileOverlay();
  drawGrid();
  drawTrainTracks();
  drawTrainStations();
  drawBusStops();
  drawAirports();
  drawFlights();
  drawRedStrings();
  drawListings();
  drawComments();
  drawPlayer();
  drawHUD();
  requestAnimationFrame(loop);
}

// ── BOOT ──
document.getElementById('SS').textContent = G.listings.length;
const countryList = document.getElementById('countryList');
if (countryList) {
  COUNTRIES.forEach(c => {
    const row = document.createElement('div');
    row.className = 'country-row';
    row.innerHTML = '<span class="country-code">' + c.code + '</span> ' + c.name;
    row.onclick = () => selectCountry(c.code);
    countryList.appendChild(row);
  });
}
loop();
