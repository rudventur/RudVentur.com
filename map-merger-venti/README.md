# ArtSpace City

An interactive map-based exploration game where you navigate the world in 9 different vehicles, discover artist communities, and visualize creative networks — all rendered on HTML5 Canvas with a retro-futuristic terminal aesthetic.

Built by [RudVentur](https://rudventur.com) — part of the RudVentur creative web universe.

---

## What Is This?

ArtSpace City merges an explorable global map with multiple transportation modes, real-world weather data, and an art community network. Pin art spaces, connect offers and seeks with "conspiracy strings", and cruise from London to Tokyo in a train, boat, plane, or UFO.

---

## Features

### 9 Vehicle Modes
- **Walk** — 5 km/h, basic movement
- **Bike** — 4 variants (Road, Mountain, Trike, E-Bike), 15–28 km/h
- **Scooter** — 35 km/h
- **Car** — 8 variants (Hatchback to Supercar), fuel system, road snapping, petrol stations
- **Bus** — 45 km/h with route stops
- **Train** — 6 variants (Regional to Maglev, up to 600 km/h), track snapping with gap-jumping
- **Boat** — 4 variants (Dinghy to Speedboat), water boundary enforcement
- **Plane** — 13 aircraft (Cessna to SR-71), altitude control, 50+ hardcoded airports, approach mode
- **UFO** — ∞ km/h, conspiracy mode with art network visualization

### Map & Layers
- 5 base tile layers (CartoDB Dark, OpenStreetMap, OpenTopoMap, Watercolor, ArcGIS Satellite)
- Smooth fractional zoom (levels 2–19)
- Coordinate grid, compass, overlays toggle
- OpenRailwayMap overlay for train mode

### Real-World Data
- **Weather** — Open-Meteo (clouds, rain, snow, fog, wind, temperature)
- **Lightning** — Blitzortung WebSocket with distance-based thunder synthesis
- **Rain Radar** — RainViewer precipitation overlay
- **Search** — Nominatim (OSM) city/place lookup
- **Infrastructure** — Overpass API for railways, roads, water bodies, bus stops, petrol stations

### Art Network
- Pin art spaces with offer/seek types (Print, Ceramics, Darkroom, Wood, Textile, etc.)
- Exchange types: Free, Swap, Donation, Skills
- Red "conspiracy strings" connecting compatible offers and seeks
- User comments dropped as map notes
- UFO mode: draw custom strings, auto-matching connections panel

---

## Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move | Arrow keys / WASD | D-Pad buttons |
| Zoom In | `+` / `=` | Zoom slider / Pinch |
| Zoom Out | `-` | Zoom slider / Pinch |
| Search | Enter (in search input) | GO button |
| Close modals | Escape | — |

Vehicle switching, layers, pins, and other features are accessed via the HUD buttons.

---

## Tech Stack

- **Rendering**: HTML5 Canvas, vanilla JavaScript (~230 KB JS total)
- **Map Tiles**: Web Mercator projection with custom tile loading/caching (LRU, 600 tiles max)
- **Styling**: CSS3 with retro terminal aesthetic (VT323 + Press Start 2P fonts)
- **Audio**: Web Audio API (thunder synthesis)
- **No frameworks, no build step** — runs directly from static files

### External APIs

| Service | Purpose | Auth Required |
|---------|---------|---------------|
| Nominatim (OSM) | City/place search | No (User-Agent header) |
| Overpass API | Railways, roads, water, amenities | No (rate-limited) |
| Open-Meteo | Real-time weather | No |
| Blitzortung | Live lightning strikes | No |
| RainViewer | Rain radar tiles | No |
| CartoDB / OSM / TopoMap / ArcGIS | Base map tiles | No |

---

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | UI layout — HUD, buttons, modals, vehicle bar, panels |
| `game.js` | Main loop, canvas setup, controls, movement physics |
| `config.js` | Vehicle definitions, aircraft fleet, countries, demo art spaces, tile URLs |
| `ui.js` | Layers menu, zoom system, country selector, grid, compass, conspiracy strings |
| `tiles.js` | Tile loading/caching, Web Mercator math, coordinate conversions |
| `utils.js` | Helpers — haversine distance, toasts, color pickers, Overpass rate limiter |
| `player.js` | Player sprite routing per vehicle mode |
| `car.js` | Car variants, roads, fuel system, petrol stations, road snapping |
| `train.js` | Train variants, railways, stations, track snapping |
| `bike.js` | Bike variants, animated sprites |
| `boat.js` | Boat variants, water body detection, water boundaries |
| `mode-plane.js` | Aircraft fleet, airports, flight tracking, altitude, Blitzortung, thunder |
| `mode-ufo.js` | UFO atmosphere, user-drawn strings, auto-matching, notebook |
| `mode-train.js` | Train atmosphere — clouds, sunshine, rain, parallax trees |
| `weather.js` | Open-Meteo fetch, rain/snow particles, cloud overlay, fog, lightning |

---

## Running

Open `index.html` in a browser. No build step or server required.

For local development with live reload:
```bash
npx serve .
```

---

## Architecture

- **Global state object `G`** centralizes game state (position, zoom, vehicle, overlays, listings)
- **Render pipeline** draws ordered layers each frame: tiles → overlays → infrastructure → pins → effects → player → compass
- **Player always centered** — the world pans around the player at `(canvas.width/2, canvas.height/2)`
- **Vehicle mode dispatch** — each vehicle has its own data loader and movement constraints
- **Overpass rate limiter** — 3-second minimum gap between API requests to avoid 429 errors

---

*Built by [RudVentur](https://rudventur.com)*
