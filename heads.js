(function () {
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function headCard(role, uid) {
    var c = el('div', { class: 'card', id: 'headCard' });
    var h = el('h2', { text: role === 'college_head' ? 'My college' : 'My department' });
    var info = el('p', { text: 'Loading...' });
    var search = el('input', { placeholder: 'Search by name or ID' });
    var list = el('div');
    c.appendChild(h); c.appendChild(info); c.appendChild(search); c.appendChild(list);
    place(c);
    var rows = [];
    function show() {
      var q = search.value.toLowerCase(); list.innerHTML = '';
      var f = rows.filter(function (s) { return (s.student_number + ' ' + (s.full_name || '')).toLowerCase().indexOf(q) >= 0; });
      f.forEach(function (s) {
        var p = el('p'); p.appendChild(el('strong', { text: s.student_number })); p.appendChild(document.createTextNode(' - ' + (s.full_name || '') + (s.email ? ' (' + s.email + ')' : '')));
        list.appendChild(p);
      });
      if (!f.length) list.appendChild(el('p', { text: 'No students found.' }));
    }
    search.addEventListener('input', show);
    db.from('staff_members').select('title,department_id,unit_id').eq('profile_id', uid).single().then(function (r) {
      if (r.error || !r.data) { info.textContent = 'Your staff record was not found. Please contact the administrator.'; return; }
      var s = r.data, tbl = role === 'college_head' ? 'academic_units' : 'departments', id = role === 'college_head' ? s.unit_id : s.department_id;
      if (!id) { info.textContent = 'No ' + (role === 'college_head' ? 'college' : 'department') + ' is assigned to you yet.'; return; }
      db.from(tbl).select('name').eq('id', id).single().then(function (n) {
        info.textContent = (s.title ? s.title + ' - ' : '') + (n.data ? n.data.name : '');
      });
      db.from('students').select('student_number,full_name,email').order('student_number').then(function (x) {
        if (x.error) { list.textContent = 'Could not load: ' + x.error.message; return; }
        rows = x.data; info.textContent += ' - ' + rows.length + ' student(s)'; show();
      });
    });
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (r.data && (r.data.role === 'department_head' || r.data.role === 'college_head') && !document.getElementById('headCard')) headCard(r.data.role, u.id);
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
