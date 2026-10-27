(function () {
  var LABEL = { dorm_officer: 'Dormitory officer', lab_staff: 'Laboratory staff', support_staff: 'Support staff' };
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function card(role, uid) {
    var c = el('div', { class: 'card', id: 'staffInfoCard' });
    c.appendChild(el('h2', { text: 'My staff profile' }));
    var p1 = el('p', { text: 'Role: ' + LABEL[role] });
    var p2 = el('p', { text: 'Loading...' });
    c.appendChild(p1); c.appendChild(p2); place(c);
    db.from('staff_members').select('title,department_id,unit_id').eq('profile_id', uid).single().then(function (r) {
      if (r.error || !r.data) { p2.textContent = 'No staff details yet.'; return; }
      var s = r.data, parts = [];
      if (s.title) parts.push('Title: ' + s.title);
      p2.textContent = parts.join(' | ') || 'No title set.';
      if (s.department_id) db.from('departments').select('name').eq('id', s.department_id).single().then(function (d) { if (d.data) c.appendChild(el('p', { text: 'Department: ' + d.data.name })); });
      if (s.unit_id) db.from('academic_units').select('name').eq('id', s.unit_id).single().then(function (d) { if (d.data) c.appendChild(el('p', { text: 'College / institute / school: ' + d.data.name })); });
    });
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (r.data && LABEL[r.data.role] && !document.getElementById('staffInfoCard')) card(r.data.role, u.id);
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
