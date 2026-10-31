/* rvDesk.js — the Windows 13 desktop for the RUDVENTUR hub.

   Drop-in (after rvView.js):
     <script src="embed/rvDesk.js" defer></script>

   Puts the Windows 13 layout straight onto the page (no ENTER screen):
     top-left      RUDVENTUR notch menu (maps, weather and stuff with icons, a Directory of
                   real European organisations with their logos, view modes, Ko-fi)
     top-right     the R circle + useRbox (embed/useRbox.js; not built here)
     bottom-left   ⌨️ Keyboards, 💬 Global Chat
     bottom-right  🍿 PB1 opens the Popcorn Hub (PB2 + pix describer inside);
                   PB2 in the hub opens the bunker (embed/popcornWindow.js)
     bottom-middle taskbar: 🎃 start button, one button per open window, clock

   Services open in floating windows (drag the title bar, resize from the
   corner, ⛶ = full screen, _ = minimise to the taskbar, ↗ = real tab, ✕).
   On phones windows open full size. Sites that refuse to be shown inside
   another page (Ko-fi, Zoom Earth) open as a real tab instead.

   Popcorn window full screen choices (also in the notch menu's VIEW group and
   the home page logo menu): rvDesk.popcorn('max' | 'fullscreen' | 'camera' |
   'normal'). On wide, short screens (panoramic) the popcorn window opens
   filling the height. The Popcorn Hub inside asks for 'max' / 'normal' itself
   with a message { type: 'rudventur-popcorn-view', mode } (same site only).
*/
(function () {
  'use strict';
  if (window.rvDesk) return;

  var scriptEl = document.currentScript;
  // services are listed relative to the hub root (the folder above embed/)
  var HUB = scriptEl ? new URL('..', scriptEl.src).href : new URL('./', location.href).href;
  function url(u) { return new URL(u, HUB).href; }

  var APPS = {
    // the keyboard and chat buttons open the one translator, at the keyboard or at the Chat tab
    keyboard:   { icon: '⌨️', title: 'World Keyboards (in the translator)', via: 'translator', msg: { tab: 'translate', keyboard: true }, query: 'keyboard=1' },
    chat:       { icon: '💬', title: 'Global Chat (in the translator)', via: 'translator', msg: { tab: 'chat' }, query: 'tab=chat' },
    popcorn:    { icon: '🍿', title: 'Popcorn Hub', src: 'bottom-right-popcorn-complete.html?v=20261018-3', w: 600, h: 760, fit: true },
    mapmerger:  { icon: '🗺️', title: 'Map Merger Venti', src: 'https://rudventur.github.io/map-merger-venti/', w: 1000, h: 680 },
    translator: { icon: '🌐', title: 'Translator, chat and keyboards', src: 'https://rudventur.github.io/map-merger-venti/translator_v7.html', w: 1000, h: 680 },
    snout:      { icon: '🐾', title: 'Snout First', src: 'https://rudventur.github.io/map-merger-venti/snout-first.html', w: 900, h: 680 },
    weather:    { icon: '🌦️', title: 'Weather News', src: 'yesterday-today-tomorrow-weather.html', w: 720, h: 640 },
    ventusky:   { icon: '🌬️', title: 'Ventusky', src: 'https://www.ventusky.com/', w: 1000, h: 680 },
    windy:      { icon: '💨', title: 'Windy', src: 'https://embed.windy.com/embed.html?type=map&zoom=4&overlay=wind', w: 1000, h: 680 },
    blitz:      { icon: '⚡', title: 'Blitzortung', src: 'https://map.blitzortung.org/', w: 1000, h: 680 },
    nullschool: { icon: '🌍', title: 'Nullschool Earth', src: 'https://earth.nullschool.net/', w: 1000, h: 680 },
    zoomearth:  { icon: '🛰️', title: 'Zoom Earth', src: 'https://zoom.earth/', tab: true },
    social:     { icon: '🎸', title: 'RudVentur Social', src: 'https://rudventur.github.io/punk-script/', w: 760, h: 680 },
    bank:       { icon: '💰', title: 'Bank / Ledger', src: 'https://rudventur.github.io/bank/', w: 900, h: 700 },
    vault:      { icon: '🍿', title: 'FAKE popCornCoin Wallet', src: 'popcoin/', w: 560, h: 760 },
    win13:      { icon: '🪟', title: 'WINDOWS 13', src: 'https://rudventur.github.io/windows13/WINDOWS13-MASTER.html', tab: true },
    luxwin:     { icon: '🐧', title: 'LuxWin13', src: 'https://rudventur.github.io/LuxWin13/', tab: true },
    chemmulti:  { icon: '⚗️', title: 'ChemVentur Multi v118', src: 'https://rudventur.github.io/ChemVentur-Multi-v118/', w: 1100, h: 720 },
    chem:       { icon: '🧬', title: 'ChemVentur (classic)', src: 'ChemVentur/index.html', w: 1100, h: 720 },
    typegame:   { icon: '⌨️', title: 'Type Game', src: 'https://rudventur.github.io/punk-script/type-game.html', w: 1000, h: 700 },
    kofi:       { icon: '☕', title: 'Ko-fi', src: 'https://ko-fi.com/rudventur', tab: true }
  };
  // The notch menu: RUDVENTUR's own maps, weather and other things open in floating windows.
  var MENU = [
    ['🗺️ MAPS', ['mapmerger', 'snout', 'translator', 'nullschool', 'zoomearth']],
    ['🌦️ WEATHER', ['weather', 'ventusky', 'windy', 'blitz']],
    ['🧰 STUFF', ['social', 'chat', 'keyboard', 'bank', 'vault', 'popcorn', 'win13', 'luxwin', 'chemmulti', 'typegame']]
  ];
  // Directory: real organisations, checked by hand, each opening its own homepage in a new tab.
  // Logos are each organisation's own site icon, saved in embed/logos; the emoji shows if a logo is missing.
  var DIRECTORY = [
 {
  "country": "Across Europe",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\"2\" fill=\"#003399\"/><circle cx=\"1.500\" cy=\"0.400\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"1.800\" cy=\"0.480\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"2.020\" cy=\"0.700\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"2.100\" cy=\"1.000\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"2.020\" cy=\"1.300\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"1.800\" cy=\"1.520\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"1.500\" cy=\"1.600\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"1.200\" cy=\"1.520\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"0.980\" cy=\"1.300\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"0.900\" cy=\"1.000\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"0.980\" cy=\"0.700\" r=\".07\" fill=\"#FFCC00\"/><circle cx=\"1.200\" cy=\"0.480\" r=\".07\" fill=\"#FFCC00\"/></svg>",
  "orgs": [
   {
    "name": "OpenStreetMap",
    "url": "https://www.openstreetmap.org/",
    "icon": "🗺️",
    "what": "Free world map data",
    "logo": "logos/osm.png"
   },
   {
    "name": "European Food Banks Federation",
    "url": "https://www.eurofoodbank.org/",
    "icon": "🥫",
    "what": "Food banks across Europe",
    "logo": "logos/eurofoodbank.png"
   },
   {
    "name": "Eurogroup for Animals",
    "url": "https://www.eurogroupforanimals.org/",
    "icon": "🐾",
    "what": "Animal welfare across Europe",
    "logo": "logos/eurogroup.png"
   },
   {
    "name": "Europetnet",
    "url": "https://europetnet.org/",
    "icon": "🔎",
    "what": "Lost pet microchip search across Europe",
    "logo": "logos/europetnet.png"
   }
  ]
 },
 {
  "country": "United Kingdom",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\"2\" fill=\"#012169\"/><path d=\"M0,0L3,2M3,0L0,2\" stroke=\"#fff\" stroke-width=\".4\"/><path d=\"M0,0L3,2M3,0L0,2\" stroke=\"#C8102E\" stroke-width=\".15\"/><path d=\"M1.5,0V2M0,1H3\" stroke=\"#fff\" stroke-width=\".6\"/><path d=\"M1.5,0V2M0,1H3\" stroke=\"#C8102E\" stroke-width=\".35\"/></svg>",
  "orgs": [
   {
    "name": "Royal Society for the Prevention of Cruelty to Animals",
    "url": "https://www.rspca.org.uk/",
    "icon": "🐾",
    "what": "Animal welfare",
    "logo": "logos/rspca.png"
   },
   {
    "name": "Dogs Trust",
    "url": "https://www.dogstrust.org.uk/",
    "icon": "🐕",
    "what": "Dog welfare and rehoming",
    "logo": "logos/dogstrust.png"
   },
   {
    "name": "Blue Cross",
    "url": "https://www.bluecross.org.uk/",
    "icon": "🐾",
    "what": "Pet charity and pet food banks",
    "logo": "logos/bluecross.png"
   },
   {
    "name": "The Trussell Trust",
    "url": "https://www.trussell.org.uk/",
    "icon": "🥫",
    "what": "Food banks",
    "logo": "logos/trussell.png"
   },
   {
    "name": "Vets Now",
    "url": "https://www.vetsnow.com/",
    "icon": "🏥",
    "what": "Emergency vets",
    "logo": ""
   },
   {
    "name": "Met Office",
    "url": "https://www.metoffice.gov.uk/",
    "icon": "🌦️",
    "what": "National weather service",
    "logo": "logos/metoffice.png"
   }
  ]
 },
 {
  "country": "Ireland",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"1\" height=\"2\" fill=\"#169B62\"/><rect x=\"1\" width=\"1\" height=\"2\" fill=\"#fff\"/><rect x=\"2\" width=\"1\" height=\"2\" fill=\"#FF883E\"/></svg>",
  "orgs": [
   {
    "name": "National Society for the Prevention of Cruelty to Animals",
    "url": "https://nspca.ie/",
    "icon": "🐾",
    "what": "Animal welfare",
    "logo": ""
   },
   {
    "name": "Dogs Trust Ireland",
    "url": "https://www.dogstrust.ie/",
    "icon": "🐕",
    "what": "Dog welfare and rehoming",
    "logo": "logos/dogstrustie.png"
   },
   {
    "name": "Met Éireann",
    "url": "https://www.met.ie/",
    "icon": "🌦️",
    "what": "National weather service",
    "logo": "logos/meteireann.png"
   }
  ]
 },
 {
  "country": "France",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"1\" height=\"2\" fill=\"#0055A4\"/><rect x=\"1\" width=\"1\" height=\"2\" fill=\"#fff\"/><rect x=\"2\" width=\"1\" height=\"2\" fill=\"#EF4135\"/></svg>",
  "orgs": [
   {
    "name": "Société Protectrice des Animaux",
    "url": "https://www.la-spa.fr/",
    "icon": "🐾",
    "what": "Animal protection society",
    "logo": "logos/spa.png"
   },
   {
    "name": "Les Restos du Cœur",
    "url": "https://www.restosducoeur.org/",
    "icon": "🥫",
    "what": "Food aid",
    "logo": "logos/restos.png"
   },
   {
    "name": "Météo-France",
    "url": "https://meteofrance.com/",
    "icon": "🌦️",
    "what": "National weather service",
    "logo": "logos/meteofrance.png"
   }
  ]
 },
 {
  "country": "Germany",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\".667\" fill=\"#000\"/><rect y=\".667\" width=\"3\" height=\".667\" fill=\"#DD0000\"/><rect y=\"1.333\" width=\"3\" height=\".667\" fill=\"#FFCE00\"/></svg>",
  "orgs": [
   {
    "name": "Deutscher Tierschutzbund",
    "url": "https://www.tierschutzbund.de/",
    "icon": "🐾",
    "what": "German Animal Welfare Federation",
    "logo": "logos/tierschutzbund.png"
   },
   {
    "name": "Tasso",
    "url": "https://www.tasso.net/",
    "icon": "🔎",
    "what": "Pet registry and lost pets",
    "logo": "logos/tasso.png"
   },
   {
    "name": "Tafel Deutschland",
    "url": "https://www.tafel.de/",
    "icon": "🥫",
    "what": "Food banks",
    "logo": "logos/tafel.png"
   },
   {
    "name": "Deutscher Wetterdienst",
    "url": "https://www.dwd.de/",
    "icon": "🌦️",
    "what": "National weather service",
    "logo": "logos/dwd.png"
   }
  ]
 },
 {
  "country": "Spain",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\"2\" fill=\"#AA151B\"/><rect y=\".5\" width=\"3\" height=\"1\" fill=\"#F1BF00\"/></svg>",
  "orgs": [
   {
    "name": "El Refugio",
    "url": "https://elrefugio.org/",
    "icon": "🐾",
    "what": "Animal shelter and protection",
    "logo": "logos/elrefugio.png"
   },
   {
    "name": "Federación Española de Bancos de Alimentos",
    "url": "https://fesbal.org/",
    "icon": "🥫",
    "what": "Spanish Federation of Food Banks",
    "logo": "logos/fesbal.png"
   },
   {
    "name": "Agencia Estatal de Meteorología",
    "url": "https://www.aemet.es/",
    "icon": "🌦️",
    "what": "National weather agency",
    "logo": "logos/aemet.png"
   }
  ]
 },
 {
  "country": "Italy",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"1\" height=\"2\" fill=\"#009246\"/><rect x=\"1\" width=\"1\" height=\"2\" fill=\"#fff\"/><rect x=\"2\" width=\"1\" height=\"2\" fill=\"#CE2B37\"/></svg>",
  "orgs": [
   {
    "name": "Ente Nazionale Protezione Animali",
    "url": "https://enpa.org/",
    "icon": "🐾",
    "what": "National Animal Protection Agency",
    "logo": "logos/enpa.png"
   },
   {
    "name": "Fondazione Banco Alimentare",
    "url": "https://www.bancoalimentare.it/",
    "icon": "🥫",
    "what": "Food bank foundation",
    "logo": "logos/banco.png"
   }
  ]
 },
 {
  "country": "Netherlands",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\".667\" fill=\"#AE1C28\"/><rect y=\".667\" width=\"3\" height=\".667\" fill=\"#fff\"/><rect y=\"1.333\" width=\"3\" height=\".667\" fill=\"#21468B\"/></svg>",
  "orgs": [
   {
    "name": "Dierenbescherming",
    "url": "https://www.dierenbescherming.nl/",
    "icon": "🐾",
    "what": "Dutch Society for the Protection of Animals",
    "logo": "logos/dierenbescherming.png"
   },
   {
    "name": "Amivedi",
    "url": "https://www.amivedi.nl/",
    "icon": "🔎",
    "what": "Lost and found pets",
    "logo": "logos/amivedi.png"
   },
   {
    "name": "Voedselbanken Nederland",
    "url": "https://voedselbankennederland.nl/",
    "icon": "🥫",
    "what": "Food banks",
    "logo": "logos/voedselbank.png"
   },
   {
    "name": "Koninklijk Nederlands Meteorologisch Instituut",
    "url": "https://www.knmi.nl/",
    "icon": "🌦️",
    "what": "Royal Netherlands Meteorological Institute",
    "logo": "logos/knmi.png"
   }
  ]
 },
 {
  "country": "Poland",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\"1\" fill=\"#fff\"/><rect y=\"1\" width=\"3\" height=\"1\" fill=\"#DC143C\"/></svg>",
  "orgs": [
   {
    "name": "OTOZ Animals",
    "url": "https://otoz.pl/",
    "icon": "🐾",
    "what": "Polish animal protection society",
    "logo": "logos/otoz.png"
   },
   {
    "name": "Banki Żywności",
    "url": "https://bankizywnosci.pl/",
    "icon": "🥫",
    "what": "Federation of Polish Food Banks",
    "logo": "logos/bankizywnosci.png"
   },
   {
    "name": "Instytut Meteorologii i Gospodarki Wodnej",
    "url": "https://imgw.pl/",
    "icon": "🌦️",
    "what": "Institute of Meteorology and Water Management",
    "logo": "logos/imgw.png"
   }
  ]
 },
 {
  "country": "Belgium",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"1\" height=\"2\" fill=\"#000\"/><rect x=\"1\" width=\"1\" height=\"2\" fill=\"#FDDA24\"/><rect x=\"2\" width=\"1\" height=\"2\" fill=\"#EF3340\"/></svg>",
  "orgs": [
   {
    "name": "Global Action in the Interest of Animals",
    "url": "https://www.gaia.be/",
    "icon": "🐾",
    "what": "Animal rights",
    "logo": ""
   },
   {
    "name": "Belgian Food Banks",
    "url": "https://www.foodbanks.be/",
    "icon": "🥫",
    "what": "Food banks",
    "logo": "logos/foodbanks.png"
   }
  ]
 },
 {
  "country": "Portugal",
  "flag": "<svg viewBox=\"0 0 3 2\" width=\"21\" height=\"14\" aria-hidden=\"true\"><rect width=\"3\" height=\"2\" fill=\"#FF0000\"/><rect width=\"1.2\" height=\"2\" fill=\"#006600\"/><circle cx=\"1.2\" cy=\"1\" r=\".4\" fill=\"#FFE600\"/></svg>",
  "orgs": [
   {
    "name": "Banco Alimentar Contra a Fome",
    "url": "https://www.bancoalimentar.pt/",
    "icon": "🥫",
    "what": "Food bank against hunger",
    "logo": "logos/bancoalimentar.png"
   },
   {
    "name": "Instituto Português do Mar e da Atmosfera",
    "url": "https://www.ipma.pt/",
    "icon": "🌦️",
    "what": "Portuguese Institute for Sea and Atmosphere",
    "logo": "logos/ipma.png"
   }
  ]
 }
];

  var CSS = [
    ':root{--rvd-neon:#00ff41;--rvd-yellow:#ffe600;--rvd-bg:#07090a}',
    // room for the taskbar and the round corner buttons above it, so the end of the page is never under them
    'body{padding-bottom:120px}',
    /* notch (top-left) */
    '#rvd-notch{position:fixed;top:10px;left:10px;z-index:1600;padding:7px 14px;background:#000;border:1px solid var(--rvd-neon);',
    'border-radius:0 0 12px 12px;color:var(--rvd-neon);font:900 13px/1 ui-monospace,monospace;letter-spacing:2px;cursor:pointer;',
    'box-shadow:0 0 12px rgba(0,255,65,.35);user-select:none}',
    '#rvd-notch:hover{background:#021a08}',
    '#rvd-menu{position:fixed;top:44px;left:10px;z-index:2000002;width:300px;max-height:calc(100vh - 110px);overflow-y:auto;',
    'background:#0b0d0e;border:1px solid #1f3a26;border-radius:10px;padding:6px;display:none;',
    'box-shadow:0 14px 40px rgba(0,0,0,.75);font:12px ui-monospace,monospace}',
    '#rvd-menu.open{display:block}',
    '#rvd-menu .rvd-mi{display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left;',
    'background:none;border:0;color:#cfe;font:inherit;letter-spacing:1px;padding:10px;border-radius:6px;cursor:pointer}',
    '#rvd-menu .rvd-mi:hover{background:rgba(0,255,65,.08);color:#fff}',
    "#rvd-menu .rvd-grp::after{content:'\\25B8';color:#4a6;transition:transform .2s}",
    '#rvd-menu .rvd-grp.open::after{transform:rotate(90deg)}',
    '#rvd-menu .rvd-sub{display:none;margin:0 0 4px 10px;border-left:1px solid #1f3a26;padding-left:4px}',
    '#rvd-menu .rvd-sub.open{display:block}',
    '#rvd-menu .rvd-sub .rvd-mi{color:#9ab;font-size:11px;padding:8px 10px}',
    '#rvd-menu .rvd-sep{border-top:1px solid #1f3a26;margin:5px 4px}',
    '#rvd-menu .rvd-gold{color:var(--rvd-yellow)}',
    '#rvd-menu .rvd-ico{display:inline-flex;width:22px;justify-content:center;flex:none;margin-right:6px}',
    '#rvd-menu .rvd-mi{justify-content:flex-start}#rvd-menu .rvd-grp{justify-content:space-between}',
    '#rvd-menu .rvd-lbl{flex:1;min-width:0;white-space:normal;overflow-wrap:anywhere}',
    '#rvd-menu .rvd-flag svg{display:block;border:1px solid #2a4;border-radius:2px}',
    '#rvd-menu a.rvd-org{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;color:#cfe;text-decoration:none;font-size:11px;line-height:1.3}',
    '#rvd-menu a.rvd-org:hover,#rvd-menu a.rvd-org:focus-visible{background:rgba(0,255,65,.08);color:#fff;outline:none}',
    '#rvd-menu .rvd-logo{width:20px;height:20px;flex:none;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:4px;overflow:hidden;font-size:13px}',
    '#rvd-menu .rvd-logo img{width:18px;height:18px;object-fit:contain}',
    '#rvd-menu .rvd-logo.emoji{background:#031a0a}',
    '#rvd-menu .rvd-what{display:block;color:#6a8;font-size:10px}',
    '#rvd-menu .rvd-note{color:#6a8;font-size:10px;padding:4px 8px 6px;line-height:1.4}',
    '@media (max-width:640px){#rvd-menu{width:calc(100vw - 20px);max-height:calc(100vh - 120px)}}',
    /* bottom corners */
    '.rvd-corner{position:fixed;bottom:62px;z-index:1600;display:flex;gap:8px}',
    '#rvd-bl{left:12px}#rvd-br{right:12px}',
    'html.rvp-open .rvd-corner{display:none}', /* the popcorn window has its own corners */
    '.rvd-cbtn{width:46px;height:46px;border-radius:50%;border:1px solid var(--rvd-neon);background:#000;font-size:21px;',
    'line-height:1;cursor:pointer;box-shadow:0 0 12px rgba(0,255,65,.35);padding:0;transition:transform .15s}',
    '.rvd-cbtn:hover{transform:scale(1.1)}',
    /* PB1 🍿 — popped with love: butter-gold glow, soft lub-dub heartbeat
       (animates `scale`, so hover can still tilt with `rotate`), tiny ❤ badge */
    '.rvd-cbtn.rvd-pb1{position:relative;width:52px;height:52px;font-size:24px;border:2px solid #ffcf5a;',
    'background:radial-gradient(circle at 34% 28%,rgba(255,243,214,.22),transparent 42%),radial-gradient(circle at 50% 60%,#3a2100,#160800 72%);',
    'box-shadow:0 0 14px rgba(255,190,80,.5),0 0 30px rgba(255,77,125,.18),inset 0 0 10px rgba(255,207,90,.25);',
    'animation:rvdPb1Beat 2.8s infinite ease-in-out;transition:rotate .45s cubic-bezier(.34,1.56,.64,1),translate .45s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}',
    ".rvd-cbtn.rvd-pb1::after{content:'\\2764';position:absolute;top:-1px;right:-1px;font-size:11px;line-height:1;color:#ff4d7d;",
    'text-shadow:0 0 6px rgba(255,77,125,.85);animation:rvdPb1Beat 2.8s infinite ease-in-out;pointer-events:none}',
    '.rvd-cbtn.rvd-pb1:hover,.rvd-cbtn.rvd-pb1:focus-visible{transform:none;rotate:-10deg;translate:0 -3px;outline:none;',
    'box-shadow:0 0 22px rgba(255,207,90,.85),0 0 44px rgba(255,77,125,.4),inset 0 0 12px rgba(255,207,90,.35)}',
    '@keyframes rvdPb1Beat{0%,100%{scale:1}10%{scale:1.09}20%{scale:.98}30%{scale:1.06}44%{scale:1}}',
    '.rvd-pb1-float{position:fixed;z-index:2000003;pointer-events:none;font-size:17px;line-height:1;',
    'animation:rvdPb1Float 1.1s cubic-bezier(.2,.7,.3,1) forwards}',
    '@keyframes rvdPb1Float{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}15%{opacity:1}',
    '100%{opacity:0;transform:translate(calc(-50% + var(--dx,0px)),calc(-50% + var(--dy,-70px))) scale(1.1) rotate(var(--rot,0deg))}}',
    '@media (prefers-reduced-motion:reduce){.rvd-cbtn.rvd-pb1,.rvd-cbtn.rvd-pb1::after{animation:none}.rvd-pb1-float{display:none}}',
    /* taskbar (bottom-middle) */
    '#rvd-taskbar{position:fixed;left:0;right:0;bottom:0;height:46px;z-index:2000001;display:flex;align-items:center;gap:6px;',
    'padding:0 8px;background:rgba(0,0,0,.92);border-top:1px solid var(--rvd-neon);box-shadow:0 -4px 18px rgba(0,255,65,.18);',
    'font:12px ui-monospace,monospace}',
    '#rvd-start{flex:none;height:32px;padding:0 12px;border:1px solid var(--rvd-yellow);border-radius:6px;background:#000;',
    'color:var(--rvd-yellow);font:900 12px ui-monospace,monospace;letter-spacing:1px;cursor:pointer}',
    '#rvd-tasks{flex:1;display:flex;justify-content:center;gap:6px;overflow-x:auto;scrollbar-width:none}',
    '#rvd-tasks::-webkit-scrollbar{display:none}',
    '.rvd-task{flex:none;max-width:170px;height:32px;padding:0 10px;border:1px solid #2a4;border-radius:6px;background:#031;',
    'color:#cfe;font:inherit;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rvd-task.front{background:#063;border-color:var(--rvd-neon);color:#fff}',
    '.rvd-task.min{opacity:.55}',
    '#rvd-clock{flex:none;color:var(--rvd-neon);min-width:44px;text-align:right}',
    /* windows */
    '.rvd-win{position:fixed;z-index:1100;display:flex;flex-direction:column;min-width:260px;min-height:160px;background:#000;',
    'border:1px solid var(--rvd-neon);border-radius:10px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.8),0 0 16px rgba(0,255,65,.25)}',
    '.rvd-win.min{display:none}',
    '.rvd-win.max{left:0!important;top:0!important;width:100%!important;height:calc(100% - 46px)!important;border-radius:0}',
    '.rvd-bar{flex:none;display:flex;align-items:center;gap:6px;height:34px;padding:0 4px 0 10px;background:#031a0a;',
    'color:#cfe;font:12px ui-monospace,monospace;cursor:move;user-select:none;touch-action:none}',
    '.rvd-title{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rvd-bar button{width:30px;height:26px;border:0;border-radius:5px;background:none;color:var(--rvd-neon);',
    'font:14px/1 ui-monospace,monospace;cursor:pointer}',
    '.rvd-bar button:hover{background:rgba(0,255,65,.12)}',
    '.rvd-bar button.rvd-x:hover{background:#600;color:#fff}',
    '.rvd-win iframe{flex:1;width:100%;border:0;background:#000}',
    '.rvd-grip{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;touch-action:none;',
    'background:linear-gradient(135deg,transparent 50%,var(--rvd-neon) 50%);opacity:.6}',
    '.rvd-win.max .rvd-grip{display:none}',
    'body.rvd-dragging iframe{pointer-events:none}',
    'body.rvd-dragging{user-select:none}',
    /* short screens (panoramic, phones on their side): slimmer title bars */
    '@media (max-height:520px){.rvd-bar{height:28px}.rvd-bar button{height:22px;font-size:13px}}',
    '.rvd-win:fullscreen{border:0;border-radius:0}',
    '@media (max-width:640px){#rvd-notch{font-size:11px;padding:6px 10px}.rvd-cbtn{width:42px;height:42px;font-size:19px}',
    '#rvd-start{padding:0 8px}}'
  ].join('');

  var PHONE = function () { return window.innerWidth < 700; };
  var wins = {}, zTop = 1100, cascade = 0;
  var tasksEl;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function realTab(src) {
    var a = document.createElement('a');
    a.href = url(src); a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('data-rv-nolayer', '');
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ── windows ── */
  // full-size windows sit above the corner widgets (the useRbox R is z 999999);
  // the notch menu stays above everything so the taskbar's start button works
  var MAX_Z = 1000000;
  function applyZ(w) { w.el.style.zIndex = (w.el.classList.contains('max') ? MAX_Z : 0) + w.z; }
  function front(w) {
    Object.keys(wins).forEach(function (k) { wins[k].task.classList.remove('front'); });
    if (!w) return;
    if (zTop > 1500) { // renumber so normal windows stay under the corners and menus
      Object.keys(wins).map(function (k) { return wins[k]; })
        .sort(function (a, b) { return a.z - b.z; })
        .forEach(function (x, i) { x.z = 1100 + i; applyZ(x); });
      zTop = 1100 + Object.keys(wins).length;
    }
    w.z = ++zTop;
    applyZ(w);
    w.task.classList.add('front');
  }
  function isFront(w) {
    return w.task.classList.contains('front') && !w.el.classList.contains('min');
  }
  function minimise(w) { w.el.classList.add('min'); w.task.classList.add('min'); w.task.classList.remove('front'); }
  function restore(w) { w.el.classList.remove('min'); w.task.classList.remove('min'); front(w); }
  function close(w) {
    w.el.remove(); w.task.remove();
    delete wins[w.id];
  }
  function setMax(w, on) {
    if (w.el.classList.contains('max') === !!on) return;
    w.el.classList.toggle('max', !!on);
    applyZ(w);
  }
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function frameCmd(w, cmd) {
    function send() {
      try { w.frame.contentWindow.postMessage({ type: 'rudventur-popcorn-cmd', cmd: cmd }, location.origin); } catch (e) {}
    }
    var ready = false;
    try { var doc = w.frame.contentDocument; ready = !!doc && doc.readyState === 'complete' && doc.URL !== 'about:blank'; } catch (e) {}
    if (ready) send(); else w.frame.addEventListener('load', function () { setTimeout(send, 300); }, { once: true });
  }
  // the popcorn window's full screen choices — only ever called from a tap or click
  function popcornView(mode) {
    var w = wins.popcorn;
    if (mode === 'normal') {
      if (!w) return;
      if (fsEl() === w.el) {
        var ex = document.exitFullscreen || document.webkitExitFullscreen;
        try { if (ex) Promise.resolve(ex.call(document)).catch(function () {}); } catch (e) {}
      }
      if (!PHONE()) setMax(w, false);
      frameCmd(w, 'normal');
      return;
    }
    w = w ? (restore(w), w) : open('popcorn');
    if (!w) return;
    setMax(w, true);
    if (mode === 'fullscreen' || mode === 'camera') {
      var fn = w.el.requestFullscreen || w.el.webkitRequestFullscreen;
      try { if (fn) Promise.resolve(fn.call(w.el)).catch(function () {}); } catch (e) {}
    }
    if (mode === 'camera') frameCmd(w, 'camera-fill');
  }
  // the Popcorn Hub inside its window asks for 'max' / 'normal'
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin) return;
    var d = ev.data || {};
    if (d.type !== 'rudventur-popcorn-view') return;
    Object.keys(wins).forEach(function (k) {
      var w = wins[k];
      if (w.frame.contentWindow !== ev.source) return;
      if (d.mode === 'max') { if (w.el.classList.contains('min')) restore(w); setMax(w, true); front(w); }
      else if (d.mode === 'normal' && !PHONE()) {
        if (fsEl() === w.el) {
          var ex = document.exitFullscreen || document.webkitExitFullscreen;
          try { if (ex) Promise.resolve(ex.call(document)).catch(function () {}); } catch (e) {}
        }
        setMax(w, false);
      }
    });
  });

  function toggleMax(w, deviceFullscreen) {
    // phones: windows are always full size, so ⛶ switches device fullscreen on/off
    if (PHONE() && deviceFullscreen && window.rvView) {
      var fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      var cur = rvView.current();
      rvView.set(fs ? 'normal' : (cur && cur !== 'normal' ? cur : 'panoramic'));
      return;
    }
    var on = !w.el.classList.contains('max');
    w.el.classList.toggle('max', on);
    applyZ(w);
    if (on && deviceFullscreen && window.rvView) {
      var m = rvView.current();
      rvView.set(m && m !== 'normal' ? m : 'panoramic');
    }
  }

  function open(id) {
    var app = APPS[id];
    if (!app) return;
    if (app.via) {
      var tw = wins[app.via];
      if (tw) {
        restore(tw);
        try { tw.frame.contentWindow.postMessage({ rvTranslator: app.msg }, '*'); } catch (e) {}
        return;
      }
      var lang = ''; try { lang = localStorage.getItem('rvUserLang') || ''; } catch (e) {}
      openWin(app.via, app.query + (lang ? '&lang=' + encodeURIComponent(lang) : ''));
      return;
    }
    openWin(id, '');
  }

  function openWin(id, query) {
    var app = APPS[id];
    if (app.tab) { realTab(app.src); return; }
    if (wins[id]) { restore(wins[id]); return; }

    var vw = window.innerWidth, vh = window.innerHeight - 46;
    var w = Math.min(app.w || 800, vw - 40), h = Math.min(app.h || 600, vh - 40);
    var x = Math.max(10, Math.round((vw - w) / 2) + (cascade % 5) * 26 - 52);
    var y = Math.max(10, Math.round((vh - h) / 2) + (cascade % 5) * 26 - 52);
    if (app.fit && vh < 640 && vw > vh) {
      // wide, short screen (panoramic): fill the height and widen, so the
      // popcorn title and PIX (camera left, SPIN right) fit without scrolling
      h = vh - 12;
      w = Math.min(vw - 20, Math.max(app.w || 600, Math.round(h * 2.1)));
      x = Math.max(10, Math.round((vw - w) / 2));
      y = 6;
    }
    cascade++;

    var win = el('div', 'rvd-win');
    win.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
    var bar = el('div', 'rvd-bar');
    var title = el('span', 'rvd-title', app.icon + ' ' + app.title);
    var bOut = el('button', '', '↗'); bOut.title = 'Open in a real tab';
    var bMin = el('button', '', '_'); bMin.title = 'Minimise to the taskbar';
    var bMax = el('button', '', '⛶'); bMax.title = 'Full screen';
    var bX = el('button', 'rvd-x', '✕'); bX.title = 'Close';
    [bOut, bMin, bMax, bX].forEach(function (b) { b.type = 'button'; });
    bar.appendChild(title); bar.appendChild(bOut); bar.appendChild(bMin); bar.appendChild(bMax); bar.appendChild(bX);
    var fr = document.createElement('iframe');
    // RUDVENTUR pages get only what they need (same list as the full-screen
    // layer in rvView.js); outside sites (Ventusky, Windy, …) get full screen only
    var perms = window.rvView && rvView.permissionsFor ? rvView.permissionsFor(url(app.src)) : [];
    fr.allow = (perms.length ? perms : ['fullscreen']).join('; ');
    fr.setAttribute('allowfullscreen', '');
    fr.src = url(app.src) + (query ? (app.src.indexOf('?') < 0 ? '?' : '&') + query : '');
    var grip = el('div', 'rvd-grip');
    win.appendChild(bar); win.appendChild(fr); win.appendChild(grip);
    document.body.appendChild(win);

    var task = el('button', 'rvd-task', app.icon + ' ' + app.title);
    task.type = 'button';
    tasksEl.appendChild(task);

    var rec = { id: id, el: win, frame: fr, task: task };
    wins[id] = rec;

    bOut.addEventListener('click', function () {
      var href = fr.src;
      try { href = fr.contentWindow.location.href; } catch (e) {}
      realTab(href); close(rec);
    });
    bMin.addEventListener('click', function () { minimise(rec); });
    bMax.addEventListener('click', function () { toggleMax(rec, true); });
    bX.addEventListener('click', function () { close(rec); });
    bar.addEventListener('dblclick', function (e) { if (e.target === bar || e.target === title) toggleMax(rec, false); });
    task.addEventListener('click', function () {
      if (win.classList.contains('min')) restore(rec);
      else if (isFront(rec)) minimise(rec);
      else front(rec);
    });
    win.addEventListener('pointerdown', function () { front(rec); });
    drag(bar, win, 'move');
    drag(grip, win, 'resize');

    if (PHONE()) win.classList.add('max');
    front(rec);
    return rec;
  }

  function drag(handle, win, kind) {
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.tagName === 'BUTTON' || win.classList.contains('max')) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, r = win.getBoundingClientRect();
      document.body.classList.add('rvd-dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (kind === 'move') {
          var nx = Math.min(Math.max(r.left + dx, 40 - r.width), window.innerWidth - 60);
          var ny = Math.min(Math.max(r.top + dy, 0), window.innerHeight - 46 - 34);
          win.style.left = nx + 'px'; win.style.top = ny + 'px';
        } else {
          win.style.width = Math.max(260, r.width + dx) + 'px';
          win.style.height = Math.max(160, r.height + dy) + 'px';
        }
      }
      function up() {
        document.body.classList.remove('rvd-dragging');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      }
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }

  // a click inside a window's iframe doesn't reach this page, but it does blur it
  window.addEventListener('blur', function () {
    setTimeout(function () {
      var a = document.activeElement;
      Object.keys(wins).forEach(function (k) { if (wins[k].frame === a) front(wins[k]); });
    }, 0);
  });

  /* ── notch menu (top-left) ── */
  function buildNotch() {
    var notch = el('div', '', 'RUDVENTUR');
    notch.id = 'rvd-notch';
    notch.title = 'RUDVENTUR menu';
    var menu = el('div');
    menu.id = 'rvd-menu';
    function labelled(cls, icon, text) {
      var b = el('button', cls);
      b.type = 'button';
      var i = el('span', 'rvd-ico', icon);
      b.appendChild(i); b.appendChild(el('span', 'rvd-lbl', text));
      return b;
    }
    function group(icon, text) {
      var g = labelled('rvd-mi rvd-grp', icon, text);
      var sub = el('div', 'rvd-sub');
      g.addEventListener('click', function (e) { e.stopPropagation(); g.classList.toggle('open'); sub.classList.toggle('open'); });
      return [g, sub];
    }
    MENU.forEach(function (grp) {
      var parts = grp[0].split(' ');
      var gs = group(parts[0], parts.slice(1).join(' '));
      var g = gs[0], sub = gs[1];
      grp[1].forEach(function (id) {
        var a = APPS[id];
        var b = labelled('rvd-mi', a.icon, a.title + (a.tab ? ' ↗' : ''));
        b.addEventListener('click', function () { closeNotch(); open(id); });
        sub.appendChild(b);
      });
      menu.appendChild(g); menu.appendChild(sub);
    });
    // directory of real organisations, grouped by country
    var dg = group('🌍', 'DIRECTORY — EUROPE');
    dg[1].appendChild(el('div', 'rvd-note', 'Real organisations for pets, food aid, maps and weather. Each one opens its own website in a new tab.'));
    DIRECTORY.forEach(function (c) {
      var cg = labelled('rvd-mi rvd-grp', '', c.country);
      cg.firstChild.classList.add('rvd-flag');
      cg.firstChild.innerHTML = c.flag;
      var cs = el('div', 'rvd-sub');
      cg.addEventListener('click', function (e) { e.stopPropagation(); cg.classList.toggle('open'); cs.classList.toggle('open'); });
      c.orgs.forEach(function (o) {
        var a = el('a', 'rvd-org');
        a.href = o.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.setAttribute('data-rv-nolayer', '');
        var lg = el('span', 'rvd-logo');
        if (o.logo) {
          var img = el('img');
          img.alt = ''; img.src = url('embed/' + o.logo);
          img.onerror = function () { lg.textContent = o.icon; lg.classList.add('emoji'); };
          lg.appendChild(img);
        } else { lg.textContent = o.icon; lg.classList.add('emoji'); }
        var t = el('span', 'rvd-lbl', o.name + ' ↗');
        t.appendChild(el('span', 'rvd-what', o.icon + ' ' + o.what));
        a.appendChild(lg); a.appendChild(t);
        a.addEventListener('click', function () { closeNotch(); });
        cs.appendChild(a);
      });
      dg[1].appendChild(cg); dg[1].appendChild(cs);
    });
    menu.appendChild(el('div', 'rvd-sep'));
    menu.appendChild(dg[0]); menu.appendChild(dg[1]);
    menu.appendChild(el('div', 'rvd-sep'));
    // view modes, same as the logo menu
    var v = labelled('rvd-mi rvd-grp', '🖥️', 'VIEW');
    var vs = el('div', 'rvd-sub');
    [['horizontal', 'Full Screen Horizontal'], ['panoramic', 'Full Screen Panoramic'],
     ['vertical', 'Full Screen Vertical'], ['normal', 'Normal / Default Browser']].forEach(function (m) {
      var b = labelled('rvd-mi', '🖥️', m[1]);
      b.addEventListener('click', function () { closeNotch(); if (window.rvView) rvView.set(m[0]); });
      vs.appendChild(b);
    });
    [['max', '🍿 Popcorn — Fill the Screen'], ['fullscreen', '🍿 Popcorn — True Full Screen'],
     ['camera', '📷 Popcorn — Full Screen Camera'], ['normal', '🍿 Popcorn — Normal Size']].forEach(function (m) {
      var b = labelled('rvd-mi', m[1].slice(0, 2), m[1].slice(3));
      b.addEventListener('click', function () { closeNotch(); popcornView(m[0]); });
      vs.appendChild(b);
    });
    v.addEventListener('click', function (e) { e.stopPropagation(); v.classList.toggle('open'); vs.classList.toggle('open'); });
    menu.appendChild(v); menu.appendChild(vs);
    menu.appendChild(el('div', 'rvd-sep'));
    var buy = labelled('rvd-mi rvd-gold', '⚡', 'Buy Pumpkin Electricity! 🎃');
    buy.addEventListener('click', function () { closeNotch(); open('kofi'); });
    var kofi = labelled('rvd-mi rvd-gold', '☕', 'Ko-fi ↗');
    kofi.addEventListener('click', function () { closeNotch(); open('kofi'); });
    menu.appendChild(buy); menu.appendChild(kofi);

    notch.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== notch && e.target.id !== 'rvd-start') closeNotch();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNotch(); });
    document.body.appendChild(notch);
    document.body.appendChild(menu);
    function closeNotch() { menu.classList.remove('open'); }
    return function () { menu.classList.toggle('open'); };
  }

  // PB1 love: a few hearts + kernels drift up from the 🍿 when it is tapped
  function pb1Burst(btn) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = btn.getBoundingClientRect();
    var bits = ['\u2764\uFE0F', '\uD83C\uDF7F', '\uD83D\uDC9B', '\uD83C\uDF7F', '\u2764\uFE0F'];
    bits.forEach(function (ch, i) {
      var s = el('span', 'rvd-pb1-float', ch);
      s.style.left = (r.left + r.width / 2) + 'px';
      s.style.top = (r.top + r.height / 2) + 'px';
      s.style.setProperty('--dx', Math.round((i - 2) * 20 + (Math.random() * 12 - 6)) + 'px');
      s.style.setProperty('--dy', Math.round(-55 - Math.random() * 45) + 'px');
      s.style.setProperty('--rot', Math.round(Math.random() * 50 - 25) + 'deg');
      s.style.animationDelay = (i * 45) + 'ms';
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 1400 + i * 45);
    });
  }

  function cornerBtn(parent, id) {
    var a = APPS[id];
    var b = el('button', 'rvd-cbtn', a.icon);
    b.type = 'button';
    b.title = a.title;
    if (id === 'popcorn') {
      b.classList.add('rvd-pb1');
      b.title = 'PB1 \u00B7 Popcorn Hub \u2014 freshly popped with \u2764\uFE0F';
      b.setAttribute('aria-label', 'Open the Popcorn Hub (PB1), made with love');
    }
    b.addEventListener('click', function () {
      // PB1 (bottom-right 🍿): open the Popcorn Hub. Inside the hub, PB2 opens
      // the bunker for secret movie making; the PIX PANEL tab is the pix describer
      // (emoji bandits + green scenery indicators on the camera feed).
      if (id === 'popcorn') pb1Burst(b);
      var w = wins[a.via || id];
      if (w && isFront(w) && !a.via) minimise(w); else open(id);
    });
    parent.appendChild(b);
  }

  function init() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var toggleNotch = buildNotch();

    var bl = el('div', 'rvd-corner'); bl.id = 'rvd-bl';
    cornerBtn(bl, 'keyboard'); cornerBtn(bl, 'chat');
    var br = el('div', 'rvd-corner'); br.id = 'rvd-br';
    cornerBtn(br, 'popcorn');

    var bar = el('div'); bar.id = 'rvd-taskbar';
    var start = el('button', '', '🎃 RUDVENTUR'); start.id = 'rvd-start'; start.type = 'button';
    start.title = 'RUDVENTUR menu';
    start.addEventListener('click', function (e) { e.stopPropagation(); toggleNotch(); });
    tasksEl = el('div'); tasksEl.id = 'rvd-tasks';
    var clock = el('div'); clock.id = 'rvd-clock';
    function tick() {
      var d = new Date();
      clock.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    tick(); setInterval(tick, 10000);
    bar.appendChild(start); bar.appendChild(tasksEl); bar.appendChild(clock);

    document.body.appendChild(bl); document.body.appendChild(br); document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // pages that use the shared logo menu get the popcorn choices there too
  if (window.rvView && typeof rvView.addMenuItem === 'function') {
    [['max', '🍿 Popcorn — Fill the Screen'], ['fullscreen', '🍿 Popcorn — True Full Screen'],
     ['camera', '📷 Popcorn — Full Screen Camera'], ['normal', '🍿 Popcorn — Normal Size']].forEach(function (m) {
      rvView.addMenuItem({ id: 'desk-popcorn-' + m[0], label: m[1], onClick: function () { popcornView(m[0]); } });
    });
  }

  window.rvDesk = { open: open, apps: APPS, popcorn: popcornView };
})();
