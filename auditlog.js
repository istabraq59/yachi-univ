// Grade changes card (admin only). Uses global `db`; role from body[data-role].
(function () {
  'use strict';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }

  var anchor = document.getElementById('attendanceCard');
  if (!anchor) {
    var hs = document.querySelectorAll('h1,h2,h3');
    for (var i = 0; i < hs.length; i++) {
      if (/transcript/i.test(hs[i].textContent)) { anchor = hs[i].parentElement; break; }
    }
  }
  var card = el('div');
  card.id = 'auditCard';
  if (anchor && anchor.parentNode) {
    card.className = anchor.className;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  } else {
    card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px';
    document.body.appendChild(card);
  }
  card.style.display = 'none';

  var SKIP = /(^id$|_at$|^enrollment_id$)/;
  function shortVal(v) {
    if (v === null || v === undefined) return '(empty)';
    return String(v);
  }
  function describe(r) {
    var o = r.old_data || {}, n = r.new_data || {};
    var base = r.action === 'DELETE' ? o : n;
    var label = base.assessment_name || base.assessment || base.title || base.name || base.assessment_type || 'grade';
    if (r.action === 'INSERT') {
      return 'Added "' + label + '": ' + shortVal(n.score) + (n.max_score != null ? ' / ' + n.max_score : '') + (n.is_final ? ' (final)' : '');
    }
    if (r.action === 'DELETE') {
      return 'Deleted "' + label + '": ' + shortVal(o.score) + (o.max_score != null ? ' / ' + o.max_score : '');
    }
    var diffs = [];
    Object.keys(n).forEach(function (k) {
      if (SKIP.test(k)) return;
      if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) diffs.push(k + ': ' + shortVal(o[k]) + ' → ' + shortVal(n[k]));
    });
    return 'Changed "' + label + '" – ' + (diffs.length ? diffs.join('; ') : 'no visible change');
  }

  function build() {
    card.appendChild(el('h2', null, 'Grade changes (audit log)'));
    var btn = el('button', BTN, 'Refresh grade changes'); btn.type = 'button';
    var msg = el('div', 'margin:8px 0');
    var out = el('div');
    card.appendChild(btn); card.appendChild(msg); card.appendChild(out);

    async function load() {
      out.textContent = ''; msg.style.color = '#15803d'; msg.textContent = 'Loading...';
      var r = await db.from('audit_log')
        .select('id, action, row_id, old_data, new_data, changed_by, changed_at')
        .eq('table_name', 'grades').order('id', { ascending: false }).limit(50);
      if (r.error) { msg.style.color = '#b91c1c'; msg.textContent = 'Could not load: ' + r.error.message; return; }
      var rows = r.data || [];
      if (!rows.length) { msg.textContent = 'No grade changes recorded yet.'; return; }

      var userIds = [], enrIds = [];
      rows.forEach(function (x) {
        if (x.changed_by && userIds.indexOf(x.changed_by) < 0) userIds.push(x.changed_by);
        var d = x.new_data || x.old_data || {};
        if (d.enrollment_id && enrIds.indexOf(d.enrollment_id) < 0) enrIds.push(d.enrollment_id);
      });
      var names = {}, who = {};
      if (userIds.length) {
        var p = await db.from('profiles').select('id, full_name').in('id', userIds);
        (p.data || []).forEach(function (x) { names[x.id] = x.full_name; });
      }
      if (enrIds.length) {
        var e = await db.from('enrollments').select('id, students(student_number, full_name), courses(course_code)').in('id', enrIds);
        (e.data || []).forEach(function (x) {
          var s = x.students || {}, c = x.courses || {};
          who[x.id] = (s.student_number || '?') + ' ' + (s.full_name || '') + (c.course_code ? ' – ' + c.course_code : '');
        });
      }
      msg.textContent = 'Showing the latest ' + rows.length + ' change(s).';
      rows.forEach(function (x) {
        var d = x.new_data || x.old_data || {};
        var line = el('div', 'padding:10px 0;border-bottom:1px solid #e5e7eb');
        line.appendChild(el('div', 'font-weight:600',
          new Date(x.changed_at).toLocaleString() + ' – by ' +
          (x.changed_by ? (names[x.changed_by] || x.changed_by.slice(0, 8)) : 'system / SQL')));
        line.appendChild(el('div', null, who[d.enrollment_id] || (d.enrollment_id ? 'enrollment removed' : '')));
        line.appendChild(el('div', null, describe(x)));
        out.appendChild(line);
      });
    }
    btn.onclick = load;
    load();
  }

  var built = false;
  function refresh() {
    var admin = document.body.getAttribute('data-role') === 'administrator';
    card.style.display = admin ? '' : 'none';
    if (admin && !built) { built = true; build(); }
    if (!admin && built) { built = false; card.textContent = ''; }
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
