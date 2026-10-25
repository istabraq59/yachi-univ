// "Continue with Google" button (uses global `db`)
(function () {
  var pw = document.querySelector('input[type=password]');
  if (!pw || document.getElementById('googleBtn')) return;
  var anchor = document.getElementById('forgotMsg') || pw;
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<button type="button" id="googleBtn" style="width:100%;padding:12px;font-size:16px;' +
    'background:#fff;color:#1f2937;border:1px solid #9ca3af;border-radius:8px;margin:8px 0;cursor:pointer">' +
    'Continue with Google</button>' +
    '<div id="googleMsg" style="margin-bottom:8px"></div>';
  anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
  document.getElementById('googleBtn').onclick = async function () {
    var msg = document.getElementById('googleMsg');
    msg.style.color = '#15803d';
    msg.textContent = 'Opening Google...';
    var r = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://istabraq59.github.io/yachi-univ/' }
    });
    if (r.error) { msg.style.color = '#b91c1c'; msg.textContent = r.error.message; }
  };
})();
