(function () {
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function card() {
    var c = el('div', { class: 'card', id: 'resetPwCard' });
    c.innerHTML = '<details><summary><strong>Reset a student\'s password</strong></summary>' +
      '<p>For students without email. Enter the student ID, then give the temporary password to the student in person. The student signs in with the ID and sets a new password in My account.</p>' +
      '<input id="rp_id" placeholder="Student ID, e.g. STU-2026-YU00001" autocapitalize="characters">' +
      '<button id="rp_go" type="button">Create temporary password</button><p id="rp_out"></p></details>';
    place(c);
    var out = c.querySelector('#rp_out'), btn = c.querySelector('#rp_go');
    btn.onclick = function () {
      var id = c.querySelector('#rp_id').value.trim().toUpperCase();
      if (!id) { out.textContent = 'Enter a student ID.'; return; }
      btn.disabled = true; out.textContent = 'Working...';
      db.functions.invoke('admin-reset', { body: { student_number: id } }).then(function (r) {
        btn.disabled = false;
        if (r.error) {
          var ctx = r.error.context;
          if (ctx && ctx.json) ctx.json().then(function (j) { out.textContent = (j && j.error) || 'Could not reset.'; }).catch(function () { out.textContent = 'Could not reset.'; });
          else out.textContent = 'Could not reset.';
          return;
        }
        out.textContent = '';
        out.appendChild(document.createTextNode('Temporary password for ' + id + ': '));
        out.appendChild(el('strong', { text: r.data.temp_password }));
        out.appendChild(el('br'));
        out.appendChild(document.createTextNode('Shown once. Give it to the student in person.'));
        c.querySelector('#rp_id').value = '';
      });
    };
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (r.data && (r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('resetPwCard')) card();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
