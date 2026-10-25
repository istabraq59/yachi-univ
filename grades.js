(function () {
  const app = document.getElementById('appBox');
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <form id="gradeForm" class="card">
      <h2>Enter a grade</h2>
      <select id="g_enroll" required></select>
      <input id="g_name" placeholder="Assessment name (e.g. Midterm)" required>
      <input id="g_score" type="number" step="any" min="0" placeholder="Score" required>
      <input id="g_max" type="number" step="any" min="1" placeholder="Out of (max score)" required>
      <label><input id="g_final" type="checkbox" style="width:auto"> This is the final grade</label>
      <button type="submit">Save grade</button>
      <div id="gradeMsg" class="msg"></div>
    </form>
    <div class="card">
      <h2>Grades for the selected enrollment</h2>
      <div class="scroll"><table>
        <thead><tr><th>Assessment</th><th>Score</th><th>Final</th></tr></thead>
        <tbody id="gradeRows"></tbody>
      </table></div>
    </div>
    <div class="card">
      <h2>Transcript</h2>
      <select id="t_student"></select>
      <button id="transcriptBtn" type="button">Show transcript</button>
      <div id="transcriptMsg" class="msg"></div>
      <div class="scroll"><table>
        <thead><tr><th>Course</th><th>Semester</th><th>Final %</th><th>Grade</th></tr></thead>
        <tbody id="transcriptRows"></tbody>
      </table></div>
      <p id="gpaLine"><strong></strong></p>
    </div>`;
  app.appendChild(wrap);

  const gid = (id) => document.getElementById(id);
  let loadedFor = null;

  function addRow(tbody, cells) {
    const tr = document.createElement('tr');
    for (const v of cells) {
      const td = document.createElement('td');
      td.textContent = v ?? '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  async function loadEnrollments() {
    const { data, error } = await db
      .from('enrollments')
      .select('id, students(student_number, full_name), courses(course_code), semesters(name)');
    if (error) { say('gradeMsg', error.message); return; }
    data.sort((a, b) =>
      ((a.students?.student_number || '') + (a.courses?.course_code || ''))
        .localeCompare((b.students?.student_number || '') + (b.courses?.course_code || '')));
    fill('g_enroll', data, (e) =>
      (e.students?.student_number || '?') + ' – ' + (e.courses?.course_code || '?') + ' – ' + (e.semesters?.name || '?'));
    loadGradeRows();
  }

  async function loadGradeRows() {
    const body = gid('gradeRows');
    body.replaceChildren();
    const id = gid('g_enroll').value;
    if (!id) return;
    const { data, error } = await db
      .from('grades')
      .select('assessment_name, score, max_score, is_final')
      .eq('enrollment_id', id)
      .order('assessment_name');
    if (error) { say('gradeMsg', error.message); return; }
    for (const g of data) addRow(body, [g.assessment_name, g.score + ' / ' + g.max_score, g.is_final ? 'Yes' : '']);
    if (data.length === 0) addRow(body, ['No grades yet', '', '']);
  }

  async function loadStudentsForTranscript() {
    const { data, error } = await db.from('students').select('id, student_number, full_name').order('student_number');
    if (error) { say('transcriptMsg', error.message); return; }
    fill('t_student', data, (s) => s.student_number + ' – ' + s.full_name);
  }

  async function showTranscript() {
    say('transcriptMsg', '');
    gid('transcriptRows').replaceChildren();
    gid('gpaLine').firstChild.textContent = '';
    const studentId = gid('t_student').value;
    if (!studentId) return;
    const sc = await db.from('grading_scale')
      .select('letter_grade, minimum_percentage, grade_points')
      .order('minimum_percentage', { ascending: false });
    if (sc.error) { say('transcriptMsg', sc.error.message); return; }
    const scale = sc.data;
    const en = await db.from('enrollments')
      .select('courses(course_code, title, credits), semesters(name), grades(assessment_name, score, max_score, is_final)')
      .eq('student_id', studentId);
    if (en.error) { say('transcriptMsg', en.error.message); return; }
    const toGrade = (pct) => scale.find((g) => pct >= Number(g.minimum_percentage)) || scale[scale.length - 1];
    let points = 0, credits = 0;
    const body = gid('transcriptRows');
    for (const e of en.data) {
      const fin = (e.grades || []).find((g) => g.is_final);
      const name = (e.courses?.course_code || '?') + ' ' + (e.courses?.title || '');
      if (!fin || !scale.length) { addRow(body, [name, e.semesters?.name, '—', 'In progress']); continue; }
      const pct = (Number(fin.score) / Number(fin.max_score)) * 100;
      const g = toGrade(pct);
      const cr = Number(e.courses?.credits || 0);
      points += Number(g.grade_points) * cr;
      credits += cr;
      addRow(body, [name, e.semesters?.name, pct.toFixed(1) + '%', g.letter_grade]);
    }
    if (en.data.length === 0) say('transcriptMsg', 'No enrollments visible.');
    gid('gpaLine').firstChild.textContent = credits > 0 ? 'GPA: ' + (points / credits).toFixed(2) : 'GPA: not available yet';
  }

  gid('gradeForm').onsubmit = async (ev) => {
    ev.preventDefault();
    say('gradeMsg', '');
    const score = Number(gid('g_score').value);
    const max = Number(gid('g_max').value);
    if (!(max > 0) || score < 0 || score > max) { say('gradeMsg', 'Score must be between 0 and the max score.'); return; }
    const { data, error } = await db.from('grades').upsert({
      enrollment_id: gid('g_enroll').value,
      assessment_name: gid('g_name').value.trim(),
      score: score,
      max_score: max,
      is_final: gid('g_final').checked
    }, { onConflict: 'enrollment_id,assessment_name' }).select();
    if (error) { say('gradeMsg', error.message); return; }
    if (!data || data.length === 0) { say('gradeMsg', 'Not saved: you do not have permission.'); return; }
    say('gradeMsg', 'Saved.', true);
    gid('g_name').value = '';
    gid('g_score').value = '';
    gid('g_max').value = '';
    gid('g_final').checked = false;
    loadGradeRows();
  };

  gid('g_enroll').onchange = loadGradeRows;
  gid('transcriptBtn').onclick = showTranscript;

  function clearAll() {
    for (const id of ['gradeRows', 'transcriptRows']) gid(id).replaceChildren();
    for (const id of ['g_enroll', 't_student']) gid(id).replaceChildren();
    for (const id of ['gradeMsg', 'transcriptMsg']) say(id, '');
    gid('gpaLine').firstChild.textContent = '';
  }

  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (session && session.user.id !== loadedFor) {
        loadedFor = session.user.id;
        loadEnrollments();
        loadStudentsForTranscript();
      } else if (!session) {
        loadedFor = null;
        clearAll();
      }
    }, 0);
  });
})();