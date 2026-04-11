// ─── RudVentur Social — Browse Logic ───

(function() {
  const list = document.getElementById('profile-list');
  const filterBar = document.getElementById('filter-bar');
  let allProfiles = [];
  let activeFilter = 'all';

  // Build filter buttons
  const filterAll = document.createElement('button');
  filterAll.className = 'filter-btn active';
  filterAll.textContent = 'all';
  filterAll.onclick = function() { setFilter('all'); };
  filterBar.appendChild(filterAll);

  Object.entries(ENTITY_TYPES).forEach(function([type, info]) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = info.icon + ' ' + info.label.toLowerCase();
    btn.onclick = function() { setFilter(type); };
    filterBar.appendChild(btn);
  });

  function setFilter(type) {
    activeFilter = type;
    filterBar.querySelectorAll('.filter-btn').forEach(function(btn, i) {
      if (type === 'all') {
        btn.classList.toggle('active', i === 0);
      } else {
        btn.classList.toggle('active', btn.textContent.includes(ENTITY_TYPES[type] ? ENTITY_TYPES[type].label.toLowerCase() : ''));
      }
    });
    renderProfiles();
  }

  function renderProfiles() {
    list.innerHTML = '';
    const filtered = activeFilter === 'all'
      ? allProfiles
      : allProfiles.filter(function(p) { return p.type === activeFilter; });

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state">nobody yet. be the first.</div>';
      return;
    }

    filtered.forEach(function(p) {
      const typeInfo = ENTITY_TYPES[p.type] || ENTITY_TYPES.human;
      const avatar = p.avatarMode === 'url' && p.avatarUrl
        ? '<img src="' + escapeAttr(p.avatarUrl) + '" onerror="this.parentNode.textContent=\'❌\';this.remove()">'
        : (p.avatarEmoji || typeInfo.icon);

      const a = document.createElement('a');
      a.href = 'profile.html?uid=' + p.uid;
      a.className = 'profile-entry';
      a.innerHTML =
        '<div class="entry-avatar">' + avatar + '</div>' +
        '<div class="entry-info">' +
          '<div class="entry-name">' + escapeHtml(p.name || 'unnamed') + '</div>' +
          '<div class="entry-bio">' + escapeHtml(p.bio || '') + '</div>' +
        '</div>' +
        '<span class="type-badge entry-badge">' + typeInfo.icon + ' ' + typeInfo.label + '</span>';
      list.appendChild(a);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Load profiles ───
  loadRecentProfiles(50).then(function(profiles) {
    allProfiles = profiles;
    renderProfiles();
  }).catch(function() {
    list.innerHTML = '<div class="empty-state">couldn\'t reach the database. try again later.</div>';
  });

})();
