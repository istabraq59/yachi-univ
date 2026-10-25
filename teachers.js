(function () {
  const g = (id) => document.getElementById(id);

  const style = document.createElement('style');
  style.textContent =
    'body:not([data-role="administrator"]) #teachersCard,' +
    'body:not([data-role="administrator"]) #makeTeacherCard { display: none; }';
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div id="makeTeacherCard" class="card"><h2>Approve a teacher</h2>' +
    '<p>New sign-ups waiting for approval. Use "Make teacher" for staff. Students are linked in the Pending accounts card.</p>' +
    '<button id="mt_refresh" type="button">Refresh</button>' +
    '<div id="mt_msg" class="msg"></div><div id="mt_list"></div></div>' +
    '<div id="teachersCard" class="card"><h2>Teachers</h2>' +
    '<button id="tc_refresh" type="button">Refresh teachers</button>' +
    '<div id="tc_msg" class="msg"></div><div id="tc_list"></div>' +
    '<h2 style="margin-top:16px">Assign a course</h2>' +
    '<select id="as_teacher"></select><select id="as_course"></select><select id="as_semester"></select>' +
    '<button id="as_btn" type="button">Assign</button><div id="as_msg" class="msg"></div></div>';
  g('appBox').appendChild(wrap);

  let departments = [];

  async function loadLookups() {
    const d = await db.from('departments').select('id, code').order('code');
    if (!d.error) departments = d.data;
    const c = await db.from('courses').select('id, course_code, title').order('course_code');
    if (!c.error) fill('as_course', c.data, (x) => x.course_code + ' – ' + x.title);
    const y = await db.from('academic_years').select('id').eq('is_current', true).single();
    if (y.error) return;
    const s = await db.from('semesters').select('id, name').eq('academic_year_id', y.data.id).order('name');
    if (!s.error) fill('as_semester', s.data, (x) => x.name);
  }

  async function loadTeachers() {
    say('tc_msg', '');
    const list = g('tc_list');
    list.replaceChildren();
    const { data, error } = await db.from('teachers')
      .select('id, teacher_number, full_name, email, title, departments(code), course_assignments(id, courses(course_code), semesters(name))')
      .order('teacher_number');
    if (error) { say('tc_msg', error.message); return; }
    fill('as_teacher', data, (t) => (t.teacher_number || '?') + ' – ' + t.full_name);
    if (data.length === 0) { say('tc_msg', 'No teachers yet.', true); return; }
    for (const t of data) {
      const box = document.createElement('div');
      box.style.cssText = 'border-top:1px solid #e2e8f0; padding:10px 0';
      const info = document.createElement('div');
      info.textContent = (t.teacher_number || '?') + ' – ' + t.full_name +
        (t.title ? ' (' + t.title + ')' : '') + ' – ' + t.email +
        (t.departments ? ' – ' + t.departments.code : '');
      box.appendChild(info);
      const asg = t.course_assignments || [];
      if (asg.length === 0) {
        const none = document.createElement('div');
        none.textContent = 'No courses assigned.';
        box.appendChild(none);
      }
      for (const a of asg) {
        const row = document.createElement('div');
        const label = (a.courses ? a.courses.course_code : '?') + ' – ' + (a.semesters ? a.semesters.name : '?');
        const span = document.createElement('span');
        span.textContent = label + ' ';
        const rb = document.createElement('button');
        rb.type = 'button';
        rb.className = 'danger';
        rb.textContent = 'Remove';
        rb.style.cssText = 'width:auto; padding:4px 10px; margin-left:8px';
        rb.onclick = async () => {
          if (!window.confirm('Remove ' + t.full_name + ' from ' + label + '?')) return;
          const r = await db.from('course_assignments').delete().eq('id', a.id).select();
          if (r.error) { say('tc_msg', r.error.message); return; }
          if (!r.data || r.data.length === 0) { say('tc_msg', 'Not removed: you do not have permission.'); return; }
          say('tc_msg', 'Assignment removed.', true);
          loadTeachers();
        };
        row.append(span, rb);
        box.appendChild(row);
      }
      list.appendChild(box);
    }
  }

  g('as_btn').onclick = async () => {
    say('as_msg', '');
    const teacher = g('as_teacher').value, course = g('as_course').value, semester = g('as_semester').value;
    if (!teacher || !course || !semester) { say('as_msg', 'Choose a teacher, course and semester.'); return; }
    const { data, error } = await db.from('course_assignments')
      .insert({ teacher_id: teacher, course_id: course, semester_id: semester }).select();
    if (error) { say('as_msg', error.message); return; }
    if (!data || data.length === 0) { say('as_msg', 'Not assigned: you do not have permission.'); return; }
    say('as_msg', 'Assigned.', true);
    loadTeachers();
  };

  async function loadPendingTeachers() {
    say('mt_msg', '');
    const list = g('mt_list');
    list.replaceChildren();
    const pa = await db.rpc('pending_accounts');
    if (pa.error) { say('mt_msg', pa.error.message); return; }
    if (pa.data.length === 0) { say('mt_msg', 'No pending accounts.', true); return; }
    for (const acc of pa.data) {
      const box = document.createElement('div');
      box.style.cssText = 'border-top:1px solid #e2e8f0; padding:10px 0';
      const info = document.createElement('div');
      info.textContent = (acc.full_name || '(no name)') + ' – ' + acc.email;
      const dept = document.createElement('select');
      for (const d of departments) dept.appendChild(new Option(d.code, d.id));
      const title = document.createElement('input');
      title.placeholder = 'Title (optional, e.g. Lecturer)';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Make teacher';
      btn.onclick = async () => {
        if (!dept.value) { say('mt_msg', 'Choose a department.'); return; }
        if (!window.confirm('Make ' + acc.email + ' a teacher?')) return;
        const r = await db.rpc('make_teacher', { p_profile: acc.id, p_department: dept.value, p_title: title.value });
        if (r.error) { say('mt_msg', r.error.message); return; }
        say('mt_msg', 'Done. Teacher number ' + r.data + '.', true);
        loadPendingTeachers();
        loadTeachers();
      };
      box.append(info, dept, title, btn);
      list.appendChild(box);
    }
  }

  g('mt_refresh').onclick = loadPendingTeachers;
  g('tc_refresh').onclick = loadTeachers;

  async function start(user) {
    const r = await db.from('profiles').select('role').eq('id', user.id).single();
    if (r.error || !r.data || r.data.role !== 'administrator') return;
    await loadLookups();
    loadTeachers();
    loadPendingTeachers();
  }

  let seen = null;
  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (session && session.user.id !== seen) { seen = session.user.id; start(session.user); }
      else if (!session) {
        seen = null;
        g('tc_list').replaceChildren();
        g('mt_list').replaceChildren();
        for (const id of ['tc_msg', 'mt_msg', 'as_msg']) say(id, '');
      }
    }, 0);
  });
})();