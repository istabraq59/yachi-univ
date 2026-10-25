// Forgot password + set new password (uses global `db`)
(function () {
  function note(el, text, ok) {
    el.textContent = text;
    el.style.color = ok ? '#15803d' : '#b91c1c';
  }

  // 1) "Forgot password?" link under the sign-in password box
  function addLink() {
    var pw = document.querySelector('input[type=password]');
    if (!pw || document.getElementById('forgotLink')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<button type="button" id="forgotLink" style="background:none;border:0;color:#2563eb;' +
      'text-decoration:underline;padding:8px 0;font-size:16px;cursor:pointer">Forgot password?</button>' +
      '<div id="forgotMsg" style="margin-bottom:8px"></div>';
    pw.parentNode.insertBefore(wrap, pw.nextSibling);
    document.getElementById('forgotLink').onclick = async function () {
      var msg = document.getElementById('forgotMsg');
      var em = document.querySelector('input[type=email]');
      var email = em ? em.value.trim() : '';
      if (!email) { note(msg, 'Type your email in the email box first, then tap Forgot password.', false); return; }
      note(msg, 'Sending...', true);
      var r = await db.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://istabraq59.github.io/yachi-univ/'
      });
      if (r.error) note(msg, 'Could not send: ' + r.error.message, false);
      else note(msg, 'If that email has an account, a reset link was sent. Check your inbox and spam.', true);
    };
  }

  // 2) New-password box, shown when the user comes back from the email link
  function showReset() {
    if (document.getElementById('resetBox')) return;
    var box = document.createElement('div');
    box.id = 'resetBox';
    box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;' +
      'align-items:center;justify-content:center;z-index:9999;padding:16px';
    box.innerHTML =
      '<div style="background:#fff;border-radius:12px;padding:20px;width:100%;max-width:420px">' +
      '<h3 style="margin-top:0">Set a new password</h3>' +
      '<input id="newPw" type="password" placeholder="New password (8+ characters)" ' +
      'style="width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px">' +
      '<button id="savePw" style="width:100%;padding:12px;font-size:16px;background:#2563eb;' +
      'color:#fff;border:0;border-radius:8px">Save new password</button>' +
      '<div id="resetMsg" style="margin-top:10px"></div></div>';
    document.body.appendChild(box);
    document.getElementById('savePw').onclick = async function () {
      var msg = document.getElementById('resetMsg');
      var pw = document.getElementById('newPw').value;
      if (pw.length < 8) { note(msg, 'Use at least 8 characters.', false); return; }
      var r = await db.auth.updateUser({ password: pw });
      if (r.error) { note(msg, r.error.message, false); return; }
      note(msg, 'Password changed. Signing you out...', true);
      await db.auth.signOut();
      setTimeout(function () { location.href = location.pathname; }, 1500);
    };
  }

  addLink();
  if (/type=recovery/.test(location.hash)) showReset();
  db.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') setTimeout(showReset, 0);
  });
})();
