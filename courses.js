(function () {
  const g = (id) => document.getElementById(id);

  const style = document.createElement('style');
  style.textContent =
    'body:not([data-role="administrator"]) #coursesCard,' +
    'body:not([data-role="administrator"]) #courseListCard,' +
    'body:not([data-role="administrator"]) #yearsCard { display: none; }';
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<form id="coursesCard" class="card"><h2 id="cf_title">Add course</h2>' +
    '<input id="cf_code" placeholder="Course code (e.g. CS301)" required>' +
    '<input id="cf_name" placeholder="Course title" required>' +
    '<input id="cf_credits" type="number" step="0.5" min="0.5" placeholder="Credits" required>' +
    '<select id="cf_dept" required></select>' +
    '<input id="cf_desc" placeholder="Description (optional)">' +
    '<button type="submit" id="cf_save">Add course</button>' +
    '<button type="button" id="cf_cancel" class="secondary hidden">Cancel edit</button>' +
    '<div id="cf_msg" class="msg"></div></form>' +
    '<div id="courseListCard" class="card"><h2>Courses</h2>' +
    '<button id="cl_refresh" type="button">Refresh courses</button>' +
    '<div id="cl_msg" class="msg"></div><div id="cl_list"></div></div>' +
    '<div id="yearsCard" class="card"><h2>Academic years and semesters</h2>' +
    '<button id="ay_refresh" type="button">Refresh</button>' +
    '<div id="ay_msg" class="msg"></div><div id="ay_list"></div>' +
    '<h2 style="margin-top:16px">Add academic year</h2>' +
    '<input id="ay_name" placeholder="Name (e.g. 2027-2028)">' +
    '<label>Starts on</label><input id="ay_start" type="date">' +
    '<label>Ends on</label><input id="ay_end" type="date">' +
    '<button id="ay_add" type="button">Add year</button>' +
    '<h2 style="margin-top:16px">Add semester</h2>' +
    '<select id="sm_year"></select>' +
    '<input id="sm_name" placeholder="Semester name (e.g. Semester 1)">' +
    '<label>Starts on</label><input id="sm_start" type="date">' +
    '<label>Ends on</label><input id="sm_end" type="date">' +
    '<button id="sm_add" type="button">Add semester</button>' +
    '<div id="sm_msg" class="msg"></div></div>';
  g('appBox').appendChild(wrap);

  let editing = null;

  /* ---------- courses ---------- */
  async function loadDepartments() {
    const { data, error } = await db.from('departments').select('id, code, name').order('code');
    if (error) { say('cf_msg', error.message); return; }
    fill('cf_dept', data, (d) => d.code + ' – ' + d.name);
  }

  function resetCourseForm() {
    editing = null;
    g('coursesCard').reset();
    g('cf_title').textContent = 'Add course';
    g('cf_save').textContent = 'Add course';
    g('cf_cancel').classList.add('hidden');
  }

  function startEdit(c) {
    editing = c.id;
    g('cf_title').textContent = 'Edit ' + c.course_code;
    g('cf_save').textContent = 'Save changes';
    g('cf_cancel').classList.remove('hidden');
    g('cf_code').value = c.course_code;
    g('cf_name').value = c.title;
    g('cf_credits').value = c.credits;
    g('cf_dept').value = c.department_id;
    g('cf_desc').value = c.description || '';
    say('cf_msg', '');
    g('coursesCard').scrollIntoView();
  }

  async function loadCourses() {
    say('cl_msg', '');
    const list = g('cl_list');
    list.replaceChildren();
    const { data, error } = await db.from('courses')
      .select('id, course_code, title, credits, description, department_id, departments(code)')
      .order('course_code');
    if (error) { say('cl_msg', error.message); return; }
    for (const c of data) {
      const box = document.createElement('div');
      box.style.cssText = 'border-top:1px solid #e2e8f0; padding:10px 0';
      const info = document.createElement('div');
      info.textContent = c.course_code + ' – ' + c.title + ' – ' + c.credits + ' credits – ' +
        (c.departments ? c.departments.code : '');
      const eb = document.createElement('button');
      eb.type = 'button';
      eb.className = 'secondary';
      eb.textContent = 'Edit';
      eb.style.cssText = 'width:auto; padding:6px 12px; margin-right:6px';
      eb.onclick = () => startEdit(c);
      const db2 = document.createElement('button');
      db2.type = 'button';
      db2.className = 'danger';
      db2.textContent = 'Delete';
      db2.style.cssText = 'width:auto; padding:6px 12px';
      db2.onclick = async () => {
        if (!window.confirm('Delete course ' + c.course_code + ' (' + c.title + ')?')) return;
        const r = await db.from('courses').delete().eq('id', c.id).select();
        if (r.error) {
          say('cl_msg', 'Could not delete: ' + r.error.message + ' (a course in use by enrollments or teachers cannot be deleted).');
          return;
        }
        if (!r.data || r.data.length === 0) { say('cl_msg', 'Not deleted: you do not have permission.'); return; }
        say('cl_msg', 'Deleted ' + c.course_code, true);
        loadCourses();
      };
      box.append(info, eb, db2);
      list.appendChild(box);
    }
    if (data.length === 0) say('cl_msg', 'No courses yet.', true);
  }

  g('coursesCard').onsubmit = async (e) => {
    e.preventDefault();
    say('cf_msg', '');
    const payload = {
      course_code: g('cf_code').value.trim(),
      title: g('cf_name').value.trim(),
      credits: Number(g('cf_credits').value),
      department_id: g('cf_dept').value,
      description: g('cf_desc').value.trim() || null
    };
    if (!(payload.credits > 0)) { say('cf_msg', 'Credits must be more than 0.'); return; }
    const q = editing
      ? db.from('courses').update(payload).eq('id', editing).select()
      : db.from('courses').insert(payload).select();
    const { data, error } = await q;
    if (error) { say('cf_msg', error.message); return; }
    if (!data || data.length === 0) { say('cf_msg', 'Not saved: you do not have permission.'); return; }
    say('cf_msg', editing ? 'Saved.' : 'Added ' + payload.course_code, true);
    resetCourseForm();
    loadCourses();
  };

  g('cf_cancel').onclick = () => { resetCourseForm(); say('cf_msg', ''); };
  g('cl_refresh').onclick = loadCourses;

  /* ---------- academic years and semesters ---------- */
  async function loadYears() {
    say('ay_msg', '');
    const list = g('ay_list');
    list.replaceChildren();
    const { data, error } = await db.from('academic_years')
      .select('id, name, starts_on, ends_on, is_current, semesters(id, name, starts_on, ends_on)')
      .order('starts_on', { ascending: false });
    if (error) { say('ay_msg', error.message); return; }
    fill('sm_year', data, (y) => y.name);
    for (const y of data) {
      const box = document.createElement('div');
      box.style.cssText = 'border-top:1px solid #e2e8f0; padding:10px 0';
      const info = document.createElement('div');
      info.textContent = y.name + ' (' + y.starts_on + ' to ' + y.ends_on + ')' + (y.is_current ? ' – CURRENT' : '');
      info.style.fontWeight = y.is_current ? 'bold' : 'normal';
      box.appendChild(info);
      const sems = (y.semesters || []).slice().sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on)));
      if (sems.length === 0) {
        const none = document.createElement('div');
        none.textContent = 'No semesters yet.';
        box.appendChild(none);
      }
      for (const s of sems) {
        const row = document.createElement('div');
        row.textContent = '• ' + s.name + ' (' + s.starts_on + ' to ' + s.ends_on + ')';
        box.appendChild(row);
      }
      if (!y.is_current) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'secondary';
        btn.textContent = 'Make current';
        btn.style.cssText = 'width:auto; padding:6px 12px; margin-top:6px';
        btn.onclick = async () => {
          if (!window.confirm('Make ' + y.name + ' the current academic year? Enrollment and grade screens will use its semesters.')) return;
          const r = await db.rpc('set_current_academic_year', { p_year: y.id });
          if (r.error) { say('ay_msg', r.error.message); return; }
          say('ay_msg', y.name + ' is now the current academic year. Reload the page to refresh the other screens.', true);
          loadYears();
        };
        box.appendChild(btn);
      }
      list.appendChild(box);
    }
    if (data.length === 0) say('ay_msg', 'No academic years yet.', true);
  }

  g('ay_add').onclick = async () => {
    say('ay_msg', '');
    const name = g('ay_name').value.trim();
    const s = g('ay_start').value, e = g('ay_end').value;
    if (!name || !s || !e) { say('ay_msg', 'Enter a name and both dates.'); return; }
    if (e <= s) { say('ay_msg', 'The end date must be after the start date.'); return; }
    const { data, error } = await db.from('academic_years').insert({ name: name, starts_on: s, ends_on: e }).select();
    if (error) { say('ay_msg', error.message); return; }
    if (!data || data.length === 0) { say('ay_msg', 'Not added: you do not have permission.'); return; }
    say('ay_msg', 'Added ' + name, true);
    g('ay_name').value = ''; g('ay_start').value = ''; g('ay_end').value = '';
    loadYears();
  };

  g('sm_add').onclick = async () => {
    say('sm_msg', '');
    const year = g('sm_year').value;
    const name = g('sm_name').value.trim();
    const s = g('sm_start').value, e = g('sm_end').value;
    if (!year || !name || !s || !e) { say('sm_msg', 'Choose a year, enter a name and both dates.'); return; }
    if (e <= s) { say('sm_msg', 'The end date must be after the start date.'); return; }
    const { data, error } = await db.from('semesters')
      .insert({ academic_year_id: year, name: name, starts_on: s, ends_on: e }).select();
    if (error) { say('sm_msg', error.message); return; }
    if (!data || data.length === 0) { say('sm_msg', 'Not added: you do not have permission.'); return; }
    say('sm_msg', 'Added ' + name, true);
    g('sm_name').value = ''; g('sm_start').value = ''; g('sm_end').value = '';
    loadYears();
  };

  g('ay_refresh').onclick = loadYears;

  /* ---------- start / stop ---------- */
  async function start(user) {
    const r = await db.from('profiles').select('role').eq('id', user.id).single();
    if (r.error || !r.data || r.data.role !== 'administrator') return;
    await loadDepartments();
    loadCourses();
    loadYears();
  }

  let seen = null;
  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (session && session.user.id !== seen) { seen = session.user.id; start(session.user); }
      else if (!session) {
        seen = null;
        g('cl_list').replaceChildren();
        g('ay_list').replaceChildren();
        resetCourseForm();
        for (const id of ['cf_msg', 'cl_msg', 'ay_msg', 'sm_msg']) say(id, '');
      }
    }, 0);
  });
})();