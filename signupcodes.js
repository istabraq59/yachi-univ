(function () {
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function csv(rows) {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var lines = ['student_number,full_name,code,valid_until'];
    rows.forEach(function (r) { lines.push([r.student_number, r.full_name, r.code, String(r.expires_at).slice(0, 10)].map(q).join(',')); });
    return lines.join('\r\n');
  }
  function card() {
    var c = el('div', { class: 'card', id: 'signupCodesCard' });
    c.innerHTML = '<details><summary><strong>Sign-up codes for new students</strong></summary>' +
      '<p>A student needs a one-time code to create an account. Each code works once and expires after 14 days. Codes are shown only here, once, so give them out or download the list straight away.</p>' +
      '<textarea id="sc_ids" rows="4" placeholder="Student IDs, one per line, e.g. STU-2026-YU00004"></textarea>' +
      '<button id="sc_some" type="button">Create codes for these students</button>' +
      '<button id="sc_all" type="button">Create codes for ALL students without an account</button>' +
      '<p id="sc_msg"></p><div id="sc_list"></div><button id="sc_csv" type="button" style="display:none">Download list (CSV)</button></details>';
    place(c);
    var msg = c.querySelector('#sc_msg'), list = c.querySelector('#sc_list'), dl = c.querySelector('#sc_csv'), last = [];
    function run(body) {
      msg.textContent = 'Working...'; list.innerHTML = ''; dl.style.display = 'none';
      db.functions.invoke('signup-code', { body: body }).then(function (r) {
        if (r.error) {
          var ctx = r.error.context;
          if (ctx && ctx.json) ctx.json().then(function (j) { msg.textContent = (j && j.error) || 'Could not create codes.'; }).catch(function () { msg.textContent = 'Could not create codes.'; });
          else msg.textContent = 'Could not create codes.';
          return;
        }
        last = r.data.codes || [];
        var sk = r.data.skipped || [];
        msg.textContent = last.length + ' code(s) created.' + (sk.length ? ' Skipped ' + sk.length + ': ' + sk.map(function (s) { return s.student_number + ' (' + s.reason + ')'; }).join(', ') : '');
        last.forEach(function (x) {
          var p = el('p'); p.appendChild(el('strong', { text: x.student_number })); p.appendChild(document.createTextNode(' ' + (x.full_name || '') + ': '));
          p.appendChild(el('strong', { text: x.code })); list.appendChild(p);
        });
        if (last.length) dl.style.display = '';
      });
    }
    c.querySelector('#sc_some').onclick = function () {
      var ids = c.querySelector('#sc_ids').value.split(/[\s,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!ids.length) { msg.textContent = 'Enter at least one student ID.'; return; }
      run({ student_numbers: ids });
    };
    c.querySelector('#sc_all').onclick = function () {
      if (window.confirm('Create new codes for every student who has no account yet? Old unused codes for them will stop working.')) run({ all_unclaimed: true });
    };
    dl.onclick = function () {
      var blob = new Blob([csv(last)], { type: 'text/csv' });
      var a = document.createElement('a'); a.href = window.URL.createObjectURL(blob);
      a.download = 'signup-codes-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
    };
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (r.data && (r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('signupCodesCard')) card();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
