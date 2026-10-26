// Accounts card (admin only): deactivate / reactivate logins. Uses global `db`.
(function () {
  'use strict';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }

  var card = el('div');
  card.id = 'accountsCard';
  card.style.display = 'none';

  function place() {
    var a = document.getElementById('announcementsCard');
    if (!a) {
      var hs = document.querySelectorAll('h1,h2,h3');
      for (var i = 0; i < hs.length; i++) {
        if (/transcript/i.test(hs[i].textContent)) { a = hs[i].parentElement; break; }
      }
    }
    if (a && a.parentNode) {
      card.className = a.className;
      a.parentNode.insertBefore(card, a.nextSibling);
    } else if (!card.parentNode) {
      card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px;display:none';
      document.body.appendChild(card);
    }
  }

  var built = false;

  function build() {
    card.appendChild(el('h2', null, 'Accounts'));
    card.appendChild(el('p', 'color:#4b5563', 'Deactivate a login to block sign-in without deleting any records. You can reactivate it later.'));
    var btn = el('button', BTN, 'Refresh accounts'); btn.type = 'button';
    var msg = el('div', 'margin:8px 0');
    var out = el('div');
    card.appendChild(btn); card.appendChild(msg); card.appendChild(out);

    function say(t, ok) { msg.textContent = t; msg.style.color = ok ? '#15803d' : '#b91c1c'; }

    async function load() {
      out.textContent = '';
      var me = null;
      var u = await db.auth.getUser();
      if (u && u.data && u.data.user) me = u.data.user.id;
      var r = await db.rpc('list_accounts');
      if (r.error) { say('Could not load accounts: ' + r.error.message, false); return; }
      var rows = r.data || [];
      say(rows.length + ' account(s).', true);
      rows.forEach(function (a) {
        var box = el('div', 'padding:10px 0;border-bottom:1px solid #e5e7eb');
        box.appendChild(el('div', 'font-weight:600', (a.full_name || '(no name)') + ' – ' + a.email));
        box.appendChild(el('div', 'font-size:14px;color:#6b7280',
          a.account_role + (a.linked_to ? ' · ' + a.linked_to : ' · not linked') + ' · ' + (a.active ? 'active' : 'DEACTIVATED')));
        if (a.profile_id !== me) {
          var b = el('button',
            'margin-top:8px;padding:8px 14px;font-size:15px;color:#fff;border:0;border-radius:8px;cursor:pointer;background:' + (a.active ? '#dc2626' : '#15803d'),
            a.active ? 'Deactivate' : 'Reactivate');
          b.type = 'button';
          b.onclick = async function () {
            var q = a.active
              ? 'Deactivate ' + a.email + '? They will be signed out and cannot sign in until reactivated.'
              : 'Reactivate ' + a.email + '?';
            if (!confirm(q)) return;
            var s = await db.rpc('set_account_active', { p_profile: a.profile_id, p_active: !a.active });
            if (s.error) say('Not changed: ' + s.error.message, false);
            else load();
          };
          box.appendChild(b);
        } else {
          box.appendChild(el('div', 'font-size:14px;color:#6b7280;margin-top:4px', '(this is you)'));
        }
        out.appendChild(box);
      });
    }
    btn.onclick = load;
    load();
  }

  function refresh() {
    var admin = document.body.getAttribute('data-role') === 'administrator';
    if (!admin) {
      built = false; card.textContent = ''; card.style.display = 'none'; return;
    }
    if (built) return;
    built = true;
    place();
    setTimeout(place, 700);
    card.style.display = '';
    build();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
