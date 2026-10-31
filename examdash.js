// Role dashboards for the exam module. Shown at the top of the Home screen; numbers come from one database function.
(function () {
  var data = null, uid = null, busy = false, ticking = false, timer = null;
  function g(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var st = document.createElement('style');
  st.textContent = [
    '.yed{margin:18px 0}.yed h3{color:#0f2a5e;margin:0 0 4px}',
    '.yed h5{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin:14px 0 6px}',
    '.yed .g{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.yed .t{border-radius:14px;padding:12px 14px;border:1px solid transparent;cursor:pointer}',
    '.yed .t b{display:block;font-size:26px;line-height:1.1}.yed .t span{font-size:13px}',
    '.yed .c0{background:#e8eefb;color:#1e3a8a;border-color:#cddbf7}.yed .c1{background:#e6f5ea;color:#14532d;border-color:#c5e8cf}',
    '.yed .c2{background:#f0e9fd;color:#4c1d95;border-color:#dccdf8}.yed .c3{background:#fff0e0;color:#7c2d12;border-color:#f8d9b6}',
    '.yed .nx{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin-top:10px;font-size:14px}',
    '@media(min-width:820px){.yed .g{grid-template-columns:repeat(4,1fr)}}'
  ].join('\n');
  document.head.appendChild(st);

  function openCard(title) {
    var bs = document.querySelectorAll('#yuSide nav button'), want = title.toLowerCase();
    for (var i = 0; i < bs.length; i++) {
      var t = bs[i].textContent.trim().toLowerCase();
      if (t === want || t.slice(-want.length) === want) { bs[i].click(); return; }
    }
  }
  function grid(list) {
    var gd = el('div', { class: 'g' });
    list.forEach(function (c, i) {
      var t = el('div', { class: 't c' + (i % 4), role: 'button', tabindex: '0' }, [el('b', { text: String(c[1] == null ? 0 : c[1]) }), el('span', { text: c[0] })]);
      if (c[2]) t.onclick = function () { openCard(c[2]); };
      gd.appendChild(t);
    });
    return gd;
  }
  function sumUnits(units, re) { var n = 0; Object.keys(units || {}).forEach(function (k) { if (re.test(k)) n += Number(units[k]); }); return n; }
  function render(d) {
    var box = el('div', { id: 'yuExamDash', class: 'yed' });
    box.appendChild(el('h3', { text: 'Exam dashboard' }));
    var ex = d.exams || {}, rs = d.results || {};
    if (d.kind === 'super') {
      box.appendChild(el('h5', { text: 'University' }));
      box.appendChild(grid([['Colleges', sumUnits(d.units, /college/)], ['Institutes', sumUnits(d.units, /institute/)], ['Schools', sumUnits(d.units, /school/)], ['Departments', d.departments], ['Students', d.students], ['Subjects', d.subjects]]));
      box.appendChild(el('h5', { text: 'Examinations' }));
      box.appendChild(grid([['Total exams', ex.total, 'Exams'], ['Active now', ex.active, 'Exam schedule'], ['Upcoming', ex.upcoming, 'Exam schedule'], ['Completed', ex.completed, 'Exam reports'], ['Draft', ex.draft, 'Exams'], ['Cancelled', ex.cancelled, 'Exams']]));
      box.appendChild(el('h5', { text: 'Results' }));
      box.appendChild(grid([['Sitting now', rs.sitting, 'Exam results and grading'], ['Waiting for grading', rs.to_grade, 'Exam results and grading'], ['Graded', rs.graded, 'Exam results and grading'], ['Published results', rs.published, 'Exam reports']]));
    } else if (d.kind === 'unit') {
      box.appendChild(el('h5', { text: 'Your unit' }));
      box.appendChild(grid([['Departments', d.departments], ['Students', d.students], ['Subjects', d.subjects], ['Scheduled exams', ex.scheduled, 'Exam schedule']]));
      box.appendChild(el('h5', { text: 'Examinations' }));
      box.appendChild(grid([['Active now', ex.active, 'Exam schedule'], ['Upcoming', ex.upcoming, 'Exam schedule'], ['Completed', ex.completed, 'Exam reports'], ['Draft', ex.draft, 'Exams']]));
      box.appendChild(el('h5', { text: 'Results' }));
      box.appendChild(grid([['Waiting for grading', rs.to_grade, 'Exam results and grading'], ['Graded', rs.graded, 'Exam results and grading'], ['Published results', rs.published, 'Exam reports'], ['Sitting now', rs.sitting, 'Exam results and grading']]));
    } else if (d.kind === 'teacher') {
      box.appendChild(el('h5', { text: 'Your teaching' }));
      box.appendChild(grid([['Assigned subjects', d.subjects], ['Question banks', d.banks, 'Exam question bank'], ['Questions', d.questions, 'Exam question bank'], ['Exams created', d.created, 'Exams']]));
      box.appendChild(el('h5', { text: 'Examinations' }));
      box.appendChild(grid([['Upcoming exams', ex.upcoming, 'Exam schedule'], ['Active now', ex.active, 'Exam schedule'], ['Answers to mark', d.to_mark, 'Exam results and grading'], ['Published results', rs.published, 'Exam reports']]));
    } else if (d.kind === 'student') {
      var c = d.counts || {};
      box.appendChild(grid([['Available now', c.available, 'My exams'], ['Upcoming', c.upcoming, 'My exams'], ['In progress', c.active, 'My exams'], ['Completed', c.completed, 'My exams'], ['Published results', c.results, 'My exams']]));
      if (d.next) box.appendChild(el('div', { class: 'nx', text: 'Next exam: ' + d.next.title + (d.next.course ? ' (' + d.next.course + ')' : '') + ' - ' + new Date(d.next.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }));
    } else return null;
    return box;
  }
  function ensure() {
    if (!data || data.kind === 'none') return;
    var home = g('yuHome'); if (!home || g('yuExamDash')) return;
    var box = render(data); if (!box) return;
    var qa = g('yuQa');
    if (qa && qa.parentNode === home) home.insertBefore(box, qa); else home.appendChild(box);
  }
  function load() {
    if (busy) return; busy = true;
    db.auth.getSession().then(function (s) {
      var sess = s && s.data && s.data.session;
      if (!sess) { data = null; uid = null; var n = g('yuExamDash'); if (n) n.remove(); busy = false; return; }
      uid = sess.user.id;
      Promise.resolve(db.rpc('exam_dashboard')).then(function (r) {
        busy = false;
        if (r.error || !r.data) return;
        data = r.data;
        var old = g('yuExamDash'); if (old) old.remove();
        ensure();
      }, function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  var mo = new MutationObserver(function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; ensure(); });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  db.auth.onAuthStateChange(function () { setTimeout(load, 900); });
  setTimeout(load, 1500);
  clearInterval(timer); timer = setInterval(load, 60000);
})();
