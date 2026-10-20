/* useRbox — the ONE shared RUDVENTUR profile box (the R circle, top right). */
(function () {
  'use strict';
  if (window.rvUserbox) return;

  var KEY = 'rud_useRbox_v3';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function escapeHtml(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c];
    });
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
      '  <div class="useRbox-notch" id="useRboxNotch">⟨⟩</div>' +
      '  <div id="rvInsideHeader" class="rv-inside-header">' +
      '    <div class="rv-nag-msg" id="rvNagMsg">☕ Support the universe — it\'s only £10 per year</div>' +
      '    <button type="button" id="rvNagOk" class="rv-nag-ok">OK</button>' +
      '  </div>' +
      '  <div class="useRbox-layout">' +
      '    <div class="useRbox-left">' +
      '      <div class="useRbox-header"><strong>⚡ useRbox</strong></div>' +
      '      <div id="liveClock">--:--:--</div>' +
      '      <label>👤 Username</label><input type="text" id="username">' +
      '      <label>📝 P.S.</label><textarea id="psignature"></textarea>' +
      '      <button id="saveUser">💾 SAVE PROFILE</button>' +
      '    </div>' +
      '    <div class="useRbox-right" id="useRboxRight">' +
      '      <div class="useRbox-right-header">👤 Profile Editor</div>' +
      '      <label>⚰️ The way you want to be buried</label>' +
      '      <input type="text" id="burialWish" placeholder="shoot in the space">' +
      '      <label>✨ Other public note</label>' +
      '      <textarea id="publicNote"></textarea>' +
      '      <button type="button" class="btn" id="saveExtra">💾 SAVE EXTRA</button>' +
      '      <small>Stored on this device for now.</small>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function init() {
    var scope = buildMarkup();
    var q = function (sel) { return scope.querySelector(sel); };
    var Rcircle = q('#Rcircle');
    var useRbox = q('#useRbox');
    Rcircle.onclick = function () { scope.classList.toggle('open'); };
    q('#iconUser').onclick = function () { useRbox.classList.toggle('hidden'); };

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
        lsSet("rv_nag_done", "1");
        return;
      }
      renderStep(nagSteps[nagIndex]);
    }
    renderStep(nagSteps[0]);
    if (nagOk) nagOk.onclick = advanceNag;
    if (lsGet("rv_nag_done") === "1" && insideHeader) insideHeader.classList.add("rv-nag-done");

    /* Extra fields */
    var burialInput = q('#burialWish');
    var publicNoteInput = q('#publicNote');
    var saveExtraBtn = q('#saveExtra');
    function loadExtra() {
      try {
        var extra = JSON.parse(lsGet('rud_useRbox_extra') || '{}');
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
      lsSet('rud_useRbox_extra', JSON.stringify(extra));
      if (saveExtraBtn) {
        var old = saveExtraBtn.textContent;
        saveExtraBtn.textContent = '✅ SAVED';
        setTimeout(function () { saveExtraBtn.textContent = old; }, 1200);
      }
    }
    if (saveExtraBtn) saveExtraBtn.onclick = saveExtra;
    loadExtra();

    /* Translator icon opens v7 */
    q('#iconTranslator').onclick = function () {
      window.open('https://rudventur.github.io/map-merger-venti/translator_v7.html', '_blank');
    };

    console.log('👤 useRbox loaded with nag + profile editor');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
