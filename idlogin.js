// "Sign in with ID number" on the sign-in screen (uses the login-by-id Edge Function).
(function () {
  'use strict';
  var FN = 'https://mczhuzxcjrdtfrcswusf.supabase.co/functions/v1/id-signin';
  var box = document.getElementById('loginBox');
  if (!box) return;

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'secondary';
  toggle.textContent = 'Sign in with ID number';
  toggle.style.marginTop = '10px';

  var panel = document.createElement('div');
  panel.style.cssText = 'display:none;margin-top:10px';

  var idIn = document.createElement('input');
  idIn.placeholder = 'ID number (e.g. STU-2026-YU00001)';
  idIn.autocomplete = 'username';
  idIn.autocapitalize = 'characters';
  idIn.spellcheck = false;

  var pwIn = document.createElement('input');
  pwIn.type = 'password';
  pwIn.placeholder = 'Password';
  pwIn.autocomplete = 'current-password';

  var go = document.createElement('button');
  go.type = 'button';
  go.textContent = 'Sign in';

  var msg = document.createElement('div');
  msg.style.cssText = 'margin-top:8px;color:#b91c1c';
  msg.setAttribute('role', 'alert');

  panel.appendChild(idIn);
  panel.appendChild(pwIn);
  panel.appendChild(go);
  panel.appendChild(msg);

  toggle.onclick = function () {
    var open = panel.style.display === 'none';
    panel.style.display = open ? '' : 'none';
    toggle.textContent = open ? 'Hide ID number sign-in' : 'Sign in with ID number';
    if (open) idIn.focus();
  };

  async function submit() {
    msg.textContent = '';
    var id = idIn.value.trim();
    if (!id || !pwIn.value) { msg.textContent = 'Enter your ID number and password.'; return; }
    go.disabled = true;
    try {
      var res = await fetch(FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, password: pwIn.value })
      });
      var out = await res.json().catch(function () { return {}; });
      if (!res.ok || !out.access_token) {
        msg.textContent = out.error || 'Sign-in failed. Please try again.';
        return;
      }
      var r = await db.auth.setSession({ access_token: out.access_token, refresh_token: out.refresh_token });
      if (r.error) { msg.textContent = 'Sign-in failed: ' + r.error.message; return; }
      pwIn.value = '';
    } catch (e) {
      msg.textContent = 'Could not reach the sign-in service. Check your connection.';
    } finally {
      go.disabled = false;
    }
  }
  go.onclick = submit;
  [idIn, pwIn].forEach(function (inp) {
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
  });

  box.appendChild(toggle);
  box.appendChild(panel);
})();
