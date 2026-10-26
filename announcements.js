// Announcements card (uses global `db`; role from body[data-role])
(function () {
  'use strict';
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  function today() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  var card = el('div');
  card.id = 'announcementsCard';
  card.style.display = 'none';

  function findAnchor() {
    var nodes = document.querySelectorAll('body *');
    var hit = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && /^\s*Signed in as/i.test(n.textContent)) { hit = n; break; }
    }
    var a = hit;
    while (a && a !== document.body) {
      if (a.className && typeof a.className === 'string' && a.className.trim()) return a;
      a = a.parentElement;
    }
    // fallback: the Transcript card
    var hs = document.querySelectorAll('h1,h2,h3');
    for (var j = 0; j < hs.length; j++) {
      if (/transcript/i.test(hs[j].textContent)) return hs[j].parentElement;
    }
    return null;
  }
  function place() {
    var a = findAnchor();
    if (a && a.parentNode && a !== card) {
      card.className = a.className;
      a.parentNode.insertBefore(card, a.nextSibling);
    } else if (!card.parentNode) {
      card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px;display:none';
      document.body.appendChild(card);
    }
  }

  var built = '';
  var listEl, msgEl;

  function say(t, ok) { msgEl.textContent = t; msgEl.style.color = ok ? '#15803d' : '#b91c1c'; }

  async function load(isAdmin) {
    listEl.textContent = '';
    var r = await db.from('announcements')
      .select('id, title, body, audience, expires_on, created_at')
      .order('created_at', { ascending: false }).limit(20);
    if (r.error) { say('Could not load announcements: ' + r.error.message, false); return; }
    var t = today();
    var rows = (r.data || []).filter(function (x) { return isAdmin || !x.expires_on || x.expires_on >= t; });
    if (!rows.length) { msgEl.textContent = 'No announcements.'; msgEl.style.color = '#4b5563'; return; }
    msgEl.textContent = '';
    rows.forEach(function (x) {
      var expired = x.expires_on && x.expires_on < t;
      var box = el('div', 'padding:10px 0;border-bottom:1px solid #e5e7eb');
      box.appendChild(el('div', 'font-weight:700', x.title));
      box.appendChild(el('div', 'font-size:14px;color:#6b7280;margin-bottom:4px',
        new Date(x.created_at).toLocaleDateString() + ' · for ' + x.audience +
        (x.expires_on ? ' · until ' + x.expires_on : '') + (expired ? ' (expired)' : '')));
      box.appendChild(el('div', 'white-space:pre-wrap', x.body));
      if (isAdmin) {
        var del = el('button', 'margin-top:8px;padding:8px 14px;font-size:15px;background:#dc2626;color:#fff;border:0;border-radius:8px;cursor:pointer', 'Delete');
        del.type = 'button';
        del.onclick = async function () {
          if (!confirm('Delete this announcement?')) return;
          var d = await db.from('announcements').delete().eq('id', x.id);
          if (d.error) say('Not deleted: ' + d.error.message, false);
          else load(true);
        };
        box.appendChild(del);
      }
      listEl.appendChild(box);
    });
  }

  function build(isAdmin) {
    card.appendChild(el('h2', null, 'Announcements'));
    if (isAdmin) {
      var title = el('input', INPUT); title.placeholder = 'Title'; title.maxLength = 150;
      var body = el('textarea', INPUT + ';min-height:100px;font-family:inherit'); body.placeholder = 'Message'; body.maxLength = 4000;
      var aud = el('select', INPUT);
      [['all', 'Everyone'], ['students', 'Students only'], ['teachers', 'Teachers only']].forEach(function (p) {
        var o = el('option', null, p[1]); o.value = p[0]; aud.appendChild(o);
      });
      var lab = el('div', 'font-size:14px;color:#6b7280;margin-bottom:4px', 'Show until (optional)');
      var exp = el('input', INPUT); exp.type = 'date';
      var post = el('button', BTN, 'Post announcement'); post.type = 'button';
      [title, body, aud, lab, exp, post].forEach(function (x) { card.appendChild(x); });
      post.onclick = async function () {
        if (!title.value.trim() || !body.value.trim()) { say('Write a title and a message.', false); return; }
        post.disabled = true;
        var r = await db.from('announcements').insert({
          title: title.value.trim(), body: body.value.trim(), audience: aud.value, expires_on: exp.value || null
        });
        post.disabled = false;
        if (r.error) { say('Not posted: ' + r.error.message, false); return; }
        title.value = ''; body.value = ''; exp.value = '';
        say('Posted.', true);
        load(true);
      };
    }
    msgEl = el('div', 'margin:8px 0');
    listEl = el('div');
    card.appendChild(msgEl); card.appendChild(listEl);
    load(isAdmin);
  }

  function refresh() {
    var r = document.body.getAttribute('data-role') || '';
    var group = r === 'administrator' ? 'admin' : (r === 'teacher' || r === 'student' ? 'user' : '');
    if (group === built) return;
    built = group;
    card.textContent = '';
    if (!group) { card.style.display = 'none'; return; }
    place();
    setTimeout(place, 600);
    card.style.display = '';
    build(group === 'admin');
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
