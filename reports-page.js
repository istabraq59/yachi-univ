(function () {
  const g = (id) => document.getElementById(id);

  const style = document.createElement('style');
  style.textContent =
    'body:not([data-role="administrator"]) #reportsCard { display: none; }' +
    '@media (max-width: 600px) { #repRows td::before { content: attr(data-label) ":"; } }';
  document.head.appendChild(style);

  const card = document.createElement('div');
  card.id = 'reportsCard';
  card.className = 'card';
  card.innerHTML =
    '<h2>Reports</h2>' +
    '<select id="rep_type">' +
    '<option value="students">Students</option>' +
    '<option value="enrollments">Enrollments</option>' +
    '<option value="performance">Performance</option></select>' +
    '<div id="rep_filters"><select id="rep_dept"></select>' +
    '<input id="rep_year" type="number" min="1" max="8" placeholder="Year of study (optional)"></div>' +
    '<button id="rep_show" type="button">Show report</button>' +
    '<button id="rep_csv" type="button" class="secondary" disabled>Download CSV</button>' +
    '<div id="rep_msg" class="msg"></div>' +
    '<div class="scroll"><table><thead id="rep_head"></thead><tbody id="repRows"></tbody></table></div>';
  g('appBox').appendChild(card);

  let current = null;

  async function fetchAll(build) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await build(from, from + 999);
      if (error) throw new Error(error.message);
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  }

  function cell(v) {
    let s = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function render(rep) {
    const head = g('rep_head');
    head.replaceChildren();
    const hr = document.createElement('tr');
    for (const h of rep.headers) {
      const th = document.createElement('th');
      th.textContent = h;
      hr.appendChild(th);
    }
    head.appendChild(hr);
    const body = g('repRows');
    body.replaceChildren();
    const shown = rep.rows.slice(0, 500);
    for (const r of shown) {
      const tr = document.createElement('tr');
      r.forEach((v, i) => {
        const td = document.createElement('td');
        td.textContent = v === null || v === undefined ? '' : v;
        td.setAttribute('data-label', rep.headers[i]);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    }
    say('rep_msg', rep.rows.length + ' row(s)' +
      (rep.rows.length > 500 ? ' – showing the first 500; the CSV has all of them.' : '.'), true);
  }

  async function buildStudents() {
    const dept = g('rep_dept').value;
    const year = g('rep_year').value;
    const data = await fetchAll((a, b) => {
      let q = db.from('students')
        .select('student_number, full_name, email, year_of_study, departments(code), programs(code)');
      if (dept) q = q.eq('department_id', dept);
      if (year) q = q.eq('year_of_study', Number(year));
      return q.order('student_number').range(a, b);
    });
    return {
      name: 'students',
      headers: ['Student number', 'Name', 'Email', 'Year', 'Department', 'Program'],
      rows: data.map((r) => [r.student_number, r.full_name, r.email, r.year_of_study,
        r.departments ? r.departments.code : '', r.programs ? r.programs.code : ''])
    };
  }

  async function buildEnrollments() {
    const data = await fetchAll((a, b) => db.from('enrollments')
      .select('status, courses(course_code, title), semesters(name)')
      .order('id').range(a, b));
    const map = new Map();
    for (const e of data) {
      const key = JSON.stringify([e.courses ? e.courses.course_code : '', e.courses ? e.courses.title : '',
        e.semesters ? e.semesters.name : '', e.status || '']);
      map.set(key, (map.get(key) || 0) + 1);
    }
    const rows = [...map.entries()].map(([k, n]) => [...JSON.parse(k), n]);
    rows.sort((x, y) => String(x[0] + x[2] + x[3]).localeCompare(String(y[0] + y[2] + y[3])));
    return { name: 'enrollments', headers: ['Course', 'Title', 'Semester', 'Status', 'Students'], rows: rows };
  }

  async function buildPerformance() {
    const sc = await db.from('grading_scale')
      .select('letter_grade, minimum_percentage')
      .order('minimum_percentage', { ascending: false });
    if (sc.error) throw new Error(sc.error.message);
    const scale = sc.data;
    const data = await fetchAll((a, b) => db.from('enrollments')
      .select('courses(course_code, title), semesters(name), grades(score, max_score, is_final)')
      .order('id').range(a, b));
    const groups = new Map();
    for (const e of data) {
      const key = JSON.stringify([e.courses ? e.courses.course_code : '', e.courses ? e.courses.title : '',
        e.semesters ? e.semesters.name : '']);
      if (!groups.has(key)) groups.set(key, { enrolled: 0, pcts: [] });
      const grp = groups.get(key);
      grp.enrolled += 1;
      const fin = (e.grades || []).find((x) => x.is_final);
      if (fin && Number(fin.max_score) > 0) grp.pcts.push((Number(fin.score) / Number(fin.max_score)) * 100);
    }
    const rows = [];
    for (const [k, grp] of groups) {
      const [code, title, sem] = JSON.parse(k);
      if (grp.pcts.length === 0) { rows.push([code, title, sem, grp.enrolled, 0, '', '', '', '']); continue; }
      const avg = grp.pcts.reduce((s, x) => s + x, 0) / grp.pcts.length;
      const letter = (scale.find((x) => avg >= Number(x.minimum_percentage)) || scale[scale.length - 1] || {}).letter_grade || '';
      rows.push([code, title, sem, grp.enrolled, grp.pcts.length, avg.toFixed(1),
        Math.max(...grp.pcts).toFixed(1), Math.min(...grp.pcts).toFixed(1), letter]);
    }
    rows.sort((x, y) => String(x[0] + x[2]).localeCompare(String(y[0] + y[2])));
    return {
      name: 'performance',
      headers: ['Course', 'Title', 'Semester', 'Enrolled', 'Graded', 'Average %', 'Highest %', 'Lowest %', 'Average grade'],
      rows: rows
    };
  }

  g('rep_type').onchange = () => {
    g('rep_filters').classList.toggle('hidden', g('rep_type').value !== 'students');
    g('rep_head').replaceChildren();
    g('repRows').replaceChildren();
    g('rep_csv').disabled = true;
    current = null;
    say('rep_msg', '');
  };

  g('rep_show').onclick = async () => {
    say('rep_msg', 'Loading…');
    g('rep_csv').disabled = true;
    try {
      const t = g('rep_type').value;
      current = t === 'students' ? await buildStudents()
        : t === 'enrollments' ? await buildEnrollments()
        : await buildPerformance();
      render(current);
      g('rep_csv').disabled = false;
    } catch (err) {
      current = null;
      say('rep_msg', err.message);
    }
  };

  g('rep_csv').onclick = () => {
    if (!current) return;
    const lines = [current.headers, ...current.rows].map((r) => r.map(cell).join(','));
    const text = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = current.name + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  async function loadDepartments() {
    const { data, error } = await db.from('departments').select('id, code').order('code');
    if (error) return;
    const sel = g('rep_dept');
    sel.replaceChildren(new Option('All departments', ''));
    for (const d of data) sel.appendChild(new Option(d.code, d.id));
  }

  let seen = null;
  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (session && session.user.id !== seen) { seen = session.user.id; loadDepartments(); }
      else if (!session) {
        seen = null;
        current = null;
        g('rep_head').replaceChildren();
        g('repRows').replaceChildren();
        g('rep_csv').disabled = true;
        say('rep_msg', '');
      }
    }, 0);
  });
})();