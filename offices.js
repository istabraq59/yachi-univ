(function () {
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var tries = 0;
    (function t() {
      var anchor = null;
      document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Colleges, institutes and schools/.test(x.textContent) && !x.querySelector('.card')) anchor = x; });
      if (anchor && anchor.parentNode) { anchor.parentNode.insertBefore(c, anchor.nextSibling); return; }
      if (++tries < 12) { setTimeout(t, 500); return; }
      var s = null;
      document.querySelectorAll('.card').forEach(function (x) { if (!s && /Signed in as/.test(x.textContent)) s = x; });
      if (s && s.parentNode) s.parentNode.insertBefore(c, s.nextSibling); else document.body.appendChild(c);
    })();
  }
  function card() {
    var c = el('div', { class: 'card', id: 'officeUnitsCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'Offices and directorates' }));
    d.appendChild(el('p', { text: 'Leadership offices, directorates and student services. These are separate from colleges, institutes and schools.' }));
    var search = el('input', { placeholder: 'Search offices' });
    var list = el('div');
    d.appendChild(search); d.appendChild(list);
    d.appendChild(el('h3', { text: 'Add an office' }));
    var nm = el('input', { placeholder: 'Office or directorate name' });
    var add = el('button', { type: 'button', text: 'Add office' });
    var msg = el('p');
    d.appendChild(nm); d.appendChild(add); d.appendChild(msg);
    c.appendChild(d); place(c);
    var rows = [];
    function render() {
      list.innerHTML = '';
      var q = search.value.trim().toLowerCase();
      var shown = rows.filter(function (r) { return !q || r.name.toLowerCase().indexOf(q) >= 0; });
      list.appendChild(el('p', { text: shown.length + ' of ' + rows.length + ' offices' }));
      shown.forEach(function (r) { list.appendChild(el('p', { text: r.name })); });
    }
    function load() {
      db.from('academic_units').select('id,name').eq('type', 'office').order('name').then(function (r) {
        if (r.error) { list.textContent = 'Could not load: ' + r.error.message; return; }
        rows = r.data || []; render();
      });
    }
    search.oninput = render;
    add.onclick = function () {
      var name = nm.value.trim();
      if (!name) { msg.textContent = 'Type a name first.'; return; }
      add.disabled = true; msg.textContent = 'Saving...';
      db.from('academic_units').insert({ name: name, type: 'office' }).then(function (r) {
        add.disabled = false;
        if (r.error) { msg.textContent = 'Could not add: ' + r.error.message; return; }
        msg.textContent = 'Added.'; nm.value = ''; load();
      });
    };
    load();
  }
  function run() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (!r.data) return;
        if ((r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('officeUnitsCard')) card();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(run, 400); });
  run();
})();
