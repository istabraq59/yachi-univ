// Connects the College/Institute/School -> Department picker to the Add student form.
(function () {
  'use strict';
  var mount = document.getElementById('udpMount');
  var sel = document.getElementById('f_program');
  var summary = document.getElementById('udpSummary');
  if (!mount || !sel || !window.UnitDeptPicker) return;

  var progs = null;
  async function getProgs() {
    if (progs) return progs;
    var r = await db.from('programs').select('id, department_id, code').order('code');
    if (r.error || !r.data || !r.data.length) return [];
    progs = r.data;
    return progs;
  }

  var obs = new MutationObserver(function () { applyPrograms(); });
  async function applyPrograms() {
    var v = picker.getValue();
    var all = await getProgs();
    var list = v.department_id ? all.filter(function (p) { return p.department_id === v.department_id; }) : [];
    obs.disconnect();
    sel.textContent = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = !v.department_id ? 'Choose a department first'
      : (list.length ? 'Choose program' : 'No programs in this department yet');
    sel.appendChild(first);
    list.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.code;
      sel.appendChild(o);
    });
    obs.observe(sel, { childList: true });
  }

  var picker = UnitDeptPicker.mount(mount, { onChange: applyPrograms });
  window.studentPicker = picker;
  applyPrograms();

  window.studentFormEdit = async function (s) {
    mount.style.display = 'none';
    summary.style.display = '';
    summary.textContent = 'Loading college and department\u2026';
    var text = '';
    try {
      if (s.department_id) {
        var d = await db.from('departments').select('name, unit_id').eq('id', s.department_id).limit(1);
        var dep = d.data && d.data[0];
        var unitId = s.unit_id || (dep && dep.unit_id);
        var un = '';
        if (unitId) {
          var u = await db.from('academic_units').select('name').eq('id', unitId).limit(1);
          un = (u.data && u.data[0]) ? u.data[0].name : '';
        }
        text = (un ? un + ' \u2192 ' : '') + (dep ? dep.name : '');
      }
    } catch (e) { text = ''; }
    summary.textContent = text
      ? 'College and department: ' + text + ' (cannot be changed while editing)'
      : 'No college or department recorded.';
  };

  window.studentFormReset = function () {
    mount.style.display = '';
    summary.style.display = 'none';
    picker.reset();
  };
  summary.style.display = 'none';
})();
