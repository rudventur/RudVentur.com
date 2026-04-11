// ═══════════════════════════════════════════════════════════════
//  ui.js — All UI: layers, zoom, country selector, modals,
//          grid, compass, listings, conspiracy patch, bus stops
// ═══════════════════════════════════════════════════════════════

// ── LAYERS MENU ──
function toggleLayersMenu() {
  document.getElementById('layersMenu').classList.toggle('show');
  document.getElementById('layersToggle').classList.toggle('open');
}
function setTileLayer(n) {
  G.curTileLayer = n;
  document.querySelectorAll('.layers-menu input[name="bl"]').forEach(r => r.checked = false);
  const el = document.getElementById('bl-' + n);
  if (el) el.checked = true;
  showToast('Map: ' + n, '#00bfff');
}

// ── ZOOM ──
function getZoom() { return ZOOM_LEVELS[G.zoomIdx]; }
function updateZoomUI() {
  const z = getZoom();
  document.getElementById('zLevDisp').textContent = z.z;
  document.getElementById('zDesc').textContent = z.desc;
  const t = document.getElementById('zTrack');
  const th = document.getElementById('zThumb');
  th.style.top = (1 - G.zoomIdx / (ZOOM_LEVELS.length - 1)) * (t.offsetHeight - 10) + 'px';
}
function zoomIn() {
  if (G.zoomIdx < ZOOM_LEVELS.length - 1) { G.zoomIdx++; updateZoomUI(); showToast('Z' + getZoom().z + ' ' + getZoom().name, '#00bfff'); }
}
function zoomOut() {
  if (G.zoomIdx > 0) { G.zoomIdx--; updateZoomUI(); showToast('Z' + getZoom().z + ' ' + getZoom().name, '#00bfff'); }
}

// Zoom drag
(function() {
  const t = document.getElementById('zTrack');
  const th = document.getElementById('zThumb');
  let dr = false;
  function sfy(y) {
    const r = t.getBoundingClientRect();
    G.zoomIdx = Math.round((1 - Math.max(0, Math.min(1, (y - r.top) / r.height))) * (ZOOM_LEVELS.length - 1));
    updateZoomUI();
  }
  th.addEventListener('pointerdown', e => { dr = true; th.setPointerCapture(e.pointerId); });
  th.addEventListener('pointermove', e => { if (dr) sfy(e.clientY); });
  th.addEventListener('pointerup', () => { dr = false; });
  t.addEventListener('click', e => sfy(e.clientY));
})();
document.addEventListener('wheel', e => { if (e.deltaY < 0) zoomIn(); else zoomOut(); e.preventDefault(); }, { passive: false });
updateZoomUI();

// ── COUNTRY SELECTOR ──
function toggleCountrySelector() {
  const panel = document.getElementById('countryPanel');
  panel.classList.toggle('show');
}

function selectCountry(code) {
  const country = COUNTRIES.find(c => c.code === code);
  if (!country) return;
  G.selectedCountry = country;
  document.getElementById('countryLabel').textContent = country.name;
  document.getElementById('countryPanel').classList.remove('show');
  showToast('\u{1F30D} ' + country.name + ' selected!', '#ffe600');

  // Pan to country center
  G.pos.lat = country.lat;
  G.pos.lng = country.lng;
  G.zoomIdx = 1; // Country zoom
  updateZoomUI();

  // Reload train data for this country
  trainOnCountrySelect(country);
}

// Auto-detect country from city search
function detectCountryFromCoords(lat, lng) {
  let best = null, bestDist = Infinity;
  COUNTRIES.forEach(c => {
    if (lat >= c.bbox[0] && lat <= c.bbox[2] && lng >= c.bbox[1] && lng <= c.bbox[3]) {
      const d = haversine(lat, lng, c.lat, c.lng);
      if (d < bestDist) { bestDist = d; best = c; }
    }
  });
  if (best && (!G.selectedCountry || G.selectedCountry.code !== best.code)) {
    G.selectedCountry = best;
    document.getElementById('countryLabel').textContent = best.name;
    showToast('\u{1F30D} Detected: ' + best.name, '#ffe600');
    if (G.veh === 'train') trainOnCountrySelect(best);
  }
}

// ── DRAW GRID ──
function drawGrid() {
  if (!G.overlays.grid) return;
  const z = getZoom().z;
  let g;
  if (z >= 17) g = 0.001; else if (z >= 15) g = 0.005; else if (z >= 13) g = 0.01;
  else if (z >= 11) g = 0.05; else if (z >= 9) g = 0.1; else if (z >= 7) g = 0.5;
  else if (z >= 5) g = 2; else g = 10;
  ctx.strokeStyle = G.curTileLayer === 'dark' ? 'rgba(0,255,65,0.06)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  const sl = Math.floor(G.pos.lat / g) * g - g * 20;
  const sg = Math.floor(G.pos.lng / g) * g - g * 20;
  for (let lat = sl; lat < sl + g * 40; lat += g) {
    const p = worldToScreen(lat, G.pos.lng);
    if (p.y > -10 && p.y < cv.height + 10) {
      ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(cv.width, p.y); ctx.stroke();
    }
  }
  for (let lng = sg; lng < sg + g * 40; lng += g) {
    const p = worldToScreen(G.pos.lat, lng);
    if (p.x > -10 && p.x < cv.width + 10) {
      ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, cv.height); ctx.stroke();
    }
  }
  // Coord labels
  ctx.font = "9px 'VT323',monospace";
  ctx.fillStyle = G.curTileLayer === 'dark' ? 'rgba(0,255,65,0.15)' : 'rgba(0,0,0,0.2)';
  ctx.textAlign = 'left';
  for (let lat = sl; lat < sl + g * 40; lat += g) {
    const p = worldToScreen(lat, G.pos.lng);
    if (p.y > 25 && p.y < cv.height - 25) ctx.fillText(lat.toFixed(z >= 13 ? 3 : 1) + '\u00B0', 4, p.y - 2);
  }
  for (let lng = sg; lng < sg + g * 40; lng += g) {
    const p = worldToScreen(G.pos.lat, lng);
    if (p.x > 25 && p.x < cv.width - 50) ctx.fillText(lng.toFixed(z >= 13 ? 3 : 1) + '\u00B0', p.x + 2, cv.height - 62);
  }
}

// ── DRAW COMPASS + COORDS ──
function drawHUD() {
  if (!G.overlays.compass) return;
  ctx.save();
  const cx = cv.width - 70, cy = cv.height - 100;
  ctx.strokeStyle = 'rgba(0,255,65,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(0,255,65,0.25)'; ctx.font = "8px 'Press Start 2P'"; ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - 9);
  ctx.fillStyle = 'rgba(0,255,65,0.12)';
  ctx.fillText('S', cx, cy + 13); ctx.fillText('W', cx - 13, cy + 3); ctx.fillText('E', cx + 13, cy + 3);
  ctx.restore();
  ctx.fillStyle = 'rgba(0,255,65,0.2)'; ctx.font = "10px 'VT323',monospace"; ctx.textAlign = 'left';
  ctx.fillText(G.pos.lat.toFixed(5) + '\u00B0N  ' + G.pos.lng.toFixed(5) + '\u00B0' + (G.pos.lng >= 0 ? 'E' : 'W'), 8, cv.height - 62);
  // Show selected country
  if (G.selectedCountry) {
    ctx.fillStyle = 'rgba(255,230,0,0.3)'; ctx.font = "9px 'VT323',monospace";
    ctx.fillText('\u{1F30D} ' + G.selectedCountry.name, 8, cv.height - 50);
  }
}

// ── DRAW ARTSPACE PINS ──
function drawListings() {
  if (!G.overlays.pins) return;
  const z = getZoom().z;
  const list = G.showOffersOnly
    ? G.listings.filter(l => l.artSpace?.offer?.types?.length > 0)
    : G.listings;

  list.forEach(l => {
    const s = worldToScreen(l.lat, l.lng);
    if (s.x < -30 || s.x > cv.width + 30 || s.y < -40 || s.y > cv.height + 20) return;
    const col = getPCol(l);
    ctx.fillStyle = col.bg; ctx.shadowColor = col.bg; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(s.x, s.y - 12, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s.x - 4, s.y - 5); ctx.lineTo(s.x, s.y + 2); ctx.lineTo(s.x + 4, s.y - 5); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(l.artSpace?.offer?.types?.length > 0 ? '\u{1F3E0}' : '\u{1F9E9}', s.x, s.y - 12);
    if (z >= 11) {
      ctx.fillStyle = col.bg; ctx.font = "9px 'VT323',monospace"; ctx.textAlign = 'center';
      ctx.fillText(l.username || '', s.x, s.y + 12);
    }
  });
}

// ── RED STRINGS (connect matching offers to seeks) ──
function drawRedStrings() {
  if (!G.showRedStrings) return;
  const offers = G.listings.filter(l => l.artSpace?.offer?.types?.length > 0);
  const seeks = G.listings.filter(l => l.artSpace?.seek?.types?.length > 0);

  seeks.forEach(sk => {
    const seekTypes = sk.artSpace.seek.types;
    offers.forEach(of => {
      if (of.id === sk.id) return;
      const ofTypes = of.artSpace.offer.types;
      // Check for matching types
      const match = seekTypes.some(st => ofTypes.some(ot => ot === st));
      if (!match) return;

      const a = worldToScreen(of.lat, of.lng);
      const b = worldToScreen(sk.lat, sk.lng);
      if (a.x < -50 && b.x < -50) return;
      if (a.x > cv.width + 50 && b.x > cv.width + 50) return;

      // Animated red string
      ctx.strokeStyle = 'rgba(255,34,68,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -G.frameN * 0.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 12); ctx.lineTo(b.x, b.y - 12); ctx.stroke();
      ctx.setLineDash([]);

      // Glow
      ctx.strokeStyle = 'rgba(255,34,68,0.1)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 12); ctx.lineTo(b.x, b.y - 12); ctx.stroke();
    });
  });
}

// ── COMMENTS (conspiracy patch) ──
function drawComments() {
  const z = getZoom().z;
  if (z < 5) return;

  G.comments.forEach(c => {
    const s = worldToScreen(c.lat, c.lng);
    if (s.x < -40 || s.x > cv.width + 40 || s.y < -40 || s.y > cv.height + 40) return;

    ctx.fillStyle = '#ffe600'; ctx.shadowColor = '#ffe600'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

    // Show tooltip when near player
    const dx = s.x - cv.width / 2, dy = s.y - cv.height / 2;
    if (Math.sqrt(dx * dx + dy * dy) < 120) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(s.x + 12, s.y - 40, 240, 60);
      ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 12, s.y - 40, 240, 60);
      ctx.fillStyle = '#ffe600'; ctx.font = "bold 11px 'VT323',monospace"; ctx.textAlign = 'left';
      ctx.fillText(c.from, s.x + 20, s.y - 22);
      ctx.fillStyle = '#ffdd44'; ctx.font = "10px 'VT323',monospace";
      ctx.fillText(c.text.length > 60 ? c.text.substring(0, 60) + '...' : c.text, s.x + 20, s.y - 5);
      ctx.fillStyle = 'rgba(255,230,0,0.6)'; ctx.font = "9px 'VT323',monospace";
      ctx.fillText(c.timestamp, s.x + 20, s.y + 12);
    }
  });
}

// ── BUS STOPS ──
let busStops = [];
async function loadBusData() {
  busStops = [];
  showToast('\u{1F68C} Loading bus stops...', '#ff2244');
  try {
    const pad = getZoom().z >= 13 ? 0.015 : 0.05;
    const bbox = (G.pos.lat - pad) + ',' + (G.pos.lng - pad * 1.5) + ',' + (G.pos.lat + pad) + ',' + (G.pos.lng + pad * 1.5);
    const q = '[out:json][timeout:15];(node["highway"="bus_stop"](' + bbox + ');node["public_transport"="platform"]["bus"="yes"](' + bbox + '););out body;';
    const data = await overpassQuery(q);
    busStops = data.elements.filter(e => e.type === 'node').map(e => ({ lat: e.lat, lon: e.lon, name: e.tags?.name || e.tags?.ref || '' }));
    document.getElementById('transitInfo').style.display = 'block';
    document.getElementById('transitText').innerHTML = busStops.length + ' bus stops';
    showToast('\u{1F68C} ' + busStops.length + ' stops!', '#ff2244');
  } catch (e) { showToast('Bus data unavailable', '#ff4444'); }
}

function drawBusStops() {
  if (G.veh !== 'bus' || !G.overlays.transit) return;
  const z = getZoom().z;
  busStops.forEach(stop => {
    const s = worldToScreen(stop.lat, stop.lon);
    if (s.x < -40 || s.x > cv.width + 40 || s.y < -20 || s.y > cv.height + 20) return;
    ctx.fillStyle = '#ff2244'; ctx.shadowColor = '#ff2244'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.stroke();
    if (z >= 13 && stop.name) {
      ctx.fillStyle = '#ff4466'; ctx.font = "9px 'VT323',monospace"; ctx.textAlign = 'left';
      ctx.fillText('\u{1F68F} ' + stop.name, s.x + 6, s.y + 3);
    }
  });
}

// ── MODALS ──
function openNewPin(lat, lng) {
  document.getElementById('MB').innerHTML = '<button class="mcl" onclick="closeModal()">\u2715</button><div class="mh">\u{1F4CC} NEW ARTSPACE</div><div class="mf"><label>YOUR NAME</label><input type="text" id="pU" placeholder="username..." maxlength="30"></div><div class="mf"><label>SIGNATURE</label><input type="text" id="pS" placeholder="your vibe..." maxlength="60"></div><div class="mf"><label>SPACE TYPES</label><div class="chips">' + TYPES.map(t => '<span class="chip" onclick="this.classList.toggle(\'on\')">' + t + '</span>').join('') + '</div></div><div class="mf"><label>DESCRIPTION</label><textarea id="pD" placeholder="What do you have or seek?"></textarea></div><div class="mf"><label>I AM</label><select id="pR"><option value="offer">\u{1F3E0} Offering</option><option value="seek">\u{1F9E9} Seeking</option><option value="both">\u{1F3E0}\u{1F9E9} Both</option></select></div><div class="mf"><label>EXCHANGE</label><div class="chips"><span class="chip on" onclick="this.classList.toggle(\'on\')">\u{1F49A} FREE</span><span class="chip" onclick="this.classList.toggle(\'on\')">\u{1F504} SWAP</span><span class="chip" onclick="this.classList.toggle(\'on\')">\u2615 DONATION</span><span class="chip" onclick="this.classList.toggle(\'on\')">\u{1F4B8} PAID</span></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><div class="mf"><label>FROM</label><input type="date" id="pF"></div><div class="mf"><label>TO</label><input type="date" id="pT"></div></div><button class="msave" onclick="savePin(' + lat + ',' + lng + ')">\u{1F4BE} PUBLISH</button>';
  document.getElementById('MO').classList.add('open');
}

function savePin(lat, lng) {
  const user = document.getElementById('pU').value.trim() || 'Anonymous';
  const sig = document.getElementById('pS').value.trim();
  const desc = document.getElementById('pD').value.trim();
  const role = document.getElementById('pR').value;
  const types = [...document.querySelectorAll('#MB .chips .chip.on')].map(c => c.textContent);
  const l = { id: 'p' + Date.now(), lat, lng, username: user, signature: sig, artSpace: { active: true,
    offer: role === 'seek' ? { types: [], desc: '', exchange: [] } : { types, desc, exchange: types, dateFrom: document.getElementById('pF').value, dateTo: document.getElementById('pT').value },
    seek: role === 'offer' ? { types: [], desc: '', exchange: [] } : { types, desc, exchange: ['\u{1F504} SKILLS'], dateFrom: document.getElementById('pF').value, dateTo: document.getElementById('pT').value }
  }};
  G.listings.push(l);
  document.getElementById('SS').textContent = G.listings.length;
  closeModal();
  showToast('\u{1F4CC} Space published!', '#00ff41');
}

function openView(p) {
  const art = p.artSpace || {};
  const io = art.offer?.types?.length > 0, is = art.seek?.types?.length > 0;
  const col = getPCol(p);
  const sec = (data, isO) => {
    if (!(isO ? io : is)) return '';
    const chips = (data.types || []).map(t => '<span class="mc ' + (isO ? 'mc-o' : 'mc-s') + '">' + t + '</span>').join('');
    const dates = fmtD(data.dateFrom, data.dateTo);
    return '<div class="msec ' + (isO ? 'msec-o' : 'msec-s') + '"><div class="mst">' + (isO ? '\u{1F3E0} OFFERING' : '\u{1F9E9} SEEKING') + '</div><div class="mchips">' + chips + '</div>' + (data.desc ? '<div class="mdesc">' + esc(data.desc) + '</div>' : '') + (dates ? '<div class="mdates">\u{1F4C5} ' + dates + '</div>' : '') + (data.exchange?.length ? '<div class="mxch">' + data.exchange.join(' \u00B7 ') + '</div>' : '') + '</div>';
  };
  document.getElementById('MB').innerHTML = '<button class="mcl" onclick="closeModal()">\u2715</button><div class="mbt" style="color:' + col.bg + ';text-shadow:0 0 6px ' + col.bg + '">' + (io && is ? '\u{1F3E0}\u{1F9E9} HOST+SEEKER' : io ? '\u{1F3E0} SPACE' : '\u{1F9E9} SEEKING') + '</div><div class="mu">' + esc(p.username || 'Anon') + '</div>' + (p.signature ? '<div class="msig">"' + esc(p.signature) + '"</div>' : '') + sec(art.offer || {}, true) + sec(art.seek || {}, false) + '<button class="mcon" onclick="showToast(\'Find ' + esc(p.username || '') + ' \u2014 auth coming soon!\',\'#00bfff\');closeModal()">\u{1F4AC} CONNECT</button>';
  document.getElementById('MO').classList.add('open');
}

function closeModal() { document.getElementById('MO').classList.remove('open'); }
