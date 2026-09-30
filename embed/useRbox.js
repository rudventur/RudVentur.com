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
      '  <div id="liveClock">--:--:--</div>' +
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
      '  <label>📡 Channel</label>' +
      '  <div class="field-row">' +
      '    <input type="text" id="channel" value="main" disabled style="flex:1;">' +
      '    <button class="btn btn-small" id="channelInfo">ℹ️</button>' +
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
    q('#refreshUser').onclick = function () { loadUser(); loadChannel(); };
    q('#channelInfo').onclick = function () { alert('Channel set on login!'); };
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
        target = u.href;
      } catch (e) {}
      window.open(target, '_blank', 'noopener');
    }
    q('#iconTranslator').onclick = function () { goTo(TRANSLATOR_URL); };

    loadUser();
    loadChannel();

    console.log('👤 useRbox loaded (shared embed, profile key ' + KEY + ')');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
