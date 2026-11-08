// To add a link: add a line to the right list. Logo = file in embed/bike-logos/, the emoji shows if it is missing.
var GUIDES = [
  ['parktool', 'Park Tool Repair Help', 'https://www.parktool.com/en-us/blog/repair-help', '🔧', 'Step-by-step repair and build articles and videos'],
  ['sheldon', 'Sheldon Brown', 'https://www.sheldonbrown.com/', '📚', 'The classic bicycle technical encyclopaedia'],
  ['shimano', 'Shimano Dealer Manuals', 'https://si.shimano.com/', '⚙️', 'Official fitting manuals for Shimano parts'],
  ['sram', 'SRAM Service', 'https://www.sram.com/en/service', '⚙️', 'Official manuals and service guides for SRAM parts']
];
var PARTS = [
  ['compton', 'Compton Cycles', 'https://comptoncycles.co.uk/', '🚲', 'Parts and workshop, Catford, South East London'],
  ['wiggle', 'Wiggle', 'https://www.wiggle.com/', '📦', 'Components and tools, United Kingdom'],
  ['merlin', 'Merlin Cycles', 'https://www.merlincycles.com/', '📦', 'Components and groupsets, United Kingdom'],
  ['bikediscount', 'Bike-Discount', 'https://www.bike-discount.de/en/', '📦', 'Components, Germany, ships across Europe'],
  ['rose', 'Rose Bikes', 'https://www.rosebikes.com/', '🌹', 'Parts and frames, Germany']
];
var FRAMES = [
  ['mercian', 'Mercian Cycles', 'https://www.merciancycles.co.uk/', '🧑‍🏭', 'Hand-built steel frames, Derby, since 1946'],
  ['bespoked', 'Bespoked Handmade Bicycle Show', 'https://bespoked.cc/', '🏆', 'Meet independent frame builders'],
  ['brompton', 'Brompton', 'https://www.brompton.com/', '🚲', 'Folding bikes hand-built in London']
];
var STEPS = ['Choose the frame and check its size', 'Fit the headset and fork', 'Fit the bottom bracket', 'Fit the crankset',
  'Fit the stem and handlebars', 'Build or fit the wheels, tyres and tubes', 'Fit the brakes', 'Fit the gears and shifters',
  'Fit the chain and set the gears', 'Fit the saddle and seat post', 'Wrap the bar tape or fit the grips',
  'Fit the pedals', 'Torque check every bolt', 'Test ride slowly and check again'];
function card(s) {
  var a = document.createElement('a');
  a.className = 'shop'; a.href = s[2]; a.target = '_blank'; a.rel = 'noopener noreferrer';
  var l = document.createElement('span'); l.className = 'logo';
  var img = new Image(); img.alt = ''; img.src = 'embed/bike-logos/' + s[0] + '.png';
  img.onerror = function () { l.textContent = s[3]; };
  l.appendChild(img);
  var t = document.createElement('span');
  var n = document.createElement('div'); n.className = 'name'; n.textContent = s[1] + ' ↗';
  var d = document.createElement('div'); d.className = 'note'; d.textContent = s[4];
  t.appendChild(n); t.appendChild(d); a.appendChild(l); a.appendChild(t);
  return a;
}
[['guides', GUIDES], ['parts', PARTS], ['frames', FRAMES]].forEach(function (p) {
  var box = document.getElementById(p[0]);
  p[1].forEach(function (s) { box.appendChild(card(s)); });
});
// The checklist ticks are kept in this browser only
var KEY = 'rv-bike-builder-steps', done = {};
try { done = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }
function drawSteps() {
  var box = document.getElementById('chk'), n = 0;
  box.textContent = '';
  STEPS.forEach(function (s, i) {
    var lab = document.createElement('label'), c = document.createElement('input');
    c.type = 'checkbox'; c.checked = !!done[i]; if (c.checked) n++;
    c.onchange = function () { done[i] = c.checked; save(); drawSteps(); };
    lab.appendChild(c); lab.appendChild(document.createTextNode((i + 1) + '. ' + s)); box.appendChild(lab);
  });
  document.getElementById('count').textContent = n + ' of ' + STEPS.length + ' steps done';
}
document.getElementById('reset').onclick = function () { done = {}; save(); drawSteps(); };
drawSteps();
