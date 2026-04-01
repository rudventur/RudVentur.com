// ═══════════════════════════════════════════════════════════════
//  train.js — Railway tracks, stations, progressive loading
// ═══════════════════════════════════════════════════════════════

let trainStations = [];
let trainTracks = [];
let trainLoading = false;
let trainLastCenter = null;
const TRAIN_RELOAD_DIST = 5;

async function trainLoadAround() {
  if (trainLoading) return;
  trainLoading = true;
  trainLastCenter = { lat: G.pos.lat, lng: G.pos.lng };
  const z = getZoom().z;
  const pad = z <= 5 ? 2.0 : z <= 7 ? 0.8 : z <= 9 ? 0.3 : z <= 11 ? 0.12 : z <= 13 ? 0.06 : 0.025;
  const bbox = (G.pos.lat - pad) + ',' + (G.pos.lng - pad * 1.6) + ',' + (G.pos.lat + pad) + ',' + (G.pos.lng + pad * 1.6);
  showToast('\u{1F682} Loading tracks...', '#ff6600');
  try {
    const q = '[out:json][timeout:20];(way["railway"="rail"]('+bbox+');node["railway"="station"]('+bbox+');node["railway"="halt"]('+bbox+'););out body;>;out skel qt;';
    const data = await overpassQuery(q);
    const nodes = {};
    data.elements.filter(e => e.type === 'node').forEach(n => { nodes[n.id] = [n.lat, n.lon]; });
    const newTracks = [];
    data.elements.filter(e => e.type === 'way' && e.tags?.railway === 'rail').forEach(w => {
      const coords = w.nodes.map(id => nodes[id]).filter(Boolean);
      if (coords.length >= 2) newTracks.push(coords);
    });
    const newStations = data.elements
      .filter(e => e.type === 'node' && e.tags && (e.tags.railway === 'station' || e.tags.railway === 'halt'))
      .map(e => ({ lat: e.lat, lon: e.lon, name: e.tags.name || 'Stop', isMain: e.tags.railway === 'station' }));
    // Merge without duplicates
    const etk = new Set(trainTracks.map(t => t[0][0].toFixed(3) + ',' + t[0][1].toFixed(3)));
    newTracks.forEach(t => { const k = t[0][0].toFixed(3) + ',' + t[0][1].toFixed(3); if (!etk.has(k)) { trainTracks.push(t); etk.add(k); } });
    const esk = new Set(trainStations.map(s => s.lat.toFixed(3) + ',' + s.lon.toFixed(3)));
    newStations.forEach(s => { const k = s.lat.toFixed(3) + ',' + s.lon.toFixed(3); if (!esk.has(k)) { trainStations.push(s); esk.add(k); } });
    document.getElementById('transitInfo').style.display = 'block';
    document.getElementById('transitText').innerHTML = trainStations.length + ' stations \u00B7 ' + trainTracks.length + ' tracks';
    if (newTracks.length > 0) showToast('\u{1F682} +' + newTracks.length + ' tracks, ' + newStations.length + ' stations!', '#ff6600');
  } catch (e) { console.log('Train error:', e); showToast('Track data unavailable', '#ff4444'); }
  trainLoading = false;
}

function trainCheckProgressiveLoad() {
  if (G.veh !== 'train') return;
  if (!trainLastCenter) { trainLoadAround(); return; }
  if (haversine(G.pos.lat, G.pos.lng, trainLastCenter.lat, trainLastCenter.lng) > TRAIN_RELOAD_DIST) trainLoadAround();
}

function drawTrainTracks() {
  if (G.veh !== 'train' || !G.overlays.transit || trainTracks.length === 0) return;
  trainTracks.forEach(tk => {
    if (tk.length < 2) return;
    let onScreen = false;
    for (let i = 0; i < tk.length; i += Math.max(1, Math.floor(tk.length / 5))) {
      const s = worldToScreen(tk[i][0], tk[i][1]);
      if (s.x > -200 && s.x < cv.width + 200 && s.y > -200 && s.y < cv.height + 200) { onScreen = true; break; }
    }
    if (!onScreen) return;
    ctx.strokeStyle = 'rgba(255,102,0,0.12)'; ctx.lineWidth = 8; ctx.setLineDash([]);
    ctx.beginPath(); tk.forEach((p, i) => { const s = worldToScreen(p[0], p[1]); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); }); ctx.stroke();
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 3; ctx.setLineDash([10, 5]);
    ctx.beginPath(); tk.forEach((p, i) => { const s = worldToScreen(p[0], p[1]); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); }); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,102,0,0.2)'; ctx.lineWidth = 1;
    for (let i = 0; i < tk.length - 1; i++) {
      const a = worldToScreen(tk[i][0], tk[i][1]), b = worldToScreen(tk[i + 1][0], tk[i + 1][1]);
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
      if (len < 5) continue;
      const nx = -dy / len * 5, ny = dx / len * 5;
      for (let t = 0; t < 1; t += 14 / len) { const mx = a.x + dx * t, my = a.y + dy * t; ctx.beginPath(); ctx.moveTo(mx + nx, my + ny); ctx.lineTo(mx - nx, my - ny); ctx.stroke(); }
    }
  });
}

function drawTrainStations() {
  if (G.veh !== 'train' || !G.overlays.transit) return;
  const z = getZoom().z;
  trainStations.forEach(st => {
    if (z <= 7 && !st.isMain) return;
    const s = worldToScreen(st.lat, st.lon);
    if (s.x < -100 || s.x > cv.width + 100 || s.y < -40 || s.y > cv.height + 40) return;
    const r = z >= 13 ? 5 : z >= 9 ? 4 : 3;
    ctx.fillStyle = '#ffe600'; ctx.shadowColor = '#ffe600'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = st.isMain ? 2.5 : 1.5;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke();
    if (z >= 9 || (z >= 5 && st.isMain)) {
      ctx.fillStyle = '#ffe600';
      ctx.font = (st.isMain ? 'bold ' : '') + (z >= 13 ? '11' : z >= 9 ? '9' : '8') + "px 'VT323',monospace";
      ctx.textAlign = 'left'; ctx.fillText('\u{1F689} ' + st.name, s.x + r + 4, s.y + 3);
    }
  });
}

function snapToTrack(lat, lng) {
  let minD = Infinity, bL = lat, bG = lng;
  trainTracks.forEach(tk => {
    for (let i = 0; i < tk.length - 1; i++) {
      const [ax, ay] = tk[i], [bx, by] = tk[i + 1];
      const dx = bx - ax, dy = by - ay, ls = dx * dx + dy * dy;
      if (!ls) continue;
      let t = ((lat - ax) * dx + (lng - ay) * dy) / ls;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + t * dx, cy = ay + t * dy, d = (cx - lat) ** 2 + (cy - lng) ** 2;
      if (d < minD) { minD = d; bL = cx; bG = cy; }
    }
  });
  return minD < 0.0001 ? { lat: bL, lng: bG, snapped: true } : { lat, lng, snapped: false };
}

function trainClear() { trainStations = []; trainTracks = []; trainLastCenter = null; document.getElementById('transitInfo').style.display = 'none'; }
function trainOnCountrySelect() { trainClear(); if (G.veh === 'train') trainLoadAround(); }
