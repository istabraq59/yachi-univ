(function () {
  var ROLE = null, asked = false, open = false, waited = 0;
  var OFFICER = [['Placement Dashboard', 'dashboard'], ['Available Opportunities', 'opportunities'], ['Student Applications', 'applications'], ['Internship Management', 'internships'],
                 ['Placement Results', 'results'], ['Partner Organizations', 'organizations'], ['Reports', 'reports']];
  var STUDENT = [['Placement Dashboard', 'dashboard'], ['Available Opportunities', 'opportunities'], ['My Applications', 'applications'], ['My Placement', 'results']];
  var BRIEFCASE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-inline-end:6px"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>';
  function go(id) { document.body.classList.remove('yu-open'); location.href = 'placement/#/' + id; }
  function paintHead(head) {
    head.textContent = ''; head.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
    var a = document.createElement('span'); a.innerHTML = BRIEFCASE; a.appendChild(document.createTextNode('Placement & Internship'));
    var c = document.createElement('span'); c.textContent = open ? '▾' : '▸'; head.appendChild(a); head.appendChild(c);
  }
  function paintBody(body) {
    body.style.display = open ? '' : 'none'; body.textContent = '';
    (ROLE === 'officer' ? OFFICER : STUDENT).forEach(function (it) { var b = document.createElement('button'); b.textContent = it[0]; b.onclick = function () { go(it[1]); }; body.appendChild(b); });
  }
  function refresh() { var h = document.querySelector('#yuSide nav [data-pl-grp]'); if (h) { paintHead(h); paintBody(h.nextSibling); } }
  function ensure() {
    if (!asked && typeof db !== 'undefined') {
      asked = true;
      try { db.rpc('pl_role').then(function (r) { ROLE = (r && !r.error && r.data) || 'none'; }, function () { ROLE = 'none'; }); } catch (e) { ROLE = 'none'; }
    }
    if (ROLE !== 'officer' && ROLE !== 'student') return;
    var nav = document.querySelector('#yuSide nav'); if (!nav) return;
    if (nav.querySelector('[data-pl-grp]')) return;
    var tmpl = nav.querySelector('.grp'), gb = nav.querySelector('.gb'); if (!tmpl || !gb) return;
    var fin = nav.querySelector('[data-fin-grp]');
    if (!fin && waited++ < 12) return;                 /* give the Finance menu a few seconds to appear first, so we sit above it */
    var ref = fin || nav.querySelector('[data-sys]') || nav.querySelector('button.out') || null;
    var head = tmpl.cloneNode(false), body = gb.cloneNode(false);
    head.setAttribute('data-pl-grp', '1'); head.onclick = function () { open = !open; refresh(); };
    nav.insertBefore(head, ref); nav.insertBefore(body, head.nextSibling); paintHead(head); paintBody(body);
  }
  setInterval(function () { if (!document.hidden) ensure(); }, 400);
})();
