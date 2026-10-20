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
 *   rud_useRbox_v2      windows13 useRbox-v2-upgraded.html and the old version of
 *                       this file ({username, channel, psignature, currentLoc,
 *                       lat, lon, saveMessages, savedLocations}); windows13
 *                       userbox-v2-ultimate.html writes the motto as "signature"
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
    escapeHtml: escapeHtml
  };

  var scriptEl = document.currentScript;
  var baseUrl = scriptEl ? new URL('.', scriptEl.src).href : './';

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
      '<div id="Rcircle" title="useR">R</div>' +
      '<div id="Ricons">' +
      '  <div class="Ricon" id="iconTranslator" title="Translator">🌐</div>' +
      '  <div class="Ricon" id="iconUser" title="useRbox">👤</div>' +
      '</div>' +
      '<div id="useRbox" class="hidden">' +
      '  <div class="useRbox-notch" id="useRboxNotch" title="Collapse / Expand">⟨⟩</div>' +
      '  <div class="useRbox-header">' +
      '    <strong>⚡ useRbox v2.0</strong>' +
      '    <div class="useRbox-header-btns">' +
      '      <button id="togglePrivacy" title="Online / private">🌐</button>' +
      '      <button id="toggleTransparency" title="Toggle transparency">🌑</button>' +
      '      <button id="collapseUser" title="Collapse to notch">⤢</button>' +
      '      <button id="closeUser" title="Close">✖</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="rb-cols">' +
      '   <section class="rb-col rb-col-left"><div class="rb-col-title">⚙️ SERVICE OPTIONS</div>' +
      '  <div id="liveClock">--:--:--</div>' +
      '  <div class="rb-section">' +
      '    <div class="social-title">🗣 MY LANGUAGE</div>' +
      '    <select id="rbLang" title="Your language, remembered on this device and passed to the translator"><option value="af">Afrikaans</option><option value="ak">Akan (Twi)</option><option value="sq">Albanian</option><option value="am">Amharic</option><option value="ar">Arabic</option><option value="an">Aragonese</option><option value="hy">Armenian</option><option value="rup">Aromanian</option><option value="ast">Asturian</option><option value="ay">Aymara</option><option value="az">Azerbaijani</option><option value="eu">Basque</option><option value="bar">Bavarian</option><option value="be">Belarusian</option><option value="bn">Bengali</option><option value="ber">Berber (Tamazight)</option><option value="bs">Bosnian</option><option value="br">Breton</option><option value="bg">Bulgarian</option><option value="my">Burmese</option><option value="yue">Cantonese</option><option value="ca">Catalan</option><option value="chr">Cherokee</option><option value="ny">Chichewa (Nyanja)</option><option value="kw">Cornish</option><option value="co">Corsican</option><option value="cr">Cree</option><option value="hr">Croatian</option><option value="cs">Czech</option><option value="da">Danish</option><option value="nl">Dutch</option><option value="en">English</option><option value="et">Estonian</option><option value="fo">Faroese</option><option value="fj">Fijian</option><option value="fi">Finnish</option><option value="fr">French</option><option value="fy">Frisian</option><option value="fur">Friulian</option><option value="ff">Fula (Fulfulde)</option><option value="gl">Galician</option><option value="ka">Georgian</option><option value="de">German</option><option value="el">Greek</option><option value="gn">Guarani</option><option value="gu">Gujarati</option><option value="ht">Haitian Creole</option><option value="ha">Hausa</option><option value="haw">Hawaiian</option><option value="he">Hebrew</option><option value="hi">Hindi</option><option value="hu">Hungarian</option><option value="is">Icelandic</option><option value="ig">Igbo</option><option value="id">Indonesian</option><option value="iu">Inuktitut</option><option value="ga">Irish</option><option value="it">Italian</option><option value="ja">Japanese</option><option value="kn">Kannada</option><option value="krl">Karelian</option><option value="csb">Kashubian</option><option value="kk">Kazakh</option><option value="km">Khmer</option><option value="kg">Kikongo</option><option value="rw">Kinyarwanda</option><option value="ko">Korean</option><option value="ku">Kurdish</option><option value="ksh">Kölsch</option><option value="lkt">Lakota</option><option value="lo">Lao</option><option value="lv">Latvian</option><option value="lij">Ligurian</option><option value="li">Limburgish</option><option value="ln">Lingala</option><option value="lt">Lithuanian</option><option value="liv">Livonian</option><option value="lmo">Lombard</option><option value="nds">Low German</option><option value="dsb">Lower Sorbian</option><option value="lb">Luxembourgish</option><option value="mk">Macedonian</option><option value="mg">Malagasy</option><option value="ms">Malay</option><option value="ml">Malayalam</option><option value="mt">Maltese</option><option value="zh-CN">Mandarin</option><option value="gv">Manx</option><option value="mi">Maori</option><option value="arn">Mapudungun</option><option value="mr">Marathi</option><option value="mn">Mongolian</option><option value="cnr">Montenegrin</option><option value="nah">Nahuatl</option><option value="nv">Navajo (Diné)</option><option value="nap">Neapolitan</option><option value="ne">Nepali</option><option value="frr">North Frisian</option><option value="no">Norwegian</option><option value="oc">Occitan</option><option value="oj">Ojibwe (Anishinaabemowin)</option><option value="om">Oromo</option><option value="pfl">Palatinate German</option><option value="ps">Pashto</option><option value="fa">Persian</option><option value="pms">Piedmontese</option><option value="pl">Polish</option><option value="pt">Portuguese</option><option value="pa">Punjabi</option><option value="qu">Quechua</option><option value="ro">Romanian</option><option value="rm">Romansh</option><option value="ru">Russian</option><option value="rue">Rusyn</option><option value="smj">Sami (Lule)</option><option value="se">Sami (Northern)</option><option value="sma">Sami (Southern)</option><option value="sm">Samoan</option><option value="sc">Sardinian</option><option value="stq">Saterland Frisian</option><option value="sco">Scots</option><option value="gd">Scots Gaelic</option><option value="sr">Serbian</option><option value="st">Sesotho</option><option value="sn">Shona</option><option value="scn">Sicilian</option><option value="szl">Silesian</option><option value="sli">Silesian German</option><option value="si">Sinhala</option><option value="sk">Slovak</option><option value="sl">Slovenian</option><option value="so">Somali</option><option value="wen">Sorbian</option><option value="es">Spanish</option><option value="swg">Swabian</option><option value="sw">Swahili</option><option value="sv">Swedish</option><option value="tl">Tagalog</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="th">Thai</option><option value="bo">Tibetan</option><option value="ti">Tigrinya</option><option value="tpi">Tok Pisin</option><option value="to">Tongan</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option><option value="hsb">Upper Sorbian</option><option value="ur">Urdu</option><option value="uz">Uzbek</option><option value="vec">Venetian</option><option value="vi">Vietnamese</option><option value="vro">Võro</option><option value="wa">Walloon</option><option value="guc">Wayuunaiki</option><option value="cy">Welsh</option><option value="vls">West Flemish</option><option value="wo">Wolof</option><option value="xh">Xhosa</option><option value="yo">Yoruba</option><option value="zu">Zulu</option></select>' +
      '    <small class="rb-dev-note">The translator opens in this language.</small>' +
      '  </div>' +
      '  <div class="rb-devices">' +
      '    <div class="social-title">📷 🎤 CAMERA &amp; MIC</div>' +
      '    <div class="rb-dev-row">' +
      '      <button type="button" class="rb-dev" id="rbCam"><span>📷 CAMERA</span><small>OFF</small></button>' +
      '      <button type="button" class="rb-dev" id="rbMic"><span>🎤 MICROPHONE</span><small>OFF</small></button>' +
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
      '      <button type="button" class="btn" id="rbOpenPopcorn" style="flex:1;">🍿 OPEN POPCORN WINDOW</button>' +
      '      <button type="button" class="btn btn-small" id="rbCamReset" title="Brightness, contrast and mirror back to normal">↺</button>' +
      '    </div>' +
      '    <small class="rb-dev-note">Camera and mic only ever run inside the 🍿 popcorn window, which is sealed off from the internet. ' +
      'Recordings and 🎬 movie maker are in there.</small>' +
      '  </div>' +
      '  <button type="button" class="btn" id="rbGetApp" style="width:100%;margin-top:14px;padding:10px;">📲 DOWNLOAD THE RUDVENTUR APP</button>' +
      '   </section>' +
      '   <section class="rb-col rb-col-mid"><div class="rb-col-title">👤 useR</div>' +
      '  <div id="rvInsideHeader" class="rv-inside-header">' +
      '    <div class="rv-nag-msg" id="rvNagMsg">☕ Support the universe — it\'s only £10 per year</div>' +
      '    <button type="button" id="rvNagOk" class="rv-nag-ok">OK</button>' +
      '  </div>' +
      '  <details class="rb-fold" id="rbMyProfile" open><summary>👤 MY PROFILE</summary><div class="rb-fold-body">' +
      '  <div class="rb-incognito">' +
      '    <div class="rb-incognito-mask">🕶</div>' +
      '    <strong>INCOGNITO — PRIVATE MODE</strong>' +
      '    <p>No login, no profile, nothing saved about you. Camera and microphone are off. ' +
      'You can still use every public tool.</p>' +
      '    <button class="btn" id="goOnline">🌐 GO ONLINE (only your name is shown)</button>' +
      '  </div>' +
      '  <div class="avatar-wrap">' +
      '    <div id="avatarHalftone"></div>' +
      '    <small>pure CSS halftone signature</small>' +
      '  </div>' +
      '  <label>👤 Username</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="username" value="Rudy" style="flex:1;">' +
      '    <button class="btn btn-small" id="refreshUser">🔄 Refresh</button>' +
      '  </div>' +
      '  <label>📝 P.S. (Personal Signature)</label>' +
      '  <textarea id="psignature" placeholder="You don\'t have to have legs to Trip"></textarea>' +
      '  <label>📍 Current Location</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="currentLoc" placeholder="???" style="flex:1;">' +
      '    <button class="btn btn-small" id="gpsBtn">📍 GPS</button>' +
      '  </div>' +
      '  <div style="display:flex; gap:8px; margin-top:8px;">' +
      '    <div style="flex:1;"><label style="margin:0 0 4px;">Lat</label><input type="text" id="lat" placeholder="0.000000"></div>' +
      '    <div style="flex:1;"><label style="margin:0 0 4px;">Lon</label><input type="text" id="lon" placeholder="0.000000"></div>' +
      '  </div>' +
      '  <div class="gps-section">' +
      '    <label>📌 Saved GPS Locations</label>' +
      '    <div class="field-row" style="margin-top:8px;">' +
      '      <input type="text" id="gpsName" placeholder="Location name..." style="flex:1;">' +
      '      <button class="btn btn-small" id="saveGpsBtn">💾 Save</button>' +
      '    </div>' +
      '    <div id="gpsList"></div>' +
      '  </div>' +
      '  <label class="toggle"><input type="checkbox" id="saveMessages" checked><span>Save my messages</span></label>' +
      '  <button id="saveUser">💾 SAVE PROFILE</button>' +
      '  </div></details>' +
      '  <div class="rb-viewed hidden" id="rbViewed"><div class="rb-viewed-head"><span id="rbViewedTitle">👁 PROFILE</span><button type="button" class="btn btn-small" id="rbViewedClose" title="Close this profile">✖</button></div><div id="rbViewedBody"></div></div>' +
      '  <details class="rb-fold rb-room" id="rbRoom" open><summary>🚪 ROOM FOR useRs</summary><div class="rb-fold-body">' +
      '    <label>📡 Channel</label>' +
      '    <div class="field-row"><input type="text" id="channel" value="main" disabled style="flex:1;"><button class="btn btn-small" id="channelInfo" title="About channels">ℹ️</button></div>' +
      '    <label>🔁 Join another room</label>' +
      '    <div class="field-row"><input type="text" id="rbRoomInput" placeholder="Room name..." style="flex:1;"><button type="button" class="btn btn-small" id="rbRoomJoin">JOIN</button></div>' +
      '    <div class="rb-known-rooms" id="rbKnownRooms"></div>' +
      '    <div class="field-row" style="margin-top:8px;"><button type="button" class="btn" id="rbRoomLeave" style="flex:1;">🚪 LEAVE (back to main)</button></div>' +
      '    <label class="toggle"><input type="checkbox" id="rbRoomVisible" checked><span>Show me in the room list</span></label>' +
      '    <small class="rb-dev-note">The room is stored on this device and shared with Windows 13.</small>' +
      '  </div></details>' +
      '   </section>' +
      '   <section class="rb-col rb-col-right">' +
      '  <details class="rb-fold" id="rbEditFold" open><summary>✏️ EDITING OPTIONS</summary><div class="rb-fold-body">' +
      '  <div class="useRbox-right" id="useRboxRight">' +
      '    <div class="useRbox-right-header">👤 Profile Editor</div>' +
      '    <label>⚰️ What kind of funeral do you want?</label>' +
      '    <select id="funeralKind"><option value="">— choose —</option><option value="burial">🪦 Burial</option><option value="cremation">🔥 Cremation</option><option value="space">🚀 Shoot me into space</option><option value="sea">🌊 At sea</option><option value="tree">🌳 Become a tree</option><option value="party">🎉 A party, not a funeral</option><option value="none">🤫 No funeral, no fuss</option></select>' +
      '    <textarea id="funeralNote" placeholder="Music, place, who to invite, what to do with the ashes..."></textarea>' +
      '    <label>⚰️ The way you want to be buried</label>' +
      '    <input type="text" id="burialWish" placeholder="shoot in the space">' +
      '    <label>✨ Other public note</label>' +
      '    <textarea id="publicNote"></textarea>' +
      '    <button type="button" class="btn" id="saveExtra">💾 SAVE EXTRA</button>' +
      '    <small>Stored on this device for now.</small>' +
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
        var okHtml = '<button type="button" class="rv-nag-ok" id="rvNagOkInline">OK</button>';
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
        del.title = 'Delete';
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
      b.onclick = function () { setRoom(name); };
      rk.appendChild(b);
    });
    q('#rbRoomJoin').onclick = function () { setRoom(q('#rbRoomInput').value); q('#rbRoomInput').value = ''; };
    q('#rbRoomInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') q('#rbRoomJoin').click(); });
    q('#rbRoomLeave').onclick = function () { setRoom('main'); };
    q('#rbRoomVisible').checked = lsGet('rvRoomVisible') !== '0';
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

    console.log('👤 useRbox loaded (shared embed, profile key ' + KEY + ')');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
