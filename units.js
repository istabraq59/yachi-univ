// Admin card: pick a unit, tick the departments that belong to it, save.
(function () {
  'use strict';
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin:8px 0 10px;cursor:pointer';
  var IND = '\u00A0\u00A0\u00A0\u00A0\u2013 ';

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  function deptName(d) { return d.name || d.department_name || d.title || d.id; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  var card = el('div');
  card.id = 'unitsCard';
  card.style.display = 'none';
  var built = false;
  var selected = '';

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

  async function load() {
    card.textContent = '';
    card.appendChild(el('h2', 'margin:0 0 12px', 'Colleges, institutes and schools'));

    var u = await db.from('academic_units').select('id, name, type').neq('type', 'office').order('type').order('name');
    var d = await db.from('departments').select('*');
    var p = await db.from('programs').select('*');
    if (u.error || d.error) {
      card.appendChild(el('div', 'color:#b91c1c', 'Could not load: ' + ((u.error || d.error).message)));
      return;
    }
    var units = u.data || [], depts = d.data || [], progs = p.error ? [] : (p.data || []);
    depts.sort(function (a, b) { return String(deptName(a)).localeCompare(String(deptName(b))); });
    function unitById(id) { return units.filter(function (x) { return x.id === id; })[0]; }

    // Dropdown: units with their departments indented
    var pick = el('select', INPUT);
    function opt(value, label) {
      var o = el('option', null, label);
      o.value = value;
      if (value === selected) o.selected = true;
      pick.appendChild(o);
    }
    opt('', 'Choose a college, institute or school');
    units.forEach(function (x) {
      opt('u:' + x.id, x.name);
    });
    var loose = depts.filter(function (y) { return !y.unit_id; });
    if (loose.length) {
    }
    card.appendChild(pick);

    var detail = el('div', 'margin-bottom:12px');
    card.appendChild(detail);
    function line(text, style) { detail.appendChild(el('div', style || 'margin:4px 0 0 12px;font-size:16px', text)); }

    function show() {
      detail.textContent = '';
      var v = pick.value;
      if (!v) return;
      var kind = v.charAt(0), id = v.slice(2);

      if (kind === 'u') {
        var unit = unitById(id);
        if (!unit) return;
        var count = depts.filter(function (x) { return x.unit_id === id; }).length;
        line(cap(unit.type) + ' \u00B7 ' + count + ' department' + (count === 1 ? '' : 's'), 'font-size:13px;color:#6b7280');
        line('Tick the departments that belong here, then press Save.', 'font-size:14px;color:#6b7280;margin:4px 0 8px');
        if (!depts.length) { line('No departments yet.', 'color:#6b7280'); return; }

        var boxes = [];
        depts.forEach(function (x) {
          var row = el('label', 'display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid #f0f0f0;font-size:16px;cursor:pointer');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.style.cssText = 'width:22px;height:22px;flex:none;margin:0';
          cb.checked = x.unit_id === id;
          var txt = el('span', 'flex:1', deptName(x));
          row.appendChild(cb);
          row.appendChild(txt);
          if (x.unit_id && x.unit_id !== id) {
            var other = unitById(x.unit_id);
            txt.appendChild(el('div', 'font-size:12px;color:#6b7280', '(now in ' + (other ? other.name : 'another unit') + ')'));
          }
          detail.appendChild(row);
          boxes.push({ dept: x, cb: cb });
        });

        var save = el('button', BTN, 'Save'); save.type = 'button';
        var msg = el('div', 'margin-bottom:8px');
        save.onclick = async function () {
          save.disabled = true;
          var errors = [];
          for (var i = 0; i < boxes.length; i++) {
            var b = boxes[i], inHere = b.dept.unit_id === id, want = b.cb.checked;
            if (want && !inHere) {
              var r1 = await db.from('departments').update({ unit_id: id }).eq('id', b.dept.id);
              if (r1.error) errors.push(r1.error.message);
            } else if (!want && inHere) {
              var r2 = await db.from('departments').update({ unit_id: null }).eq('id', b.dept.id);
              if (r2.error) errors.push(r2.error.message);
            }
          }
          save.disabled = false;
          if (errors.length) { msg.textContent = 'Not saved: ' + errors[0]; msg.style.color = '#b91c1c'; return; }
          selected = 'u:' + id;
          await load();
        };
        detail.appendChild(save);
        detail.appendChild(msg);
      } else {
        var dep = depts.filter(function (x) { return x.id === id; })[0];
        if (!dep) return;
        var parent = unitById(dep.unit_id);
        line('Department', 'font-size:13px;color:#6b7280');
        line(deptName(dep), 'font-weight:600;font-size:17px');
        line(parent ? 'Belongs to: ' + parent.name + ' (' + parent.type + ')' : 'Not linked to any unit yet.', 'margin-top:4px');
        var pp = progs.filter(function (x) { return x.department_id === id; });
        line('Programs: ' + pp.length, 'margin-top:8px;color:#6b7280');
        pp.forEach(function (x) { line('\u2022 ' + (x.name || x.program_name || x.id)); });
      }
    }
    pick.onchange = function () { selected = pick.value; show(); };
    show();

    // Add unit (collapsed)
    var addBox = document.createElement('details');
    addBox.appendChild(el('summary', 'font-weight:700;cursor:pointer;padding:8px 0', 'Add a college, institute or school'));
    var nm = el('input', INPUT); nm.placeholder = 'Full name';
    var ty = el('select', INPUT);
    ['college', 'institute', 'school'].forEach(function (t) {
      var o = el('option', null, cap(t)); o.value = t; ty.appendChild(o);
    });
    var add = el('button', BTN, 'Add'); add.type = 'button';
    var m1 = el('div', 'margin-bottom:8px');
    add.onclick = async function () {
      if (!nm.value.trim()) { m1.textContent = 'Type a name.'; m1.style.color = '#b91c1c'; return; }
      add.disabled = true;
      var r = await db.from('academic_units').insert({ name: nm.value.trim(), type: ty.value });
      add.disabled = false;
      if (r.error) { m1.textContent = 'Not added: ' + r.error.message; m1.style.color = '#b91c1c'; return; }
      load();
    };
    [nm, ty, add, m1].forEach(function (x) { addBox.appendChild(x); });
    card.appendChild(addBox);
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
