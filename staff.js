// Admin card: turn a pending account into department head, college head, dorm officer, lab or support staff.
(function () {
  'use strict';
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin:4px 0 10px;cursor:pointer';
  var ROLES = [
    ['department_head', 'Department head'],
    ['college_head', 'College / institute / school head'],
    ['dorm_officer', 'Dormitory (proctor) officer'],
    ['lab_staff', 'Laboratory staff'],
    ['support_staff', 'Support staff']
  ];

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  var card = el('div');
  card.id = 'staffCard';
  card.style.display = 'none';
  var built = false;

  function place() {
    var nodes = document.querySelectorAll('body *');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && /^\s*Signed in as/i.test(n.textContent)) {
        var a = n;
        while (a && a !== document.body) {
          if (a.className && typeof a.className === 'string' && a.className.trim()) {
            card.className = a.className;
            a.parentNode.appendChild(card);
            return;
          }
          a = a.parentElement;
        }
      }
    }
    if (!card.parentNode) {
      card.style.cssText = 'background:#fff;border-radius:12px;padding:16px;margin:16px;display:none';
      document.body.appendChild(card);
    }
  }

  async function pendingList() {
    var r = await db.rpc('pending_accounts');
    if (!r.error && Array.isArray(r.data)) {
      return r.data.map(function (x) {
        return { id: x.profile_id || x.id || x.user_id, name: x.full_name || '', email: x.email || '' };
      }).filter(function (x) { return x.id; });
    }
    var p = await db.from('profiles').select('id, full_name').eq('role', 'student').is('id_number', null);
    if (p.error) throw new Error(p.error.message);
    return (p.data || []).map(function (x) { return { id: x.id, name: x.full_name || '', email: '' }; });
  }

  async function load(note) {
    card.textContent = '';
    card.appendChild(el('h2', 'margin:0 0 8px', 'Assign staff role'));
    card.appendChild(el('div', 'font-size:14px;color:#6b7280;margin-bottom:10px',
      'For people who signed up and are waiting. Students and teachers are approved in their own cards.'));
    if (note) card.appendChild(el('div', 'color:#15803d;margin-bottom:10px;font-weight:600', note));

    var pend, depts, units;
    try {
      pend = await pendingList();
      var d = await db.from('departments').select('id, name').order('name');
      var u = await db.from('academic_units').select('id, name, type').order('name');
      if (d.error) throw new Error(d.error.message);
      if (u.error) throw new Error(u.error.message);
      depts = d.data || []; units = u.data || [];
    } catch (e) {
      card.appendChild(el('div', 'color:#b91c1c', 'Could not load: ' + e.message));
      return;
    }
    if (!pend.length) {
      card.appendChild(el('div', 'color:#6b7280', 'No pending accounts right now.'));
      return;
    }

    var who = el('select', INPUT);
    pend.forEach(function (x) {
      var o = el('option', null, (x.name || '(no name)') + (x.email ? ' \u2013 ' + x.email : ''));
      o.value = x.id; who.appendChild(o);
    });
    var role = el('select', INPUT);
    ROLES.forEach(function (r) { var o = el('option', null, r[1]); o.value = r[0]; role.appendChild(o); });

    var dept = el('select', INPUT);
    depts.forEach(function (x) { var o = el('option', null, x.name); o.value = x.id; dept.appendChild(o); });
    var unit = el('select', INPUT);
    units.filter(function (z) { return z.type !== 'office'; }).forEach(function (x) { var o = el('option', null, x.name); o.value = x.id; unit.appendChild(o); });
    var deptLabel = el('div', 'font-weight:600;margin-bottom:4px', 'Department');
    var unitLabel = el('div', 'font-weight:600;margin-bottom:4px', 'College, institute or school');
    var officeLabel = el('div', 'font-weight:600;margin-bottom:4px', 'Office or directorate (optional)');
    var office = el('select', INPUT);
    var o0 = el('option', null, '- none -'); o0.value = ''; office.appendChild(o0);
    units.filter(function (z) { return z.type === 'office'; }).forEach(function (x) { var o = el('option', null, x.name); o.value = x.id; office.appendChild(o); });
    var title = el('input', INPUT); title.placeholder = 'Title (optional)';

    function sync() {
      var r = role.value;
      var showD = r === 'department_head', showU = r === 'college_head', showO = r === 'support_staff' || r === 'dorm_officer';
      dept.style.display = deptLabel.style.display = showD ? '' : 'none';
      unit.style.display = unitLabel.style.display = showU ? '' : 'none';
      office.style.display = officeLabel.style.display = showO ? '' : 'none';
    }
    role.onchange = sync;

    var go = el('button', BTN, 'Assign and give ID'); go.type = 'button';
    var msg = el('div', 'margin-bottom:8px');
    go.onclick = async function () {
      if (!confirm('Assign this role and create the ID number?')) return;
      go.disabled = true;
      var r = await db.rpc('admin_assign_staff', {
        p_profile: who.value,
        p_role: role.value,
        p_department: role.value === 'department_head' ? dept.value : null,
        p_unit: role.value === 'college_head' ? unit.value : ((role.value === 'support_staff' || role.value === 'dorm_officer') && office.value ? office.value : null),
        p_title: title.value.trim() || null
      });
      go.disabled = false;
      if (r.error) { msg.textContent = 'Not assigned: ' + r.error.message; msg.style.color = '#b91c1c'; return; }
      load('Assigned. ID number: ' + r.data);
    };

    [who, role, deptLabel, dept, unitLabel, unit, officeLabel, office, title, go, msg].forEach(function (x) { card.appendChild(x); });
    sync();
  }

  function refresh() {
    var r = document.body.getAttribute('data-role') || '';
    if (r !== 'administrator') { built = false; card.textContent = ''; card.style.display = 'none'; return; }
    if (built) return;
    built = true;
    place();
    setTimeout(place, 1000);
    card.style.display = '';
    load();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  refresh();
})();
