// ═══════════════════════════════════════════════════════════════
//  fly.js — Aircraft types, airports, flights, physics, boarding
// ═══════════════════════════════════════════════════════════════

let airports = [];
let flights = [];
let showFlights = false;
let flightInt = null;
let planeAirborne = false;
let nearAirport = null;
let planeHeading = 0;
let prevPos = null;
let planeAltitude = 0;
let targetAltitude = 0;
let curAircraft = AIRCRAFT[1]; // default Boeing 747

// ── AIRCRAFT SELECTOR ──
function openAircraftSelector() {
  let html = '<button class="mcl" onclick="closeModal()">\u2715</button>';
  html += '<div class="mh">\u2708 SELECT AIRCRAFT</div>';
  AIRCRAFT.forEach(ac => {
    const isCur = curAircraft.id === ac.id;
    html += '<div style="padding:8px;margin:4px 0;border:2px solid ' + (isCur ? ac.color : 'rgba(0,255,65,0.15)') + ';border-radius:4px;cursor:pointer;background:' + (isCur ? 'rgba(255,255,255,0.05)' : 'transparent') + '" onclick="selectAircraft(\'' + ac.id + '\')">';
    html += '<div style="font-family:\'Press Start 2P\',monospace;font-size:.3rem;color:' + ac.color + '">' + ac.name + '</div>';
    html += '<div style="font-family:VT323,monospace;font-size:.9rem;color:rgba(0,255,65,0.6)">' + ac.desc + ' \u00B7 ' + ac.kmh + ' km/h</div>';
    html += '</div>';
  });
  document.getElementById('MB').innerHTML = html;
  document.getElementById('MO').classList.add('open');
}

function selectAircraft(id) {
  curAircraft = AIRCRAFT.find(a => a.id === id) || AIRCRAFT[1];
  closeModal();
  document.getElementById('SPD').innerHTML = '\u2708<br>' + curAircraft.kmh + ' km/h';
  showToast('\u2708 ' + curAircraft.name + ' \u2014 ' + curAircraft.desc, curAircraft.color);
}

// ── AIRPORTS ──
async function flyLoadAirports() {
  airports = [];
  showToast('\u2708 Loading airports...', '#00bfff');
  try {
    const bbox = (G.pos.lat - 4) + ',' + (G.pos.lng - 6) + ',' + (G.pos.lat + 4) + ',' + (G.pos.lng + 6);
    const q = '[out:json][timeout:20];(node["aeroway"="aerodrome"]('+bbox+');way["aeroway"="aerodrome"]('+bbox+'););out center body;';
    const data = await overpassQuery(q);
    airports = data.elements.map(e => ({
      lat: e.lat || e.center?.lat, lon: e.lon || e.center?.lon,
      name: e.tags?.name || 'Airport', iata: e.tags?.iata || '', icao: e.tags?.icao || ''
    })).filter(a => a.lat && a.lon);
    showToast('\u2708 ' + airports.length + ' airports!', '#00bfff');
  } catch (e) { showToast('Airport data unavailable', '#ff4444'); }
}

// ── FLIGHTS ──
function toggleFlights() {
  showFlights = !showFlights;
  const fb = document.getElementById('flightBtn'), fp = document.getElementById('FP');
  const ov = document.getElementById('ov-flights');
  if (ov) ov.checked = showFlights;
  if (showFlights) { fb.style.background = '#00bfff'; fb.style.color = '#000'; fp.classList.add('show'); fetchFlights(); flightInt = setInterval(fetchFlights, 15000); }
  else { fb.style.cssText = ''; fp.classList.remove('show'); clearInterval(flightInt); flights = []; document.getElementById('SF').textContent = '0'; }
}

async function fetchFlights() {
  const pad = getZoom().z >= 9 ? 0 : 1;
  try {
    const res = await fetch('https://opensky-network.org/api/states/all?lamin='+(G.pos.lat-5-pad)+'&lomin='+(G.pos.lng-8-pad)+'&lamax='+(G.pos.lat+5+pad)+'&lomax='+(G.pos.lng+8+pad));
    const data = await res.json();
    const st = (data.states || []).slice(0, 80);
    flights = st.map(s => ({ icao:s[0], callsign:(s[1]||'').trim(), country:s[2], lon:s[5], lat:s[6], altitude:s[7], onGround:s[8], velocity:s[9], heading:s[10] }));
    document.getElementById('SF').textContent = flights.length;
    const rows = flights.slice(0,12).map(f => {
      const alt = f.altitude ? Math.round(f.altitude*3.281) : '?';
      const spd = f.velocity ? Math.round(f.velocity*3.6) : '?';
      return '<div class="fpflight"><span>'+(f.onGround?'\u{1F6E9}':'\u2708')+' '+(f.callsign||f.icao||'???')+'</span><span style="color:rgba(0,191,255,0.4)">'+alt+'ft '+spd+'km/h</span></div>';
    });
    const gr = flights.filter(f => f.onGround).length;
    document.getElementById('FL').innerHTML = (rows.join('')||'<div style="color:rgba(0,191,255,0.3);padding:6px">No flights</div>') +
      '<div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(0,191,255,0.12);font-size:.72rem;color:rgba(0,191,255,0.35)">\u2708 '+(flights.length-gr)+' airborne \u00B7 \u{1F6E9} '+gr+' grounded</div>';
  } catch (e) { document.getElementById('FL').innerHTML = '<div style="color:#ff4444;font-size:.82rem">OpenSky offline</div>'; }
}

// ── DRAW ──
function drawFlights() {
  if (!showFlights) return;
  flights.forEach(f => {
    if (!f.lat || !f.lon) return;
    const s = worldToScreen(f.lat, f.lon);
    if (s.x < -30 || s.x > cv.width + 30 || s.y < -30 || s.y > cv.height + 30) return;
    ctx.save(); ctx.translate(s.x, s.y);
    if (f.heading) ctx.rotate((f.heading - 90) * Math.PI / 180);
    ctx.globalAlpha = f.onGround ? 0.4 : 1;
    ctx.fillStyle = '#00bfff';
    if (!f.onGround) { ctx.shadowColor = '#00bfff'; ctx.shadowBlur = 6; }
    ctx.font = (f.onGround ? '14' : '16') + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u2708', 0, 0); ctx.shadowBlur = 0; ctx.restore();
    if (getZoom().z >= 9 && f.callsign) { ctx.fillStyle = 'rgba(0,191,255,0.5)'; ctx.font = "7px 'VT323',monospace"; ctx.textAlign = 'center'; ctx.fillText(f.callsign, s.x, s.y + 12); }
  });
}

function drawAirports() {
  if (G.veh !== 'plane' || !G.overlays.transit) return;
  const z = getZoom().z;
  airports.forEach(ap => {
    const s = worldToScreen(ap.lat, ap.lon);
    if (s.x < -100 || s.x > cv.width + 100 || s.y < -40 || s.y > cv.height + 40) return;
    ctx.fillStyle = 'rgba(0,191,255,0.12)'; ctx.fillRect(s.x - 30, s.y - 2, 60, 4);
    const ts = z >= 11 ? 10 : 7;
    ctx.fillStyle = 'rgba(0,191,255,0.25)'; ctx.fillRect(s.x - ts, s.y - ts, ts * 2, ts * 2);
    ctx.strokeStyle = '#00bfff'; ctx.lineWidth = 2; ctx.strokeRect(s.x - ts, s.y - ts, ts * 2, ts * 2);
    ctx.fillStyle = '#00bfff'; ctx.font = "bold " + (z >= 11 ? '11' : '9') + "px 'VT323',monospace"; ctx.textAlign = 'center';
    ctx.fillText('\u2708 ' + (ap.iata || ap.icao || ap.name), s.x, s.y - ts - 4);
    const d = haversine(G.pos.lat, G.pos.lng, ap.lat, ap.lon);
    ctx.fillStyle = 'rgba(0,191,255,0.35)'; ctx.font = "8px 'VT323',monospace"; ctx.fillText(d.toFixed(1) + ' km', s.x, s.y + ts + 10);
    if (d < 3) { ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(s.x, s.y, ts + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  });
}

// ── PROXIMITY + BOARDING ──
function checkAirportProximity() {
  if (G.veh !== 'plane') { nearAirport = null; return; }
  nearAirport = null;
  airports.forEach(ap => { if (haversine(G.pos.lat, G.pos.lng, ap.lat, ap.lon) < 3) nearAirport = ap; });
  const ind = document.getElementById('airInd'), bb = document.getElementById('boardBtn'), lb = document.getElementById('landBtn');
  if (nearAirport && !planeAirborne) { ind.style.display = 'block'; ind.innerHTML = '\u2708 AT ' + (nearAirport.iata || nearAirport.name) + ' \u2014 BOARD'; bb.style.display = 'inline-block'; lb.style.display = 'none'; }
  else if (nearAirport && planeAirborne) { ind.style.display = 'block'; ind.innerHTML = '\u2708 NEAR ' + (nearAirport.iata || nearAirport.name) + ' \u2014 LAND'; bb.style.display = 'none'; lb.style.display = 'inline-block'; }
  else { ind.style.display = 'none'; bb.style.display = 'none'; lb.style.display = 'none'; }
}

function boardPlane() {
  if (!nearAirport) { showToast('Get to an airport!', '#ff4444'); return; }
  planeAirborne = true; targetAltitude = 35000;
  showToast('\u2708 ' + curAircraft.name + ' TAKEOFF from ' + (nearAirport.iata || nearAirport.name) + '!', curAircraft.color);
  if (G.zoomIdx > 4) { G.zoomIdx = 4; updateZoomUI(); }
}

function landPlane() {
  if (!nearAirport) { showToast('Fly to an airport!', '#ff4444'); return; }
  planeAirborne = false; targetAltitude = 0;
  showToast('\u2708 Landed at ' + (nearAirport.iata || nearAirport.name) + '!', '#ffe600');
  G.zoomIdx = 6; updateZoomUI();
}

// ── PHYSICS ──
function flyUpdatePhysics() {
  if (prevPos) {
    const dLat = G.pos.lat - prevPos.lat, dLng = G.pos.lng - prevPos.lng;
    if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
      planeHeading = Math.atan2(dLng, dLat) * 180 / Math.PI;
    }
  }
  prevPos = { lat: G.pos.lat, lng: G.pos.lng };
  planeAltitude += (targetAltitude - planeAltitude) * 0.02;
  if (!planeAirborne && planeAltitude < 10) planeAltitude = 0;
}

function flyClear() {
  airports = []; flights = []; planeAirborne = false; nearAirport = null; planeAltitude = 0; targetAltitude = 0;
  document.getElementById('airInd').style.display = 'none';
  document.getElementById('boardBtn').style.display = 'none';
  document.getElementById('landBtn').style.display = 'none';
}
