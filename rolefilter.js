(function () {
  var ROLES = ['lab_staff', 'support_staff', 'dorm_officer', 'department_head', 'college_head'];
  var KEEP_IDS = ['scannerCard','trCard', 'idCard', 'photoCard', 'bioCard', 'staffInfoCard', 'dormOfficeCard', 'headCard'];
  var role = null, timer = null;
  function apply() {
    if (!role) return;
    document.querySelectorAll('.card').forEach(function (c) {
      if (c.querySelector('.card')) return;
      var keep = KEEP_IDS.indexOf(c.id) >= 0 || /Signed in as|My account|Announcements/.test(c.textContent) || [].some.call(c.querySelectorAll('button'), function (b) { return /Sign out/i.test(b.textContent); });
      c.style.display = keep ? '' : 'none';
    });
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(apply, 250); }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user;
      if (!u) { role = null; return; }
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        role = (r.data && ROLES.indexOf(r.data.role) >= 0) ? r.data.role : null;
        apply();
      });
    });
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 500); });
  check();
})();
