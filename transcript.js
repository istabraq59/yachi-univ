(function () {
  var PASS_MIN = 40; // lowest passing final percentage (the D line). Change if the Registrar decides otherwise.
  var ROLES = /^(student|teacher|admin|administrator|department_head|college_head)$/;
  var CSS = [
    '#trCard select{width:100%}',
    '#trCard .tw{overflow-x:auto}',
    '#trSheet{background:#fff;border:1px solid #dbe4f5;border-radius:14px;padding:16px;margin-top:12px}',
    '#trSheet .th{display:flex;align-items:center;gap:12px;border-bottom:2px solid #0f2a5e;padding-bottom:10px;margin-bottom:10px}',
    '#trSheet .th img{width:54px;height:54px;object-fit:cover;border-radius:10px}',
    '#trSheet .th b{display:block;font-size:18px;color:#0f2a5e}#trSheet .th small{color:#475569}',
    '#trSheet h3{margin:6px 0 10px;text-align:center;color:#0f2a5e;letter-spacing:.05em;text-transform:uppercase;font-size:15px}',
    '#trSheet .info{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:13px;margin-bottom:10px}#trSheet .info span{color:#64748b;display:block;font-size:11px}',
    '#trSheet table{width:100%;border-collapse:collapse;font-size:13px}',
    '#trSheet th{background:#eef3fc;color:#0f2a5e;text-align:left;padding:8px 6px}',
    '#trSheet td{padding:8px 6px;border-bottom:1px solid #e7edf8}',
    '#trSheet .bd{padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}',
    '#trSheet .ok{background:#dcfce7;color:#14532d}#trSheet .bad{background:#fee2e2;color:#7f1d1d}#trSheet .prog{background:#e0e7ff;color:#3730a3}',
    '#trSheet .sum{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-top:12px;font-size:14px;color:#0f2a5e}',
    '#trSheet .sig{display:flex;justify-content:space-between;gap:20px;margin-top:34px;font-size:13px;color:#334155}',
    '#trSheet .sig div{flex:1;border-top:1px solid #334155;padding-top:4px;text-align:center}',
    '#trSheet .note{margin-top:14px;font-size:11px;color:#64748b;text-align:center}',
    '#trPrint{display:none}',
    '@media print{@page{size:A4;margin:14mm}body.trp>*:not(#trPrint){display:none!important}body.trp #trPrint{display:block!important;background:#fff}body.trp #trPrint #trSheet{border:0;margin:0;padding:0}}'
  ].join('\n');
  var scale = null, students = [], cur = null, all = [], semSel, stuSel, msg, sheet, role = '';
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function signedCard() { var s = null; document.querySelectorAll('.card').forEach(function (x) { if (!s && /Signed in as/.test(x.textContent) && !x.querySelector('.card')) s = x; }); return s; }
  function loadScale(cb) {
    if (scale) return cb();
    db.from('grading_scale').select('letter_grade, minimum_percentage, grade_points').order('minimum_percentage', { ascending: false })
      .then(function (r) { scale = r.data || []; cb(); }, function () { scale = []; cb(); });
  }
  function toGrade(p) { for (var i = 0; i < scale.length; i++) if (p >= Number(scale[i].minimum_percentage)) return scale[i]; return scale[scale.length - 1]; }
  function calc(e) {
    var c = e.courses || {}, cr = Number(c.credits || 0), fin = (e.grades || []).filter(function (g) { return g.is_final; })[0];
    var o = { e: e, c: c, cr: cr, state: 'prog' };
    if (fin && scale.length && Number(fin.max_score) > 0 && fin.score !== null) {
      o.pct = Number(fin.score) / Number(fin.max_score) * 100;
      var g = toGrade(o.pct); o.letter = g.letter_grade; o.pts = Number(g.grade_points);
      o.state = o.pct >= PASS_MIN ? 'ok' : 'bad';
    }
    return o;
  }
  function gpa(list) { var cr = 0, pts = 0; list.forEach(function (o) { if (o.state !== 'prog') { cr += o.cr; pts += o.pts * o.cr; } }); return cr > 0 ? (pts / cr).toFixed(2) : '-'; }
  function render() {
    if (!cur) { sheet.style.display = 'none'; return; }
    var sv = semSel.value, all2 = all.map(calc);
    var rows = all2.filter(function (o) { return sv === 'all' || (o.e.semesters && o.e.semesters.id === sv); });
    rows.sort(function (a, b) { return String((a.e.semesters || {}).starts_on || '').localeCompare(String((b.e.semesters || {}).starts_on || '')) || String(a.c.course_code).localeCompare(String(b.c.course_code)); });
    sheet.textContent = ''; sheet.style.display = '';
    var th = el('div', { class: 'th' }); var im = el('img', { src: 'logo.jpg', alt: '' }); im.onerror = function () { im.style.display = 'none'; }; th.appendChild(im);
    var tt = el('div'); tt.appendChild(el('b', { text: 'YACHI UNIVERSITY' })); tt.appendChild(el('small', { text: 'Office of the Registrar' })); th.appendChild(tt); sheet.appendChild(th);
    sheet.appendChild(el('h3', { text: 'Academic Transcript' }));
    var semName = sv === 'all' ? 'All semesters' : ((rows[0] && rows[0].e.semesters && rows[0].e.semesters.name) || '');
    var info = el('div', { class: 'info' });
    [['Name', cur.full_name], ['Student ID', cur.student_number], ['Department', (cur.departments && cur.departments.name) || '-'], ['Program', (cur.programs && cur.programs.name) || '-'], ['Year of study', cur.year_of_study || '-'], ['Semester', semName], ['Date printed', new Date().toLocaleDateString('en-GB')]].forEach(function (p) {
      var d = el('div'); d.appendChild(el('span', { text: p[0] })); d.appendChild(document.createTextNode(String(p[1] === undefined || p[1] === null ? '-' : p[1]))); info.appendChild(d);
    });
    sheet.appendChild(info);
    var wrap = el('div', { class: 'tw' }); var tb = el('table'); var hr = el('tr');
    ['Course Code', 'Course Name', 'Credit', 'Grade', 'Status'].forEach(function (h) { hr.appendChild(el('th', { text: h })); }); tb.appendChild(hr);
    if (!rows.length) { var er = el('tr'); var ec = el('td', { text: 'No courses for this selection.' }); ec.setAttribute('colspan', '5'); er.appendChild(ec); tb.appendChild(er); }
    rows.forEach(function (o) {
      var tr = el('tr');
      tr.appendChild(el('td', { text: o.c.course_code || '' })); tr.appendChild(el('td', { text: o.c.title || '' })); tr.appendChild(el('td', { text: o.cr || '' }));
      tr.appendChild(el('td', { text: o.state === 'prog' ? '-' : o.letter }));
      var st = el('td'); st.appendChild(el('span', { class: 'bd ' + o.state, text: o.state === 'ok' ? 'Passed' : o.state === 'bad' ? 'Failed' : 'In progress' })); tr.appendChild(st);
      tb.appendChild(tr);
    });
    wrap.appendChild(tb); sheet.appendChild(wrap);
    var att = 0, earned = 0; rows.forEach(function (o) { if (o.state !== 'prog') att += o.cr; if (o.state === 'ok') earned += o.cr; });
    var sm = el('div', { class: 'sum' });
    [['Credits attempted: ', att], ['Credits earned: ', earned], ['GPA (shown): ', gpa(rows)], ['Cumulative GPA: ', gpa(all2)]].forEach(function (p) { var d = el('div'); d.appendChild(document.createTextNode(p[0])); d.appendChild(el('b', { text: String(p[1]) })); sm.appendChild(d); });
    sheet.appendChild(sm);
    var sg = el('div', { class: 'sig' }); ['Registrar signature', 'Stamp', 'Date'].forEach(function (t) { sg.appendChild(el('div', { text: t })); }); sheet.appendChild(sg);
    sheet.appendChild(el('div', { class: 'note', text: "Valid only with the Registrar's signature and stamp." }));
  }
  function view() {
    var id = stuSel.value; if (!id) { msg.textContent = 'Choose a student first.'; return; }
    cur = students.filter(function (s) { return s.id === id; })[0] || null;
    msg.textContent = 'Loading...';
    loadScale(function () {
      db.from('enrollments').select('id, status, courses(course_code, title, credits), semesters(id, name, starts_on), grades(assessment_name, score, max_score, is_final)')
        .eq('student_id', id).limit(300).then(function (r) {
          if (r.error) { msg.textContent = 'Could not load: ' + r.error.message; return; }
          all = r.data || []; msg.textContent = '';
          var keep = semSel.value, seen = {}, opts = [['all', 'All semesters']];
          all.forEach(function (e) { var s = e.semesters; if (s && !seen[s.id]) { seen[s.id] = 1; opts.push([s.id, s.name]); } });
          semSel.textContent = ''; opts.forEach(function (o) { var op = el('option', { value: o[0], text: o[1] }); semSel.appendChild(op); });
          if (seen[keep]) semSel.value = keep;
          render();
        }, function () { msg.textContent = 'Could not load.'; });
    });
  }
  function doPrint() {
    if (!cur || sheet.style.display === 'none') { msg.textContent = 'Press View first.'; return; }
    var old = document.getElementById('trPrint'); if (old) old.remove();
    var p = el('div', { id: 'trPrint' }); p.appendChild(sheet.cloneNode(true)); document.body.appendChild(p);
    document.body.classList.add('trp');
    var off = function () { document.body.classList.remove('trp'); document.removeEventListener('click', off, true); };
    setTimeout(function () { document.addEventListener('click', off, true); }, 500);
    window.print();
  }
  function build(card) {
    card.appendChild(el('h3', { text: 'Academic transcript' }));
    msg = el('p', { text: '' });
    stuSel = el('select'); semSel = el('select');
    var vb = el('button', { type: 'button', text: 'View' }); vb.onclick = view;
    var pb = el('button', { type: 'button', text: 'Print / Save as PDF' }); pb.onclick = doPrint;
    sheet = el('div', { id: 'trSheet' }); sheet.style.display = 'none';
    semSel.onchange = render;
    [stuSel, semSel, vb, pb, msg, sheet].forEach(function (x) { card.appendChild(x); });
    stuSel.appendChild(el('option', { value: '', text: 'Loading students...' }));
    function fill(rows) {
      students = rows || []; stuSel.textContent = '';
      if (!students.length) { stuSel.appendChild(el('option', { value: '', text: 'No students to show' })); return; }
      if (students.length > 1) stuSel.appendChild(el('option', { value: '', text: 'Choose a student' }));
      students.forEach(function (s) { stuSel.appendChild(el('option', { value: s.id, text: s.student_number + ' - ' + s.full_name })); });
      if (students.length === 1) view();
    }
    db.from('students').select('id, student_number, full_name, year_of_study, departments(name), programs(name)').order('full_name').limit(500).then(function (r) {
      if (!r.error) { fill(r.data); return; }
      db.from('students').select('id, student_number, full_name, year_of_study').order('full_name').limit(500).then(function (r2) { fill(r2.data); });
    });
  }
  function init() {
    if (typeof db === 'undefined') return;
    db.auth.getUser().then(function (u) {
      var user = u.data && u.data.user;
      if (!user) { var o = document.getElementById('trCard'); if (o) o.remove(); return; }
      if (document.getElementById('trCard')) return;
      db.from('profiles').select('role').eq('id', user.id).maybeSingle().then(function (p) {
        role = (p.data && p.data.role) || '';
        if (!ROLES.test(role) || document.getElementById('trCard')) return;
        var tries = 0;
        (function place() {
          var s = signedCard();
          if (!s) { if (tries++ < 20) setTimeout(place, 500); return; }
          if (document.getElementById('trCard')) return;
          var card = el('div', { class: 'card', id: 'trCard' });
          s.parentNode.insertBefore(card, s.nextSibling);
          build(card);
        })();
      });
    });
  }
  var st = el('style'); st.textContent = CSS; document.head.appendChild(st);
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(init, 400); });
  init(); setTimeout(init, 1500);
})();
