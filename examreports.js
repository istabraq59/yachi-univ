// Exam module, stage 5: PDF (print) and CSV reports, question analysis. Data comes from database functions that apply the user's permissions.
(function () {
  var ROLES = ['admin', 'administrator', 'college_head', 'department_head', 'teacher'];
  var uid = null, busy = false, last = null;
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
  function fmt(d) { return d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'; }
  function pc(n, d) { return d ? (Math.round(n / d * 1000) / 10) + '%' : '-'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var st = document.createElement('style');
  st.textContent = [
    '.rp .rt{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0}',
    '.rp .rt th{background:#e8eefb;color:#0f2a5e;text-align:left;padding:6px}',
    '.rp .rt td{padding:6px;border-bottom:1px solid #e2e8f0;vertical-align:top}',
    '.rp .scroll{overflow-x:auto}',
    '.rp .stat{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}',
    '.rp .stat div{background:#f1f5f9;border-radius:10px;padding:8px 10px;font-size:13px}',
    '.rp .stat b{display:block;font-size:18px;color:#0f2a5e}',
    '.rp .bar{display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0}',
    '.rp .bar span{width:62px;flex:none}.rp .bar i{display:block;height:12px;background:#2563eb;border-radius:3px;min-width:2px}',
    '.rp .flag-hard{color:#b91c1c;font-weight:600}.rp .flag-easy{color:#92400e;font-weight:600}.rp .flag-ok{color:#166534}',
    '.rp .kv{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:14px;margin:10px 0}.rp .kv small{display:block;color:#64748b;font-size:12px}',
    '.rp .sig{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:36px;font-size:13px}.rp .sig div{border-top:1px solid #0f2a5e;padding-top:4px}',
    '#rpPrint{display:none}',
    '@media print{body.rpp>*:not(#rpPrint){display:none!important}body.rpp #rpPrint{display:block!important}body.rpp{padding:0!important;background:#fff!important}}'
  ].join('\n');
  document.head.appendChild(st);

  function head(title, sub) {
    var d = el('div');
    d.appendChild(el('div', { style: 'display:flex;gap:12px;align-items:center' }, [
      el('img', { src: 'logo.jpg', alt: '', style: 'width:48px;height:48px;border-radius:8px;object-fit:cover' }),
      el('div', null, [el('b', { text: 'YACHI UNIVERSITY', style: 'font-size:18px;color:#0f2a5e' }), el('div', { class: 'hint', text: 'Examination report' })])]));
    d.appendChild(el('h3', { text: title }));
    if (sub) d.appendChild(el('div', { class: 'hint', text: sub }));
    return d;
  }
  function table(heads, rows) {
    var t = el('table', { class: 'rt' }), th = el('tr');
    heads.forEach(function (h) { th.appendChild(el('th', { text: h })); });
    t.appendChild(el('thead', null, [th]));
    var tb = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      r.forEach(function (c) { var td = el('td'); if (c && c.nodeType) td.appendChild(c); else td.textContent = c == null ? '' : String(c); tr.appendChild(td); });
      tb.appendChild(tr);
    });
    t.appendChild(tb); return el('div', { class: 'scroll' }, [t]);
  }
  function stats(list) { var d = el('div', { class: 'stat' }); list.forEach(function (c) { d.appendChild(el('div', null, [el('b', { text: String(c[1]) }), c[0]])); }); return d; }
  function kv(list) { var d = el('div', { class: 'kv' }); list.forEach(function (c) { d.appendChild(el('div', null, [el('small', { text: c[0] }), c[1] == null || c[1] === '' ? '-' : String(c[1])])); }); return d; }
  function sig(a, b) { return el('div', { class: 'sig' }, [el('div', { text: a }), el('div', { text: b })]); }
  function csvCell(v) { v = v == null ? '' : String(v); return '"' + v.replace(/"/g, '""') + '"'; }
  function downloadCsv(name, lines) {
    var csv = '\uFEFF' + lines.map(function (l) { return l.map(csvCell).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name.replace(/[^a-z0-9]+/gi, '-') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  function printReport() {
    var r = g('rp_out'); if (!r || !r.firstChild) return;
    var old = g('rpPrint'); if (old) old.remove();
    var pr = el('div', { id: 'rpPrint', class: 'rp' }); pr.appendChild(r.cloneNode(true)); document.body.appendChild(pr);
    document.body.classList.add('rpp');
    var done = function () { document.body.classList.remove('rpp'); pr.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); }, 150);
  }
  function qflag(q) {
    if (!q.marked) return ['Not marked yet', ''];
    var idx = Number(q.avg_score) / Number(q.marks);
    var f = idx < 0.3 ? ['Too hard - review', 'flag-hard'] : idx > 0.9 ? ['Too easy', 'flag-easy'] : ['Good', 'flag-ok'];
    if (q.marked < 5) f[0] += ' (few answers)';
    return f;
  }
  function actions(extra) {
    var a = el('div', { class: 'acts' }, [btn('Print / Save as PDF', printReport)]);
    (extra || []).forEach(function (b) { a.appendChild(b); });
    return a;
  }

  // ---------- single exam ----------
  function showExam(d) {
    last = d;
    var out = g('rp_out'); out.textContent = '';
    var e = d.exam, s = d.stats, tot = Number(e.total_marks);
    var finished = s.submitted + s.auto_submitted;
    out.appendChild(head(e.title, e.course));
    out.appendChild(kv([['Academic unit', e.unit], ['Department', e.department], ['Exam type', e.type], ['Status', e.status], ['Starts', fmt(e.starts_at)], ['Ends', fmt(e.ends_at)], ['Duration', e.duration + ' minutes'], ['Total / passing marks', e.total_marks + ' / ' + e.passing_marks], ['Report created', fmt(d.generated_at)]]));
    out.appendChild(el('h3', { text: 'Participation' }));
    out.appendChild(stats([['Eligible students', d.eligible], ['Attempted', s.attempted], ['Finished', finished], ['Auto-submitted (time ran out)', s.auto_submitted], ['Absent', d.absent.length], ['Participation rate', pc(s.attempted, d.eligible)]]));
    out.appendChild(el('h3', { text: 'Results' }));
    out.appendChild(stats([['Graded', s.graded], ['Waiting for marking', s.pending], ['Average mark', s.avg == null ? '-' : s.avg + ' / ' + tot], ['Median', s.median == null ? '-' : Math.round(s.median * 10) / 10], ['Highest', s.max == null ? '-' : s.max], ['Lowest', s.min == null ? '-' : s.min], ['Passed', s.passed], ['Failed', s.failed], ['Pass rate', pc(s.passed, s.graded)]]));
    out.appendChild(el('h3', { text: 'Score distribution (percent of total marks)' }));
    var mx = Math.max.apply(null, d.distribution.map(function (b) { return b.count; }).concat([1]));
    d.distribution.forEach(function (b) {
      out.appendChild(el('div', { class: 'bar' }, [el('span', { text: b.from + (b.from === 90 ? '-100%' : '-' + (b.from + 9) + '%') }), el('i', { style: 'width:' + Math.round(b.count / mx * 60) + '%' }), String(b.count)]));
    });
    out.appendChild(el('h3', { text: 'Student results' }));
    out.appendChild(table(['No.', 'Student number', 'Name', 'Status', 'Score', '%', 'Outcome'], d.students.map(function (x, i) {
      return [i + 1, x.number, x.name, x.status.replace('_', ' '), x.score == null ? '-' : x.score + ' / ' + tot, x.pct == null ? '-' : x.pct + '%', x.score == null ? 'Pending' : (x.passed ? 'Passed' : 'Failed')];
    })));
    if (d.absent.length) {
      out.appendChild(el('h3', { text: 'Eligible students who did not attempt' }));
      out.appendChild(table(['No.', 'Student number', 'Name'], d.absent.map(function (x, i) { return [i + 1, x.number, x.name]; })));
    }
    out.appendChild(el('h3', { text: 'Question analysis' }));
    out.appendChild(el('p', { class: 'hint', text: 'Difficulty index = average mark divided by the question marks. Below 30% is flagged as too hard, above 90% as too easy.' }));
    out.appendChild(table(['No.', 'Type', 'Question', 'Marks', 'Answered', 'Average', 'Difficulty index', 'Full marks', 'Zero', 'Flag'], d.questions.map(function (q, i) {
      var f = qflag(q);
      return [i + 1, q.type.replace('_', ' '), q.body.length > 70 ? q.body.slice(0, 70) + '...' : q.body, q.marks, q.answered + ' / ' + finished, q.avg_score == null ? '-' : q.avg_score, q.marked ? pc(Number(q.avg_score), Number(q.marks)) : '-', q.full_marks, q.zero, el('span', { class: f[1], text: f[0] })];
    })));
    var mc = d.questions.filter(function (q) { return q.type === 'mcq' && q.options; });
    if (mc.length) {
      out.appendChild(el('h3', { text: 'Multiple-choice option analysis' }));
      mc.forEach(function (q) {
        var qi = d.questions.indexOf(q) + 1;
        out.appendChild(el('div', { text: 'Q' + qi + ': ' + (q.body.length > 90 ? q.body.slice(0, 90) + '...' : q.body), style: 'font-weight:600;margin-top:8px' }));
        out.appendChild(table(['Option', 'Chosen by', 'Correct?'], q.options.map(function (o) { return [o.text, o.chosen, o.correct ? 'Yes' : '']; })));
      });
    }
    out.appendChild(sig('Prepared by (teacher)', 'Head of department'));
    var wrap = g('rp_actions'); wrap.textContent = '';
    wrap.appendChild(actions([
      btn('Student results CSV', function () {
        var l = [['Student number', 'Name', 'Status', 'Score', 'Total marks', 'Percentage', 'Outcome']];
        d.students.forEach(function (x) { l.push([x.number, x.name, x.status, x.score == null ? '' : x.score, tot, x.pct == null ? '' : x.pct, x.score == null ? 'Pending' : (x.passed ? 'Passed' : 'Failed')]); });
        downloadCsv('results-' + e.title, l);
      }, 'secondary'),
      btn('Question analysis CSV', function () {
        var l = [['No', 'Type', 'Question', 'Marks', 'Answered', 'Marked', 'Average mark', 'Difficulty index %', 'Full marks', 'Zero marks', 'Flag']];
        d.questions.forEach(function (q, i) { l.push([i + 1, q.type, q.body, q.marks, q.answered, q.marked, q.avg_score == null ? '' : q.avg_score, q.marked ? Math.round(Number(q.avg_score) / Number(q.marks) * 1000) / 10 : '', q.full_marks, q.zero, qflag(q)[0]]); });
        downloadCsv('question-analysis-' + e.title, l);
      }, 'secondary')]));
  }
  function runExam() {
    var id = g('rp_exam').value; if (!id) { g('rp_msg').textContent = 'Choose an exam first.'; return; }
    g('rp_msg').textContent = 'Building the report...';
    Promise.resolve(db.rpc('exam_report_exam', { p_exam: id })).then(function (r) {
      if (r.error) { g('rp_msg').textContent = r.error.message; return; }
      g('rp_msg').textContent = ''; showExam(r.data);
    });
  }

  // ---------- overview ----------
  function group(rows, keyFn) {
    var m = {};
    rows.forEach(function (r) {
      var k = keyFn(r), a = m[k] || (m[k] = { name: k, exams: 0, eligible: 0, attempted: 0, graded: 0, sumPct: 0, passed: 0 });
      a.exams++; a.eligible += r.eligible; a.attempted += r.attempted; a.graded += r.graded; a.sumPct += Number(r.sum_pct); a.passed += r.passed;
    });
    return Object.keys(m).sort().map(function (k) { return m[k]; });
  }
  function groupRows(list) { return list.map(function (a) { return [a.name, a.exams, a.eligible, a.attempted, pc(a.attempted, a.eligible), a.graded, a.graded ? Math.round(a.sumPct / a.graded * 10) / 10 + '%' : '-', pc(a.passed, a.graded)]; }); }
  var GH = ['Name', 'Exams', 'Eligible', 'Attempted', 'Participation', 'Graded', 'Average', 'Pass rate'];
  function showOverview(d, from, to) {
    last = d;
    var out = g('rp_out'); out.textContent = '';
    var rows = d.rows, now = Date.now();
    out.appendChild(head('Examination overview', 'Period: ' + from + ' to ' + to));
    out.appendChild(el('div', { class: 'hint', text: 'Report created ' + fmt(d.generated_at) }));
    var cnt = { draft: 0, upcoming: 0, done: 0, cancelled: 0 };
    rows.forEach(function (r) {
      if (r.status === 'draft') cnt.draft++; else if (r.status === 'cancelled') cnt.cancelled++;
      else if (r.status === 'completed' || (r.ends_at && Date.parse(r.ends_at) < now)) cnt.done++; else cnt.upcoming++;
    });
    out.appendChild(el('h3', { text: 'Examination completion' }));
    out.appendChild(stats([['All exams', rows.length], ['Completed', cnt.done], ['Published / upcoming', cnt.upcoming], ['Draft', cnt.draft], ['Cancelled', cnt.cancelled], ['Completion rate', pc(cnt.done, rows.length - cnt.draft - cnt.cancelled + cnt.done - cnt.done)]]));
    var run = rows.filter(function (r) { return r.status !== 'draft' && r.status !== 'cancelled'; });
    out.appendChild(el('h3', { text: 'By academic unit' })); out.appendChild(table(GH, groupRows(group(run, function (r) { return r.unit; }))));
    out.appendChild(el('h3', { text: 'By department' })); out.appendChild(table(GH, groupRows(group(run, function (r) { return r.department; }))));
    out.appendChild(el('h3', { text: 'By subject' })); out.appendChild(table(GH, groupRows(group(run, function (r) { return r.course; }))));
    out.appendChild(el('h3', { text: 'All exams in the period' }));
    out.appendChild(table(['Date', 'Exam', 'Subject', 'Status', 'Attempted / eligible', 'Average', 'Pass rate'], rows.map(function (r) {
      return [r.starts_at ? fmt(r.starts_at) : 'Not scheduled', r.title, r.course, r.status, r.attempted + ' / ' + r.eligible, r.graded ? Math.round(Number(r.sum_pct) / r.graded * 10) / 10 + '%' : '-', pc(r.passed, r.graded)];
    })));
    out.appendChild(sig('Prepared by', 'Registrar / Dean'));
    var wrap = g('rp_actions'); wrap.textContent = '';
    wrap.appendChild(actions([btn('Download CSV (Excel)', function () {
      var l = [['Date', 'Exam', 'Type', 'Subject', 'Department', 'Academic unit', 'Status', 'Eligible', 'Attempted', 'Graded', 'Average %', 'Passed', 'Pass rate %']];
      rows.forEach(function (r) { l.push([r.starts_at || '', r.title, r.type, r.course, r.department, r.unit, r.status, r.eligible, r.attempted, r.graded, r.graded ? Math.round(Number(r.sum_pct) / r.graded * 10) / 10 : '', r.passed, r.graded ? Math.round(r.passed / r.graded * 1000) / 10 : '']); });
      downloadCsv('exam-overview-' + from + '-to-' + to, l);
    }, 'secondary')]));
  }
  function runOverview() {
    var f = g('rp_from').value, t = g('rp_to').value;
    if (!f || !t) { g('rp_msg').textContent = 'Choose the dates.'; return; }
    var to = new Date(t); to.setDate(to.getDate() + 1);
    g('rp_msg').textContent = 'Building the report...';
    Promise.resolve(db.rpc('exam_report_overview', { p_from: new Date(f).toISOString(), p_to: to.toISOString() })).then(function (r) {
      if (r.error) { g('rp_msg').textContent = r.error.message; return; }
      g('rp_msg').textContent = ''; showOverview(r.data, f, t);
    });
  }

  function loadExams() {
    var s = g('rp_exam'); if (!s) return;
    Promise.resolve(db.from('exams').select('id,title,status,starts_at,courses(course_code)').neq('status', 'draft').order('starts_at', { ascending: false, nullsFirst: false }).limit(150)).then(function (r) {
      s.textContent = ''; s.appendChild(el('option', { value: '', text: '(choose an exam)' }));
      (r.data || []).forEach(function (x) { s.appendChild(el('option', { value: x.id, text: (x.courses ? x.courses.course_code + ' - ' : '') + x.title + (x.starts_at ? ' (' + fmt(x.starts_at) + ')' : '') })); });
    });
  }
  function mode() {
    var m = g('rp_type').value;
    g('rp_examBox').style.display = m === 'exam' ? '' : 'none';
    g('rp_dateBox').style.display = m === 'overview' ? '' : 'none';
  }
  function build() {
    var ref = g('enrollForm'); if (!ref || g('examReportCard')) return;
    var c = el('div', { class: 'card ex rp', id: 'examReportCard' });
    c.appendChild(el('h2', { text: 'Exam reports' }));
    c.appendChild(el('p', { class: 'hint', text: 'Participation, results, pass/fail statistics and question analysis. Print or save as PDF, or download for Excel.' }));
    var t = el('select', { id: 'rp_type' }); t.appendChild(el('option', { value: 'exam', text: 'One exam: results and question analysis' })); t.appendChild(el('option', { value: 'overview', text: 'All exams: participation, performance, completion' })); t.onchange = mode;
    c.appendChild(el('label', { class: 'f', text: 'Report' })); c.appendChild(t);
    var eb = el('div', { id: 'rp_examBox' }, [el('label', { class: 'f', text: 'Exam' }), el('select', { id: 'rp_exam' })]);
    var y = new Date().getFullYear();
    var db_ = el('div', { id: 'rp_dateBox', class: 'row' }, [el('div', null, [el('label', { class: 'f', text: 'From' }), el('input', { id: 'rp_from', type: 'date', value: y + '-01-01' })]), el('div', null, [el('label', { class: 'f', text: 'To' }), el('input', { id: 'rp_to', type: 'date', value: y + '-12-31' })])]);
    c.appendChild(eb); c.appendChild(db_);
    c.appendChild(el('div', { style: 'height:10px' }));
    c.appendChild(btn('Build report', function () { if (g('rp_type').value === 'exam') runExam(); else runOverview(); }));
    c.appendChild(el('div', { id: 'rp_msg', class: 'msg' }));
    c.appendChild(el('div', { id: 'rp_actions' }));
    c.appendChild(el('div', { id: 'rp_out' }));
    ref.parentNode.insertBefore(c, ref);
    mode(); loadExams();
  }
  function init() {
    if (busy) return; busy = true;
    db.auth.getSession().then(function (s) {
      var sess = s && s.data && s.data.session;
      if (!sess) { var n = g('examReportCard'); if (n) n.remove(); uid = null; busy = false; return; }
      if (uid === sess.user.id && g('examReportCard')) { busy = false; return; }
      uid = sess.user.id;
      Promise.resolve(db.from('profiles').select('role').eq('id', uid).single()).then(function (r) {
        if (ROLES.indexOf(r.data && r.data.role) < 0) { busy = false; return; }
        build(); busy = false;
      }).catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  db.auth.onAuthStateChange(function () { setTimeout(init, 900); });
  setTimeout(init, 1400);
})();
