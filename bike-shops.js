// To add a shop: add a line here. Logo = file in embed/bike-logos/, the emoji shows if it is missing.
var SHOPS = [
  ['compton', 'Compton Cycles', 'https://comptoncycles.co.uk/', '🚲', 'Catford, South East London — first in the list'],
  ['evans', 'Evans Cycles', 'https://www.evanscycles.com/', '🚴', 'Stores nationwide, United Kingdom'],
  ['halfords', 'Halfords', 'https://www.halfords.com/', '🔧', 'Largest bike retailer in the United Kingdom'],
  ['tredz', 'Tredz', 'https://www.tredz.co.uk/', '🚵', 'Online bike experts, United Kingdom'],
  ['leisurelakes', 'Leisure Lakes Bikes', 'https://www.leisurelakesbikes.com/', '🏞️', 'Stores across England'],
  ['sigma', 'Sigma Sports', 'https://www.sigmasports.com/', '🏁', 'Premium road and triathlon, United Kingdom'],
  ['rutland', 'Rutland Cycling', 'https://www.rutlandcycling.com/', '🚲', 'Stores across England'],
  ['rose', 'Rose Bikes', 'https://www.rosebikes.com/', '🌹', 'Germany — ships across Europe']
];
var list = document.getElementById('list');
SHOPS.forEach(function (s, i) {
  var a = document.createElement('a');
  a.className = 'shop' + (i ? '' : ' first'); a.href = s[2]; a.target = '_blank'; a.rel = 'noopener noreferrer';
  var l = document.createElement('span'); l.className = 'logo';
  var img = new Image(); img.alt = ''; img.src = 'embed/bike-logos/' + s[0] + '.png';
  img.onerror = function () { l.textContent = s[3]; };
  l.appendChild(img);
  var t = document.createElement('span');
  var n = document.createElement('div'); n.className = 'name'; n.textContent = s[1] + ' ↗';
  var d = document.createElement('div'); d.className = 'note'; d.textContent = s[4];
  t.appendChild(n); t.appendChild(d); a.appendChild(l); a.appendChild(t); list.appendChild(a);
});

var map = L.map('map').setView([51.445, -0.02], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
var layer = L.layerGroup().addTo(map), st = document.getElementById('status'), busy = false;
var bikeIcon = L.divIcon({ html: '<span style="font-size:22px">🚲</span>', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
function esc(x) { return String(x).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
function osmLink() {
  var c = map.getCenter();
  return '<a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/#map=' + map.getZoom() + '/' + c.lat.toFixed(4) + '/' + c.lng.toFixed(4) + '">Open OpenStreetMap ↗</a>';
}
function popup(g) {
  var h = '<b>' + esc(g.name || 'Bike shop (no name listed)') + '</b>';
  if (g['addr:street']) h += '<br>' + esc((g['addr:housenumber'] || '') + ' ' + g['addr:street'] + (g['addr:postcode'] ? ', ' + g['addr:postcode'] : ''));
  h += '<br>🕒 ' + esc(g.opening_hours || 'hours not listed');
  var ph = g.phone || g['contact:phone'];
  h += '<br>📞 ' + (ph ? '<a href="tel:' + esc(ph.replace(/\s/g, '')) + '">' + esc(ph) + '</a>' : 'not listed');
  var w = g.website || g['contact:website'];
  if (w && /^https?:\/\//.test(w)) h += '<br>🌐 <a target="_blank" rel="noopener noreferrer" href="' + esc(w) + '">website ↗</a>';
  return h;
}

// Live shops: OpenStreetMap Overpass (shop = bicycle), with a second server if the first is down
var OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
function search() {
  if (busy) return;
  if (map.getZoom() < 11) { st.textContent = 'Zoom in to town level to search for bike shops.'; return; }
  busy = true; st.textContent = '🔎 Looking for bike shops…';
  var b = map.getBounds();
  var bb = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map(function (n) { return n.toFixed(4); }).join(',');
  var q = '[out:json][timeout:25];nwr["shop"="bicycle"](' + bb + ');out center 300;';
  tryAt(0, q);
}
function tryAt(i, q) {
  fetch(OVERPASS[i], { method: 'POST', body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (j) {
      layer.clearLayers();
      j.elements.forEach(function (e) {
        var lat = e.lat || (e.center && e.center.lat), lon = e.lon || (e.center && e.center.lon);
        if (lat) L.marker([lat, lon], { icon: bikeIcon }).bindPopup(popup(e.tags || {})).addTo(layer);
      });
      st.innerHTML = '🚲 ' + j.elements.length + ' bike shops in this view. ' + osmLink();
      busy = false;
    })
    .catch(function () {
      if (i + 1 < OVERPASS.length) return tryAt(i + 1, q);
      st.innerHTML = '⚠️ The OpenStreetMap shop service is busy or offline. Try again in a minute. ' + osmLink();
      busy = false;
    });
}
document.getElementById('here').onclick = search;
document.getElementById('go').onclick = find;
document.getElementById('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') find(); });
if (location.hash === '#map') document.getElementById('mapbox').scrollIntoView();
search();
// Near me: asks the browser, only when the button is pressed
document.getElementById('me').onclick = function () {
  if (!navigator.geolocation) { st.textContent = 'This browser cannot share a location.'; return; }
  navigator.geolocation.getCurrentPosition(function (p) {
    map.setView([p.coords.latitude, p.coords.longitude], 14); search();
  }, function () { st.textContent = 'Location not shared, so type a town instead.'; });
};
function gotPlace(j) {
  if (!j.length) { st.textContent = 'Place not found.'; return; }
  map.setView([+j[0].lat, +j[0].lon], 14);
  search();
}
function getJSON(href, ok, bad) {
  var x = new XMLHttpRequest();
  x.open('GET', href);
  x.onload = function () { try { ok(JSON.parse(x.responseText)); } catch (e) { bad(); } };
  x.onerror = bad;
  x.send();
}
var GEO = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=';
function find() {
  var v = document.getElementById('q').value.trim();
  if (!v) return;
  st.textContent = 'Finding ' + v;
  getJSON(GEO + encodeURIComponent(v), gotPlace, placeDown);
}
function placeDown() { st.textContent = 'Place search is offline right now.'; }
