// "Sign up with ID number" for students the university has already registered.
(function () {
  'use strict';
  var FN = 'https://mczhuzxcjrdtfrcswusf.supabase.co/functions/v1/quick-handler';
  var box = document.getElementById('loginBox');
  if (!box) return;

  function mk(tag, text, style) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (style) e.style.cssText = style;
    return e;
  }
  function input(ph, type, ac) {
    var i = document.createElement('input');
    i.placeholder = ph;
    if (type) i.type = type;
    if (ac) i.autocomplete = ac;
    return i;
  }

  var toggle = mk('button', 'New student? Sign up with ID number', 'margin-top:10px');
  toggle.type = 'button';
  toggle.className = 'secondary';

  var panel = mk('div', null, 'display:none;margin-top:10px');
  panel.appendChild(mk('div',
    'For students the university has already registered. Use your Grade 12 admission number or your academic username, and your date of birth.',
    'font-size:14px;color:#6b7280;margin-bottom:10px'));

  var idIn = input('Admission number or academic username', null, 'off');
  idIn.spellcheck = false;
  var dobLabel = mk('div', 'Date of birth', 'font-weight:600;margin:4px 0');
  var dob = input('Date of birth', 'date', 'bday');
  var pw1 = input('Choose a password (8+ characters)', 'password', 'new-password');
  var pw2 = input('Type the password again', 'password', 'new-password');
  var em = input('Email (optional, for password reset)', 'email', 'email');
  var go = mk('button', 'Create my account');
  go.type = 'button';
  var msg = mk('div', null, 'margin-top:8px;color:#b91c1c');
  msg.setAttribute('role', 'alert');

  [idIn, dobLabel, dob, pw1, pw2, em, go, msg].forEach(function (x) { panel.appendChild(x); });

  toggle.onclick = function () {
    var open = panel.style.display === 'none';
    panel.style.display = open ? '' : 'none';
    toggle.textContent = open ? 'Hide ID number sign-up' : 'New student? Sign up with ID number';
    if (open) idIn.focus();
  };

  async function submit() {
    msg.style.color = '#b91c1c';
    msg.textContent = '';
    if (!idIn.value.trim() || !dob.value) { msg.textContent = 'Enter your number and your date of birth.'; return; }
    if (pw1.value.length < 8) { msg.textContent = 'Use at least 8 characters for the password.'; return; }
    if (pw1.value !== pw2.value) { msg.textContent = 'The two passwords are not the same.'; return; }
    go.disabled = true;
    try {
      var res = await fetch(FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          identifier: idIn.value.trim(),
          birth_date: dob.value,
          password: pw1.value,
          email: em.value.trim()
        })
      });
      var out = await res.json().catch(function () { return {}; });
      if (!res.ok || !out.ok) { msg.textContent = out.error || 'Sign-up failed. Please try again.'; return; }
      if (out.access_token) {
        var r = await db.auth.setSession({ access_token: out.access_token, refresh_token: out.refresh_token });
        if (r.error) { msg.textContent = 'Account created. Sign in with your ID number: ' + out.student_number; return; }
      } else {
        msg.style.color = '#15803d';
        msg.textContent = 'Account created. Sign in with your ID number: ' + out.student_number;
      }
      pw1.value = ''; pw2.value = '';
    } catch (e) {
      msg.textContent = 'Could not reach the sign-up service. Check your connection.';
    } finally {
      go.disabled = false;
    }
  }
  go.onclick = submit;
  [idIn, dob, pw1, pw2, em].forEach(function (i) {
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  });

  box.appendChild(toggle);
  box.appendChild(panel);
})();
