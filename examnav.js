(function () {
  var ROLE = null, asked = false;
  var STAFF = [['Exam dashboard', 'dashboard'], ['Exams', 'exams'], ['Question bank', 'bank'], ['Grading & results', 'results'], ['Exam reports', 'reports']];
  var STUDENT = [['Exam dashboard', 'dashboard'], ['My exams', 'myexams']];
  function go(id) { document.body.classList.remove('yu-open'); location.href = 'exams/#/' + id; }
  function ensure() {
    if (!asked && typeof db !== 'undefined') {
      asked = true;
      db.rpc('exam_role').then(function (r) { ROLE = (r && r.data) || 'none'; }, function () { ROLE = 'none'; });
    }
    if (!ROLE) return;
    var nav = document.querySelector('#yuSide nav'); if (!nav) return;
    var head = [].filter.call(nav.querySelectorAll('.grp'), function (g) { return /^Examinations/.test(g.textContent); })[0];
    if (!head) return;
    var body = head.nextSibling;
    if (!body || body.getAttribute('data-exnav')) return;
    var staff = ['admin', 'administrator', 'college_head', 'department_head', 'teacher'].indexOf(ROLE) >= 0;
    var list = staff ? STAFF : (ROLE === 'student' ? STUDENT : null);
    if (!list) return;
    body.setAttribute('data-exnav', '1');
    var lab = document.createElement('div');
    lab.textContent = 'Classic pages';
    lab.style.cssText = 'font-size:11px;opacity:.6;padding:10px 14px 2px;letter-spacing:.08em;text-transform:uppercase';
    body.insertBefore(lab, body.firstChild);
    list.forEach(function (it) {
      var b = document.createElement('button');
      b.textContent = it[0];
      b.onclick = function () { go(it[1]); };
      body.insertBefore(b, lab);
    });
  }
  setInterval(ensure, 700);
})();
