/* useRbox — the ONE shared RUDVENTUR profile box (the R circle, top right).
 * One line on any page of any RUDVENTUR repository:
 *   <script src="https://rudventur.github.io/RudVentur.com/embed/useRbox.js" defer></script>
 * It adds its own look (useRbox.css, found next to this file) and markup, and
 * sits top-right above the page on every page it's loaded on.
 *
 * WHERE THE PROFILE IS SAVED (this browser's local storage, shared by every
 * RUDVENTUR page because they are all on rudventur.github.io):
 *   rud_useRbox_v3            the profile: name, motto, location, saved places
 *   rud_useRbox_v3_migration  which old keys were already copied in (see below)
 *   rud_useRbox_collapsed     '1' when the box is folded to its notch
 *   rud_useRbox_transparent   '1' when the see-through background is on
 *   rudventur_channel         the channel picked at the Windows 13 login (read only)
 *   rvViewMode                the shared view mode (owned by rvView.js)
 *
 * OLDER PROFILE BOXES and the keys they used — copied into rud_useRbox_v3
 * automatically, once; copying in never deletes or changes them:
 *   rud_useRbox_v2      the old windows13 boxes (now deleted) and the old version of
 *                       this file ({username, channel, psignature, currentLoc,
 *                       lat, lon, saveMessages, savedLocations});
 *                       the old Ultimate box wrote the motto as "signature"
 *   rv_username         Snout First's display name (also used by its pets,
 *                       lost-pet reports and SHOW ME)
 *   sf_owner_signature  Snout First's "Your Motto"
 *   sf_walk_spots       Snout First's saved walk spots [{id, name, lat, lon}]
 * If an app that hasn't switched over yet changes one of those keys later, the
 * change is copied in the next time this box loads (only that key, once).
 * Two names or mottos that disagree are never thrown away: the one not used is
 * kept in the profile under "migration.notes".
 * To keep apps that haven't switched over in step, pressing save (or adding /
 * deleting a saved place) here also updates
 * rud_useRbox_v2 (read by windows13, LuxWin13 and the PopCOIN wallet), and
 * rv_username + sf_owner_signature (read by Snout First).
 *
 * For other scripts: window.rvUserbox.get() returns a copy of the profile,
 * rvUserbox.save({username: 'Pumpkin'}) changes it, rvUserbox.KEY and
 * rvUserbox.LEGACY_KEYS name the keys.
 *
 * Override the translator's address by setting window.RUDVENTUR_TRANSLATOR_URL
 * before this script runs.
 */
(function () {
  'use strict';
  if (window.rvUserbox) return;   // loaded twice on one page: once is enough

  var KEY = 'rud_useRbox_v3';
  var MIGRATION_KEY = 'rud_useRbox_v3_migration';
  var LEGACY_KEYS = ['rud_useRbox_v2', 'rv_username', 'sf_owner_signature', 'sf_walk_spots'];
  // defaults the old boxes filled in by themselves — not a name anyone chose
  var PLACEHOLDER_NAMES = { '': 1, 'rudy': 1, 'anonymous walker': 1, 'traveler': 1, 'anonymous': 1 };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function parse(raw) { try { return JSON.parse(raw); } catch (e) { return undefined; } }
  function str(v) { return v == null ? '' : String(v); }
  function isPlaceholderName(n) { return !!PLACEHOLDER_NAMES[str(n).trim().toLowerCase()]; }

  function blankProfile() {
    return {
      version: 3, username: '', psignature: '', currentLoc: '', lat: '', lon: '',
      saveMessages: true, savedLocations: [], updatedAt: '', migration: { notes: [] }
    };
  }
  function cleanLocation(loc) {
    if (!loc || typeof loc !== 'object') return null;
    var name = str(loc.name).trim();
    var lat = str(loc.lat).trim(), lon = str(loc.lon).trim();
    if (!name && !lat && !lon) return null;
    var id = Number(loc.id);
    return { id: isFinite(id) && id > 0 ? id : 0, name: name.slice(0, 200), lat: lat.slice(0, 32), lon: lon.slice(0, 32) };
  }
  function sameLocation(a, b) {
    function n(v) { var f = parseFloat(v); return isFinite(f) ? f.toFixed(5) : str(v); }
    return a.name.toLowerCase() === b.name.toLowerCase() && n(a.lat) === n(b.lat) && n(a.lon) === n(b.lon);
  }
  function addLocations(profile, list) {
    if (!Array.isArray(list)) return;
    list.forEach(function (raw) {
      var loc = cleanLocation(raw);
      if (!loc) return;
      if (profile.savedLocations.some(function (l) { return sameLocation(l, loc); })) return;
      var ids = profile.savedLocations.map(function (l) { return l.id; });
      if (!loc.id || ids.indexOf(loc.id) >= 0) loc.id = Math.max(Date.now(), Math.max.apply(null, ids.concat(0)) + 1);
      profile.savedLocations.push(loc);
    });
  }
  function note(profile, key, field, value) {
    profile.migration.notes.push({ from: key, field: field, value: str(value).slice(0, 2000), at: new Date().toISOString() });
    if (profile.migration.notes.length > 50) profile.migration.notes.shift();
  }
  // put one old value into the profile. First migration: fill empty fields,
  // keep the other value in notes. Later change by an old app: that value is
  // newer, so it wins and the previous one goes to notes.
  function takeField(profile, key, field, value, newer) {
    value = str(value);
    if (!value.trim()) return;
    var cur = str(profile[field]);
    if (cur === value) return;
    var curEmpty = field === 'username' ? isPlaceholderName(cur) : !cur.trim();
    var valWeak = field === 'username' && isPlaceholderName(value);
    if (curEmpty && (!valWeak || !cur.trim())) {
      if (cur.trim()) note(profile, KEY, field, cur);   // even a default name is kept
      profile[field] = value;
      return;
    }
    if (newer && !valWeak) { if (cur.trim()) note(profile, KEY, field, cur); profile[field] = value; return; }
    note(profile, key, field, value);
  }
  function mergeLegacy(profile, key, raw, newer) {
    if (key === 'rud_useRbox_v2') {
      var u = parse(raw);
      if (!u || typeof u !== 'object') { note(profile, key, 'unreadable', raw); return; }
      takeField(profile, key, 'username', u.username, newer);
      takeField(profile, key, 'psignature', u.psignature != null ? u.psignature : u.signature, newer);
      if (u.psignature != null && u.signature != null && str(u.signature) !== str(u.psignature))
        takeField(profile, key, 'psignature', u.signature, false);
      takeField(profile, key, 'currentLoc', u.currentLoc, newer);
      takeField(profile, key, 'lat', u.lat, newer);
      takeField(profile, key, 'lon', u.lon, newer);
      if (typeof u.saveMessages === 'boolean' && (newer || !profile.updatedAt)) profile.saveMessages = u.saveMessages;
      addLocations(profile, u.savedLocations);
    } else if (key === 'rv_username') {
      takeField(profile, key, 'username', raw, newer);
    } else if (key === 'sf_owner_signature') {
      takeField(profile, key, 'psignature', raw, newer);
    } else if (key === 'sf_walk_spots') {
      var spots = parse(raw);
      if (!Array.isArray(spots)) { note(profile, key, 'unreadable', raw); return; }
      addLocations(profile, spots);
    }
  }

  function readProfile() {
    var p = parse(lsGet(KEY));
    if (!p || typeof p !== 'object') return null;
    var out = blankProfile();
    Object.keys(p).forEach(function (k) { out[k] = p[k]; });   // keep unknown fields too
    ['username', 'psignature', 'currentLoc', 'lat', 'lon'].forEach(function (k) { out[k] = str(out[k]); });
    out.saveMessages = out.saveMessages !== false;
    var locs = Array.isArray(out.savedLocations) ? out.savedLocations : [];
    out.savedLocations = [];
    addLocations(out, locs);
    if (!out.migration || typeof out.migration !== 'object') out.migration = { notes: [] };
    if (!Array.isArray(out.migration.notes)) out.migration.notes = [];
    return out;
  }

  // copy the profile back to the keys older apps read, so they stay in step
  function writeMirrors(profile, state) {
    var v2 = parse(lsGet('rud_useRbox_v2'));
    if (!v2 || typeof v2 !== 'object') v2 = {};
    v2.username = profile.username;
    v2.channel = lsGet('rudventur_channel') || v2.channel || 'main';
    v2.psignature = profile.psignature;
    v2.signature = profile.psignature;
    v2.currentLoc = profile.currentLoc;
    v2.lat = profile.lat;
    v2.lon = profile.lon;
    v2.saveMessages = profile.saveMessages;
    v2.savedLocations = profile.savedLocations;
    var mirrors = { rud_useRbox_v2: JSON.stringify(v2) };
    if (profile.username && !isPlaceholderName(profile.username)) mirrors.rv_username = profile.username;
    if (profile.psignature || lsGet('sf_owner_signature') !== null) mirrors.sf_owner_signature = profile.psignature;
    Object.keys(mirrors).forEach(function (k) {
      if (lsGet(k) !== mirrors[k]) lsSet(k, mirrors[k]);
      state.seen[k] = lsGet(k);   // our own write — don't copy it back in
    });
  }
  function readState() {
    var st = parse(lsGet(MIGRATION_KEY));
    if (!st || typeof st !== 'object') st = {};
    if (!st.seen || typeof st.seen !== 'object') st.seen = {};
    return st;
  }
  // mirror = false for the migration itself: copying in never changes the old keys
  function writeProfile(profile, state, mirror) {
    profile.version = 3;
    profile.updatedAt = new Date().toISOString();
    lsSet(KEY, JSON.stringify(profile));
    if (mirror) writeMirrors(profile, state);
    lsSet(MIGRATION_KEY, JSON.stringify(state));
  }

  // the migration: runs on every load but only does work for an old key that is
  // new or changed since it was last copied in
  function migrate() {
    var state = readState();
    var profile = readProfile();
    var first = !profile;
    if (first) profile = blankProfile();
    var changed = first && LEGACY_KEYS.some(function (k) { return lsGet(k) !== null; });
    LEGACY_KEYS.forEach(function (k) {
      var raw = lsGet(k);
      if (raw === null || state.seen[k] === raw) return;
      mergeLegacy(profile, k, raw, !first);
      state.seen[k] = raw;
      changed = true;
    });
    if (changed) {
      if (first) state.migratedAt = new Date().toISOString();
      state.version = 1;
      writeProfile(profile, state, false);
    }
    return profile;
  }

  function getProfile() { return readProfile() || migrate(); }
  function saveProfile(patch) {
    var state = readState();
    var profile = readProfile() || migrate();
    Object.keys(patch || {}).forEach(function (k) {
      if (k === 'savedLocations') {
        var list = Array.isArray(patch[k]) ? patch[k] : [];
        profile.savedLocations = [];
        addLocations(profile, list);
      } else if (k === 'saveMessages') profile.saveMessages = patch[k] !== false;
      else if (k !== 'version' && k !== 'migration' && k !== 'updatedAt') profile[k] = str(patch[k]);
    });
    writeProfile(profile, state, true);
    return JSON.parse(JSON.stringify(profile));
  }

  migrate();
  window.rvUserbox = {
    KEY: KEY, MIGRATION_KEY: MIGRATION_KEY, LEGACY_KEYS: LEGACY_KEYS.slice(),
    get: function () { return JSON.parse(JSON.stringify(getProfile())); },
    save: saveProfile,
    migrate: migrate,
    escapeHtml: escapeHtml,
    // until the box is built (or when it is not built, inside a window of a page that already has it)
    // these remember the request; init() replaces them with the real ones and replays it
    setLeft: function (content, opts) { pendingLeft = { content: content, opts: opts }; return null; },
    open: function (section) { pendingOpen = section || true; },
    close: function () { pendingOpen = null; }
  };
  var pendingLeft = null, pendingOpen = null;

  var scriptEl = document.currentScript;
  var baseUrl = scriptEl ? new URL('.', scriptEl.src).href : './';

  // the shared right-click / long-press button explanations (embed/rxplanation.js), once per page
  (function loadExplain() {
    if (window.rvExplain || document.querySelector('script[src*="rxplanation.js"]')) return;
    var el = document.createElement('script'); el.src = baseUrl + 'rxplanation.js'; el.defer = true;
    (document.head || document.documentElement).appendChild(el);
  })();

  function injectStylesheet() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = baseUrl + 'useRbox.css';
    document.head.appendChild(link);
  }

  function buildMarkup() {
    var root = document.createElement('div');
    root.id = 'topRightUser';
    root.innerHTML =
      '<div data-explain="Opens your useRbox corner: the translator and your profile appear next to the R." id="Rcircle" title="useR">R</div>' +
      '<div id="Ricons">' +
      '  <div data-explain="Opens the RUDVENTUR translator in your language: translate, chat with translation and on-screen keyboards." class="Ricon" id="iconTranslator" title="Translator">🌐</div>' +
      '  <div data-explain="Opens the full useRbox: your profile, places, rooms, the restaurant and the PopCOIN shop." class="Ricon" id="iconUser" title="useRbox">👤</div>' +
      '</div>' +
      '<div id="useRbox" class="hidden">' +
      '  <div class="useRbox-notch" id="useRboxNotch" title="Collapse / Expand">⟨⟩</div>' +
      '  <div class="useRbox-header">' +
      '    <strong>⚡ useRbox</strong>' +
      '    <div class="useRbox-header-btns">' +
      '      <button data-explain="Jumps to the PopCOIN shop in the left section, where you spend popCoins on pages and items." id="rbFakePopShop" title="PopCoin shop (left section)">🛒</button>' +
      '      <button data-explain="Switches between online (others can see your name in the room) and private mode (nobody sees you)." id="togglePrivacy" title="Online / private">🌐</button>' +
      '      <button data-explain="Makes the useRbox background see-through so the page behind stays visible, or solid again." id="toggleTransparency" title="Toggle transparency">🌑</button>' +
      '      <button data-explain="Folds the useRbox into a small notch at the edge of the screen; tap the notch to bring it back." id="collapseUser" title="Collapse to notch">⤢</button>' +
      '      <button data-explain="Closes the useRbox. Everything you saved stays on this device." id="closeUser" title="Close">✖</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="rb-cols">' +
      '   <section class="rb-col rb-col-left"><div class="rb-col-title">⚙️ SERVICE OPTIONS</div>' +
      '  <div class="rb-section rb-left-slot" id="rbLeftSlot" hidden><div class="social-title" id="rbLeftSlotTitle"></div><div id="rbLeftSlotBody"></div></div>' +
      '  <div class="rb-section rb-shop" id="rbShop"><div class="social-title">🧭 SERVICES · 🛒 POPCOIN SHOP</div>' +
      '    <div class="rb-fakepop" id="rbFakePop" title="Fake popCoins: just for fun, saved in this browser, no real money">' +
      '      <span>🍿 <b id="rbFakePopBal">0</b> fake popCoins</span>' +
      '      <button type="button" class="btn btn-small" data-explain="Claims your free daily popCoins. You can claim once a day." id="rbFakePopClaim">🎁 DAILY</button>' +
      '    </div>' +
      '    <small class="rb-dev-note">Fake popCoins only: no real money. Buy a link once and it is yours on this browser.</small>' +
      '    <div id="rbShopList" class="rb-services"></div></div>' +
      '  <div id="liveClock">--:--:--</div>' +
      '  <div class="rb-section">' +
      '    <div class="social-title">🗣 MY LANGUAGE</div>' +
      '    <select id="rbLang" title="Your language, remembered on this device and passed to the translator"><option value="af">Afrikaans</option><option value="ak">Akan (Twi)</option><option value="sq">Albanian</option><option value="am">Amharic</option><option value="ar">Arabic</option><option value="an">Aragonese</option><option value="hy">Armenian</option><option value="rup">Aromanian</option><option value="ast">Asturian</option><option value="ay">Aymara</option><option value="az">Azerbaijani</option><option value="eu">Basque</option><option value="bar">Bavarian</option><option value="be">Belarusian</option><option value="bn">Bengali</option><option value="ber">Berber (Tamazight)</option><option value="bs">Bosnian</option><option value="br">Breton</option><option value="bg">Bulgarian</option><option value="my">Burmese</option><option value="yue">Cantonese</option><option value="ca">Catalan</option><option value="chr">Cherokee</option><option value="ny">Chichewa (Nyanja)</option><option value="kw">Cornish</option><option value="co">Corsican</option><option value="cr">Cree</option><option value="hr">Croatian</option><option value="cs">Czech</option><option value="da">Danish</option><option value="nl">Dutch</option><option value="en">English</option><option value="et">Estonian</option><option value="fo">Faroese</option><option value="fj">Fijian</option><option value="fi">Finnish</option><option value="fr">French</option><option value="fy">Frisian</option><option value="fur">Friulian</option><option value="ff">Fula (Fulfulde)</option><option value="gl">Galician</option><option value="ka">Georgian</option><option value="de">German</option><option value="el">Greek</option><option value="gn">Guarani</option><option value="gu">Gujarati</option><option value="ht">Haitian Creole</option><option value="ha">Hausa</option><option value="haw">Hawaiian</option><option value="he">Hebrew</option><option value="hi">Hindi</option><option value="hu">Hungarian</option><option value="is">Icelandic</option><option value="ig">Igbo</option><option value="id">Indonesian</option><option value="iu">Inuktitut</option><option value="ga">Irish</option><option value="it">Italian</option><option value="ja">Japanese</option><option value="kn">Kannada</option><option value="krl">Karelian</option><option value="csb">Kashubian</option><option value="kk">Kazakh</option><option value="km">Khmer</option><option value="kg">Kikongo</option><option value="rw">Kinyarwanda</option><option value="ko">Korean</option><option value="ku">Kurdish</option><option value="ksh">Kölsch</option><option value="lkt">Lakota</option><option value="lo">Lao</option><option value="lv">Latvian</option><option value="lij">Ligurian</option><option value="li">Limburgish</option><option value="ln">Lingala</option><option value="lt">Lithuanian</option><option value="liv">Livonian</option><option value="lmo">Lombard</option><option value="nds">Low German</option><option value="dsb">Lower Sorbian</option><option value="lb">Luxembourgish</option><option value="mk">Macedonian</option><option value="mg">Malagasy</option><option value="ms">Malay</option><option value="ml">Malayalam</option><option value="mt">Maltese</option><option value="zh-CN">Mandarin</option><option value="gv">Manx</option><option value="mi">Maori</option><option value="arn">Mapudungun</option><option value="mr">Marathi</option><option value="mn">Mongolian</option><option value="cnr">Montenegrin</option><option value="nah">Nahuatl</option><option value="nv">Navajo (Diné)</option><option value="nap">Neapolitan</option><option value="ne">Nepali</option><option value="frr">North Frisian</option><option value="no">Norwegian</option><option value="oc">Occitan</option><option value="oj">Ojibwe (Anishinaabemowin)</option><option value="om">Oromo</option><option value="pfl">Palatinate German</option><option value="ps">Pashto</option><option value="fa">Persian</option><option value="pms">Piedmontese</option><option value="pl">Polish</option><option value="pt">Portuguese</option><option value="pa">Punjabi</option><option value="qu">Quechua</option><option value="ro">Romanian</option><option value="rm">Romansh</option><option value="ru">Russian</option><option value="rue">Rusyn</option><option value="smj">Sami (Lule)</option><option value="se">Sami (Northern)</option><option value="sma">Sami (Southern)</option><option value="sm">Samoan</option><option value="sc">Sardinian</option><option value="stq">Saterland Frisian</option><option value="sco">Scots</option><option value="gd">Scots Gaelic</option><option value="sr">Serbian</option><option value="st">Sesotho</option><option value="sn">Shona</option><option value="scn">Sicilian</option><option value="szl">Silesian</option><option value="sli">Silesian German</option><option value="si">Sinhala</option><option value="sk">Slovak</option><option value="sl">Slovenian</option><option value="so">Somali</option><option value="wen">Sorbian</option><option value="es">Spanish</option><option value="swg">Swabian</option><option value="sw">Swahili</option><option value="sv">Swedish</option><option value="tl">Tagalog</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="th">Thai</option><option value="bo">Tibetan</option><option value="ti">Tigrinya</option><option value="tpi">Tok Pisin</option><option value="to">Tongan</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option><option value="hsb">Upper Sorbian</option><option value="ur">Urdu</option><option value="uz">Uzbek</option><option value="vec">Venetian</option><option value="vi">Vietnamese</option><option value="vro">Võro</option><option value="wa">Walloon</option><option value="guc">Wayuunaiki</option><option value="cy">Welsh</option><option value="vls">West Flemish</option><option value="wo">Wolof</option><option value="xh">Xhosa</option><option value="yo">Yoruba</option><option value="zu">Zulu</option></select>' +
      '    <small class="rb-dev-note">The translator opens in this language.</small>' +
      '  </div>' +
      '  <div class="rb-devices">' +
      '    <div class="social-title">📷 🎤 CAMERA &amp; MIC</div>' +
      '    <div class="rb-dev-row">' +
      '      <button type="button" data-explain="Turns your camera on or off for the popcorn window and the PIX camera challenges. Nothing is recorded or sent." class="rb-dev" id="rbCam"><span>📷 CAMERA</span><small>OFF</small></button>' +
      '      <button type="button" data-explain="Turns your microphone on or off for pages that listen, such as voice features. Nothing is recorded or sent." class="rb-dev" id="rbMic"><span>🎤 MICROPHONE</span><small>OFF</small></button>' +
      '    </div>' +
      '    <label>Camera</label>' +
      '    <select id="rbFacing">' +
      '      <option value="user">🤳 Front (selfie)</option>' +
      '      <option value="environment">📷 Back</option>' +
      '    </select>' +
      '    <label>Brightness <span id="rbBrightVal"></span></label>' +
      '    <input type="range" id="rbBright" min="-100" max="100" value="0">' +
      '    <label>Contrast <span id="rbContrastVal"></span></label>' +
      '    <input type="range" id="rbContrast" min="-100" max="100" value="0">' +
      '    <label class="toggle"><input type="checkbox" id="rbMirror"><span>Mirror the picture</span></label>' +
      '    <div class="field-row" style="margin-top:8px;">' +
      '      <button type="button" class="btn" data-explain="Opens the Popcorn Hub window: wallet, PIX camera challenges, bunker and tools." id="rbOpenPopcorn" style="flex:1;">🍿 OPEN POPCORN WINDOW</button>' +
      '      <button type="button" class="btn btn-small" data-explain="Puts the camera brightness, contrast and mirror settings back to normal." id="rbCamReset" title="Brightness, contrast and mirror back to normal">↺</button>' +
      '    </div>' +
      '    <small class="rb-dev-note">Camera and mic only ever run inside the 🍿 popcorn window, which is sealed off from the internet. ' +
      'Recordings and 🎬 movie maker are in there.</small>' +
      '  </div>' +
      '  <button type="button" class="btn" data-explain="Installs RUDVENTUR on your home screen as an app, or shows how to do it on your phone." id="rbGetApp" style="width:100%;margin-top:14px;padding:10px;">📲 DOWNLOAD THE RUDVENTUR APP</button>' +
      '   </section>' +
      '   <section class="rb-col rb-col-mid"><div class="rb-col-title">👤 useR</div>' +
      '  <div id="rvInsideHeader" class="rv-inside-header">' +
      '    <div class="rv-nag-msg" id="rvNagMsg">☕ Support the universe — it\'s only £10 per year</div>' +
      '    <button type="button" data-explain="Hides this notice." id="rvNagOk" class="rv-nag-ok">OK</button>' +
      '  </div>' +
      '  <details class="rb-fold" id="rbMyProfile" open><summary>👤 MY INFO</summary><div class="rb-fold-body">' +
      '  <div class="rb-incognito">' +
      '    <div class="rb-incognito-mask">🕶</div>' +
      '    <strong>INCOGNITO — PRIVATE MODE</strong>' +
      '    <p>No login, no profile, nothing saved about you. Camera and microphone are off. ' +
      'You can still use every public tool.</p>' +
      '    <button class="btn" data-explain="Joins the room online. Only your name is shown to others, never your location unless you share it." id="goOnline">🌐 GO ONLINE (only your name is shown)</button>' +
      '  </div>' +
      '  <div class="avatar-wrap">' +
      '    <div id="avatarHalftone"></div>' +
      '    <small>pure CSS halftone signature</small>' +
      '  </div>' +
      '    <div class="rb-myinfo" id="rbMyInfo"></div>' +
      '    <small class="rb-dev-note">Read only. Change it in ✏️ Editing on the right.</small>' +
      '  </div></details>' +
      '  <div class="rb-viewed hidden" id="rbViewed"><div class="rb-viewed-head"><span id="rbViewedTitle">👁 PROFILE</span><button type="button" class="btn btn-small" data-explain="Closes the profile you are looking at and goes back to your own." id="rbViewedClose" title="Close this profile">✖</button></div><div id="rbViewedBody"></div></div>' +
      '  <details class="rb-fold rb-room" id="rbRoom" open><summary>🍽️ RESTAURANT</summary><div class="rb-fold-body">' +
      '    <label>📡 Channel</label>' +
      '    <div class="field-row"><input type="text" id="channel" value="main" disabled style="flex:1;"><button class="btn btn-small" data-explain="Explains what channels are: shared rooms where people on the same channel see each other." id="channelInfo" title="About channels">ℹ️</button></div>' +
      '    <label>🔁 Join another room</label>' +
      '    <div class="field-row"><input type="text" id="rbRoomInput" placeholder="Room name..." style="flex:1;"><button type="button" class="btn btn-small" data-explain="Joins the room typed in the box next to it." id="rbRoomJoin">JOIN</button></div>' +
      '    <div class="rb-known-rooms" id="rbKnownRooms"></div>' +
      '    <div class="field-row" style="margin-top:8px;"><button type="button" class="btn" data-explain="Leaves this room and goes back to the main room." id="rbRoomLeave" style="flex:1;">🚪 LEAVE (back to main)</button></div>' +
      '    <label class="toggle"><input type="checkbox" id="rbRoomVisible"><span>Show me in the room list</span></label>' +
      '    <small class="rb-dev-note" id="rbPresenceNote">Off by default. When on, your name and the public fields you chose are shared live with this room.</small>' +
      '    <div class="rb-subtitle">🍽️ OPEN RESTAURANTS</div>' +
      '    <div id="rbRestaurants"><div class="rb-empty">No restaurants open right now</div></div>' +
      '    <div class="rb-tables hidden" id="rbTables"><div class="rb-viewed-head"><span id="rbTablesTitle"></span><button type="button" class="btn btn-small" data-explain="Closes the restaurant tables list." id="rbTablesClose" title="Close">✖</button></div><div id="rbTablesList"></div></div>' +
      '  </div></details>' +
      '   </section>' +
      '   <section class="rb-col rb-col-right">' +
      '  <details class="rb-fold" id="rbEditFold" open><summary>✏️ EDITING OPTIONS</summary><div class="rb-fold-body">' +
      '    <div class="rb-subtitle">👤 MY PROFILE</div>' +
      '  <label>👤 Username</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="username" value="Rudy" style="flex:1;">' +
      '    <button class="btn btn-small" data-explain="Picks a random fun name for you. Save the profile to keep it." id="randomUser" title="Pick a random name">🎲</button>' +
      '    <button class="btn btn-small" data-explain="Reloads your profile from this device, undoing changes you have not saved." id="refreshUser">🔄 Refresh</button>' +
      '  </div>' +
      '  <label>📝 P.S. (Personal Signature)</label>' +
      '  <textarea id="psignature" placeholder="You don\'t have to have legs to Trip"></textarea>' +
      '  <label>📍 Current Location</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="currentLoc" placeholder="???" style="flex:1;">' +
      '    <button class="btn btn-small" data-explain="Reads your position from the device once, so you can save it as a place. Your browser asks first." id="gpsBtn">📍 GPS</button>' +
      '  </div>' +
      '  <div style="display:flex; gap:8px; margin-top:8px;">' +
      '    <div style="flex:1;"><label style="margin:0 0 4px;">Lat</label><input type="text" id="lat" placeholder="0.000000"></div>' +
      '    <div style="flex:1;"><label style="margin:0 0 4px;">Lon</label><input type="text" id="lon" placeholder="0.000000"></div>' +
      '  </div>' +
      '  <div class="gps-section">' +
      '    <label>📌 Saved GPS Locations</label>' +
      '    <div class="field-row" style="margin-top:8px;">' +
      '      <input type="text" id="gpsName" placeholder="Location name..." style="flex:1;">' +
      '      <button class="btn btn-small" data-explain="Saves the position read by GPS as one of your places." id="saveGpsBtn">💾 Save</button>' +
      '    </div>' +
      '    <div id="gpsList"></div>' +
      '  </div>' +
      '  <label class="toggle"><input type="checkbox" id="saveMessages" checked><span>Save my messages</span></label>' +
      '  <button data-explain="Saves your profile (name, avatar, languages and more) on this device." id="saveUser">💾 SAVE PROFILE</button>' +
      '    <div class="rb-subtitle">⚰️ EXTRA</div>' +
      '  <div class="useRbox-right" id="useRboxRight">' +
      '    <div class="useRbox-right-header">👤 Profile Editor</div>' +
      '    <label>⚰️ What kind of funeral do you want?</label>' +
      '    <select id="funeralKind"><option value="">— choose —</option><option value="burial">🪦 Burial</option><option value="cremation">🔥 Cremation</option><option value="space">🚀 Shoot me into space</option><option value="sea">🌊 At sea</option><option value="tree">🌳 Become a tree</option><option value="party">🎉 A party, not a funeral</option><option value="none">🤫 No funeral, no fuss</option></select>' +
      '    <textarea id="funeralNote" placeholder="Music, place, who to invite, what to do with the ashes..."></textarea>' +
      '    <label>⚰️ The way you want to be buried</label>' +
      '    <input type="text" id="burialWish" placeholder="shoot in the space">' +
      '    <label>✨ Other public note</label>' +
      '    <textarea id="publicNote"></textarea>' +
      '    <button type="button" class="btn" data-explain="Saves the extra profile fields on this device." id="saveExtra">💾 SAVE EXTRA</button>' +
      '    <small>Stored on this device for now.</small>' +
      '    <div class="rb-subtitle">🔓 WHAT THE ROOM MAY SEE</div>' +
      '    <label class="toggle"><input type="checkbox" id="rbShareLoc"><span>Share my current location</span></label>' +
      '    <label class="toggle"><input type="checkbox" id="rbShareBurial"><span>Make my burial wish public</span></label>' +
      '    <small class="rb-dev-note">Your name, P.S. and public note are shared when you show yourself in the room list.</small>' +
      '    <div class="rb-subtitle">🍽️ MY RESTAURANT</div>' +
      '    <label class="toggle"><input type="checkbox" id="rbSubscriber"><span>I am a subscriber (supporter)</span></label>' +
      '    <div id="rbRestSettings">' +
      '      <label>Opening</label><select id="rbRestOpen"><option value="online">🟢 Open when I am online</option><option value="closed">🔴 Closed</option></select>' +
      '      <label>Tables (the services I serve)</label><div id="rbTableChoices"></div>' +
      '    </div>' +
      '    <button type="button" class="btn" data-explain="Saves what you share publicly and your restaurant opening and tables." id="rbSavePublic" style="width:100%;margin-top:10px;">💾 SAVE SHARING AND RESTAURANT</button>' +
      '  </div>' +
      '  </div></details>' +
      '  <div class="rb-people"><div class="rb-col-title">👥 IN THIS ROOM <span id="rbPeopleRoom"></span></div>' +
      '    <div id="rbPeopleList"><div class="rb-empty">No one else here yet</div></div>' +
      '  </div>' +
      '   </section>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  // for any profile text that ever has to go into HTML
  function escapeHtml(text) {
    return str(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function rbLsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function rbLsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function init() {
    // inside a window/layer on a page that already shows the R circle, one is enough
    try {
      if (window.top !== window && window.top.document.getElementById('topRightUser')) return;
    } catch (e) {}
    injectStylesheet();
    var scope = buildMarkup();
    var q = function (sel) { return scope.querySelector(sel); };

    var savedLocations = [];
    var root = scope;
    var Rcircle = q('#Rcircle');
    var useRbox = q('#useRbox');
    var useRboxNotch = q('#useRboxNotch');

    Rcircle.onclick = function () { root.classList.toggle('open'); };
    var scopeForNag = scope;
    /* Nag flow */
    var nagSteps = [
      { type: "text", text: "☕ Support the universe — it's only £10 per year" },
      { type: "text", text: "Promise you will pay one day so that this thing can be developed" },
      { type: "checkbox", text: "I'm not a robot", id: "notRobot" },
      { type: "text", text: "One coffee keeps the servers and the experiments running" },
      { type: "kofi-ok", text: "Help keep it going" },
      { type: "text", text: "OK — you can hide this for now (it will come back next visit)" }
    ];
    var nagIndex = 0;
    var nagMsg = q('#rvNagMsg');
    var nagOk = q('#rvNagOk');
    var insideHeader = q('#rvInsideHeader');

    function renderStep(step) {
      if (!nagMsg || !nagOk) return;
      nagMsg.innerHTML = "";
      nagOk.style.display = "";
      if (step.type === "text") {
        nagMsg.textContent = step.text;
        nagOk.textContent = "OK";
      } else if (step.type === "checkbox") {
        nagMsg.innerHTML = '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="' + step.id + '" style="width:18px;height:18px;"> ' + escapeHtml(step.text) + '</label>';
        nagOk.textContent = "OK";
        nagOk.disabled = true;
        var cb = nagMsg.querySelector("input");
        if (cb) cb.onchange = function () { nagOk.disabled = !cb.checked; };
      } else if (step.type === "kofi-ok") {
        var kofiFirst = Math.random() < 0.5;
        var kofiHtml = '<a href="https://ko-fi.com/rudventur" target="_blank" rel="noopener" class="rv-nag-kofi" style="margin:0 6px;">☕ Ko-fi</a>';
        var okHtml = '<button type="button" class="rv-nag-ok" data-explain="Hides this notice." id="rvNagOkInline">OK</button>';
        nagMsg.innerHTML = step.text + '<br>' + (kofiFirst ? kofiHtml + okHtml : okHtml + kofiHtml);
        nagOk.style.display = "none";
        var inlineOk = nagMsg.querySelector("#rvNagOkInline");
        if (inlineOk) inlineOk.onclick = advanceNag;
      }
    }
    function advanceNag() {
      nagIndex++;
      if (nagIndex >= nagSteps.length) {
        if (insideHeader) insideHeader.classList.add("rv-nag-done");
        rbLsSet("rv_nag_done", "1");
        return;
      }
      renderStep(nagSteps[nagIndex]);
    }
    renderStep(nagSteps[0]);
    if (nagOk) nagOk.onclick = advanceNag;
    if (rbLsGet("rv_nag_done") === "1" && insideHeader) insideHeader.classList.add("rv-nag-done");

    /* Extra fields */
    var burialInput = q('#burialWish');
    var publicNoteInput = q('#publicNote');
    var saveExtraBtn = q('#saveExtra');
    function loadExtra() {
      try {
        var extra = JSON.parse(rbLsGet('rud_useRbox_extra') || '{}');
        if (burialInput) burialInput.value = extra.burialWish || '';
        if (publicNoteInput) publicNoteInput.value = extra.publicNote || '';
      } catch (e) {}
    }
    function saveExtra() {
      var extra = {
        burialWish: burialInput ? burialInput.value : '',
        publicNote: publicNoteInput ? publicNoteInput.value : '',
        updatedAt: new Date().toISOString()
      };
      rbLsSet('rud_useRbox_extra', JSON.stringify(extra));
      if (saveExtraBtn) {
        var old = saveExtraBtn.textContent;
        saveExtraBtn.textContent = '✅ SAVED';
        setTimeout(function () { saveExtraBtn.textContent = old; }, 1200);
      }
    }
    if (saveExtraBtn) saveExtraBtn.onclick = saveExtra;
    loadExtra();


    q('#iconUser').onclick = function () { useRbox.classList.toggle('hidden'); };
    q('#closeUser').onclick = function () {
      useRbox.classList.add('hidden');
      root.classList.remove('open');
    };

    /* Collapse / notch — lighter minimize state, distinct from close */
    function setCollapsed(collapsed) {
      useRbox.classList.toggle('collapsed', collapsed);
      lsSet('rud_useRbox_collapsed', collapsed ? '1' : '0');
    }
    q('#collapseUser').onclick = function () { setCollapsed(true); };
    useRboxNotch.onclick = function () { setCollapsed(!useRbox.classList.contains('collapsed')); };
    if (lsGet('rud_useRbox_collapsed') === '1') useRbox.classList.add('collapsed');

    /* Transparency toggle */
    var PANEL_BG_SOLID = 'rgba(0, 15, 5, 0.96)';
    var PANEL_BG_TRANSPARENT = 'rgba(0, 15, 5, 0.35)';
    var panelTransparent = lsGet('rud_useRbox_transparent') === '1';
    function applyTransparency() {
      root.style.setProperty('--panel-bg', panelTransparent ? PANEL_BG_TRANSPARENT : PANEL_BG_SOLID);
      var btn = q('#toggleTransparency');
      btn.textContent = panelTransparent ? '👻' : '🌑';
      btn.title = panelTransparent ? 'Switch to solid background' : 'Switch to see-through background';
    }
    q('#toggleTransparency').onclick = function () {
      panelTransparent = !panelTransparent;
      lsSet('rud_useRbox_transparent', panelTransparent ? '1' : '0');
      applyTransparency();
    };
    applyTransparency();

    /* Live clock */
    function updateClock() {
      q('#liveClock').textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }
    setInterval(updateClock, 1000);
    updateClock();

    /* GPS */
    q('#gpsBtn').onclick = function (event) {
      if (!navigator.geolocation) { alert('GPS not supported by your browser!'); return; }
      var btn = event.target;
      btn.textContent = '⏳...';
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        function (position) {
          var lat = position.coords.latitude.toFixed(6);
          var lon = position.coords.longitude.toFixed(6);
          q('#lat').value = lat;
          q('#lon').value = lon;
          q('#currentLoc').value = lat + ', ' + lon;
          btn.textContent = '✅ GPS';
          btn.disabled = false;
          setTimeout(function () { btn.textContent = '📍 GPS'; }, 2000);
        },
        function (error) {
          alert('GPS Error: ' + error.message);
          btn.textContent = '❌ GPS';
          btn.disabled = false;
          setTimeout(function () { btn.textContent = '📍 GPS'; }, 2000);
        }
      );
    };

    // every piece of profile text goes in with textContent, never as HTML
    function renderGPSList() {
      var list = q('#gpsList');
      list.textContent = '';
      if (savedLocations.length === 0) {
        var empty = document.createElement('div');
        empty.style.cssText = 'text-align:center; opacity:0.5; padding:10px;';
        empty.textContent = 'No saved locations';
        list.appendChild(empty);
        return;
      }
      savedLocations.forEach(function (loc) {
        var item = document.createElement('div');
        item.className = 'gps-item';
        var text = document.createElement('div');
        var name = document.createElement('div');
        name.className = 'gps-item-name';
        name.textContent = str(loc.name);
        var coords = document.createElement('div');
        coords.className = 'gps-item-coords';
        coords.textContent = str(loc.lat) + ', ' + str(loc.lon);
        text.appendChild(name); text.appendChild(coords);
        var del = document.createElement('button');
        del.className = 'gps-item-delete';
        del.type = 'button';
        del.title = 'Delete'; del.setAttribute('data-explain', 'Deletes this saved place from your list (asks first).');
        del.textContent = '\uD83D\uDDD1\uFE0F';
        del.onclick = function () {
          if (!confirm('Delete this location?')) return;
          savedLocations = savedLocations.filter(function (l) { return l.id !== loc.id; });
          renderGPSList();
          persist();
        };
        item.appendChild(text); item.appendChild(del);
        list.appendChild(item);
      });
    }

    q('#saveGpsBtn').onclick = function () {
      var name = q('#gpsName').value.trim();
      var lat = q('#lat').value.trim();
      var lon = q('#lon').value.trim();
      if (!name) { alert('Please enter a location name!'); return; }
      if (!lat || !lon) { alert('Please get GPS coordinates first!'); return; }
      savedLocations.push({ id: Date.now(), name: name, lat: lat, lon: lon });
      q('#gpsName').value = '';
      renderGPSList();
      persist();
    };

    /* Save / load user data */
    function collectUserData() {
      return {
        username: q('#username').value,
        channel: q('#channel').value,
        psignature: q('#psignature').value,
        funeralKind: q('#funeralKind').value,
        funeralNote: q('#funeralNote').value,
        currentLoc: q('#currentLoc').value,
        lat: q('#lat').value,
        lon: q('#lon').value,
        saveMessages: q('#saveMessages').checked,
        savedLocations: savedLocations
      };
    }
    function persist() {
      if (isPrivate()) return;   // incognito: nothing about you is kept
      localStorage.setItem('rud_useRbox_v2', JSON.stringify(collectUserData()));
    }
    function saveUser() {
      persist();
      var btn = q('#saveUser');
      var oldText = btn.textContent;
      btn.textContent = '✅ SAVED!';
      btn.style.background = '#00ff41';
      setTimeout(function () {
        btn.textContent = oldText;
        btn.style.background = '';
      }, 2000);
    }
    function loadUser() {
      migrate();   // picks up anything an older app changed since
      var u = readProfile();
      if (!u) return;
      q('#username').value = u.username || 'Rudy';
      q('#psignature').value = u.psignature || '';
      q('#funeralKind').value = u.funeralKind || '';
      q('#funeralNote').value = u.funeralNote || '';
      q('#currentLoc').value = u.currentLoc || '';
      q('#lat').value = u.lat || '';
      q('#lon').value = u.lon || '';
      q('#saveMessages').checked = u.saveMessages !== false;
      savedLocations = u.savedLocations || [];
      renderGPSList();
    }
    /* 🌐 online / 🕶 private — per device, shared with the popcorn window
       (embed/popcornWindow.js) through localStorage 'rvPrivacy' */
    function isPrivate() { return localStorage.getItem('rvPrivacy') === 'private'; }
    function setPrivacy(mode) {
      if (window.rvPrivacy) { window.rvPrivacy.set(mode); return; }
      localStorage.setItem('rvPrivacy', mode);
      applyPrivacy();
    }
    function applyPrivacy() {
      var priv = isPrivate();
      useRbox.classList.toggle('incognito', priv);
      Rcircle.classList.toggle('incognito', priv);
      var b = q('#togglePrivacy');
      b.textContent = priv ? '🕶' : '🌐';
      b.title = priv ? 'Private mode — tap to go online' : 'Online — tap for private mode';
    }
    q('#togglePrivacy').onclick = function () { setPrivacy(isPrivate() ? 'online' : 'private'); };
    q('#goOnline').onclick = function () { setPrivacy('online'); };
    document.addEventListener('rvprivacy', applyPrivacy);
    window.addEventListener('storage', function (e) { if (e.key === 'rvPrivacy') applyPrivacy(); });
    applyPrivacy();

    /* 📷 🎤 camera + mic — the switches and settings live here and in the popcorn
       window (embed/popcornWindow.js), sharing these localStorage keys; each side
       fires a document 'rvdevices' event so the other catches up straight away */
    var K_CAM = 'rvCamAllowed', K_MIC = 'rvMicAllowed', K_FACE = 'rvCamFacing',
        K_MIRROR = 'rvCamMirror', K_BRIGHT = 'rvCamBright', K_CONTRAST = 'rvCamContrast';
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function tellDevices() {
      try { document.dispatchEvent(new CustomEvent('rvdevices', { detail: { from: 'useRbox' } })); } catch (e) {}
      renderDevices();
    }
    function renderDevices() {
      var pc = window.rvPopcorn;
      [['#rbCam', K_CAM, 'camOn'], ['#rbMic', K_MIC, 'micOn']].forEach(function (d) {
        var b = q(d[0]), allowed = lsGet(d[1]) === '1';
        var live = !!(pc && pc[d[2]] && pc[d[2]]());
        b.classList.toggle('on', allowed);
        b.querySelector('small').textContent = live ? 'ON — running'
          : allowed ? 'ON — starts in 🍿' : 'OFF';
      });
      var facing = lsGet(K_FACE) === 'environment' ? 'environment' : 'user';
      q('#rbFacing').value = facing;
      var m = lsGet(K_MIRROR);
      q('#rbMirror').checked = m === '1' ? true : m === '0' ? false : facing === 'user';
      var br = parseInt(lsGet(K_BRIGHT), 10) || 0, ct = parseInt(lsGet(K_CONTRAST), 10) || 0;
      q('#rbBright').value = br;
      q('#rbContrast').value = ct;
      q('#rbBrightVal').textContent = (br > 0 ? '+' : '') + br;
      q('#rbContrastVal').textContent = (ct > 0 ? '+' : '') + ct;
      q('#rbOpenPopcorn').style.display = pc ? '' : 'none';
      // 📲 the app install lives in embed/rvView.js; hidden once installed
      q('#rbGetApp').style.display = window.rvView && window.rvView.canInstall && window.rvView.canInstall() ? '' : 'none';
    }
    q('#rbGetApp').onclick = function () { if (window.rvView) window.rvView.install(); };
    q('#rbCam').onclick = function () { lsSet(K_CAM, lsGet(K_CAM) === '1' ? '0' : '1'); tellDevices(); };
    q('#rbMic').onclick = function () { lsSet(K_MIC, lsGet(K_MIC) === '1' ? '0' : '1'); tellDevices(); };
    q('#rbFacing').onchange = function () { lsSet(K_FACE, this.value); tellDevices(); };
    q('#rbMirror').onchange = function () { lsSet(K_MIRROR, this.checked ? '1' : '0'); tellDevices(); };
    q('#rbBright').oninput = function () { lsSet(K_BRIGHT, this.value); tellDevices(); };
    q('#rbContrast').oninput = function () { lsSet(K_CONTRAST, this.value); tellDevices(); };
    q('#rbCamReset').onclick = function () {
      [K_MIRROR, K_BRIGHT, K_CONTRAST].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      tellDevices();
    };
    q('#rbOpenPopcorn').onclick = function () {
      if (!window.rvPopcorn) return;
      useRbox.classList.add('hidden');   // out of the way of the popcorn window's door
      root.classList.remove('open');
      window.rvPopcorn.open();
    };
    document.addEventListener('rvdevices', function (e) { if (!e.detail || e.detail.from !== 'useRbox') renderDevices(); });
    window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('rvCam') === 0) renderDevices(); });
    // popcornWindow.js loads after this script on the hub; catch up once it's there
    window.addEventListener('load', renderDevices);
    q('#iconUser').addEventListener('click', renderDevices);
    renderDevices();

    q('#refreshUser').onclick = loadUser;
    // 🎲 a random traveller name (press 💾 SAVE PROFILE to keep it)
    var RAND_ADJ = ['Neon', 'Cyber', 'Quantum', 'Electric', 'Atomic', 'Cosmic', 'Digital', 'Neural', 'Plasma', 'Sonic'];
    var RAND_NOUN = ['Wanderer', 'Explorer', 'Traveler', 'Seeker', 'Nomad', 'Pioneer', 'Voyager', 'Drifter', 'Runner', 'Walker'];
    function randomName() {
      var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
      return pick(RAND_ADJ) + pick(RAND_NOUN) + Math.floor(Math.random() * 999);
    }
    q('#randomUser').onclick = function () { q('#username').value = randomName(); q('#username').focus(); };
    q('#channelInfo').onclick = function () { alert('Your room is shared with Windows 13. Join one below, or leave to go back to main.'); };
    q('#saveUser').onclick = saveUser;

    function loadChannel() {
      q('#channel').value = lsGet('rudventur_channel') || 'main';
    }

    /* Shared view mode — same key + URL param convention as translator_v7.html's
       goTo(), so opening the translator carries the current fullscreen/orientation
       state instead of resetting it. */
    var VIEW_MODE_KEY = 'rvViewMode';
    function currentViewMode() {
      return lsGet(VIEW_MODE_KEY) || '';
    }
    // the one translator: the map-merger-venti repo's copy (the hub's old copy redirects there)
    var TRANSLATOR_URL = window.RUDVENTUR_TRANSLATOR_URL || 'https://rudventur.github.io/map-merger-venti/translator_v7.html';
    function goTo(url) {
      if (window.rvView && rvView.redirect) { rvView.redirect(url); return; }
      var mode = currentViewMode(), target = url;
      try {
        var u = new URL(url, location.href);
        if (mode && mode !== 'normal') u.searchParams.set('view', mode);
        var lang = lsGet('rvUserLang');
        if (lang) u.searchParams.set('lang', lang);
        target = u.href;
      } catch (e) {}
      window.open(target, '_blank', 'noopener');
    }
    // the useR's language, shared with the translator (?lang=) and stored on this device
    var langSel = q('#rbLang');
    var navLang = (navigator.language || 'en').toLowerCase();
    var savedLang = lsGet('rvUserLang') || navLang;
    if (!langSel.querySelector('option[value="' + savedLang + '"]')) savedLang = savedLang.split('-')[0];
    if (!langSel.querySelector('option[value="' + savedLang + '"]')) savedLang = 'en';
    langSel.value = savedLang;
    langSel.onchange = function () { lsSet('rvUserLang', this.value); };
    function withLang(url) {
      try { var u = new URL(url, location.href); var l = lsGet('rvUserLang') || langSel.value; if (l) u.searchParams.set('lang', l); return u.href; } catch (e) { return url; }
    }
    q('#iconTranslator').onclick = function () {
      if (!lsGet('rvUserLang')) lsSet('rvUserLang', langSel.value);
      goTo(withLang(TRANSLATOR_URL));
    };

    loadUser();
    loadChannel();

    /* ===== Room for useRs + people in the room ===== */
    var KNOWN_ROOMS = ['main', 'prompter', 'chemventur', 'map-merger', 'global-chat'];
    var people = [];
    function setRoom(name) {
      name = str(name).trim();
      if (!name) return;
      lsSet('rudventur_channel', name);
      loadChannel();
      renderPeople();
      try { document.dispatchEvent(new CustomEvent('rv:channel', { detail: { channel: name } })); } catch (e) {}
    }
    var rk = q('#rbKnownRooms');
    KNOWN_ROOMS.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn btn-small'; b.textContent = name;
      b.setAttribute('data-explain', 'Moves you into the ' + name + ' room, where you see the people in that room.');
      b.onclick = function () { setRoom(name); };
      rk.appendChild(b);
    });
    q('#rbRoomJoin').onclick = function () { setRoom(q('#rbRoomInput').value); q('#rbRoomInput').value = ''; };
    q('#rbRoomInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') q('#rbRoomJoin').click(); });
    q('#rbRoomLeave').onclick = function () { setRoom('main'); };
    q('#rbRoomVisible').checked = lsGet('rvRoomVisible') === '1';   // off unless the useR turns it on
    q('#rbRoomVisible').onchange = function () { lsSet('rvRoomVisible', this.checked ? '1' : '0'); };

    function showPerson(p) {
      var box = q('#rbViewed');
      q('#rbViewedTitle').textContent = '👁 ' + (p.username || p.name || 'useR');
      var rows = [['📝 P.S.', p.psignature], ['📍 Location', p.currentLoc], ['✨ Public note', p.publicNote], ['⚰️ Burial wish', p.burialWish]];
      q('#rbViewedBody').innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
        return '<label>' + r[0] + '</label><div class="rb-viewed-val">' + escapeHtml(r[1]) + '</div>';
      }).join('') || '<div class="rb-empty">This useR has not shared anything yet.</div>';
      box.classList.remove('hidden');
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    q('#rbViewedClose').onclick = function () { q('#rbViewed').classList.add('hidden'); };
    function renderPeople() {
      var room = lsGet('rudventur_channel') || 'main';
      q('#rbPeopleRoom').textContent = '· ' + room;
      var list = q('#rbPeopleList');
      list.innerHTML = '';
      var here = people.filter(function (p) { return !p.channel || p.channel === room; });
      if (!here.length) { list.innerHTML = '<div class="rb-empty">No one else here yet</div>'; return; }
      here.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'rb-person';
        b.textContent = '👤 ' + (p.username || p.name || 'useR');
        b.setAttribute('data-explain', 'Shows what this person shares publicly: note, location and wishes.');
        b.onclick = function () { showPerson(p); };
        list.appendChild(b);
      });
    }
    // hook for a future presence source (for example the Firebase database popcoin already uses)
    window.rvUserbox.setChannelPeople = function (list) {
      people = Array.isArray(list) ? list.filter(function (p) { return p && typeof p === 'object'; }) : [];
      renderPeople();
    };
    window.rvUserbox.showProfile = showPerson;
    renderPeople();

    /* ===== services (left column) = the tables a restaurant can serve ===== */
    var SITE = (function () { try { return new URL('../', baseUrl).href; } catch (e) { return location.origin + '/'; } })();
    var SERVICES = [
      { id: 'hub', name: '🏠 RudVentur hub', url: SITE },
      { id: 'translator', name: '🌐 Translator, chat and keyboards', url: TRANSLATOR_URL },
      { id: 'chemventur', name: '🧪 ChemVentur', url: 'https://rudventur.github.io/v120-ChemVentur/' },
      { id: 'map-merger', name: '🗺️ Map merger', url: 'https://rudventur.github.io/map-merger-venti/' },
      { id: 'windows13', name: '🪟 Windows 13', url: 'https://rudventur.github.io/windows13/WINDOWS13-MASTER.html' },
      { id: 'punk-script', name: '🎸 Punk script', url: 'https://rudventur.github.io/punk-script/' },
      { id: 'pumpkin-guy', name: '🎃 pumpKIN Guy', url: SITE + 'pumpKIN-Guy/' },
      { id: 'popcoin', name: '🪙 PopCOIN wallet', url: SITE + 'popcoin/' },
      { id: 'camera-background', name: '📷 Camera background', url: SITE + 'camera-background.html' },
      { id: 'weather', name: '⛅ Weather', url: SITE + 'yesterday-today-tomorrow-weather.html' }
    ];
    function serviceById(id) { return SERVICES.filter(function (x) { return x.id === id; })[0]; }
    var tableBox = q('#rbTableChoices');   // the service links themselves are the shop items in the left section
    SERVICES.forEach(function (x) {
      var a = document.createElement('a');
      var l = document.createElement('label');
      l.className = 'toggle';
      l.innerHTML = '<input type="checkbox" value="' + x.id + '"><span>' + escapeHtml(x.name) + '</span>';
      tableBox.appendChild(l);
    });

    /* ===== public settings (sharing, subscriber, restaurant) — stored on this device ===== */
    var PUB_KEY = 'rvPublicSettings';
    function readPub() {
      var d = {}; try { d = JSON.parse(lsGet(PUB_KEY) || '{}') || {}; } catch (e) {}
      return { shareLoc: !!d.shareLoc, shareBurial: !!d.shareBurial, subscriber: !!d.subscriber,
        restOpen: d.restOpen === 'closed' ? 'closed' : 'online', tables: Array.isArray(d.tables) ? d.tables : [] };
    }
    function loadPub() {
      var d = readPub();
      q('#rbShareLoc').checked = d.shareLoc; q('#rbShareBurial').checked = d.shareBurial;
      q('#rbSubscriber').checked = d.subscriber; q('#rbRestOpen').value = d.restOpen;
      tableBox.querySelectorAll('input').forEach(function (i) { i.checked = d.tables.indexOf(i.value) >= 0; });
      q('#rbRestSettings').style.display = d.subscriber ? '' : 'none';
    }
    q('#rbSubscriber').onchange = function () { q('#rbRestSettings').style.display = this.checked ? '' : 'none'; };
    q('#rbSavePublic').onclick = function () {
      var tables = [];
      tableBox.querySelectorAll('input:checked').forEach(function (i) { tables.push(i.value); });
      lsSet(PUB_KEY, JSON.stringify({ shareLoc: q('#rbShareLoc').checked, shareBurial: q('#rbShareBurial').checked,
        subscriber: q('#rbSubscriber').checked, restOpen: q('#rbRestOpen').value, tables: tables }));
      var b = this, t = b.textContent; b.textContent = '✅ SAVED'; setTimeout(function () { b.textContent = t; }, 1200);
      renderMyInfo(); presence.publish();
    };
    loadPub();

    /* ===== middle column: this useR's info, read only ===== */
    function extraData() { try { return JSON.parse(lsGet('rud_useRbox_extra') || '{}') || {}; } catch (e) { return {}; } }
    function renderMyInfo(live) {
      var x = extraData(), d = readPub(), pf = getProfile();
      var dr = window.rvUserbox.previewDraft ? window.rvUserbox.previewDraft() : { avatar: pf.avatar, languages: pf.languages };
      if (live) { d.shareLoc = q('#rbShareLoc').checked; d.subscriber = q('#rbSubscriber').checked; d.tables = []; tableBox.querySelectorAll('input:checked').forEach(function (i) { d.tables.push(i.value); }); x.publicNote = q('#publicNote').value; }
      var langs = Array.isArray(dr.languages) ? dr.languages : str(dr.languages).split(',').filter(Boolean);
      var rows = [['🙂 Avatar', str(dr.avatar)], ['👤 Name', q('#username').value], ['📝 P.S.', q('#psignature').value],
        ['📍 Location', q('#currentLoc').value + (q('#currentLoc').value ? (d.shareLoc ? '  (shared)' : '  (private)') : '')],
        ['✨ Public note', x.publicNote], ['⚰️ Burial wish', x.burialWish ? x.burialWish + (d.shareBurial ? '  (public)' : '  (private)') : ''],
        ['🗣 Languages', langs.map(function (v) { var o = q('#rbLang option[value="' + v + '"]'); return o ? o.textContent : v; }).join(', ')],
        ['📡 Room', lsGet('rudventur_channel') || 'main'],
        ['🍽️ Restaurant', d.subscriber ? (d.restOpen === 'online' ? 'Open when online · ' + d.tables.length + ' tables' : 'Closed') : '']];
      q('#rbMyInfo').innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
        return '<div class="rb-info-row"><span>' + r[0] + '</span><b>' + escapeHtml(r[1]) + '</b></div>';
      }).join('');
    }
    q('#saveUser').addEventListener('click', function () { renderMyInfo(); presence.publish(); });
    if (saveExtraBtn) saveExtraBtn.addEventListener('click', function () { renderMyInfo(); presence.publish(); });

    /* ===== restaurants (middle column) ===== */
    function restaurantName(p) { return '🍽️ ' + (p.username || 'useR') + '\'s restaurant'; }
    function renderRestaurants() {
      var box = q('#rbRestaurants'); box.innerHTML = '';
      var open = people.filter(function (p) { return p.restaurant && p.restaurant.open && p.restaurant.tables.length; });
      if (!open.length) { box.innerHTML = '<div class="rb-empty">No restaurants open right now</div>'; return; }
      open.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'rb-person';
        b.textContent = restaurantName(p) + ' · ' + p.restaurant.tables.length + ' tables';
        b.setAttribute('data-explain', 'Shows the open tables at this restaurant, so you can sit down and talk.');
        b.onclick = function () { showTables(p); };
        box.appendChild(b);
      });
    }
    function showTables(p) {
      q('#rbTablesTitle').textContent = restaurantName(p);
      var list = q('#rbTablesList'); list.innerHTML = '';
      p.restaurant.tables.forEach(function (id) {
        var x = serviceById(id); if (!x) return;
        var a = document.createElement('a');
        a.className = 'rb-service'; a.href = x.id === 'translator' ? withLang(x.url) : x.url;
        a.target = '_blank'; a.rel = 'noopener'; a.textContent = '🪑 ' + x.name;
        list.appendChild(a);
      });
      q('#rbTables').classList.remove('hidden');
    }
    q('#rbTablesClose').onclick = function () { q('#rbTables').classList.add('hidden'); };
    var origSet = window.rvUserbox.setChannelPeople;
    window.rvUserbox.setChannelPeople = function (list) { origSet(list); renderRestaurants(); };

    /* ===== live presence: the popcoin Firebase project's Realtime Database =====
       presence/rooms/<room>/<uid>. Only written while "Show me in the room list" is on;
       only public fields; marked offline by the server when this tab goes away. */
    var presence = (function () {
      var st = { db: null, uid: null, myRef: null, room: null, listen: null, starting: null, offlineAfter: 0 };
      var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
      function cleanRoom(r) { r = str(r).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32); return r || 'main'; }
      function loadScript(src) {
        return new Promise(function (res, rej) {
          var old = document.querySelector('script[src="' + src + '"]');
          if (old) { if (old.dataset.loaded || window.firebase) { res(); return; } old.addEventListener('load', res); old.addEventListener('error', rej); return; }
          var el = document.createElement('script'); el.src = src;
          el.onload = function () { el.dataset.loaded = '1'; res(); }; el.onerror = function () { rej(new Error('could not load ' + src)); };
          document.head.appendChild(el);
        });
      }
      function config() {
        if (window.RV_PRESENCE_FIREBASE) return Promise.resolve(window.RV_PRESENCE_FIREBASE);
        if (window.POPCOIN_FIREBASE) return Promise.resolve(window.POPCOIN_FIREBASE);
        return loadScript(SITE + 'popcoin/config.js').then(function () { return window.POPCOIN_FIREBASE || null; });
      }
      function start() {
        if (st.starting) return st.starting;
        st.starting = config().then(function (cfg) {
          if (!cfg) throw new Error('no Firebase settings');
          // never load the app library twice: that would wipe popcoin's Firebase app
          var chain = window.firebase ? Promise.resolve() : loadScript(SDK + 'firebase-app-compat.js');
          return chain
            .then(function () { return firebase.auth ? null : loadScript(SDK + 'firebase-auth-compat.js'); })
            .then(function () { return firebase.database ? null : loadScript(SDK + 'firebase-database-compat.js'); })
            .then(function () {
              var app = firebase.apps.filter(function (a) { return a.name === 'rvpresence'; })[0] || firebase.initializeApp(cfg, 'rvpresence');
              var auth = app.auth(); st.db = app.database();
              if (cfg.emulator) { auth.useEmulator('http://127.0.0.1:' + cfg.emulator.auth); st.db.useEmulator('127.0.0.1', cfg.emulator.db); }
              return new Promise(function (resolve, reject) {
                var off = auth.onAuthStateChanged(function (user) {
                  off();
                  if (user) resolve(user); else auth.signInAnonymously().then(function (c) { resolve(c.user); }, reject);
                }, reject);
              });
            })
            .then(function (user) { st.uid = user.uid; });
        });
        st.starting.catch(function (e) { st.starting = null; note('Live room list unavailable: ' + (e && e.message || e)); });
        return st.starting;
      }
      function note(t) { var n = q('#rbPresenceNote'); if (n && t) n.textContent = t; }
      function visible() { return q('#rbRoomVisible').checked && !isPrivate(); }
      function myRecord() {
        var d = readPub(), x = extraData();
        var rec = { name: str(q('#username').value).slice(0, 32) || 'useR', online: true,
          lastSeen: firebase.database.ServerValue.TIMESTAMP, sub: d.subscriber };
        var ps = str(q('#psignature').value).slice(0, 200); if (ps) rec.ps = ps;
        var nt = str(x.publicNote).slice(0, 300); if (nt) rec.note = nt;
        if (d.shareLoc && q('#currentLoc').value) rec.loc = str(q('#currentLoc').value).slice(0, 80);
        if (d.shareBurial && x.burialWish) rec.burial = str(x.burialWish).slice(0, 120);
        if (d.subscriber) {
          var tables = {};
          d.tables.forEach(function (t) { if (serviceById(t)) tables[t] = true; });
          rec.rest = { open: d.restOpen === 'online' };
          if (Object.keys(tables).length) rec.rest.tables = tables;
        }
        return rec;
      }
      function withdraw() {
        if (!st.myRef) return Promise.resolve();
        var r = st.myRef; st.myRef = null;
        r.onDisconnect().cancel();
        return r.remove().catch(function () {});
      }
      function publish() {
        if (!visible()) { return withdraw(); }
        return start().then(function () {
          var room = cleanRoom(lsGet('rudventur_channel') || 'main');
          var ref = st.db.ref('presence/rooms/' + room + '/' + st.uid);
          var pre = st.myRef && st.myRef.toString() !== ref.toString() ? withdraw() : Promise.resolve();
          return pre.then(function () {
            st.myRef = ref;
            ref.onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
            return ref.set(myRecord());
          }).then(function () { note('You are shown live in room "' + room + '".'); });
        }).catch(function (e) { note('Could not share your presence: ' + (e && e.message || e)); });
      }
      function listen() {
        return start().then(function () {
          var room = cleanRoom(lsGet('rudventur_channel') || 'main');
          if (st.listen && st.listen.room === room) return;
          if (st.listen) st.listen.ref.off();
          var ref = st.db.ref('presence/rooms/' + room);
          st.listen = { room: room, ref: ref };
          ref.on('value', function (snap) {
            var list = [];
            snap.forEach(function (c) {
              var v = c.val() || {};
              if (c.key === st.uid || !v.online) return;
              list.push({ id: c.key, username: v.name, psignature: v.ps, currentLoc: v.loc, publicNote: v.note,
                burialWish: v.burial, channel: lsGet('rudventur_channel') || 'main', subscriber: !!v.sub,
                restaurant: v.sub && v.rest ? { open: !!v.rest.open, tables: Object.keys(v.rest.tables || {}) } : null });
            });
            window.rvUserbox.setChannelPeople(list);
          }, function (e) { note('Live room list unavailable: ' + (e && e.message || e)); });
        }).catch(function () {});
      }
      return { publish: publish, listen: listen, withdraw: withdraw, cleanRoom: cleanRoom, state: st, start: start };
    })();
    window.rvUserbox.presence = { publish: presence.publish, listen: presence.listen, leave: presence.withdraw };
    q('#rbRoomVisible').addEventListener('change', function () { presence.publish(); });
    document.addEventListener('rv:channel', function () { renderMyInfo(); presence.publish(); presence.listen(); });
    // start reading the room only once the useR opens the box (no sign-in for every page view)
    q('#iconUser').addEventListener('click', function () { presence.listen(); presence.publish(); });
    if (lsGet('rvRoomVisible') === '1') presence.publish().then(presence.listen);

    /* ===== view modes: 3 sections · half screen (one section, tabs or swipe) · full screen (everything) ===== */
    var VIEW_KEY = 'rvUseRboxView', VIEWS = ['three', 'half', 'full'];
    var VIEW_LABEL = { three: '▥ 3 sections', half: '◧ Half screen', full: '⛶ Full screen' };
    var viewBtn = document.createElement('button');
    viewBtn.id = 'rbViewMode'; viewBtn.type = 'button';
    viewBtn.setAttribute('data-explain', 'Changes how the useRbox is laid out: three sections side by side, half the screen with tabs, or the full screen.');
    q('#closeUser').parentNode.insertBefore(viewBtn, q('#closeUser'));
    var tabs = document.createElement('div');
    tabs.className = 'rb-tabs'; tabs.id = 'rbTabs';
    tabs.innerHTML = '<button type="button" data-col="left" data-explain="Shows the Options section: shop, camera, microphone, popcorn window and app.">⚙️ Options</button><button type="button" data-col="mid" data-explain="Shows the useR section: you, your room, the people here and the restaurants.">👤 useR</button><button type="button" data-col="right" data-explain="Shows the Editing section: the profile builder, places and channels.">✏️ Editing</button>';
    var cols = q('.rb-cols');
    cols.parentNode.insertBefore(tabs, cols);
    function setTab(col) {
      if (['left', 'mid', 'right'].indexOf(col) < 0) col = 'mid';
      cols.setAttribute('data-tab', col); rbLsSet('rvUseRboxTab', col);
      tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-col') === col); });
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setTab(b.getAttribute('data-col')); });
    (function () {   // swipe left / right switches the section in half-screen view
      var x0 = null, y0 = 0;
      cols.addEventListener('touchstart', function (e) { if (useRbox.getAttribute('data-view') !== 'half') return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      cols.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
        var order = ['left', 'mid', 'right'], i = order.indexOf(cols.getAttribute('data-tab'));
        setTab(order[Math.max(0, Math.min(2, i + (dx < 0 ? 1 : -1)))]);
      });
    })();
    function setView(v) {
      if (VIEWS.indexOf(v) < 0) v = 'three';
      useRbox.setAttribute('data-view', v); rbLsSet(VIEW_KEY, v);
      var next = VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length];
      viewBtn.textContent = VIEW_LABEL[v].split(' ')[0];
      viewBtn.title = 'View: ' + VIEW_LABEL[v].slice(2) + ' (tap for ' + VIEW_LABEL[next].slice(2).toLowerCase() + ')';
      if (v === 'full') useRbox.querySelectorAll('details.rb-fold').forEach(function (d) { d.open = true; });
    }
    viewBtn.onclick = function () { setView(VIEWS[(VIEWS.indexOf(useRbox.getAttribute('data-view')) + 1) % VIEWS.length]); };
    setTab(rbLsGet('rvUseRboxTab') || 'mid');
    setView(rbLsGet(VIEW_KEY) || 'three');

    /* ===== profile builder (Editing column): one step at a time, live preview in 👤 MY INFO ===== */
    var AVATARS = ['🙂', '😎', '🦊', '🐱', '🐸', '🦉', '🐙', '🌵', '🍄', '🚀', '🎸', '🧪', '🎃', '🌍', '👽', '🤖'];
    var LANGS = Array.prototype.map.call(q('#rbLang').options, function (o) { return { v: o.value, t: o.textContent }; });
    function langName(v) { var l = LANGS.filter(function (x) { return x.v === v; })[0]; return l ? l.t : v; }
    var draft = { avatar: '', languages: [] };
    function loadDraft() { var p = getProfile(); draft.avatar = str(p.avatar); draft.languages = str(p.languages).split(',').filter(Boolean).slice(0, 8); }   // stored as "pl,en" (profile fields are strings)
    var STEPS = [
      { t: '1 · Your name', h: 'What should people call you?', f: '<input type="text" data-b="username" maxlength="32" placeholder="Your name">' },
      { t: '2 · Signature', h: 'A short line under your name (your P.S.)', f: '<textarea data-b="psignature" maxlength="200" placeholder="You don\'t have to have legs to Trip"></textarea>' },
      { t: '3 · Avatar', h: 'Pick an emoji', f: '<div class="rb-avatars">' + AVATARS.map(function (a) { return '<button type="button" data-explain="Uses this emoji as your avatar." data-av="' + a + '">' + a + '</button>'; }).join('') + '</div>' },
      { t: '4 · Languages', h: 'The languages you speak (up to 8)', f: '<div class="field-row"><select data-b="langpick" style="flex:1;">' + LANGS.map(function (l) { return '<option value="' + l.v + '">' + escapeHtml(l.t) + '</option>'; }).join('') + '</select><button type="button" class="btn btn-small" data-b="langadd" data-explain="Adds the language picked in the list to the languages you speak (up to 8).">＋ ADD</button></div><div class="rb-chips" data-b="langlist"></div>' },
      { t: '5 · Public note', h: 'Something anyone in your room may read', f: '<textarea data-b="publicNote" maxlength="300"></textarea>' },
      { t: '6 · Location', h: 'Should the room see your current location?', f: '<label class="toggle"><input type="radio" name="rbBLoc" value="private"><span>🔒 Keep it private</span></label><label class="toggle"><input type="radio" name="rbBLoc" value="share"><span>📍 Share my current location</span></label>' },
      { t: '7 · Restaurant tables', h: 'Supporters get a restaurant; the tables are the services you serve', f: '<label class="toggle"><input type="checkbox" data-b="sub"><span>I am a subscriber (supporter)</span></label><div data-b="tables"></div>' },
      { t: '8 · Done', h: 'Check the preview in 👤 MY INFO, then save', f: '<div class="rb-dev-note">Saving keeps everything on this device. Only what you chose to share goes to the room, and only while "Show me in the room list" is on.</div>' }
    ];
    var builder = document.createElement('details');
    builder.className = 'rb-fold'; builder.id = 'rbBuilder'; builder.open = true;
    builder.innerHTML = '<summary>🧭 PROFILE BUILDER</summary><div class="rb-fold-body">' +
      '<div class="rb-steps" id="rbSteps">' + STEPS.map(function (s, i) { return '<span data-i="' + i + '"></span>'; }).join('') + '</div>' +
      STEPS.map(function (s, i) { return '<div class="rb-step hidden" data-step="' + i + '"><div class="rb-subtitle">' + s.t + '</div><small class="rb-dev-note">' + s.h + '</small>' + s.f + '</div>'; }).join('') +
      '<div class="field-row" style="margin-top:10px;"><button type="button" class="btn btn-small" data-explain="Goes back one step in the profile builder." id="rbBack">⬅ BACK</button><span style="flex:1"></span><button type="button" class="btn btn-small" data-explain="Goes to the next step in the profile builder." id="rbNext">NEXT ➡</button></div></div>';
    var rightCol = q('.rb-col-right');
    rightCol.insertBefore(builder, rightCol.firstChild);
    var bq = function (k) { return builder.querySelector('[data-b="' + k + '"]'); };
    var bTables = bq('tables');
    SERVICES.forEach(function (x) { var l = document.createElement('label'); l.className = 'toggle'; l.innerHTML = '<input type="checkbox" value="' + x.id + '"><span>' + escapeHtml(x.name) + '</span>'; bTables.appendChild(l); });
    var step = 0;
    function renderLangs() {
      bq('langlist').innerHTML = draft.languages.map(function (v) { return '<button type="button" class="rb-chip" data-explain="Removes this language from the languages you speak." data-lang="' + escapeHtml(v) + '">' + escapeHtml(langName(v)) + ' ✖</button>'; }).join('') || '<span class="rb-empty">None yet</span>';
    }
    function fillBuilder() {
      loadDraft(); var d = readPub();
      bq('username').value = q('#username').value; bq('psignature').value = q('#psignature').value;
      bq('publicNote').value = q('#publicNote').value || extraData().publicNote || '';
      builder.querySelectorAll('input[name="rbBLoc"]').forEach(function (r) { r.checked = r.value === (d.shareLoc ? 'share' : 'private'); });
      bq('sub').checked = d.subscriber;
      bTables.querySelectorAll('input').forEach(function (i) { i.checked = d.tables.indexOf(i.value) >= 0; });
      bq('langpick').value = q('#rbLang').value;
      renderLangs(); showStep(step);
    }
    function showStep(i) {
      step = Math.max(0, Math.min(STEPS.length - 1, i));
      builder.querySelectorAll('.rb-step').forEach(function (el) { el.classList.toggle('hidden', +el.getAttribute('data-step') !== step); });
      builder.querySelectorAll('#rbSteps span').forEach(function (el) { var n = +el.getAttribute('data-i'); el.className = n < step ? 'done' : n === step ? 'now' : ''; });
      builder.querySelectorAll('[data-av]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-av') === draft.avatar); });
      q('#rbBack').disabled = step === 0;
      q('#rbNext').textContent = step === STEPS.length - 1 ? '💾 SAVE PROFILE' : 'NEXT ➡';
      bTables.style.display = bq('sub').checked ? '' : 'none';
    }
    // every change goes straight into the editing fields, so 👤 MY INFO previews it at once
    function preview() {
      q('#username').value = bq('username').value; q('#psignature').value = bq('psignature').value;
      q('#publicNote').value = bq('publicNote').value;
      var shareLoc = builder.querySelector('input[name="rbBLoc"]:checked');
      q('#rbShareLoc').checked = !!shareLoc && shareLoc.value === 'share';
      q('#rbSubscriber').checked = bq('sub').checked; q('#rbRestSettings').style.display = bq('sub').checked ? '' : 'none';
      var on = []; bTables.querySelectorAll('input:checked').forEach(function (i) { on.push(i.value); });
      tableBox.querySelectorAll('input').forEach(function (i) { i.checked = on.indexOf(i.value) >= 0; });
      renderMyInfo(true);
    }
    builder.addEventListener('input', function () { preview(); showStep(step); });
    builder.addEventListener('change', function () { preview(); showStep(step); });
    builder.addEventListener('click', function (e) {
      var av = e.target.closest('[data-av]'), chip = e.target.closest('[data-lang]');
      if (av) { draft.avatar = av.getAttribute('data-av'); preview(); showStep(step); }
      if (chip) { var v = chip.getAttribute('data-lang'); draft.languages = draft.languages.filter(function (x) { return x !== v; }); renderLangs(); preview(); }
      if (e.target === bq('langadd')) { var v2 = bq('langpick').value; if (v2 && draft.languages.indexOf(v2) < 0 && draft.languages.length < 8) draft.languages.push(v2); renderLangs(); preview(); }
    });
    q('#rbBack').onclick = function () { showStep(step - 1); };
    q('#rbNext').onclick = function () {
      if (step < STEPS.length - 1) { showStep(step + 1); return; }
      preview();
      saveProfile({ avatar: draft.avatar, languages: draft.languages.slice(0, 8).join(','), username: q('#username').value, psignature: q('#psignature').value });   // shared profile (rvUserbox.get)
      q('#saveUser').click(); q('#saveExtra').click(); q('#rbSavePublic').click();
      var b = q('#rbNext'); b.textContent = '✅ SAVED'; setTimeout(function () { showStep(step); }, 1200);
    };
    builder.addEventListener('toggle', function () { if (builder.open) fillBuilder(); });
    q('#iconUser').addEventListener('click', fillBuilder);
    window.rvUserbox.previewDraft = function () { return { avatar: draft.avatar, languages: draft.languages.slice() }; };

    /* ===== channels: make your own room (popcoin Realtime Database, channels/...) ===== */
    var chBox = document.createElement('details');
    chBox.className = 'rb-fold'; chBox.id = 'rbChannels'; chBox.open = true;
    chBox.innerHTML = '<summary>📡 CHANNELS</summary><div class="rb-fold-body">' +
      '<div class="rb-invite hidden" id="rbInvite"></div>' +
      '<div class="rb-subtitle">⭐ MY CHANNELS</div><div id="rbMyChannels"><div class="rb-empty">Open the box to load</div></div>' +
      '<div class="rb-subtitle">🌍 PUBLIC CHANNELS</div><div id="rbPublicChannels"><div class="rb-empty">Open the box to load</div></div>' +
      '<small class="rb-dev-note" id="rbChannelNote"></small></div>';
    var roomFold = q('#rbRoom');
    roomFold.parentNode.insertBefore(chBox, roomFold.nextSibling);
    var mk = document.createElement('details');
    mk.className = 'rb-fold'; mk.id = 'rbMakeChannel';
    mk.innerHTML = '<summary>➕ MAKE A CHANNEL</summary><div class="rb-fold-body">' +
      '<label>Name</label><input type="text" id="rbChName" maxlength="40" placeholder="Night owls">' +
      '<label>Description (optional)</label><textarea id="rbChDesc" maxlength="200" placeholder="What is this channel about?"></textarea>' +
      '<label class="toggle"><input type="radio" name="rbChVis" value="public" checked><span>🌍 Public: listed for everyone</span></label>' +
      '<label class="toggle"><input type="radio" name="rbChVis" value="private"><span>🔒 Private: only people with the link</span></label>' +
      '<button type="button" class="btn" data-explain="Creates a new channel with the name and settings above, and gives you a link to share." id="rbChCreate" style="width:100%;margin-top:8px;">📡 CREATE CHANNEL</button>' +
      '<small class="rb-dev-note" id="rbChMsg">You are the owner. Only you can change or delete it.</small></div>';
    rightCol.insertBefore(mk, builder.nextSibling);

    function chNote(t) { q('#rbChannelNote').textContent = t || ''; }
    function slug(name) { return str(name).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'channel'; }
    function shareLink(id) { var u = new URL(location.href); u.searchParams.set('rvroom', id); u.hash = ''; return u.href; }
    function joinChannel(id) {
      lsSet('rudventur_channel', id); loadChannel();
      document.dispatchEvent(new CustomEvent('rv:channel', { detail: { channel: id, from: 'useRbox' } }));
      renderMyInfo(); chNote('You joined "' + id + '".');
    }
    function chRow(c, mine) {
      var row = document.createElement('div'); row.className = 'rb-channel';
      row.innerHTML = '<div class="rb-ch-name">' + (c.public ? '🌍 ' : '🔒 ') + escapeHtml(c.name) + '</div>' + (c.desc ? '<div class="rb-ch-desc">' + escapeHtml(c.desc) + '</div>' : '') +
        '<div class="field-row"><button type="button" class="btn btn-small" data-a="join" data-explain="Joins this channel: you see and talk with the people in it.">🚪 JOIN</button><button type="button" class="btn btn-small" data-a="share" data-explain="Copies a link to this channel so you can invite people.">🔗 SHARE</button>' + (mine ? '<button type="button" class="btn btn-small" data-a="del" title="Delete this channel" data-explain="Deletes this channel you made. People in it are moved back to the main room.">🗑</button>' : '') + '</div>';
      row.querySelector('[data-a="join"]').onclick = function () { joinChannel(c.id); };
      row.querySelector('[data-a="share"]').onclick = function () {
        var link = shareLink(c.id), done = function () { chNote('Link copied: ' + link); };
        if (navigator.share) navigator.share({ title: c.name, url: link }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, function () { chNote(link); });
        else chNote(link);
      };
      if (mine) row.querySelector('[data-a="del"]').onclick = function () { if (confirm('Delete channel "' + c.name + '"?')) deleteChannel(c.id).then(listChannels); };
      return row;
    }
    function fill(box, list, mine, empty) {
      box.innerHTML = '';
      if (!list.length) { box.innerHTML = '<div class="rb-empty">' + empty + '</div>'; return; }
      list.forEach(function (c) { box.appendChild(chRow(c, mine)); });
    }
    function read(snap, id, isPublic) { var v = snap.val(); return v ? { id: id, name: str(v.name), desc: str(v.desc), owner: str(v.owner), public: isPublic, created: v.created } : null; }
    function getChannel(id) {
      return presence.start().then(function () {
        var db = presence.state.db;
        return db.ref('channels/public/' + id).once('value').then(function (s) {
          if (s.exists()) return read(s, id, true);
          return db.ref('channels/private/' + id).once('value').then(function (p) { return read(p, id, false); });
        });
      });
    }
    function createChannel(opts) {
      opts = opts || {};
      var name = str(opts.name).trim().slice(0, 40), desc = str(opts.description || opts.desc).trim().slice(0, 200), isPublic = opts.public !== false;
      if (!name) return Promise.reject(new Error('A channel needs a name'));
      return presence.start().then(function () {
        var st = presence.state, id = slug(name) + '-' + Math.random().toString(36).slice(2, 7);
        var rec = { name: name, owner: st.uid, created: firebase.database.ServerValue.TIMESTAMP };
        if (desc) rec.desc = desc;
        var upd = {}; upd['channels/' + (isPublic ? 'public' : 'private') + '/' + id] = rec; upd['channels/mine/' + st.uid + '/' + id] = isPublic ? 'public' : 'private';
        return st.db.ref().update(upd).then(function () { return { id: id, name: name, desc: desc, public: isPublic, owner: st.uid, link: shareLink(id) }; });
      });
    }
    function deleteChannel(id) {
      return presence.start().then(function () {
        var st = presence.state;
        return st.db.ref('channels/mine/' + st.uid + '/' + id).once('value').then(function (s) {
          if (!s.exists()) throw new Error('Not your channel');
          var upd = {}; upd['channels/' + s.val() + '/' + id] = null; upd['channels/mine/' + st.uid + '/' + id] = null;
          return st.db.ref().update(upd);
        });
      });
    }
    function listChannels() {
      return presence.start().then(function () {
        var st = presence.state;
        var pub = st.db.ref('channels/public').orderByChild('created').limitToLast(50).once('value').then(function (s) {
          var out = []; s.forEach(function (c) { var r = read(c, c.key, true); if (r) out.push(r); }); return out.reverse();
        });
        var mine = st.db.ref('channels/mine/' + st.uid).once('value').then(function (s) {
          var ids = []; s.forEach(function (c) { ids.push(c.key); });
          return Promise.all(ids.map(getChannel)).then(function (l) { return l.filter(Boolean); });
        });
        return Promise.all([mine, pub]).then(function (r) {
          fill(q('#rbMyChannels'), r[0], true, 'You have not made a channel yet');
          fill(q('#rbPublicChannels'), r[1], false, 'No public channels yet');
          return { mine: r[0], public: r[1] };
        });
      }).catch(function (e) { chNote('Channels unavailable: ' + (e && e.message || e)); return { mine: [], public: [], error: String(e && e.message || e) }; });
    }
    q('#rbChCreate').onclick = function () {
      var vis = mk.querySelector('input[name="rbChVis"]:checked');
      var btn = this; btn.disabled = true;
      createChannel({ name: q('#rbChName').value, description: q('#rbChDesc').value, public: !vis || vis.value === 'public' }).then(function (c) {
        q('#rbChMsg').textContent = '✅ Made "' + c.name + '". Share: ' + c.link;
        q('#rbChName').value = ''; q('#rbChDesc').value = '';
        return listChannels();
      }, function (e) { q('#rbChMsg').textContent = '⚠️ ' + (e && e.message || e); }).then(function () { btn.disabled = false; });
    };
    // opened from a share link (?rvroom=<id>): offer to join
    (function () {
      var id; try { id = new URL(location.href).searchParams.get('rvroom'); } catch (e) { id = null; }
      if (!id || !/^[a-z0-9_-]{3,32}$/.test(id)) return;
      var inv = q('#rbInvite');
      inv.classList.remove('hidden');
      inv.innerHTML = '<div>📨 You were invited to channel <b>' + escapeHtml(id) + '</b></div><button type="button" class="btn btn-small" data-explain="Joins the channel you were invited to." id="rbInviteJoin">🚪 JOIN</button>';
      q('#rbInviteJoin').onclick = function () { joinChannel(id); inv.classList.add('hidden'); };
      getChannel(id).then(function (c) { if (c) inv.querySelector('b').textContent = c.name; }).catch(function () {});
    })();
    q('#iconUser').addEventListener('click', function () { if (!useRbox.classList.contains('hidden')) listChannels(); });
    window.rvUserbox.createChannel = createChannel;
    window.rvUserbox.listChannels = listChannels;
    window.rvUserbox.joinChannel = joinChannel;
    window.rvUserbox.deleteChannel = deleteChannel;
    renderMyInfo();

    /* ===== fake popCoins and the shop =====
       Just for fun: no real money, nothing leaves this browser. One wallet per player
       name (the profile username) in localStorage 'rud_fakePopCoins_v1':
       { players: { <name>: { balance, claimed: 'YYYY-MM-DD', bought: [itemId] } } } */
    var FP_KEY = 'rud_fakePopCoins_v1', FP_START = 50, FP_DAILY = 10;
    var GH = 'https://rudventur.github.io/';
    /* The items and their prices live in embed/popcoin-shop-items.json (next to this file):
       { id, name, price, type: service | site | repository, and service (an id from SERVICES) or url }.
       If that file cannot be loaded, the shop falls back to the services above at 5 fake popCoins each (the hub free). */
    function shopItem(x) {
      var svc = x && x.service ? serviceById(x.service) : null, url = svc ? svc.url : str(x && x.url);
      if (!x || !x.id || !url) return null;
      return { id: str(x.id), name: str(x.name || (svc && svc.name) || x.id), url: url,
        type: str(x.type || (svc ? 'service' : 'site')), price: Math.max(0, Math.floor(+x.price || 0)) };
    }
    var SHOP = SERVICES.map(function (x) { return shopItem({ id: 'svc-' + x.id, service: x.id, price: x.id === 'hub' ? 0 : 5 }); });
    var shopLoaded = new Promise(function (done) { setTimeout(function () {
      var src; try { src = new URL('popcoin-shop-items.json', new URL(baseUrl, location.href)).href; } catch (e) { return done(false); }
      if (!window.fetch) return done(false);
      fetch(src, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (d) {
          var list = (d && Array.isArray(d.items) ? d.items : []).map(shopItem).filter(Boolean);
          if (!list.length) return done(false);
          SHOP = list; window.rvUserbox.fakePop.items = SHOP; fpRender(); done(true);
        }).catch(function (e) { console.warn('useRbox: shop items not loaded, using the built-in list', e); done(false); });
    }, 0); });

    function fpPlayer() { var n = str(getProfile().username).trim(); return n && !isPlaceholderName(n) ? n.toLowerCase() : 'guest'; }
    function fpRead() {
      var all = parse(lsGet(FP_KEY)); if (!all || typeof all !== 'object' || !all.players) all = { players: {} };
      var me = fpPlayer(), w = all.players[me];
      if (!w) w = all.players[me] = { balance: FP_START, claimed: '', bought: [] };
      if (!Array.isArray(w.bought)) w.bought = [];
      w.balance = Math.max(0, Math.floor(+w.balance || 0));
      return { all: all, w: w };
    }
    function fpWrite(d) { lsSet(FP_KEY, JSON.stringify(d.all)); fpRender(); }
    function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function owns(w, it) { return it.price === 0 || w.bought.indexOf(it.id) !== -1; }
    function fpRender() {
      var d = fpRead(), w = d.w;
      q('#rbFakePopBal').textContent = w.balance;
      var claim = q('#rbFakePopClaim'); claim.disabled = w.claimed === today();
      claim.title = claim.disabled ? 'Come back tomorrow' : 'Claim ' + FP_DAILY + ' fake popCoins';
      var list = q('#rbShopList'); list.innerHTML = '';
      SHOP.forEach(function (it) {
        var row = document.createElement('div'); row.className = 'rb-shop-item rb-shop-' + it.type;
        var mine = owns(w, it), url = it.id === 'svc-translator' ? withLang(it.url) : it.url;
        var label = document.createElement(mine ? 'a' : 'span'); label.className = 'rb-shop-name'; label.textContent = it.name;
        if (mine) { label.href = url; label.target = '_blank'; label.rel = 'noopener'; }
        row.appendChild(label);
        var b = document.createElement(mine ? 'a' : 'button');
        b.className = 'btn btn-small';
        if (mine) { b.href = url; b.target = '_blank'; b.rel = 'noopener'; b.textContent = it.price ? '↗ OPEN' : '↗ FREE'; }
        else { b.type = 'button'; b.textContent = '🍿 ' + it.price + ' BUY'; b.disabled = w.balance < it.price;
          b.title = b.disabled ? 'Not enough fake popCoins' : 'Buy for ' + it.price + ' fake popCoins';
          b.setAttribute('data-explain', 'Buys ' + it.name + ' for ' + it.price + ' popCoins. After buying, this button opens it.');
          b.onclick = function () { fpBuy(it.id); }; }
        row.appendChild(b); list.appendChild(row);
      });
      if (typeof markService === 'function') markService();
    }
    function fpBuy(id) {
      var it = SHOP.filter(function (x) { return x.id === id; })[0], d = fpRead();
      if (!it || owns(d.w, it) || d.w.balance < it.price) return false;
      d.w.balance -= it.price; d.w.bought.push(it.id); fpWrite(d); return true;
    }
    function fpClaim() {
      var d = fpRead(); if (d.w.claimed === today()) return false;
      d.w.balance += FP_DAILY; d.w.claimed = today(); fpWrite(d); return true;
    }
    function openShop() {   // the shop is the left section: show that section and scroll to it
      useRbox.classList.remove('hidden', 'collapsed'); fpRender();
      var tab = scope.querySelector('#rbTabs button[data-col="left"]'); if (tab) tab.click();
      var shop = q('#rbShop'); if (shop.scrollIntoView) shop.scrollIntoView({ block: 'start', behavior: 'smooth' });
      shop.classList.add('rb-flash'); setTimeout(function () { shop.classList.remove('rb-flash'); }, 900);
    }
    q('#rbFakePopClaim').onclick = fpClaim;
    q('#rbFakePopShop').onclick = openShop;
    window.addEventListener('storage', function (e) { if (e.key === FP_KEY || e.key === KEY) fpRender(); });
    q('#saveUser').addEventListener('click', function () { setTimeout(fpRender, 0); });
    fpRender();
    window.rvUserbox.fakePop = { KEY: FP_KEY, items: SHOP, wallet: function () { return JSON.parse(JSON.stringify(fpRead().w)); },
      buy: fpBuy, claim: fpClaim, player: fpPlayer, openShop: openShop, loaded: shopLoaded };

    /* ===== the service slot (left section) =====
       The middle and right sections are the same on every page; only the left section
       changes with the service. By default it is the shop. A page adds its own part above it:
         <script src=".../embed/useRbox.js" data-service="map-merger" data-left="#myPanel" data-left-title="🗺️ MAP"></script>
         window.rvUserboxLeft = { title, html | node | selector }   (set before the script, or any time later with:)
         rvUserbox.setLeft(htmlOrNodeOrSelector, { title })  /  rvUserbox.setLeft(null) to clear
       A node or a selector's element is moved into the slot, so its own event handlers keep working. */
    var slot = q('#rbLeftSlot'), slotBody = q('#rbLeftSlotBody'), slotTitle = q('#rbLeftSlotTitle');
    function setLeft(content, opts) {
      opts = opts || {};
      slotBody.innerHTML = '';
      if (content == null || content === '') { slot.hidden = true; slotTitle.textContent = ''; return null; }
      var node = null;
      if (content.nodeType) node = content;
      else if (typeof content === 'string' && /^[#.][\w-]+$/.test(content.trim())) node = document.querySelector(content.trim());
      if (node) { node.hidden = false; if (node.style && node.style.display === 'none') node.style.display = ''; slotBody.appendChild(node); }
      else slotBody.innerHTML = str(content);
      slotTitle.textContent = str(opts.title || '🧩 THIS SERVICE');
      slot.hidden = false;
      return slotBody;
    }
    var currentService = str((scriptEl && scriptEl.getAttribute('data-service')) || window.RV_USERBOX_SERVICE || '');
    function markService() {
      if (!currentService) return;
      [].forEach.call(q('#rbShopList').children, function (row, i) {
        var it = SHOP[i], c = currentService.toLowerCase();
        row.classList.toggle('rb-here', !!it && [c, 'svc-' + c, 'page-' + c].indexOf(it.id.toLowerCase()) !== -1);
      });
    }
    shopLoaded.then(markService); markService();
    window.rvUserbox.setLeft = setLeft;
    /* open / close the box from page code: rvUserbox.open() or rvUserbox.open('left' | 'mid' | 'right') */
    function openBox(section) {
      root.classList.add('open'); useRbox.classList.remove('hidden'); useRbox.classList.remove('collapsed');
      if (typeof section === 'string') {
        var tab = scope.querySelector('#rbTabs button[data-col="' + section + '"]'); if (tab) tab.click();
        var col = q('.rb-col-' + section); if (col && col.scrollIntoView) col.scrollIntoView({ block: 'nearest' });
      }
    }
    window.rvUserbox.open = openBox;
    /* where the R sits, for pages whose own controls are in the top right corner:
       data-top="60px" data-right="220px" on the script tag, or rvUserbox.place({ top: 60, right: 220 }) */
    function place(pos) {
      pos = pos || {};
      ['top', 'right', 'bottom', 'left'].forEach(function (k) {
        if (pos[k] == null) return;
        root.style[k] = typeof pos[k] === 'number' ? pos[k] + 'px' : str(pos[k]);
      });
    }
    window.rvUserbox.place = place;
    if (scriptEl) place({ top: scriptEl.getAttribute('data-top'), right: scriptEl.getAttribute('data-right') });
    window.rvUserbox.close = function () { useRbox.classList.add('hidden'); root.classList.remove('open'); };
    window.rvUserbox.leftSlot = function () { return slotBody; };
    window.rvUserbox.service = currentService;
    (function () {
      var pre = window.rvUserboxLeft, sel = scriptEl && scriptEl.getAttribute('data-left');
      var title = scriptEl && scriptEl.getAttribute('data-left-title');
      if (pendingLeft) setLeft(pendingLeft.content, pendingLeft.opts);
      else if (pre) setLeft(pre.node || pre.selector || pre.html, { title: pre.title || title });
      else if (sel) {
        var tryMove = function () { if (document.querySelector(sel)) setLeft(sel, { title: title }); };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryMove); else tryMove();
      }
    })();
    if (pendingOpen) openBox(pendingOpen);
    try { document.dispatchEvent(new CustomEvent('rvuserbox:ready', { detail: window.rvUserbox })); } catch (e) {}

    console.log('👤 useRbox loaded (shared embed, profile key ' + KEY + ')');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
