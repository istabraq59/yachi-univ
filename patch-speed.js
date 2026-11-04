// Usage: node patch-speed.js   (run inside ~/sms-web). Exact-match edits only; stops if anything is not found.
const fs = require('fs');
let failed = false;
function rd(f) { return fs.readFileSync(f, 'utf8'); }
function once(src, find, repl, label) {
  const i = src.indexOf(find);
  if (i < 0) { console.log('MISSING  ' + label); failed = true; return src; }
  if (src.indexOf(find, i + 1) >= 0) { console.log('MULTIPLE ' + label); failed = true; return src; }
  console.log('ok       ' + label);
  return src.slice(0, i) + repl + src.slice(i + find.length);
}
function between(src, a, b, repl, label) {
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0 || j < i || src.indexOf(a, i + 1) >= 0) { console.log('MISSING  ' + label); failed = true; return src; }
  console.log('ok       ' + label);
  return src.slice(0, i) + repl + src.slice(j);
}
if (!fs.existsSync('core.js')) { console.log('core.js not found - create it first'); process.exit(1); }
const edits = {};
function stage(f, fn) { edits[f] = fn(edits[f] !== undefined ? edits[f] : rd(f)); }

/* ---------- index.html ---------- */
stage('index.html', (h) => {
  h = once(h, '<title>Yachi University</title>',
    '<title>Yachi University</title>\n<link rel="preconnect" href="https://mczhuzxcjrdtfrcswusf.supabase.co" crossorigin>\n<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>', 'preconnect hints');
  h = once(h, '  .hidden { display: none; }\n',
    '  .hidden { display: none; }\n' +
    '  @keyframes yusk { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }\n' +
    '  .sk, .yu-sk b { display: inline-block; height: 1em; min-width: 2.2em; border-radius: 4px; vertical-align: middle; background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size: 200% 100%; animation: yusk 1.2s linear infinite; }\n' +
    '  @media (prefers-reduced-motion: reduce) { .sk, .yu-sk b { animation: none } }\n', 'skeleton CSS');
  h = once(h, '<script src="config.js"></script>', '<script src="config.js"></script>\n<script src="core.js?v=1"></script>', 'core.js tag');
  h = once(h, '<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>\n', '', 'jsQR no longer loaded at start');
  h = between(h, '  async function loadCourseAndSemesterLists() {', '  /* ---------- students ---------- */',
`  async function loadCourseAndSemesterLists() {
    // courses and the academic-year -> semesters chain run at the same time
    const coursesP = db.from('courses').select('id, course_code, title').order('course_code');
    const semestersP = db.from('academic_years').select('id').eq('is_current', true).single().then(async (y) => {
      if (y.error) return { stage: 'Academic year', error: y.error };
      const s = await db.from('semesters').select('id, name').eq('academic_year_id', y.data.id).order('name');
      return { stage: 'Semesters', error: s.error, data: s.data };
    });
    const [c, s] = await Promise.all([coursesP, semestersP]);
    if (c.error) { say('enrollMsg', 'Courses: ' + c.error.message); }
    else {
      const label = (x) => x.course_code + ' \\u2013 ' + x.title;
      fill('e_course', c.data, label);
      fill('r_course', c.data, label);
    }
    if (s.error) { say('enrollMsg', s.stage + ': ' + s.error.message); return; }
    fill('e_semester', s.data, (x) => x.name);
    fill('r_semester', s.data, (x) => x.name);
  }

`, 'parallel course/semester loading');
  h = between(h, '  async function loadStudents() {', '  async function removeStudent(s) {',
`  const STUDENT_COLS = 'id, student_number, full_name, email, year_of_study, phone, address, date_of_birth, unit_id, department_id, admission_number, academic_username';
  const PAGE = 100;
  let shown = 0, choicesLoaded = false;
  const moreBtn = document.createElement('button');
  moreBtn.className = 'secondary hidden';
  moreBtn.textContent = 'Load more students';
  $('rows').closest('.scroll').after(moreBtn);
  moreBtn.onclick = () => loadStudents(true);

  function skeletonRows(n) {
    const body = $('rows');
    body.replaceChildren();
    for (let i = 0; i < n; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < 5; j++) {
        const td = document.createElement('td');
        const sp = document.createElement('span');
        sp.className = 'sk';
        sp.style.width = j === 1 ? '9em' : j === 2 ? '10em' : '4em';
        td.appendChild(sp);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
  }

  // the enroll dropdown needs every student, but only 3 columns, and it is not urgent
  async function loadStudentChoices() {
    if (choicesLoaded) return;
    choicesLoaded = true;
    const r = await db.from('students').select('id, student_number, full_name').order('student_number');
    if (r.error) { choicesLoaded = false; say('enrollMsg', 'Students: ' + r.error.message); return; }
    fill('e_student', r.data, (s) => s.student_number + ' \\u2013 ' + s.full_name);
  }
  const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

  async function loadStudents(more) {
    more = more === true;
    say('listMsg', '');
    const from = more ? shown : 0;
    // the table needs only 5 columns; the full record is fetched when Edit is pressed
    const { data, error } = await db
      .from('students')
      .select('id, student_number, full_name, email, year_of_study')
      .order('student_number')
      .range(from, from + PAGE - 1);
    if (error) { say('listMsg', error.message); $('rows').replaceChildren(); return; }
    const body = $('rows');
    if (!more) { body.replaceChildren(); shown = 0; choicesLoaded = false; idle(loadStudentChoices); }
    for (const s of data) {
      const tr = document.createElement('tr');
      for (const v of [s.student_number, s.full_name, s.email, s.year_of_study]) {
        const td = document.createElement('td');
        td.textContent = v ?? '';
        tr.appendChild(td);
      }
      const act = document.createElement('td');
      const eb = document.createElement('button');
      eb.textContent = 'Edit';
      eb.className = 'secondary';
      eb.onclick = async () => {
        eb.disabled = true;
        const r = await db.from('students').select(STUDENT_COLS).eq('id', s.id).single();
        eb.disabled = false;
        if (r.error) { say('listMsg', r.error.message); return; }
        startEdit(r.data);
      };
      const dbtn = document.createElement('button');
      dbtn.textContent = 'Delete';
      dbtn.className = 'danger';
      dbtn.onclick = () => removeStudent(s);
      act.append(eb, dbtn);
      tr.appendChild(act);
      body.appendChild(tr);
    }
    shown = from + data.length;
    moreBtn.classList.toggle('hidden', data.length < PAGE);
    if (shown === 0) say('listMsg', 'No students visible to this account.');
  }

`, 'students: lean columns, paging, lazy full record');
  h = between(h, '  async function startApp() {', "  $('loginBtn').onclick",
`  async function startApp() {
    skeletonRows(6);
    // independent loads run together instead of one after another
    await Promise.allSettled([loadPrograms(), loadCourseAndSemesterLists(), loadStudents()]);
  }

`, 'parallel startApp with skeleton rows');
  return h;
});

/* ---------- lazy-load jsQR only when the camera starts ---------- */
stage('scanner.js', (s) => once(s,
  "      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })",
  "      if (window.yuLoad && !window.jsQR) yuLoad('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');\n      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })", 'scanner: load jsQR on demand'));

/* ---------- stop 5-times-a-second polling while the tab is hidden ---------- */
for (const f of ['clinicnav.js', 'examnav.js', 'finnav.js', 'sysnav.js'])
  stage(f, (s) => once(s, 'setInterval(ensure, 200);', 'setInterval(function () { if (!document.hidden) ensure(); }, 400);', f + ': calmer polling'));
for (const f of ['examdash.js', 'financehome.js'])
  stage(f, (s) => once(s, 'timer = setInterval(load, 60000);', 'timer = setInterval(function () { if (!document.hidden) load(); }, 60000);', f + ': refresh only when visible'));

/* ---------- home stat cards: show a placeholder instead of popping in ---------- */
stage('shell2.js', (s) => {
  s = once(s, "var d = el('div', { class: 'st ' + cls }); d.style.display = 'none';", "var d = el('div', { class: 'st ' + cls + ' yu-sk' });", 'home cards: placeholder while loading');
  s = once(s, "run(function (c) { if (c !== null && c !== undefined) { n.textContent = String(c); d.style.display = ''; } });",
    "run(function (c) { d.classList.remove('yu-sk'); if (c !== null && c !== undefined) { n.textContent = String(c); d.style.display = ''; } else { d.style.display = 'none'; } });", 'home cards: fill or hide when loaded');
  return s;
});

/* ---------- sign-in should not wait 25 s for the captcha ---------- */
stage('turnstile.js', (s) => once(s, '}, 25000);', '}, 10000);', 'turnstile: 10 s wait limit'));


/* ---------- make browsers fetch the changed files again ---------- */
stage('index.html', (h) => {
  const stamp = Date.now();
  for (const f of ['scanner', 'clinicnav', 'examnav', 'finnav', 'sysnav', 'examdash', 'financehome', 'shell2', 'turnstile']) {
    const re = new RegExp('src="' + f + '\\.js(\\?v=[0-9]+)?"');
    if (!re.test(h)) { console.log('MISSING  version tag for ' + f); failed = true; continue; }
    h = h.replace(re, 'src="' + f + '.js?v=' + stamp + '"');
  }
  console.log('ok       version tags bumped');
  return h;
});

if (failed) { console.log('\nSTOPPED: nothing was changed. Send me this output.'); process.exit(1); }
for (const f in edits) fs.writeFileSync(f, edits[f]);
console.log('\nAll edits written and version tags updated. Now commit and push.');
