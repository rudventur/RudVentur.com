// Advertisements shown in the Advert scroll on the hub (index.html).
// To add another advertiser, append an object to SCROLL_ADVERTS with
// id, name, url, icon and text. Only use wording already agreed with
// the advertiser — do not invent prices, offers or claims.
// Compton Cycles is the first entry; its name, location text and web
// address come from bike-builder.js in this repository.
var SCROLL_ADVERTS = [
  {
    id: 'compton',
    name: 'Compton Cycles',
    url: 'https://comptoncycles.co.uk/',
    icon: '🚲',
    text: 'Parts and workshop, Catford, South East London'
  }
];

(function () {
  'use strict';

  function hostOf(url) {
    try { return new URL(url).host; } catch (e) { return url; }
  }

  function itemEl(ad, hidden) {
    var a = document.createElement('a');
    a.className = 'advert-item';
    a.href = ad.url;
    a.target = '_blank';
    a.rel = 'noopener sponsored';
    a.setAttribute('aria-label', 'Advert: ' + ad.name + '. ' + ad.text);
    if (hidden) a.setAttribute('tabindex', '-1');

    var badge = document.createElement('span');
    badge.className = 'advert-item__badge';
    badge.textContent = 'Advert';

    var icon = document.createElement('span');
    icon.className = 'advert-item__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ad.icon || '';

    var name = document.createElement('span');
    name.className = 'advert-item__name';
    name.textContent = ad.name;

    var text = document.createElement('span');
    text.className = 'advert-item__text';
    text.textContent = ad.text || '';

    var host = document.createElement('span');
    host.className = 'advert-item__url';
    host.textContent = hostOf(ad.url);

    a.appendChild(badge);
    if (ad.icon) a.appendChild(icon);
    a.appendChild(name);
    if (ad.text) a.appendChild(text);
    a.appendChild(host);
    return a;
  }

  function fillSet(box, ads, copies, hidden) {
    box.textContent = '';
    for (var c = 0; c < copies; c++) {
      ads.forEach(function (ad) { box.appendChild(itemEl(ad, hidden)); });
    }
  }

  function start() {
    var root = document.getElementById('advert-strip');
    if (!root || !SCROLL_ADVERTS.length) return;

    var staticList = document.createElement('div');
    staticList.className = 'advert-strip__static';
    SCROLL_ADVERTS.forEach(function (ad) { staticList.appendChild(itemEl(ad, false)); });
    root.appendChild(staticList);

    var track = document.createElement('div');
    track.className = 'advert-strip__track';
    track.setAttribute('aria-hidden', 'true');

    var setA = document.createElement('div');
    setA.className = 'advert-strip__set';
    var setB = document.createElement('div');
    setB.className = 'advert-strip__set';

    track.appendChild(setA);
    track.appendChild(setB);
    root.appendChild(track);

    var copies = 1;
    fillSet(setA, SCROLL_ADVERTS, copies, true);
    // Repeat the list until one set is at least as wide as the strip,
    // so the loop stays seamless on both phone and desktop widths.
    while (setA.scrollWidth < Math.max(root.clientWidth, 320) && copies < 12) {
      copies += 1;
      fillSet(setA, SCROLL_ADVERTS, copies, true);
    }
    fillSet(setB, SCROLL_ADVERTS, copies, true);

    function pause() { track.style.animationPlayState = 'paused'; }
    function resume() { track.style.animationPlayState = ''; }
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', function (ev) {
      if (!root.contains(ev.relatedTarget)) resume();
    });
    root.addEventListener('touchstart', pause, { passive: true });
    root.addEventListener('touchend', function () {
      setTimeout(resume, 1200);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
