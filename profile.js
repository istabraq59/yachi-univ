// "My account" card: shows who you are, change password, sign out everywhere.
// Uses global `db`; role from body[data-role].
(function () {
  'use strict';
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';
  var BTN2 = BTN.replace('#2563eb', '#64748b');

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }

  var card = el('div');
  card.id = 'profileCard';
  card.style.display = 'none';

  function signedInCard() {
    var nodes = document.querySelectorAll('body *');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && /^\s*Signed in as/i.test(n.textContent)) {
        var a = n;
        while (a && a !== document.body) {
          if (a.className && typeof a.className === 'string' && a.className.trim()) return a;
          a = a.parentElement;
        }
      }
    }
    return null;
  }
  function place() {
    var a = signedInCard();
    if (a && a.parentNode) {
      card.className = a.className;
      a.parentNode.appendChild(card); // end of the card list
    } else if (!card.parentNode) {
      card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px;display:none';
      document.body.appendChild(card);
    }
  }

  var built = false;

  async function build() {
    var u = await db.auth.getUser();
    var user = u && u.data && u.data.user;
    if (!user) { card.style.display = 'none'; return; }
    var p = await db.from('profiles').select('full_name, role').eq('id', user.id).limit(1);
    var prof = (p.data && p.data[0]) || {};

    var box = document.createElement('details');
    var sum = document.createElement('summary');
    sum.style.cssText = 'font-size:1.2em;font-weight:700;cursor:pointer';
    sum.textContent = 'My account';
    box.appendChild(sum);

    var info = el('div', 'margin:12px 0');
    info.appendChild(el('div', null, 'Name: ' + (prof.full_name || '(not set)')));
    info.appendChild(el('div', null, 'Email: ' + (user.email || '')));
    info.appendChild(el('div', null, 'Role: ' + (prof.role || '')));
    info.appendChild(el('div', 'font-size:14px;color:#6b7280;margin-top:6px',
      'To change your name or role, contact the school office.'));
    box.appendChild(info);

    box.appendChild(el('h3', 'margin:16px 0 6px', 'Change password'));
    box.appendChild(el('div', 'font-size:14px;color:#6b7280;margin-bottom:8px',
      'If you normally sign in with Google, setting a password also lets you sign in with your email.'));
    var pw1 = el('input', INPUT); pw1.type = 'password'; pw1.placeholder = 'New password (8+ characters)'; pw1.autocomplete = 'new-password';
    var pw2 = el('input', INPUT); pw2.type = 'password'; pw2.placeholder = 'Type it again'; pw2.autocomplete = 'new-password';
    var save = el('button', BTN, 'Change password'); save.type = 'button';
    var msg = el('div', 'margin:6px 0 12px');
    box.appendChild(pw1); box.appendChild(pw2); box.appendChild(save); box.appendChild(msg);

    function say(t, ok) { msg.textContent = t; msg.style.color = ok ? '#15803d' : '#b91c1c'; }

    save.onclick = async function () {
      if (pw1.value.length < 8) { say('Use at least 8 characters.', false); return; }
      if (pw1.value !== pw2.value) { say('The two passwords are not the same.', false); return; }
      save.disabled = true;
      var r = await db.auth.updateUser({ password: pw1.value });
      save.disabled = false;
      if (r.error) {
        if (/reauth|recent|nonce/i.test(r.error.message)) {
          say('For security, sign out, sign in again, then try once more.', false);
        } else {
          say('Not changed: ' + r.error.message, false);
        }
        return;
      }
      pw1.value = ''; pw2.value = '';
      say('Password changed. Use it next time you sign in with your email.', true);
    };

    box.appendChild(el('h3', 'margin:16px 0 6px', 'Security'));
    var out = el('button', BTN2, 'Sign out on all devices'); out.type = 'button';
    out.onclick = async function () {
      if (!confirm('Sign out on every device where you are signed in?')) return;
      await db.auth.signOut({ scope: 'global' });
      location.reload();
    };
    box.appendChild(out);

    card.appendChild(box);
  }

  function refresh() {
    var r = document.body.getAttribute('data-role') || '';
    if (!r) { built = false; card.textContent = ''; card.style.display = 'none'; return; }
    if (built) return;
    built = true;
    place();
    setTimeout(place, 1000);
    card.style.display = '';
    build();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
