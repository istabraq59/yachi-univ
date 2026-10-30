// Restyles "Add student" and "Enroll a student". Layout and labels only: ids, buttons and saving are untouched.
(function () {
  var css = [
    '#studentForm,#enrollForm{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}',
    '#studentForm>*,#enrollForm>*{grid-column:1/-1;margin-top:0;margin-bottom:0}',
    '#studentForm h2,#enrollForm h2{margin:0;padding-bottom:10px;border-bottom:2px solid #e8eefb;color:#0f2a5e}',
    '#studentForm .yuF,#enrollForm .yuF{grid-column:1/-1;min-width:0}',
    '#studentForm .yuF.half,#enrollForm .yuF.half{grid-column:auto}',
    '#extra{display:contents}',
    '#extra>label{display:none}',
    '.yuF .yuFl{display:block;font-size:12px;font-weight:600;color:#475569;margin:0 0 5px}',
    '.yuF input,.yuF select{width:100%;margin:0;box-sizing:border-box}',
    '#studentForm #saveBtn,#enrollForm button[type=submit]{background:#16a34a;color:#fff;border:0;border-radius:10px;padding:12px;font-size:15px;font-weight:600;width:100%}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function wrap(id, label, half) {
    var i = document.getElementById(id);
    if (!i || (i.parentNode.className || '').indexOf('yuF') > -1) return;
    var w = document.createElement('div'); w.className = 'yuF' + (half ? ' half' : '');
    var l = document.createElement('label'); l.className = 'yuFl'; l.textContent = label; l.setAttribute('for', id);
    i.parentNode.insertBefore(w, i); w.appendChild(l); w.appendChild(i);
  }
  function run() {
    wrap('f_name', 'Full name *');
    wrap('f_email', 'Email *');
    wrap('f_program', 'Program *');
    wrap('f_year', 'Year of study *', true);
    wrap('f_phone', 'Phone (optional)', true);
    wrap('f_address', 'Address (optional)');
    wrap('f_dob', 'Date of birth (needed for ID sign-up)', true);
    wrap('f_admission', 'Grade 12 admission number (optional)', true);
    wrap('f_username', 'Academic username (optional)');
    wrap('e_student', 'Student *');
    wrap('e_course', 'Course *', true);
    wrap('e_semester', 'Semester *', true);
  }
  run();
  document.addEventListener('DOMContentLoaded', run);
})();
