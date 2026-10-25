(function () {
  const css = `
    /* hide admin-only controls unless the signed-in user is an administrator */
    body:not([data-role="administrator"]) #studentForm,
    body:not([data-role="administrator"]) #enrollForm,
    body:not([data-role="administrator"]) #rows td:last-child,
    body:not([data-role="administrator"]) #rosterRows td:last-child,
    body:not([data-role="administrator"]) .card:has(#rows) thead th:last-child,
    body:not([data-role="administrator"]) .card:has(#rosterRows) thead th:last-child { display: none; }
    /* students cannot grade and do not need the roster */
    body[data-role="student"] #gradeForm,
    body[data-role="student"] .card:has(#rosterRows) { display: none; }

    /* phone layout: stack table rows */
    @media (max-width: 600px) {
      .scroll table, .scroll thead, .scroll tbody, .scroll tr, .scroll td { display: block; }
      .scroll thead { display: none; }
      .scroll tr { border-bottom: 1px solid #cbd5e1; padding: 8px 0; }
      .scroll td { border: 0; padding: 2px 0; }
      .scroll td:empty { display: none; }
      .scroll td::before { font-weight: bold; margin-right: 6px; }
      #rows td:nth-child(1)::before { content: "Number:"; }
      #rows td:nth-child(2)::before { content: "Name:"; }
      #rows td:nth-child(3)::before { content: "Email:"; }
      #rows td:nth-child(4)::before { content: "Year:"; }
      #rosterRows td:nth-child(1)::before { content: "Number:"; }
      #rosterRows td:nth-child(2)::before { content: "Name:"; }
      #rosterRows td:nth-child(3)::before { content: "Status:"; }
      #gradeRows td:nth-child(1)::before { content: "Assessment:"; }
      #gradeRows td:nth-child(2)::before { content: "Score:"; }
      #gradeRows td:nth-child(3)::before { content: "Final:"; }
      #transcriptRows td:nth-child(1)::before { content: "Course:"; }
      #transcriptRows td:nth-child(2)::before { content: "Semester:"; }
      #transcriptRows td:nth-child(3)::before { content: "Final %:"; }
      #transcriptRows td:nth-child(4)::before { content: "Grade:"; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* typed confirmation for destructive actions */
  const origConfirm = window.confirm.bind(window);
  window.confirm = function (msg) {
    msg = String(msg || '');
    if (/^Delete /.test(msg)) return window.prompt(msg + '\n\nType DELETE to confirm:') === 'DELETE';
    if (/^Remove /.test(msg)) return window.prompt(msg + '\n\nType REMOVE to confirm:') === 'REMOVE';
    return origConfirm(msg);
  };

  /* look up the signed-in user's role and tag the page with it */
  let roleFor = null;
  async function applyRole(user) {
    const { data, error } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (error || !data) { document.body.removeAttribute('data-role'); return; }
    document.body.setAttribute('data-role', data.role);
    const who = document.getElementById('who');
    who.textContent = who.textContent.replace(/ \(.*\)$/, '') + ' (' + data.role + ')';
  }

  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      if (session && session.user.id !== roleFor) {
        roleFor = session.user.id;
        applyRole(session.user);
      } else if (!session) {
        roleFor = null;
        document.body.removeAttribute('data-role');
      }
    }, 0);
  });
})();