// Exam module, stage 4: results, teacher grading, publishing. Rules are enforced by the database.
(function () {
  var ROLES = ['admin', 'administrator', 'college_head', 'department_head', 'teacher'];
  var uid = null, busy = false, cur = null;
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
  function say(id, text, ok) { var b = g(id); if (b) { b.textContent = text || ''; b.style.color = ok ? '#166534' : '#b91c1c'; } }
  function fmt(d) { return d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''; }
  var QT = { mcq: 'Multiple choice', true_false: 'True / False', short_answer: 'Short answer', essay: 'Essay', matching: 'Matching', fill_blank: 'Fill in the blank' };
  var st = document.createElement('style');
  st.textContent = '.gr .stat{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.gr .stat div{background:#f1f5f9;border-radius:10px;padding:8px 10px;font-size:13px}.gr .stat b{display:block;font-size:18px;color:#0f2a5e}.gr .badge.warn{background:#fef3c7;color:#92400e}.gr .acts button{width:auto;padding:6px 12px;margin:6px 6px 0 0;font-size:13px}.gr .ans{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;margin:6px 0;white-space:pre-wrap;font-size:14px}.gr .ok{color:#166534}';
  document.head.appendChild(st);

  function loadExams() {
    var s = g('gr_exam'); if (!s) return;
    Promise.resolve(db.from('exams').select('id,title,status,starts_at,courses(course_code)').in('status', ['published', 'completed']).order('starts_at', { ascending: false, nullsFirst: false }).limit(100)).then(function (r) {
      var keep = s.value; s.textContent = '';
      s.appendChild(el('option', { value: '', text: r.error ? 'Could not load exams' : '(choose an exam)' }));
      (r.data || []).forEach(function (x) { s.appendChild(el('option', { value: x.id, text: (x.courses ? x.courses.course_code + ' - ' : '') + x.title + (x.starts_at ? ' (' + fmt(x.starts_at) + ')' : '') })); });
      s.value = keep;
    });
  }
  function csvCell(v) { v = v == null ? '' : String(v); return '"' + v.replace(/"/g, '""') + '"'; }
  function downloadCsv(d) {
    var tot = Number(d.exam.total_marks), lines = [['Student number', 'Name', 'Status', 'Score', 'Total marks', 'Percentage', 'Outcome', 'Published']];
    d.rows.forEach(function (x) {
      var sc = x.total_score; var pct = sc != null && tot ? Math.round(sc / tot * 1000) / 10 : '';
      lines.push([x.student_number, x.full_name, x.session_status, sc == null ? '' : sc, tot, pct, sc == null ? 'Pending' : (Number(sc) >= Number(d.exam.passing_marks) ? 'Passed' : 'Failed'), x.published ? 'Yes' : 'No']);
    });
    var csv = '\uFEFF' + lines.map(function (l) { return l.map(csvCell).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'results-' + d.exam.title.replace(/[^a-z0-9]+/gi, '-') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  function publish(on) {
    if (!confirm(on ? 'Publish these results? Students will see their scores.' : 'Unpublish these results? Students will no longer see their scores.')) return;
    Promise.resolve(db.rpc('exam_publish_results', { p_exam: cur, p_publish: on })).then(function (r) {
      if (r.error) { say('gr_msg', r.error.message); return; }
      say('gr_msg', (on ? 'Published ' : 'Unpublished ') + r.data.count + ' result(s).', true); loadResults();
    });
  }
  function loadResults() {
    cur = g('gr_exam').value; var box = g('gr_list'), sum = g('gr_sum'); g('gr_review').textContent = '';
    if (!cur) { say('gr_msg', 'Choose an exam first.'); return; }
    say('gr_msg', ''); box.textContent = 'Loading...'; sum.textContent = '';
    Promise.resolve(db.rpc('exam_results_list', { p_exam: cur })).then(function (r) {
      box.textContent = '';
      if (r.error) { say('gr_msg', r.error.message); return; }
      var d = r.data, rows = d.rows, tot = Number(d.exam.total_marks), pm = Number(d.exam.passing_marks);
      var scored = rows.filter(function (x) { return x.total_score != null; }).map(function (x) { return Number(x.total_score); });
      var pending = rows.filter(function (x) { return x.result_status !== 'graded' && x.session_status !== 'in_progress'; }).length;
      var inprog = rows.filter(function (x) { return x.session_status === 'in_progress'; }).length;
      var pub = rows.filter(function (x) { return x.published; }).length;
      var avg = scored.length ? Math.round(scored.reduce(function (a, b) { return a + b; }, 0) / scored.length * 10) / 10 : '-';
      var passed = scored.filter(function (s) { return s >= pm; }).length;
      var cells = [['Eligible', d.eligible], ['Attempted', rows.length], ['Not attempted', Math.max(0, d.eligible - rows.length)], ['Still taking', inprog], ['Needs grading', pending], ['Average', avg + ' / ' + tot], ['Highest', scored.length ? Math.max.apply(null, scored) : '-'], ['Lowest', scored.length ? Math.min.apply(null, scored) : '-'], ['Passed', passed], ['Failed', scored.length - passed]];
      var grid = el('div', { class: 'stat' }); cells.forEach(function (c) { grid.appendChild(el('div', null, [el('b', { text: String(c[1]) }), c[0]])); });
      sum.appendChild(el('b', { text: d.exam.title }));
      sum.appendChild(el('div', { class: 'hint', text: pub === rows.length && rows.length ? 'Results are published.' : (pub ? 'Results are partly published.' : 'Results are not published.') }));
      sum.appendChild(grid);
      var acts = el('div', { class: 'acts' });
      if (d.can_publish && rows.length && pub < rows.length) acts.appendChild(btn('Publish results', function () { publish(true); }));
      if (d.can_publish && pub > 0) acts.appendChild(btn('Unpublish results', function () { publish(false); }, 'secondary'));
      if (rows.length) acts.appendChild(btn('Download CSV (Excel)', function () { downloadCsv(d); }, 'secondary'));
      sum.appendChild(acts);
      if (!d.can_publish) sum.appendChild(el('p', { class: 'hint', text: 'You can grade. A head or administrator publishes the results.' }));
      if (!rows.length) { box.appendChild(el('p', { class: 'hint', text: 'No student has started this exam yet.' })); return; }
      rows.forEach(function (x) {
        var it = el('div', { class: 'item' });
        var done = x.session_status !== 'in_progress';
        it.appendChild(el('div', null, [
          el('span', { class: 'badge ' + (x.session_status === 'in_progress' ? 'warn' : ''), text: x.session_status.replace('_', ' ') }),
          x.pending > 0 && done ? el('span', { class: 'badge warn', text: x.pending + ' to mark' }) : null,
          x.published ? el('span', { class: 'badge published', text: 'published' }) : null]));
        it.appendChild(el('b', { text: x.full_name }));
        it.appendChild(el('div', { class: 'hint', text: x.student_number + (x.submitted_at ? ' | submitted ' + fmt(x.submitted_at) : '') }));
        it.appendChild(el('div', { text: x.total_score != null ? 'Score: ' + x.total_score + ' / ' + tot + (Number(x.total_score) >= pm ? ' - Passed' : ' - Failed') : (done ? 'Score pending (auto marks so far: ' + (x.auto_score == null ? 0 : x.auto_score) + ')' : 'Not submitted yet') }));
        if (done) it.appendChild(el('div', { class: 'acts' }, [btn('Review and mark', function () { review(x.session_id); }, 'secondary')]));
        box.appendChild(it);
      });
    });
  }
  function review(sid) {
    var box = g('gr_review'); box.textContent = 'Loading...';
    Promise.resolve(db.rpc('exam_grading_paper', { p_session: sid })).then(function (r) {
      box.textContent = '';
      if (r.error) { box.textContent = r.error.message; return; }
      var d = r.data;
      box.appendChild(el('h3', { text: 'Marking: ' + d.student.name + ' (' + d.student.number + ')' }));
      if (d.published) box.appendChild(el('p', { class: 'hint', text: 'These results are published and locked. Unpublish them to change marks.' }));
      d.questions.forEach(function (q, i) {
        var it = el('div', { class: 'item' });
        it.appendChild(el('div', null, [el('span', { class: 'badge', text: 'Q' + (i + 1) + ' ' + QT[q.type] }), el('span', { class: 'badge', text: q.marks + ' mark(s)' }), q.score == null ? el('span', { class: 'badge warn', text: 'needs marking' }) : null]));
        it.appendChild(el('div', { text: q.body, style: 'white-space:pre-wrap' }));
        it.appendChild(el('div', { class: 'hint', text: 'Student answer:' }));
        it.appendChild(el('div', { class: 'ans', text: q.answer_text || '(no answer)' }));
        it.appendChild(el('div', { class: 'hint', text: q.type === 'essay' ? 'Marking guide:' : 'Correct answer:' }));
        it.appendChild(el('div', { class: 'ans ok', text: q.correct_text || '(none)' }));
        var sc = el('input', { type: 'number', min: '0', max: String(q.marks), step: '0.5', placeholder: 'Mark (0 to ' + q.marks + ')' }); if (q.score != null) sc.value = q.score;
        var cm = el('input', { type: 'text', placeholder: 'Comment for the student (optional)' }); cm.value = q.comment || '';
        var msg = el('div', { class: 'msg' });
        sc.disabled = cm.disabled = d.published;
        it.appendChild(el('div', { class: 'row' }, [el('div', null, [el('label', { class: 'f', text: 'Mark' }), sc]), el('div', null, [el('label', { class: 'f', text: 'Comment' }), cm])]));
        if (!d.published) it.appendChild(btn('Save mark', function () {
          if (sc.value === '') { msg.style.color = '#b91c1c'; msg.textContent = 'Enter a mark.'; return; }
          Promise.resolve(db.rpc('exam_grade_answer', { p_session: sid, p_question: q.question_id, p_score: Number(sc.value), p_comment: cm.value })).then(function (x) {
            if (x.error) { msg.style.color = '#b91c1c'; msg.textContent = x.error.message; return; }
            msg.style.color = '#166534'; msg.textContent = x.data.pending ? 'Saved. Other answers still need marking.' : 'Saved. Total score: ' + x.data.total;
            loadResults(); setTimeout(function () { review(sid); }, 600);
          });
        }));
        it.appendChild(msg); box.appendChild(it);
      });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  function build() {
    var ref = g('enrollForm'); if (!ref || g('examGradeCard')) return;
    var c = el('div', { class: 'card ex gr', id: 'examGradeCard' });
    c.appendChild(el('h2', { text: 'Exam results and grading' }));
    c.appendChild(el('p', { class: 'hint', text: 'Review student answers, mark essays, override marks, then publish. Students see results only after publishing.' }));
    c.appendChild(el('label', { class: 'f', text: 'Exam' }));
    var s = el('select', { id: 'gr_exam' }); s.onchange = function () { g('gr_review').textContent = ''; loadResults(); }; c.appendChild(s);
    c.appendChild(el('div', { style: 'height:8px' }));
    c.appendChild(btn('Refresh results', loadResults));
    c.appendChild(el('div', { id: 'gr_msg', class: 'msg' }));
    c.appendChild(el('div', { id: 'gr_sum' }));
    c.appendChild(el('div', { id: 'gr_list' }));
    c.appendChild(el('div', { id: 'gr_review' }));
    ref.parentNode.insertBefore(c, ref);
    loadExams();
  }
  function init() {
    if (busy) return; busy = true;
    db.auth.getSession().then(function (s) {
      var sess = s && s.data && s.data.session;
      if (!sess) { var n = g('examGradeCard'); if (n) n.remove(); uid = null; busy = false; return; }
      if (uid === sess.user.id && g('examGradeCard')) { busy = false; return; }
      uid = sess.user.id;
      Promise.resolve(db.from('profiles').select('role').eq('id', uid).single()).then(function (r) {
        if (ROLES.indexOf(r.data && r.data.role) < 0) { busy = false; return; }
        build(); busy = false;
      }).catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  db.auth.onAuthStateChange(function () { setTimeout(init, 800); });
  setTimeout(init, 1200);
})();
