// Student home: "My overview" card + hides admin/teacher cards for students.
// Uses global `db`; role from body[data-role]. Display only; security is in the database.
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
  card.id = 'studentHomeCard';
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
    var a = document.getElementById('announcementsCard');
    if (!a || !a.parentNode) a = signedInCard();
    if (a && a.parentNode) {
      card.className = a.className;
      a.parentNode.insertBefore(card, a.nextSibling);
    } else if (!card.parentNode) {
      card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px;display:none';
      document.body.appendChild(card);
    }
  }

  var HIDE = /^\s*(Add student|Students|Enroll a student|Class roster|Enter a grade|Grades for the selected enrollment)\s*$/i;
  function hideStaffCards() {
    var hs = document.querySelectorAll('h1,h2,h3');
    for (var i = 0; i < hs.length; i++) {
      var p = hs[i].parentElement;
      if (HIDE.test(hs[i].textContent) && p && p !== card) p.style.display = 'none';
    }
  }

  async function load(out, msg) {
    out.textContent = '';
    msg.textContent = '';
    var s = await db.from('students')
      .select('id, student_number, full_name, year_of_study, department_id, program_id').limit(1);
    if (s.error || !s.data || !s.data.length) { card.style.display = 'none'; return; }
    card.style.display = '';
    var st = s.data[0];

    var dep = '', prog = '';
    if (st.department_id) {
      var d = await db.from('departments').select('*').eq('id', st.department_id).limit(1);
      if (d.data && d.data[0]) dep = d.data[0].name || d.data[0].code || '';
    }
    if (st.program_id) {
      var p = await db.from('programs').select('*').eq('id', st.program_id).limit(1);
      if (p.data && p.data[0]) prog = p.data[0].name || p.data[0].title || p.data[0].code || '';
    }
    out.appendChild(el('div', 'font-weight:700;font-size:18px', st.full_name || ''));
    out.appendChild(el('div', 'color:#4b5563;margin-bottom:12px',
      [st.student_number, prog, dep, st.year_of_study ? 'Year ' + st.year_of_study : ''].filter(Boolean).join(' · ')));

    var e = await db.from('enrollments')
      .select('id, status, courses(course_code, title, credits), semesters(name)').eq('student_id', st.id);
    if (e.error) { msg.style.color = '#b91c1c'; msg.textContent = 'Could not load courses: ' + e.error.message; return; }
    var enr = e.data || [];
    if (!enr.length) { out.appendChild(el('div', 'color:#4b5563', 'You are not enrolled in any course yet.')); return; }
    var ids = enr.map(function (x) { return x.id; });

    var g = await db.from('grades').select('enrollment_id, score, max_score, is_final').in('enrollment_id', ids);
    var a = await db.from('attendance').select('enrollment_id, status').in('enrollment_id', ids);
    var grades = {}, att = {};
    (g.data || []).forEach(function (r) { (grades[r.enrollment_id] = grades[r.enrollment_id] || []).push(r); });
    (a.data || []).forEach(function (r) {
      var c = att[r.enrollment_id] = att[r.enrollment_id] || { present: 0, late: 0, absent: 0, excused: 0 };
      if (c[r.status] !== undefined) c[r.status]++;
    });

    enr.forEach(function (x) {
      var co = x.courses || {}, se = x.semesters || {};
      var box = el('div', 'padding:10px 0;border-top:1px solid #e5e7eb');
      box.appendChild(el('div', 'font-weight:600', (co.course_code || '?') + ' – ' + (co.title || '')));
      box.appendChild(el('div', 'font-size:14px;color:#6b7280',
        (se.name || '') + (co.credits != null ? ' · ' + co.credits + ' credits' : '')));

      var rows = grades[x.id] || [];
      var line;
      var fin = rows.filter(function (r) { return r.is_final; })[0];
      if (fin) {
        line = 'Final grade: ' + fin.score + (fin.max_score != null ? ' / ' + fin.max_score : '');
      } else if (rows.length) {
        var sum = 0, max = 0;
        rows.forEach(function (r) { if (r.max_score > 0) { sum += Number(r.score); max += Number(r.max_score); } });
        line = max > 0 ? 'Average so far: ' + Math.round((sum / max) * 100) + '% (' + rows.length + ' assessment' + (rows.length > 1 ? 's' : '') + ')'
                       : rows.length + ' grade(s) recorded';
      } else {
        line = 'No grades yet';
      }
      box.appendChild(el('div', null, line));

      var c = att[x.id];
      if (c) {
        var total = c.present + c.late + c.absent + c.excused;
        var pct = total ? Math.round(((c.present + c.late) / total) * 100) : 0;
        box.appendChild(el('div', null, 'Attendance: ' + pct + '% (present ' + c.present + ', late ' + c.late +
          ', absent ' + c.absent + ', excused ' + c.excused + ')'));
      } else {
        box.appendChild(el('div', null, 'Attendance: none recorded'));
      }
      out.appendChild(box);
    });
  }

  var built = false;
  function build() {
    card.appendChild(el('h2', null, 'My overview'));
    var btn = el('button', BTN, 'Refresh overview'); btn.type = 'button';
    var msg = el('div', 'margin:8px 0');
    var out = el('div');
    card.appendChild(btn); card.appendChild(msg); card.appendChild(out);
    btn.onclick = function () { load(out, msg); };
    load(out, msg);
  }

  function refresh() {
    var student = document.body.getAttribute('data-role') === 'student';
    if (!student) { built = false; card.textContent = ''; card.style.display = 'none'; return; }
    hideStaffCards();
    setTimeout(hideStaffCards, 900);
    if (built) return;
    built = true;
    place();
    setTimeout(place, 900);
    build();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
