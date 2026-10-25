(function () {
  const g = (id) => document.getElementById(id);

  const style = document.createElement('style');
  style.textContent =
    'body:not([data-role="administrator"]) #pendingCard { display: none; }' +
    '#waitNote { background: #fff7ed; border: 1px solid #fdba74; }' +
    '#signupForm { margin-top: 12px; }';
  document.head.appendChild(style);

  /* ---- sign-up form inside the sign-in box ---- */
  const loginBox = g('loginBox');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'secondary';
  toggle.textContent = 'Create an account';
  const form = document.createElement('form');
  form.id = 'signupForm';
  form.className = 'hidden';
  form.innerHTML =
    '<h2>Create an account</h2>' +
    '<input id="su_name" placeholder="Full name" required autocomplete="name">' +
    '<input id="su_email" type="email" placeholder="Email" required autocomplete="email">' +
    '<input id="su_pass" type="password" minlength="8" placeholder="Password (at least 8 characters)" required autocomplete="new-password">' +
    '<input id="su_pass2" type="password" minlength="8" placeholder="Repeat password" required autocomplete="new-password">' +
    '<button type="submit">Create account</button>' +
    '<div id="su_msg" class="msg"></div>';
  loginBox.append(toggle, form);
  toggle.onclick = () => form.classList.toggle('hidden');

  form.onsubmit = async (e) => {
    e.preventDefault();
    say('su_msg', '');
    if (g('su_pass').value !== g('su_pass2').value) { say('su_msg', 'Passwords do not match.'); return; }
    const options = { data: { full_name: g('su_name').value.trim() } };
    if (location.hostname.endsWith('github.io')) options.emailRedirectTo = location.origin + location.pathname;
    const { error } = await db.auth.signUp({
      email: g('su_email').value.trim(),
      password: g('su_pass').value,
      options: options
    });
    g('su_pass').value = '';
    g('su_pass2').value = '';
    if (error) { say('su_msg', error.message); return; }
    say('su_msg', 'Almost done: open your email and click the confirmation link. After that, the school office will approve your account.', true);
  };

  /* ---- pending accounts (administrator) and waiting notice (new users) ---- */
  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div id="pendingCard" class="card"><h2>Pending accounts</h2>' +
    '<button id="pendingBtn" type="button">Refresh pending accounts</button>' +
    '<div id="pendingMsg" class="msg"></div><div id="pendingList"></div></div>' +
    '<div id="waitNote" class="card hidden"><strong>Your account is waiting for approval.</strong><br>' +
    'The school office will link it to your student record. Please check back later.</div>';
  const app = g('appBox');
  app.insertBefore(wrap, app.children[1] || null);

  async function loadPending() {
    say('pendingMsg', '');
    const list = g('pendingList');
    list.replaceChildren();
    const pa = await db.rpc('pending_accounts');
    if (pa.error) { say('pendingMsg', pa.error.message); return; }
    const st = await db.from('students')
      .select('id, student_number, full_name, email')
      .is('profile_id', null)
      .order('student_number');
    if (st.error) { say('pendingMsg', st.error.message); return; }
    if (pa.data.length === 0) { say('pendingMsg', 'No pending accounts.', true); return; }
    for (const acc of pa.data) {
      const box = document.createElement('div');
      box.style.cssText = 'border-top:1px solid #e2e8f0; padding:10px 0';
      const info = document.createElement('div');
      info.textContent = (acc.full_name || '(no name)') + ' – ' + acc.email;
      const sel = document.createElement('select');
      sel.appendChild(new Option('Choose a student record…', ''));
      for (const s of st.data) {
        const o = new Option(s.student_number + ' – ' + s.full_name + ' – ' + (s.email || ''), s.id);
        if (s.email && s.email.toLowerCase() === String(acc.email).toLowerCase()) o.selected = true;
        sel.appendChild(o);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Link to this student';
      btn.onclick = async () => {
        if (!sel.value) { say('pendingMsg', 'Choose a student record first.'); return; }
        const label = sel.options[sel.selectedIndex].text;
        if (!window.confirm('Link ' + acc.email + ' to ' + label + '?')) return;
        const r = await db.from('students')
          .update({ profile_id: acc.id })
          .eq('id', sel.value)
          .is('profile_id', null)
          .select();
        if (r.error) { say('pendingMsg', r.error.message); return; }
        if (!r.data || r.data.length === 0) { say('pendingMsg', 'Not linked: that record is already linked, or you lack permission.'); return; }
        say('pendingMsg', 'Linked.', true);
        loadPending();
      };
      box.append(info, sel, btn);
      list.appendChild(box);
    }
  }
  g('pendingBtn').onclick = loadPending;

  async function afterSignIn(user) {
    g('waitNote').classList.add('hidden');
    const r = await db.from('profiles').select('role').eq('id', user.id).single();
    if (r.error || !r.data) return;
    if (r.data.role === 'administrator') { loadPending(); return; }
    if (r.data.role === 'student') {
      const s = await db.from('students').select('id', { count: 'exact', head: true });
      if (!s.error && s.count === 0) g('waitNote').classList.remove('hidden');
    }
  }

  let seen = null;
  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (session && session.user.id !== seen) { seen = session.user.id; afterSignIn(session.user); }
      else if (!session) {
        seen = null;
        g('pendingList').replaceChildren();
        say('pendingMsg', '');
        g('waitNote').classList.add('hidden');
      }
    }, 0);
  });
})();