// ═══════════════════════════════════════════════════════════════
//  tiles.js — Slippy map tile rendering on canvas
// ═══════════════════════════════════════════════════════════════

const tileCache = {};
const TILE_SIZE = 256;

function lon2tile(lon, z) { return ((lon + 180) / 360) * Math.pow(2, z); }
function lat2tile(lat, z) { return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z); }
function tile2lon(x, z) { return x / Math.pow(2, z) * 360 - 180; }
function tile2lat(y, z) { const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }

function loadTile(x, y, z, urlTemplate) {
  const key = urlTemplate.slice(0, 20) + ':' + z + ':' + x + ':' + y;
  if (tileCache[key]) return tileCache[key];
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = urlTemplate.replace('{z}', z).replace('{x}', x).replace('{y}', y);
  img._loaded = false;
  img._failed = false;
  img.onload = () => { img._loaded = true; };
  img.onerror = () => { img._failed = true; };
  tileCache[key] = img;
  // Limit cache size
  const ks = Object.keys(tileCache);
  if (ks.length > 600) {
    for (let i = 0; i < 120; i++) delete tileCache[ks[i]];
  }
  return img;
}

// Draw base map tiles
function drawTiles() {
  const z = getZoom().z;
  const cx = lon2tile(G.pos.lng, z), cy = lat2tile(G.pos.lat, z);
  const tw = Math.ceil(cv.width / TILE_SIZE) + 2;
  const th = Math.ceil(cv.height / TILE_SIZE) + 2;
  const sx = Math.floor(cx - tw / 2), sy = Math.floor(cy - th / 2);
  const maxT = Math.pow(2, z);

  for (let dy = 0; dy < th; dy++) {
    for (let dx = 0; dx < tw; dx++) {
      const tx = sx + dx, ty = sy + dy;
      if (ty < 0 || ty >= maxT) continue;
      const wtx = ((tx % maxT) + maxT) % maxT;
      const px = cv.width / 2 + (tx - cx) * TILE_SIZE;
      const py = cv.height / 2 + (ty - cy) * TILE_SIZE;

      const tile = loadTile(wtx, ty, z, TILE_URLS[G.curTileLayer]);
      if (tile._loaded) {
        ctx.drawImage(tile, Math.floor(px), Math.floor(py), TILE_SIZE + 1, TILE_SIZE + 1);
      } else if (!tile._failed) {
        ctx.fillStyle = G.curTileLayer === 'dark' ? '#1a1a2e' : '#ddd';
        ctx.fillRect(Math.floor(px), Math.floor(py), TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// Draw OpenRailwayMap overlay tiles (for train mode)
function drawRailTileOverlay() {
  if (G.veh !== 'train' || !G.overlays.transit) return;
  const z = getZoom().z;
  if (z < 5) return; // too zoomed out for rail tiles

  const cx = lon2tile(G.pos.lng, z), cy = lat2tile(G.pos.lat, z);
  const tw = Math.ceil(cv.width / TILE_SIZE) + 2;
  const th = Math.ceil(cv.height / TILE_SIZE) + 2;
  const sx = Math.floor(cx - tw / 2), sy = Math.floor(cy - th / 2);
  const maxT = Math.pow(2, z);

  for (let dy = 0; dy < th; dy++) {
    for (let dx = 0; dx < tw; dx++) {
      const tx = sx + dx, ty = sy + dy;
      if (ty < 0 || ty >= maxT) continue;
      const wtx = ((tx % maxT) + maxT) % maxT;
      const px = cv.width / 2 + (tx - cx) * TILE_SIZE;
      const py = cv.height / 2 + (ty - cy) * TILE_SIZE;

      const tile = loadTile(wtx, ty, z, RAIL_TILE_URL);
      if (tile._loaded) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(tile, Math.floor(px), Math.floor(py), TILE_SIZE + 1, TILE_SIZE + 1);
        ctx.globalAlpha = 1.0;
      }
    }
  }
}

// Coordinate transforms
function worldToScreen(lat, lng) {
  const z = getZoom().z;
  const cx = lon2tile(G.pos.lng, z) * TILE_SIZE;
  const cy = lat2tile(G.pos.lat, z) * TILE_SIZE;
  return {
    x: cv.width / 2 + (lon2tile(lng, z) * TILE_SIZE - cx),
    y: cv.height / 2 + (lat2tile(lat, z) * TILE_SIZE - cy)
  };
}

function screenToWorld(sx, sy) {
  const z = getZoom().z;
  const cx = lon2tile(G.pos.lng, z);
  const cy = lat2tile(G.pos.lat, z);
  return {
    lat: tile2lat(cy + (sy - cv.height / 2) / TILE_SIZE, z),
    lng: tile2lon(cx + (sx - cv.width / 2) / TILE_SIZE, z)
  };
}
