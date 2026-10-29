(function () {
  var CSS = [
    'body.yu-in{background:#f3f6fc}',
    'body.yu-in h1{display:none}',
    '.yu-off{display:none!important}',
    '#yuSide,#yuTop,#yuScrim{display:none}',
    'body.yu-in #yuTop{display:flex;position:fixed;top:0;left:0;right:0;height:52px;background:#0f2a5e;color:#fff;align-items:center;gap:12px;padding:0 14px;z-index:50;box-shadow:0 2px 10px rgba(0,0,0,.2)}',
    '#yuTop button{background:none;border:0;color:#fff;font-size:26px;line-height:1;padding:4px 8px;width:auto;margin:0;cursor:pointer}',
    '#yuTop b{font-size:16px}',
    'body.yu-in #yuSide{display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;width:260px;max-width:82vw;background:#0f2a5e;color:#fff;z-index:70;transform:translateX(-105%);transition:transform .2s;overflow-y:auto}',
    'body.yu-in.yu-open #yuSide{transform:none}',
    'body.yu-in.yu-open #yuScrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:60}',
    '#yuSide .brand{display:flex;align-items:center;gap:10px;padding:16px;border-bottom:1px solid rgba(255,255,255,.12)}',
    '#yuSide .brand img{width:40px;height:40px;border-radius:10px;object-fit:cover;background:#fff}',
    '#yuSide .brand b{display:block;font-size:15px}#yuSide .brand small{opacity:.8;font-size:11px}',
    '#yuSide nav{padding:10px;display:flex;flex-direction:column;gap:2px;flex:1}',
    '#yuSide nav button{background:none;border:0;color:#d6e2ff;text-align:left;padding:11px 12px;border-radius:10px;font-size:14px;width:100%;margin:0;cursor:pointer}',
    '#yuSide nav button.on{background:#2563eb;color:#fff;font-weight:600}',
    '#yuSide nav button:hover{background:rgba(255,255,255,.1)}',
    '#yuSide nav button.out{margin-top:12px;border-top:1px solid rgba(255,255,255,.12);border-radius:0 0 10px 10px;color:#ffb4b4}',
    'body.yu-in .yu-main{max-width:900px;margin:0 auto;padding-top:60px}',
    '#yuHome{margin:12px 0}',
    '#yuHome h3{margin:0 0 4px;color:#0f2a5e}',
    '#yuHome p{margin:0 0 12px;color:#64748b}',
    '#yuHome .tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}',
    '#yuHome .tiles button{background:#fff;border:1px solid #dbe4f5;border-left:5px solid #2563eb;border-radius:12px;padding:16px 12px;text-align:left;font-size:14px;color:#0f2a5e;font-weight:600;box-shadow:0 2px 8px rgba(30,58,138,.07);margin:0;width:auto;cursor:pointer}',
    '@media(min-width:820px){body.yu-in{padding-left:260px}body.yu-in #yuTop{display:none}body.yu-in #yuSide{transform:none;z-index:40}body.yu-in .yu-main{padding-top:20px}#yuHome .tiles{grid-template-columns:repeat(3,1fr)}}'
  ].join('\n');
  var cur = 'home', signed = null, container = null, side, top, scrim, home, nav, cards = [];
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  var NAMES = {scannerCard:'Gate and meal scanner',idCard:'My ID card',idLookupCard:'Print an ID card',photoCard:'My photo',bioCard:'My biography',gateReportsCard:'Gate and meal reports',officeUnitsCard:'Offices and directorates',dormOfficeCard:'Dormitory office',staffInfoCard:'My staff information',headCard:'Head of unit'};
function ttl(c) {
  if (c.id && NAMES[c.id]) return NAMES[c.id];
  var h = c.querySelector('h1,h2,h3,h4,h5,legend,strong,b,.title');
  if (h && h.textContent.trim()) return h.textContent.trim().slice(0, 40);
  var w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, null), n;
  while ((n = w.nextNode())) {
    var p = n.parentNode && n.parentNode.nodeName;
    if (p === 'SCRIPT' || p === 'STYLE' || p === 'OPTION' || p === 'BUTTON') continue;
    var t = n.nodeValue.trim(); if (t.length > 2) return t.slice(0, 40);
  }
  return '';
}
  function appHidden(c) { return c.hidden || c.style.display === 'none'; }
  function findSigned() { var s = null; document.querySelectorAll('.card').forEach(function (x) { if (!s && /Signed in as/.test(x.textContent) && !x.querySelector('.card')) s = x; }); return s; }
  function shellParts() {
    if (side) return;
    var st = el('style', { id: 'yuShell2Style' }); st.textContent = CSS; document.head.appendChild(st);
    top = el('div', { id: 'yuTop' });
    var mb = el('button', { text: '\u2630', 'aria-label': 'Menu' }); mb.onclick = function () { document.body.classList.toggle('yu-open'); };
    top.appendChild(mb); top.appendChild(el('b', { text: 'Yachi University' }));
    scrim = el('div', { id: 'yuScrim' }); scrim.onclick = function () { document.body.classList.remove('yu-open'); };
    side = el('div', { id: 'yuSide' });
    var br = el('div', { class: 'brand' }); var im = el('img', { src: 'logo.jpg', alt: '' }); im.onerror = function () { im.style.display = 'none'; };
    var bt = el('div'); bt.appendChild(el('b', { text: 'Yachi University' })); bt.appendChild(el('small', { text: 'Student Management System' }));
    br.appendChild(im); br.appendChild(bt); side.appendChild(br);
    nav = el('nav'); side.appendChild(nav);
    document.body.appendChild(top); document.body.appendChild(scrim); document.body.appendChild(side);
  }
  function go(k) { cur = k; document.body.classList.remove('yu-open'); apply(); window.scrollTo(0, 0); }
  function apply() {
    if (!signed) return;
    cards.forEach(function (c) { c.card.classList.toggle('yu-off', cur !== c.key); });
    if (home) home.classList.toggle('yu-off', cur !== 'home');
    signed.classList.toggle('yu-off', cur !== 'home');
    [].forEach.call(nav.querySelectorAll('button[data-k]'), function (b) { b.classList.toggle('on', b.getAttribute('data-k') === cur); });
  }
  function build() {
    var s = findSigned(); if (!s) return;
    shellParts();
    signed = s; container = s.parentNode; container.classList.add('yu-main');
    document.body.classList.add('yu-in');
    cards = [];
    [].forEach.call(container.children, function (c, i) {
      if (!c.classList || !c.classList.contains('card') || c === signed) return;
      if (/Continue with Google/.test(c.textContent) || c.querySelector('.card') || appHidden(c)) return;
      var key = c.id || ('c' + i); c.setAttribute('data-yu', key);
      cards.push({ key: key, card: c, label: ttl(c) || 'Section' });
    });
    if (cur !== 'home' && !cards.some(function (c) { return c.key === cur; })) cur = 'home';
    nav.innerHTML = '';
    function item(k, t, cls) { var b = el('button', { 'data-k': k, text: t }); if (cls) b.className = cls; b.onclick = function () { go(k); }; nav.appendChild(b); }
    item('home', 'Home');
    cards.forEach(function (c) { item(c.key, c.label); });
    var so = el('button', { class: 'out', text: 'Sign out' }); so.onclick = function () { db.auth.signOut(); }; nav.appendChild(so);
    if (!home) { home = el('div', { id: 'yuHome' }); }
    if (home.parentNode !== container) container.insertBefore(home, signed.nextSibling);
    home.innerHTML = '';
    home.appendChild(el('h3', { text: 'Welcome to Yachi University' }));
    home.appendChild(el('p', { text: 'Choose what you want to do.' }));
    var t = el('div', { class: 'tiles' });
    cards.forEach(function (c) { var b = el('button', { text: c.label }); b.onclick = function () { go(c.key); }; t.appendChild(b); });
    home.appendChild(t);
    apply();
  }
  function teardown() {
    document.body.classList.remove('yu-in', 'yu-open');
    document.querySelectorAll('.yu-off').forEach(function (x) { x.classList.remove('yu-off'); });
    if (home && home.parentNode) home.parentNode.removeChild(home);
    signed = null; cur = 'home';
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (r) { if (r.data && r.data.session) build(); else teardown(); });
  }
  var timer = null;
  function later() { clearTimeout(timer); timer = setTimeout(check, 400); }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  new MutationObserver(function (m) { if (signed || document.body.classList.contains('yu-in')) later(); }).observe(document.body, { childList: true, subtree: true });
  [600, 1500, 3000, 6000].forEach(function (ms) { setTimeout(check, ms); });
})();
