// Attendance card (uses global `db`; role comes from body[data-role])
(function () {
  'use strict';
  var STATUSES = ['present', 'late', 'absent', 'excused'];
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';
  var BTN2 = BTN.replace('#2563eb', '#64748b');

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  function today() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function csvCell(v) {
    v = String(v == null ? '' : v);
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  // Place the card after the Transcript card, copying its look
  var anchor = null;
  var hs = document.querySelectorAll('h1,h2,h3');
  for (var i = 0; i < hs.length; i++) {
    if (/transcript/i.test(hs[i].textContent)) { anchor = hs[i].parentElement; break; }
  }
  var card = el('div');
  card.id = 'attendanceCard';
  if (anchor && anchor.parentNode) {
    card.className = anchor.className;
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  } else {
    card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px';
    document.body.appendChild(card);
  }
  card.style.display = 'none';

  function buildStaff() {
    card.appendChild(el('h2', null, 'Attendance'));
    var courseSel = el('select', INPUT);
    var semSel = el('select', INPUT);
    var dateIn = el('input', INPUT);
    dateIn.type = 'date';
    dateIn.value = today();
    var loadBtn = el('button', BTN, 'Load students'); loadBtn.type = 'button';
    var list = el('div');
    var saveBtn = el('button', BTN, 'Save attendance'); saveBtn.type = 'button'; saveBtn.style.display = 'none';
    var sumBtn = el('button', BTN2, 'Show summary for this course'); sumBtn.type = 'button';
    var csvBtn = el('button', BTN2, 'Download CSV'); csvBtn.type = 'button'; csvBtn.style.display = 'none';
    var msg = el('div', 'margin:8px 0');
    var out = el('div');
    [courseSel, semSel, dateIn, loadBtn, list, saveBtn, sumBtn, csvBtn, msg, out].forEach(function (x) { card.appendChild(x); });

    var rows = [];
    var summaryRows = [];
    function say(t, ok) { msg.textContent = t; msg.style.color = ok ? '#15803d' : '#b91c1c'; }

    async function fillSelects() {
      var c = await db.from('courses').select('id, course_code, title').order('course_code');
      var s = await db.from('semesters').select('id, name, starts_on, academic_years(name)').order('starts_on', { ascending: false });
      if (c.error) { say('Could not load courses: ' + c.error.message, false); return; }
      if (s.error) { say('Could not load semesters: ' + s.error.message, false); return; }
      (c.data || []).forEach(function (x) {
        var o = el('option', null, x.course_code + ' – ' + x.title); o.value = x.id; courseSel.appendChild(o);
      });
      (s.data || []).forEach(function (x) {
        var o = el('option', null, (x.academic_years ? x.academic_years.name + ' – ' : '') + x.name); o.value = x.id; semSel.appendChild(o);
      });
    }

    async function getEnrollments() {
      var e = await db.from('enrollments').select('id, students(student_number, full_name)')
        .eq('course_id', courseSel.value).eq('semester_id', semSel.value);
      if (e.error) { say('Could not load students: ' + e.error.message, false); return null; }
      var data = e.data || [];
      data.sort(function (a, b) {
        return String(a.students && a.students.student_number).localeCompare(String(b.students && b.students.student_number));
      });
      return data;
    }

    loadBtn.onclick = async function () {
      list.textContent = ''; rows = []; saveBtn.style.display = 'none'; msg.textContent = '';
      if (!courseSel.value || !semSel.value || !dateIn.value) { say('Choose a course, a semester and a date.', false); return; }
      var enr = await getEnrollments();
      if (!enr) return;
      if (!enr.length) { say('No students are enrolled in this course and semester (or you may not teach it).', false); return; }
      var ids = enr.map(function (r) { return r.id; });
      var a = await db.from('attendance').select('enrollment_id, status').eq('class_date', dateIn.value).in('enrollment_id', ids);
      if (a.error) { say('Could not load attendance: ' + a.error.message, false); return; }
      var existing = {};
      (a.data || []).forEach(function (r) { existing[r.enrollment_id] = r.status; });
      enr.forEach(function (r) {
        var line = el('div', 'padding:8px 0;border-bottom:1px solid #e5e7eb');
        var st = r.students || {};
        line.appendChild(el('div', 'margin-bottom:6px', (st.student_number || '?') + ' – ' + (st.full_name || '?')));
        var sel = el('select', INPUT.replace('margin-bottom:10px', 'margin-bottom:0'));
        STATUSES.forEach(function (s) { var o = el('option', null, s); o.value = s; sel.appendChild(o); });
        sel.value = existing[r.id] || 'present';
        line.appendChild(sel);
        list.appendChild(line);
        rows.push({ id: r.id, sel: sel });
      });
      saveBtn.style.display = '';
      say(Object.keys(existing).length ? 'Showing saved attendance for this date.' : 'Nothing saved yet for this date. Default is present.', true);
    };

    saveBtn.onclick = async function () {
      var recs = rows.map(function (r) { return { enrollment_id: r.id, class_date: dateIn.value, status: r.sel.value }; });
      if (!recs.length) return;
      saveBtn.disabled = true;
      var r = await db.from('attendance').upsert(recs, { onConflict: 'enrollment_id,class_date' });
      saveBtn.disabled = false;
      if (r.error) say('Not saved: ' + r.error.message, false);
      else say('Saved ' + recs.length + ' record(s) for ' + dateIn.value + '.', true);
    };

    sumBtn.onclick = async function () {
      out.textContent = ''; csvBtn.style.display = 'none'; summaryRows = [];
      if (!courseSel.value || !semSel.value) { say('Choose a course and a semester.', false); return; }
      var enr = await getEnrollments();
      if (!enr) return;
      if (!enr.length) { say('No students found for this course and semester.', false); return; }
      var ids = enr.map(function (r) { return r.id; });
      var a = await db.from('attendance').select('enrollment_id, status').in('enrollment_id', ids);
      if (a.error) { say('Could not load attendance: ' + a.error.message, false); return; }
      var counts = {};
      ids.forEach(function (id) { counts[id] = { present: 0, late: 0, absent: 0, excused: 0 }; });
      (a.data || []).forEach(function (r) { if (counts[r.enrollment_id]) counts[r.enrollment_id][r.status]++; });
      enr.forEach(function (r) {
        var c = counts[r.id]; var st = r.students || {};
        var total = c.present + c.late + c.absent + c.excused;
        var pct = total ? Math.round(((c.present + c.late) / total) * 100) : '';
        summaryRows.push([st.student_number, st.full_name, c.present, c.late, c.absent, c.excused, total, pct]);
        out.appendChild(el('div', 'padding:8px 0;border-bottom:1px solid #e5e7eb',
          (st.student_number || '?') + ' – ' + (st.full_name || '?') + ': present ' + c.present + ', late ' + c.late +
          ', absent ' + c.absent + ', excused ' + c.excused + (total ? ' (' + pct + '% attended)' : ' (no records)')));
      });
      csvBtn.style.display = '';
      say('Summary ready.', true);
    };

    csvBtn.onclick = function () {
      var head = ['student_number', 'full_name', 'present', 'late', 'absent', 'excused', 'total', 'attended_percent'];
      var text = [head].concat(summaryRows).map(function (r) { return r.map(csvCell).join(','); }).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
      a.download = 'attendance-' + today() + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
    };

    fillSelects();
  }

  async function buildStudent() {
    card.appendChild(el('h2', null, 'My attendance'));
    var out = el('div', null, 'Loading...');
    card.appendChild(out);
    var r = await db.from('attendance')
      .select('class_date, status, enrollments(courses(course_code, title), semesters(name))')
      .order('class_date', { ascending: false });
    out.textContent = '';
    if (r.error) { out.style.color = '#b91c1c'; out.textContent = 'Could not load attendance: ' + r.error.message; return; }
    var data = r.data || [];
    if (!data.length) { out.textContent = 'No attendance recorded yet.'; return; }
    var c = { present: 0, late: 0, absent: 0, excused: 0 };
    data.forEach(function (x) { c[x.status]++; });
    var total = data.length;
    out.appendChild(el('div', 'margin-bottom:10px;font-weight:600',
      'Present ' + c.present + ', late ' + c.late + ', absent ' + c.absent + ', excused ' + c.excused +
      ' (' + Math.round(((c.present + c.late) / total) * 100) + '% attended)'));
    data.forEach(function (x) {
      var en = x.enrollments || {}; var co = en.courses || {};
      out.appendChild(el('div', 'padding:6px 0;border-bottom:1px solid #e5e7eb',
        x.class_date + ' – ' + (co.course_code || '?') + ' – ' + x.status));
    });
  }

  var built = '';
  function refresh() {
    var r = document.body.getAttribute('data-role') || '';
    var group = (r === 'administrator' || r === 'teacher') ? 'staff' : (r === 'student' ? 'student' : '');
    if (group === built) return;
    built = group;
    card.textContent = '';
    card.style.display = group ? '' : 'none';
    if (group === 'staff') buildStaff();
    else if (group === 'student') buildStudent();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
