(function () {
  var CSS = [
    'body.yu-in{background:#f3f6fc}',
    'body.yu-in h1{display:none}',
    '.yu-off{display:none!important}',
    '.yu-dup{display:none!important}',
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
    '#yuSide nav .grp{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7f9be0;padding:14px 12px 4px}',
    '#yuSide nav button.out{margin-top:12px;border-top:1px solid rgba(255,255,255,.12);border-radius:0 0 10px 10px;color:#ffb4b4}',
    'body.yu-in .yu-main{max-width:900px;margin:0 auto;padding-top:60px}',
    '#yuHome{margin:12px 0}',
    '#yuHome h3{margin:0 0 4px;color:#0f2a5e}',
    '#yuHome p{margin:0 0 12px;color:#64748b}',
    '#yuHome .stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}#yuHome .stats:empty{display:none}#yuHome .st{background:linear-gradient(160deg,#1e3a8a,#2563eb);color:#fff;border-radius:14px;padding:14px}#yuHome .st b{display:block;font-size:28px}#yuHome .st span{font-size:12px;opacity:.9}',
    '#yuHome .tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}',
    '#yuHome .tiles button{background:#fff;border:1px solid #dbe4f5;border-left:5px solid #2563eb;border-radius:12px;padding:16px 12px;text-align:left;font-size:14px;color:#0f2a5e;font-weight:600;box-shadow:0 2px 8px rgba(30,58,138,.07);margin:0;width:auto;cursor:pointer}',
    '@media(min-width:820px){body.yu-in{padding-left:260px}body.yu-in #yuTop{display:none}body.yu-in #yuSide{transform:none;z-index:40}body.yu-in .yu-main{padding-top:20px}#yuHome .tiles{grid-template-columns:repeat(3,1fr)}}'
  ].join('\n');
  var me = null, meEl = null;
  var CSS2 = [
    '#yuTop .me{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:13px}',
    '#yuTop .me i{width:30px;height:30px;border-radius:50%;background:#2563eb;display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-weight:700}',
    '#yuBanner{background:linear-gradient(120deg,#dbe9ff,#f4f8ff 60%,#cfe1ff);border-radius:16px;padding:20px;margin-bottom:14px;border:1px solid #dbe4f5}',
    '#yuBanner h2{margin:0 0 6px;color:#0f2a5e;font-size:24px}',
    '#yuBanner p{margin:0;color:#475569}',
    '#yuBanner em{display:block;margin-top:12px;color:#1e3a8a;font-family:cursive;font-size:18px}',
    '#yuHome h4{margin:16px 0 8px;color:#0f2a5e}',
    '#yuSide nav .grp{cursor:pointer;user-select:none}',
    '#yuTabs{display:none;gap:6px;overflow-x:auto;padding:2px 0 12px}',
    '#yuTabs button{width:auto;white-space:nowrap;background:#e8eefb;color:#0f2a5e;border:0;border-radius:999px;padding:8px 14px;margin:0;font-size:13px;cursor:pointer;flex:none}',
    '#yuTabs button.on{background:#2563eb;color:#fff;font-weight:600}',
    '#yuTop #yuSb{margin-left:auto;flex:0 1 150px;min-width:0}',
    '#yuTop #yuSi{width:100%;height:34px;margin:0;padding:6px 12px;font-size:13px;border:0;border-radius:999px;background:rgba(255,255,255,.16);color:#fff}',
    '#yuTop #yuSi::placeholder{color:#c7d4f0}',
    '#yuTop .me{margin-left:8px}',
    '#yuSearch{display:none;position:fixed;top:66px;left:0;right:0;background:#fff;padding:10px 14px;z-index:55;box-shadow:0 8px 20px rgba(15,42,94,.2)}',
    '#yuSearch.open{display:block}',
    '#yuSearch input{width:100%;margin:0}',
    '#yuSearch .res button{display:block;width:100%;text-align:left;background:#f3f6fc;border:0;border-radius:10px;padding:10px 12px;margin:6px 0 0;color:#0f2a5e;font-size:14px}',
    '#yuSearch small{display:block;color:#64748b}',
    '@media(min-width:820px){body.yu-in #yuTop #yuSb{display:inline-block}#yuSearch{left:260px}}',
    '#yuHome h5{cursor:pointer;user-select:none;background:#e8eefb;border-radius:10px;padding:10px 12px;margin:10px 0 6px;color:#64748b;font-size:12px;letter-spacing:.08em;text-transform:uppercase}',
    '#yuHome .stats .st{border:1px solid transparent}',
    '#yuHome .stats .st i{font-style:normal;font-size:22px;display:block;margin-bottom:6px}',
    '#yuHome .stats .st.s0{background:#e8f0ff;border-color:#c9dbff;color:#1e3a8a}',
    '#yuHome .stats .st.s1{background:#e6f7ee;border-color:#bfe8d0;color:#14532d}',
    '#yuHome .stats .st.s2{background:#f0e9ff;border-color:#dccbff;color:#4c1d95}',
    '#yuHome .stats .st.s3{background:#fff1e3;border-color:#ffd8b0;color:#7c2d12}',
    '#yuHome .tiles .yuq{display:flex;align-items:center;gap:10px;border:1px solid #dbe4f5;border-radius:14px;padding:14px;box-shadow:none}',
    '#yuHome .tiles .yuq i{font-style:normal;font-size:22px;width:40px;height:40px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:#fff;flex:none}',
    '#yuHome .tiles .yuq.c0{background:#e8f0ff;border-color:#c9dbff;color:#1e3a8a}',
    '#yuHome .tiles .yuq.c1{background:#e6f7ee;border-color:#bfe8d0;color:#14532d}',
    '#yuHome .tiles .yuq.c2{background:#f0e9ff;border-color:#dccbff;color:#4c1d95}',
    '#yuHome .tiles .yuq.c3{background:#fff1e3;border-color:#ffd8b0;color:#7c2d12}',
    '#yuAct{background:#fff;border:1px solid #dbe4f5;border-radius:14px;padding:4px 14px 10px;margin-top:14px}',
    '#yuAct .row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eef2fa;font-size:14px;color:#0f2a5e}',
    '#yuAct .row small{color:#64748b;white-space:nowrap}',
    '#yuTop .me{cursor:pointer}',
    '#yuProf{position:fixed;top:58px;right:10px;width:270px;max-width:calc(100vw - 20px);background:#fff;border:1px solid #dbe4f5;border-radius:14px;box-shadow:0 12px 30px rgba(15,42,94,.25);z-index:80;padding:14px;color:#0f2a5e}',
    '#yuProf .pf-top{display:flex;gap:10px;align-items:center;margin-bottom:6px}',
    '#yuProf .pf-av{width:44px;height:44px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex:none}',
    '#yuProf small{color:#64748b;display:block;word-break:break-all}',
    '#yuProf button{display:block;width:100%;text-align:left;background:#f3f6fc;border:0;border-radius:10px;padding:10px 12px;margin:6px 0 0;color:#0f2a5e;font-size:14px;cursor:pointer}',
    '#yuProf button.out{color:#b91c1c}',
    '#yuTop b{white-space:nowrap}@media(max-width:819px){#yuTop .me .nm{display:none}}',
    '@media(min-width:820px){body.yu-in #yuTop{display:flex;left:260px}body.yu-in #yuTop button{display:none}body.yu-in .yu-main{padding-top:70px}}'
  ].join('\n');
  function closeProf() { var p = document.getElementById('yuProf'); if (p) p.remove(); if (searchBox) searchBox.classList.remove('open'); }
  function toggleProf(e) {
    if (e) e.stopPropagation();
    if (document.getElementById('yuProf')) { closeProf(); return; }
    if (!me) return;
    var p = el('div', { id: 'yuProf' }); p.onclick = function (ev) { ev.stopPropagation(); };
    var tp = el('div', { class: 'pf-top' });
    tp.appendChild(el('div', { class: 'pf-av', text: initials(me.name) }));
    var tx = el('div'); tx.appendChild(el('b', { text: me.name }));
    tx.appendChild(el('small', { text: (me.role || '').replace(/_/g, ' ') }));
    tx.appendChild(el('small', { text: me.email || '' }));
    tp.appendChild(tx); p.appendChild(tp);
    [[/biograph/i, 'My biography'], [/my id card/i, 'My ID card'], [/change password/i, 'Change password']].forEach(function (x) {
      var f = null; cards.forEach(function (c) { if (!f && x[0].test(c.label) && !/look up/i.test(c.label)) f = c; });
      if (!f) return;
      var b = el('button', { text: x[1] }); b.onclick = function () { closeProf(); go(f.key); }; p.appendChild(b);
    });
    var so = el('button', { class: 'out', text: 'Sign out' }); so.onclick = function () { closeProf(); db.auth.signOut(); }; p.appendChild(so);
    document.body.appendChild(p);
  }
  document.addEventListener('click', closeProf);
  var searchBox = null, searchTimer = null;
  function renderTabs() {
    if (!tabs) return;
    if (cur === 'home') { tabs.style.display = 'none'; return; }
    var g = null; gList.forEach(function (x) { if (!g && x[1].some(function (c) { return c.key === cur; })) g = x; });
    tabs.textContent = '';
    if (!g || g[1].length < 2) { tabs.style.display = 'none'; return; }
    tabs.style.display = '';
    g[1].forEach(function (c) { var b = el('button', { class: c.key === cur ? 'on' : '', text: c.label }); b.onclick = function () { go(c.key); }; tabs.appendChild(b); });
    var on = tabs.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  function ensureSearch() {
    if (searchBox) return searchBox;
    searchBox = el('div', { id: 'yuSearch' });
    var inp = document.getElementById('yuSi');
    var res = el('div', { class: 'res' });
    searchBox.appendChild(res); document.body.appendChild(searchBox);
    searchBox.onclick = function (e) { e.stopPropagation(); };
    document.addEventListener('click', function () { searchBox.classList.remove('open'); });
    inp.oninput = function () {
      clearTimeout(searchTimer);
      var q = inp.value.replace(/[,()%*]/g, '').trim();
      if (q.length < 2) { res.textContent = ''; searchBox.classList.remove('open'); return; }
      searchBox.classList.add('open');
      searchTimer = setTimeout(function () { runSearch(q, res); }, 300);
    };
    return searchBox;
  }
  function runSearch(q, res) {
    res.textContent = 'Searching...';
    var filt = 'full_name.ilike.%' + q + '%,student_number.ilike.%' + q + '%';
    db.from('students').select('id, student_number, full_name, year_of_study, departments(name), programs(name)').or(filt).limit(8).then(function (r) {
      if (r.error) { db.from('students').select('id, student_number, full_name, year_of_study').or(filt).limit(8).then(function (r2) { showRes(res, r2.data || []); }); return; }
      showRes(res, r.data || []);
    });
  }
  function showRes(res, rows) {
    res.textContent = '';
    if (!rows.length) { res.appendChild(el('p', { text: 'No student found.' })); return; }
    rows.forEach(function (s) {
      var b = el('button', { type: 'button' });
      b.appendChild(document.createTextNode(s.full_name));
      b.appendChild(el('small', { text: s.student_number + (s.departments && s.departments.name ? ' | ' + s.departments.name : '') + ' | tap to open the transcript' }));
      b.onclick = function () {
        searchBox.classList.remove('open');
        var si0 = document.getElementById('yuSi'); if (si0) { si0.value = ''; si0.blur(); }
        var t = cards.filter(function (c) { return c.key === 'trCard'; })[0];
        if (t) { go('trCard'); if (window.YUOpenTranscript) window.YUOpenTranscript(s); }
      };
      res.appendChild(b);
    });
  }
  function toggleSearch(e) { if (e) e.stopPropagation(); var b = ensureSearch(); b.classList.toggle('open'); if (b.classList.contains('open')) b.querySelector('input').focus(); }
  function initials(n) { return (n || '?').trim().charAt(0).toUpperCase(); }
  function paintMe() {
    if (!me || !meEl) return;
    meEl.textContent = '';
    meEl.appendChild(el('i', { text: initials(me.name) }));
    meEl.appendChild(el('span', { class: 'nm', text: me.name }));
  }
  function loadMe(cb) {
    if (me) { cb(me); return; }
    db.auth.getUser().then(function (u) {
      var user = u.data && u.data.user; if (!user) return;
      var base = { name: (user.email || '').split('@')[0], role: '', email: user.email || '' };
      db.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle().then(function (r) {
        if (r.data) { if (r.data.full_name) base.name = r.data.full_name; base.role = r.data.role || ''; }
        me = base; paintMe(); cb(me);
      }, function () { me = base; paintMe(); cb(me); });
    });
  }
  function ago(t) {
    var m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    var h = Math.floor(m / 60); if (h < 24) return h + ' h ago';
    return Math.floor(h / 24) + ' d ago';
  }
  var ICONS = [[/password/i, '\u{1F511}'], [/sign-up|code/i, '\u{1F39F}'], [/id card/i, '\u{1FAAA}'], [/biograph/i, '\u{1F4DD}'], [/student/i, '\u{1F393}'], [/gate|scanner/i, '\u{1F6AA}'], [/report/i, '\u{1F4CA}'], [/office|director/i, '\u{1F3E2}'], [/college|institute|school/i, '\u{1F3EB}'], [/dorm/i, '\u{1F6CF}'], [/announce/i, '\u{1F4E2}'], [/account|assign|staff/i, '\u{1F465}'], [/enroll|roster|class/i, '\u{1F4CB}'], [/timetable/i, '\u{1F552}'], [/attendance/i, '\u2705'], [/teacher/i, '\u{1F9D1}\u200D\u{1F3EB}'], [/course|grade|transcript|semester/i, '\u{1F4DA}']];
  function icon(l) { for (var i = 0; i < ICONS.length; i++) if (ICONS[i][0].test(l)) return ICONS[i][1]; return '\u{1F4C1}'; }
  function banner() {
    var b = el('div', { id: 'yuBanner' }); var h = el('h2', { text: 'Welcome' });
    b.appendChild(h);
    b.appendChild(el('p', { text: 'Manage students, courses, departments and academic activities easily and efficiently.' }));
    b.appendChild(el('em', { text: 'Better Education, Brighter Future' }));
    loadMe(function (m) { h.textContent = 'Welcome, ' + m.name; });
    return b;
  }
  function activity(h) {
    loadMe(function (m) {
      if (!/^(admin|administrator)$/.test(m.role)) return;
      var box = el('div', { id: 'yuAct' }); box.appendChild(el('h4', { text: 'Recent activities' }));
      var list = el('div'); box.appendChild(list); h.appendChild(box);
      var rows = [], pending = 2;
      function fin() {
        if (--pending) return;
        rows.sort(function (a, b) { return b.t - a.t; }); list.textContent = '';
        if (!rows.length) { list.appendChild(el('p', { text: 'No activity yet.' })); return; }
        rows.slice(0, 6).forEach(function (r) { var d = el('div', { class: 'row' }); d.appendChild(el('span', { text: r.text })); d.appendChild(el('small', { text: ago(r.t) })); list.appendChild(d); });
      }
      db.from('profiles').select('full_name, role, created_at').order('created_at', { ascending: false }).limit(4).then(function (r) {
        if (!r.error && r.data) r.data.forEach(function (p) { if (p.created_at) rows.push({ t: new Date(p.created_at).getTime(), text: 'New account: ' + (p.full_name || '(no name)') + ' (' + p.role + ')' }); });
        fin();
      }, fin);
      db.from('gate_logs').select('created_at, profiles!gate_logs_profile_id_fkey(full_name)').order('created_at', { ascending: false }).limit(4).then(function (r) {
        if (!r.error && r.data) r.data.forEach(function (x) { if (x.created_at) rows.push({ t: new Date(x.created_at).getTime(), text: ((x.profiles && x.profiles.full_name) || 'Someone') + ' scanned at the gate' }); });
        fin();
      }, fin);
    });
  }
  var gList = [], tabs = null, homeOpen = {}, sideOpen = {}, lastSig = '', cur = 'home', signed = null, container = null, side, top, scrim, home, nav, cards = [];
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
  function appHidden(c) { return !!c.hidden || c.offsetParent === null; }
  function findSigned() { var s = null; document.querySelectorAll('.card').forEach(function (x) { if (!s && /Signed in as/.test(x.textContent) && !x.querySelector('.card')) s = x; }); return s; }
  function shellParts() {
    if (side) return;
    var st = el('style', { id: 'yuShell2Style' }); st.textContent = CSS + '\n' + CSS2; document.head.appendChild(st);
    top = el('div', { id: 'yuTop' });
    var mb = el('button', { text: '\u2630', 'aria-label': 'Menu' }); mb.onclick = function () { document.body.classList.toggle('yu-open'); };
    top.appendChild(mb); top.appendChild(el('b', { text: 'Yachi University' }));
    var sb = el('div', { id: 'yuSb' }); var si = el('input', { type: 'search', id: 'yuSi', placeholder: '\u{1F50D} Search student', 'aria-label': 'Search student' }); si.onfocus = function () { ensureSearch(); }; si.onclick = function (e) { e.stopPropagation(); }; sb.appendChild(si); top.appendChild(sb);
    meEl = el('span', { class: 'me' }); meEl.onclick = toggleProf; top.appendChild(meEl); paintMe();
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
    renderTabs();
  }
  function build() {
    var s = findSigned(); if (!s) return;
    shellParts();
    signed = s; container = s.parentNode; container.classList.add('yu-main');
    if (!tabs) tabs = el('div', { id: 'yuTabs' });
    if (tabs.parentNode !== container) container.insertBefore(tabs, signed);
    document.body.classList.add('yu-in');
    document.querySelectorAll('.yu-off').forEach(function (x) { x.classList.remove('yu-off'); });
    cards = []; var seenIds = {};
    [].forEach.call(document.querySelectorAll('.card'), function (c, i) {
      if (c === signed || c.querySelector('.card')) return;
      if (ttl(c) === 'Transcript') { c.classList.add('yu-dup'); return; }
      if (c.closest('#yuHome, #yuSide, #yuProf, #yuBanner, #yuAct, #yuTop')) return;
      if (/Continue with Google/.test(c.textContent) || appHidden(c)) return;
      if (c.id && seenIds[c.id]) { c.classList.add('yu-dup'); return; }
      if (c.id) seenIds[c.id] = 1;
      var key = c.id || ('c' + i); c.setAttribute('data-yu', key);
      cards.push({ key: key, card: c, label: ttl(c) || 'Section' });
    });
    var sig = cards.map(function (c) { return c.key + ':' + c.label; }).join('|');
    if (sig === lastSig && home && home.parentNode === container) { apply(); return; }
    lastSig = sig;
    if (cur !== 'home' && !cards.some(function (c) { return c.key === cur; })) cur = 'home';
    nav.innerHTML = '';
    function item(k, t, cls, parent) { var b = el('button', { 'data-k': k, text: t }); if (cls) b.className = cls; b.onclick = function () { go(k); }; (parent || nav).appendChild(b); }
    item('home', 'Home');
    var GROUPS = [
      ['Main', /^my |change password/i],
      ['People', /student|account|sign-up|enroll|roster|password|teacher|assign staff|look up|print an id/i],
      ['Campus', /gate|scanner|office|dorm|college|institute|school|department|unit|head/i],
      ['Academic', /course|grade|transcript|semester|academic|attendance|exam|timetable|enrollment/i],
      ['Communication', /announce|message|notice/i]
    ];
    var used = {}, groupedList = []; gList = groupedList;
    GROUPS.concat([['More', /./]]).forEach(function (g) {
      var list = cards.filter(function (c) { return !used[c.key] && g[1].test(c.label); });
      if (!list.length) return;
      groupedList.push([g[0], list]);
      var gl = el('div', { class: 'grp' }), gb = el('div', { class: 'gb' });
      list.forEach(function (c) { used[c.key] = 1; item(c.key, c.label, null, gb); });
      if (sideOpen[g[0]] === undefined) sideOpen[g[0]] = list.some(function (c) { return c.key === cur; });
      (function (name, l, b) {
        function p() { var o = !!sideOpen[name]; b.style.display = o ? '' : 'none'; l.textContent = (o ? '\u25BE ' : '\u25B8 ') + name; }
        l.onclick = function () { sideOpen[name] = !sideOpen[name]; p(); }; p();
      })(g[0], gl, gb);
      nav.appendChild(gl); nav.appendChild(gb);
    });
    var so = el('button', { class: 'out', text: 'Sign out' }); so.onclick = function () { db.auth.signOut(); }; nav.appendChild(so);
    if (!home) { home = el('div', { id: 'yuHome' }); }
    if (home.parentNode !== container) container.insertBefore(home, signed.nextSibling);
    home.innerHTML = '';
    home.appendChild(banner());
    home.appendChild(el('h4', { id: 'yuQa', text: 'Quick actions' }));
    var ci = 0;
    groupedList.forEach(function (g) {
      var hd = el('h5', { class: 'yuGh' }); home.appendChild(hd);
      var t = el('div', { class: 'tiles' });
      g[1].forEach(function (c) {
        var b = el('button', { class: 'yuq c' + (ci++ % 4) });
        b.appendChild(el('i', { text: icon(c.label) })); b.appendChild(el('span', { text: c.label }));
        b.onclick = function () { go(c.key); }; t.appendChild(b);
      });
      home.appendChild(t);
      function paint() { var o = !!homeOpen[g[0]]; t.style.display = o ? '' : 'none'; hd.textContent = (o ? '\u25BE ' : '\u25B8 ') + g[0] + ' (' + g[1].length + ')'; }
      hd.onclick = function () { homeOpen[g[0]] = !homeOpen[g[0]]; paint(); };
      paint();
    });
    stats(home);
    if (window.YUUpcoming) window.YUUpcoming(home);
    activity(home);
    apply();
  }
  var statsBox = null, statsAt = 0;
  function stats(h) {
    var box = el('div', { class: 'stats' });
    h.insertBefore(box, h.querySelector('#yuQa'));
    function slot(label, ic, cls, run) {
      var d = el('div', { class: 'st ' + cls }); d.style.display = 'none';
      d.appendChild(el('i', { text: ic }));
      var n = el('b', { text: '' }); d.appendChild(n); d.appendChild(el('span', { text: label })); box.appendChild(d);
      run(function (c) { if (c !== null && c !== undefined) { n.textContent = String(c); d.style.display = ''; } });
    }
    function cnt(table, filter) {
      return function (done) {
        var q = db.from(table).select('id', { count: 'exact', head: true });
        if (filter) q = filter(q);
        q.then(function (r) { done(r.error ? null : r.count); }, function () { done(null); });
      };
    }
    slot('Students', '\u{1F393}', 's0', cnt('students'));
    slot('Staff', '\u{1F465}', 's1', function (done) {
      db.from('profiles').select('id', { count: 'exact', head: true }).not('role', 'in', '(student,admin,administrator)')
        .then(function (r) { done(r.error ? null : r.count); }, function () { done(null); });
    });
    slot('Colleges and schools', '\u{1F3EB}', 's2', cnt('academic_units', function (q) { return q.neq('type', 'office'); }));
    slot('Offices', '\u{1F3E2}', 's3', cnt('academic_units', function (q) { return q.eq('type', 'office'); }));
  }
  function teardown() {
    document.body.classList.remove('yu-in', 'yu-open'); closeProf();
    document.querySelectorAll('.yu-off').forEach(function (x) { x.classList.remove('yu-off'); });
    if (home && home.parentNode) home.parentNode.removeChild(home);
    signed = null; cur = 'home'; lastSig = ''; if (tabs) tabs.style.display = 'none';
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
