// Exam module, stage 2: monthly exam schedule, eligible students and clash check.
(function () {
  var ROLES = ['admin', 'administrator', 'college_head', 'department_head', 'teacher'];
  var uid = null, busy = false;
  function g(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function btn(text, fn, cls) { var b = el('button', { type: 'button', text: text }); if (cls) b.className = cls; b.onclick = fn; return b; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tm(d) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function dayName(d) { return new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  var st = document.createElement('style');
  st.textContent = '.ex .day{font-weight:700;color:#0f2a5e;margin:16px 0 4px;padding-top:8px;border-top:2px solid #e8eefb}.ex .out{margin-top:8px;font-size:13px}';
  document.head.appendChild(st);

  function entry(x) {
    var it = el('div', { class: 'item' });
    var out = el('div', { class: 'out' });
    it.appendChild(el('div', null, [el('span', { class: 'badge ' + x.status, text: x.status }), x.starts_at ? el('span', { class: 'badge', text: tm(x.starts_at) + (x.ends_at ? ' - ' + tm(x.ends_at) : '') }) : null]));
    it.appendChild(el('b', { text: x.title }));
    it.appendChild(el('div', { class: 'hint', text: (x.courses ? x.courses.course_code + ' - ' + x.courses.title : '') + (x.room ? ' | ' + x.room : '') + ' | ' + x.duration_minutes + ' min' }));
    it.appendChild(el('div', { class: 'acts' }, [
      btn('Students', function () {
        if (out.getAttribute('data-k') === 's') { out.textContent = ''; out.removeAttribute('data-k'); return; }
        out.setAttribute('data-k', 's'); out.style.color = ''; out.textContent = 'Loading...';
        Promise.resolve(db.rpc('exam_eligible_students', { p_exam: x.id })).then(function (r) {
          out.textContent = '';
          if (r.error) { out.style.color = '#b91c1c'; out.textContent = r.error.message; return; }
          if (!r.data.length) { out.textContent = 'No students are enrolled in this subject for this semester yet.'; return; }
          out.appendChild(el('b', { text: r.data.length + ' eligible student(s)' }));
          r.data.slice(0, 300).forEach(function (s, i) { out.appendChild(el('div', { text: (i + 1) + '. ' + s.student_number + ' - ' + s.full_name })); });
        });
      }, 'secondary'),
      btn('Check clashes', function () {
        out.setAttribute('data-k', 'c'); out.textContent = 'Checking...'; out.style.color = '';
        if (!x.starts_at || !x.ends_at) { out.style.color = '#92400e'; out.textContent = 'Set the date and time first.'; return; }
        Promise.resolve(db.rpc('exam_conflicts', { p_exam: x.id })).then(function (r) {
          out.textContent = '';
          if (r.error) { out.style.color = '#b91c1c'; out.textContent = r.error.message; return; }
          if (!r.data.length) { out.style.color = '#166534'; out.textContent = 'No clashes with published exams.'; return; }
          out.style.color = '#b91c1c';
          r.data.forEach(function (c) { out.appendChild(el('div', { text: (c.kind === 'room' ? 'Room clash: ' : 'Student clash: ') + c.other_title + ' (' + c.detail + ')' })); });
        });
      }, 'secondary')
    ]));
    it.appendChild(out);
    return it;
  }
  function load() {
    var box = g('sd_list'); if (!box) return;
    var v = g('sd_month').value; if (!v) return;
    var p = v.split('-'), s = new Date(Number(p[0]), Number(p[1]) - 1, 1), e = new Date(Number(p[0]), Number(p[1]), 1);
    var sel = 'id,title,status,starts_at,ends_at,duration_minutes,room,course_id,semester_id,courses(course_code,title)';
    var q1 = db.from('exams').select(sel).gte('starts_at', s.toISOString()).lt('starts_at', e.toISOString()).order('starts_at');
    if (g('sd_only').value === 'published') q1 = q1.eq('status', 'published');
    box.textContent = 'Loading...';
    Promise.all([Promise.resolve(q1), Promise.resolve(db.from('exams').select(sel).is('starts_at', null).neq('status', 'cancelled').limit(50))]).then(function (r) {
      box.textContent = '';
      if (r[0].error) { box.textContent = 'Could not load: ' + r[0].error.message; return; }
      if (!r[0].data.length) box.appendChild(el('p', { class: 'hint', text: 'No exams scheduled in this month.' }));
      var last = '';
      r[0].data.forEach(function (x) {
        var d = dayName(x.starts_at);
        if (d !== last) { box.appendChild(el('div', { class: 'day', text: d })); last = d; }
        box.appendChild(entry(x));
      });
      var u = r[1].data || [];
      if (u.length) {
        box.appendChild(el('div', { class: 'day', text: 'Needs a date and time' }));
        u.forEach(function (x) { box.appendChild(entry(x)); });
      }
    });
  }
  function build() {
    var ref = g('enrollForm'); if (!ref || g('examSchedCard')) return;
    var c = el('div', { class: 'card ex', id: 'examSchedCard' });
    c.appendChild(el('h2', { text: 'Exam schedule' }));
    c.appendChild(el('p', { class: 'hint', text: 'Exams by day. Publishing is blocked if a student or a room would be double-booked.' }));
    var now = new Date();
    var m = el('input', { id: 'sd_month', type: 'month', value: now.getFullYear() + '-' + pad(now.getMonth() + 1) });
    m.onchange = load;
    var o = el('select', { id: 'sd_only' }); [['all', 'All exams'], ['published', 'Published only']].forEach(function (a) { var op = el('option', { value: a[0], text: a[1] }); o.appendChild(op); });
    o.onchange = load;
    c.appendChild(el('div', { class: 'row' }, [el('div', null, [el('label', { class: 'f', text: 'Month' }), m]), el('div', null, [el('label', { class: 'f', text: 'Show' }), o])]));
    c.appendChild(el('div', { id: 'sd_list' }));
    ref.parentNode.insertBefore(c, ref);
    load();
  }
  function init() {
    if (busy) return; busy = true;
    db.auth.getSession().then(function (s) {
      var sess = s && s.data && s.data.session;
      if (!sess) { var n = g('examSchedCard'); if (n) n.remove(); uid = null; busy = false; return; }
      if (uid === sess.user.id && g('examSchedCard')) { busy = false; return; }
      uid = sess.user.id;
      Promise.resolve(db.from('profiles').select('role').eq('id', uid).single()).then(function (r) {
        if (ROLES.indexOf(r.data && r.data.role) < 0) { busy = false; return; }
        build(); busy = false;
      }).catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  db.auth.onAuthStateChange(function () { setTimeout(init, 700); });
  setTimeout(init, 1000);
})();
