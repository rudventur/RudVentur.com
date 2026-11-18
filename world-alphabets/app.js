/* World Alphabets viewer. Reads window.WORLD_ALPHABETS from data.js. */
(function () {
  const DATA = window.WORLD_ALPHABETS;
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const count = document.getElementById('count');
  const search = document.getElementById('search');
  const typeSel = document.getElementById('type');
  const sortSel = document.getElementById('sort');
  const sourcesBox = document.getElementById('sources');

  if (new URLSearchParams(location.search).has('embed')) {
    document.documentElement.classList.add('embed');
  }

  const TYPES = ['alphabet', 'abjad', 'abugida', 'syllabary', 'logographic'];

  function norm(s) {
    return String(s || '').toLowerCase();
  }

  function formatUsers(s) {
    return s.usersLabel || ('about ' + s.usersMillion + ' million people');
  }

  function letterBits(s) {
    if (!s.letters) return '';
    return Object.entries(s.letters).map(([label, val]) => {
      const dir = s.direction && s.direction.indexOf('right to left') === 0 ? 'rtl' : 'ltr';
      return '<div class="letters" dir="' + dir + '"><span class="let-label">' + escapeHtml(label) + '</span><span class="let-set">' + escapeHtml(val) + '</span></div>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function matches(s, q, type) {
    if (type && s.type !== type) return false;
    if (!q) return true;
    const bag = [s.name, s.nativeName, s.sample, s.type, s.direction, s.funFact]
      .concat(s.languages || []).join(' ');
    return norm(bag).indexOf(q) !== -1;
  }

  function sortScripts(list, how) {
    const copy = list.slice();
    if (how === 'name') copy.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (how === 'type') copy.sort(function (a, b) { return a.type.localeCompare(b.type) || b.usersMillion - a.usersMillion; });
    else if (how === 'direction') copy.sort(function (a, b) { return a.direction.localeCompare(b.direction) || b.usersMillion - a.usersMillion; });
    else copy.sort(function (a, b) { return (b.usersMillion || 0) - (a.usersMillion || 0); });
    return copy;
  }

  function render() {
    const q = norm(search.value).trim();
    const type = typeSel.value;
    const list = sortScripts(DATA.scripts.filter(function (s) { return matches(s, q, type); }), sortSel.value);
    count.textContent = list.length + ' of ' + DATA.scripts.length + ' writing systems';
    grid.textContent = '';
    empty.hidden = list.length > 0;
    list.forEach(function (s) {
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = s.id;
      const dirClass = s.direction.indexOf('right to left') === 0 ? 'rtl' : 'ltr';
      const countLine = s.letterCount
        ? (s.letterCount + ' ' + (s.letterCount === 1 ? 'basic letter' : 'basic letters'))
        : 'No simple letter count';
      const langs = (s.languages || []).join(', ');
      card.innerHTML =
        '<div class="sample ' + dirClass + '" lang="" dir="' + dirClass + '">' + escapeHtml(s.sampleBig || s.sample) + '</div>' +
        '<h2>' + escapeHtml(s.name) + (s.nativeName && s.nativeName !== s.name ? ' <span class="native" dir="' + dirClass + '">' + escapeHtml(s.nativeName) + '</span>' : '') + '</h2>' +
        '<div class="chips">' +
          '<span class="chip type">' + escapeHtml(s.type) + '</span>' +
          '<span class="chip">' + escapeHtml(s.direction.split(';')[0]) + '</span>' +
        '</div>' +
        (s.typeNote ? '<p class="type-note">' + escapeHtml(s.typeNote) + '</p>' : '') +
        '<p class="users">' + escapeHtml(formatUsers(s)) + ' <span class="approx">(approximate)</span></p>' +
        '<p class="langs"><b>Main languages:</b> ' + escapeHtml(langs) + '</p>' +
        '<p class="lcount"><b>Letters:</b> ' + escapeHtml(countLine) + (s.letterCountNote ? ' — ' + escapeHtml(s.letterCountNote) : '') + '</p>' +
        '<p class="fun">💡 ' + escapeHtml(s.funFact) + '</p>' +
        '<details><summary>Full letter set and the source for the numbers</summary>' +
          letterBits(s) +
          '<p class="src">' + escapeHtml(s.usersNote) + '</p>' +
        '</details>';
      grid.appendChild(card);
    });
  }

  TYPES.forEach(function (t) {
    const o = document.createElement('option');
    o.value = t;
    o.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    typeSel.appendChild(o);
  });

  sourcesBox.innerHTML = DATA.sources.map(function (s) {
    return '<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.name) + '</a> — ' + escapeHtml(s.note) + '</li>';
  }).join('');

  const explain = document.getElementById('type-explain');
  if (explain && DATA.typeExplain) {
    explain.innerHTML = Object.entries(DATA.typeExplain).map(function (kv) {
      return '<p><b>' + escapeHtml(kv[0].charAt(0).toUpperCase() + kv[0].slice(1)) + ':</b> ' + escapeHtml(kv[1]) + '</p>';
    }).join('');
  }

  search.addEventListener('input', render);
  typeSel.addEventListener('change', render);
  sortSel.addEventListener('change', render);
  render();
})();
