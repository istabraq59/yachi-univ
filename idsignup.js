(function () {
  var ENDPOINT = 'https://mczhuzxcjrdtfrcswusf.supabase.co/functions/v1/student-signup';
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function build() {
    var box = document.getElementById('loginBox');
    if (!box || document.getElementById('idSignupBtn')) return;
    var ref = [].slice.call(box.querySelectorAll('button')).filter(function (b) { return /Create an account/.test(b.textContent); })[0];
    var btn = el('button', { type: 'button', id: 'idSignupBtn', text: 'New student? Sign up with ID number' });
    if (ref) btn.className = ref.className;
    var panel = el('div', { id: 'idSignupPanel' }); panel.style.display = 'none';
    var f = {};
    function field(key, ph, type) { var i = el('input', { placeholder: ph, type: type || 'text', autocomplete: 'off' }); f[key] = i; panel.appendChild(i); return i; }
    panel.appendChild(el('p', { text: 'You need the sign-up code that the registrar\'s office gave you.' }));
    field('id', 'Grade 12 admission number or academic username');
    field('code', 'Sign-up code (e.g. ABCD-EFGH)').setAttribute('autocapitalize', 'characters');
    field('pw', 'Choose a password (8 or more characters)', 'password');
    field('pw2', 'Repeat the password', 'password');
    field('email', 'Email (optional)', 'email');
    var go = el('button', { type: 'button', text: 'Create my account' });
    var msg = el('p'); msg.style.color = '#b91c1c';
    panel.appendChild(go); panel.appendChild(msg);
    btn.onclick = function () { panel.style.display = panel.style.display === 'none' ? '' : 'none'; };
    go.onclick = function () {
      msg.style.color = '#b91c1c';
      if (!f.id.value.trim() || !f.code.value.trim()) { msg.textContent = 'Enter your admission number and sign-up code.'; return; }
      if (f.pw.value.length < 8) { msg.textContent = 'The password must have at least 8 characters.'; return; }
      if (f.pw.value !== f.pw2.value) { msg.textContent = 'The two passwords do not match.'; return; }
      go.disabled = true; msg.textContent = 'Working...';
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: f.id.value.trim(), code: f.code.value.trim(), password: f.pw.value, email: f.email.value.trim() }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          go.disabled = false;
          if (!x.ok || x.j.error) { msg.textContent = x.j.error || 'Could not create the account.'; return; }
          if (x.j.access_token && x.j.refresh_token) {
            return db.auth.setSession({ access_token: x.j.access_token, refresh_token: x.j.refresh_token }).then(function (r) {
              if (r.error) { msg.style.color = '#166534'; msg.textContent = 'Account created. Sign in with your ID number: ' + (x.j.id_number || ''); }
            });
          }
          msg.style.color = '#166534';
          msg.textContent = 'Account created. Sign in with your ID number: ' + (x.j.id_number || '');
        })
        .catch(function () { go.disabled = false; msg.textContent = 'Could not reach the server. Check your connection.'; });
    };
    box.appendChild(btn); box.appendChild(panel);
  }
  build(); setTimeout(build, 600);
})();
