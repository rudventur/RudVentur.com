/* useRbox v2.0 — shared site-wide widget
 * Drop this in with a single tag on every page:
 *   <script src="/embed/useRbox.js" defer></script>
 * It injects its own CSS + markup and anchors itself top-right, above all
 * page content, on every page it's loaded on.
 *
 * Override the translator's location per-site (if it isn't served from
 * /map-merger-venti/) by setting window.RUDVENTUR_TRANSLATOR_URL before
 * this script runs.
 */
(function () {
  'use strict';

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
      '  <textarea id="psignature" placeholder="Your personal motto, signature, or note..."></textarea>' +
      '  <label>⚰️ What kind of funeral do you want?</label>' +
      '  <select id="funeralKind">' +
      '    <option value="">— not decided yet —</option>' +
      '    <option value="burial">🪦 Burial</option>' +
      '    <option value="cremation">🔥 Cremation</option>' +
      '    <option value="green">🌳 Green / woodland (natural burial)</option>' +
      '    <option value="sea">🌊 Sea burial / ashes at sea</option>' +
      '    <option value="science">🔬 Body donated to science</option>' +
      '    <option value="party">🎉 Party — celebration of life</option>' +
      '    <option value="none">🤫 No funeral, no fuss</option>' +
      '    <option value="other">✍️ Something else (write it below)</option>' +
      '  </select>' +
      '  <textarea id="funeralNote" placeholder="Music, place, who to invite, what to do with the ashes..."></textarea>' +
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
      '  <div class="social-section">' +
      '    <div class="social-title">🌐 SOCIAL MEDIA</div>' +
      '    <div class="social-grid">' +
      '      <a href="https://github.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="GitHub">' +
      '        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' +
      '      </a>' +
      '      <a href="https://discord.gg/rudventur" target="_blank" rel="noopener" class="social-icon" title="Discord">💬</a>' +
      '      <a href="https://twitter.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Twitter/X">𝕏</a>' +
      '      <a href="https://instagram.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Instagram">📷</a>' +
      '      <a href="https://youtube.com/@rudventur" target="_blank" rel="noopener" class="social-icon" title="YouTube">▶️</a>' +
      '      <a href="https://ko-fi.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Ko-fi">☕</a>' +
      '      <a href="https://tiktok.com/@rudventur" target="_blank" rel="noopener" class="social-icon" title="TikTok">🎵</a>' +
      '      <a href="https://linkedin.com/in/rudventur" target="_blank" rel="noopener" class="social-icon" title="LinkedIn">💼</a>' +
      '      <a href="https://reddit.com/u/rudventur" target="_blank" rel="noopener" class="social-icon" title="Reddit">🤖</a>' +
      '      <a href="https://facebook.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Facebook">📘</a>' +
      '      <a href="https://twitch.tv/rudventur" target="_blank" rel="noopener" class="social-icon" title="Twitch">🎮</a>' +
      '      <a href="https://snapchat.com/add/rudventur" target="_blank" rel="noopener" class="social-icon" title="Snapchat">👻</a>' +
      '      <a href="https://pinterest.com/rudventur" target="_blank" rel="noopener" class="social-icon" title="Pinterest">📌</a>' +
      '      <a href="https://t.me/rudventur" target="_blank" rel="noopener" class="social-icon" title="Telegram">✈️</a>' +
      '      <a href="https://wa.me/447594923008" target="_blank" rel="noopener" class="social-icon" title="WhatsApp">📱</a>' +
      '      <a href="mailto:RudVentur@gmail.com" class="social-icon" title="Email">📧</a>' +
      '    </div>' +
      '  </div>' +
      '  <button type="button" class="btn" id="rbGetApp" style="width:100%;margin-top:14px;padding:10px;">📲 DOWNLOAD THE RUDVENTUR APP</button>' +
      '  <label class="toggle"><input type="checkbox" id="saveMessages" checked><span>Save my messages</span></label>' +
      '  <button id="saveUser">💾 SAVE PROFILE</button>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
      localStorage.setItem('rud_useRbox_collapsed', collapsed ? '1' : '0');
    }
    q('#collapseUser').onclick = function () { setCollapsed(true); };
    useRboxNotch.onclick = function () { setCollapsed(!useRbox.classList.contains('collapsed')); };
    if (localStorage.getItem('rud_useRbox_collapsed') === '1') useRbox.classList.add('collapsed');

    /* Transparency toggle */
    var PANEL_BG_SOLID = 'rgba(0, 15, 5, 0.96)';
    var PANEL_BG_TRANSPARENT = 'rgba(0, 15, 5, 0.35)';
    var panelTransparent = localStorage.getItem('rud_useRbox_transparent') === '1';
    function applyTransparency() {
      root.style.setProperty('--panel-bg', panelTransparent ? PANEL_BG_TRANSPARENT : PANEL_BG_SOLID);
      var btn = q('#toggleTransparency');
      btn.textContent = panelTransparent ? '👻' : '🌑';
      btn.title = panelTransparent ? 'Switch to solid background' : 'Switch to see-through background';
    }
    q('#toggleTransparency').onclick = function () {
      panelTransparent = !panelTransparent;
      localStorage.setItem('rud_useRbox_transparent', panelTransparent ? '1' : '0');
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

    function renderGPSList() {
      var list = q('#gpsList');
      if (savedLocations.length === 0) {
        list.innerHTML = '<div style="text-align:center; opacity:0.5; padding:10px;">No saved locations</div>';
        return;
      }
      list.innerHTML = savedLocations.map(function (loc) {
        return '<div class="gps-item">' +
          '<div><div class="gps-item-name">' + escapeHtml(loc.name) + '</div>' +
          '<div class="gps-item-coords">' + loc.lat + ', ' + loc.lon + '</div></div>' +
          '<button class="gps-item-delete" data-id="' + loc.id + '">🗑️</button></div>';
      }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('.gps-item-delete'), function (btn) {
        btn.onclick = function () {
          if (!confirm('Delete this location?')) return;
          var id = Number(btn.getAttribute('data-id'));
          savedLocations = savedLocations.filter(function (loc) { return loc.id !== id; });
          renderGPSList();
          persist();
        };
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
      var data = localStorage.getItem('rud_useRbox_v2');
      if (!data) return;
      var u = JSON.parse(data);
      q('#username').value = u.username || 'Rudy';
      q('#channel').value = u.channel || 'main';
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
    q('#channelInfo').onclick = function () { alert('Channel set on login!'); };
    q('#saveUser').onclick = saveUser;

    function loadChannel() {
      q('#channel').value = localStorage.getItem('rudventur_channel') || 'main';
    }

    /* Shared view mode — same key + URL param convention as translator_v7.html's
       goTo(), so opening the translator carries the current fullscreen/orientation
       state instead of resetting it. */
    var VIEW_MODE_KEY = 'rvViewMode';
    function currentViewMode() {
      return localStorage.getItem(VIEW_MODE_KEY) || '';
    }
    // the one translator: the map-merger-venti repo's copy (the hub's old copy redirects there)
    var TRANSLATOR_URL = window.RUDVENTUR_TRANSLATOR_URL || 'https://rudventur.github.io/map-merger-venti/translator_v7.html';
    function goTo(url) {
      var mode = currentViewMode();
      var qs = mode && mode !== 'normal' ? '?view=' + encodeURIComponent(mode) : '';
      window.open(url + qs, '_blank', 'noopener');
    }
    q('#iconTranslator').onclick = function () { goTo(TRANSLATOR_URL); };

    loadUser();
    loadChannel();

    console.log('👤 useRbox v2.0 loaded (shared embed)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
