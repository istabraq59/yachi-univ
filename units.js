// Admin card: one dropdown with units and their departments; link departments; add units.
(function () {
  'use strict';
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';
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

    var u = await db.from('academic_units').select('id, name, type').order('type').order('name');
    var d = await db.from('departments').select('*');
    var p = await db.from('programs').select('*');
    if (u.error || d.error) {
      card.appendChild(el('div', 'color:#b91c1c', 'Could not load: ' + ((u.error || d.error).message)));
      return;
    }
    var units = u.data || [], depts = d.data || [], progs = p.error ? [] : (p.data || []);
    function sortName(a, b) { return String(deptName(a)).localeCompare(String(deptName(b))); }
    depts.sort(sortName);

    // One dropdown: unit, then its departments indented
    var pick = el('select', INPUT);
    function opt(value, label) {
      var o = el('option', null, label);
      o.value = value;
      if (value === selected) o.selected = true;
      pick.appendChild(o);
    }
    opt('', 'Choose a college, institute, school or department');
    units.forEach(function (x) {
      opt('u:' + x.id, x.name);
      depts.filter(function (y) { return y.unit_id === x.id; })
           .forEach(function (y) { opt('d:' + y.id, IND + deptName(y)); });
    });
    var loose = depts.filter(function (y) { return !y.unit_id; });
    if (loose.length) {
      opt('', '\u2014 Not linked to any unit \u2014');
      loose.forEach(function (y) { opt('d:' + y.id, IND + deptName(y)); });
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
        var unit = units.filter(function (x) { return x.id === id; })[0];
        if (!unit) return;
        var mine = depts.filter(function (x) { return x.unit_id === id; });
        line(cap(unit.type) + ' \u00B7 ' + mine.length + ' department' + (mine.length === 1 ? '' : 's'),
             'font-size:13px;color:#6b7280');
        if (!mine.length) line('No departments linked yet.', 'color:#6b7280;margin-top:4px');
        mine.forEach(function (x) { line('\u2022 ' + deptName(x)); });
      } else {
        var dep = depts.filter(function (x) { return x.id === id; })[0];
        if (!dep) return;
        var parent = units.filter(function (x) { return x.id === dep.unit_id; })[0];
        line('Department', 'font-size:13px;color:#6b7280');
        line(deptName(dep), 'font-weight:600;font-size:17px');
        line(parent ? 'Belongs to: ' + parent.name + ' (' + parent.type + ')' : 'Not linked to any unit yet.',
             'margin-top:4px');
        var pp = progs.filter(function (x) { return x.department_id === id; });
        line('Programs: ' + pp.length, 'margin-top:8px;color:#6b7280');
        pp.forEach(function (x) { line('\u2022 ' + (x.name || x.program_name || x.id)); });
      }
    }
    pick.onchange = function () { selected = pick.value; show(); };
    show();

    // Link department (collapsed)
    var linkBox = document.createElement('details');
    linkBox.appendChild(el('summary', 'font-weight:700;cursor:pointer;padding:8px 0', 'Link a department to a unit'));
    if (!depts.length) {
      linkBox.appendChild(el('div', 'color:#6b7280', 'No departments yet.'));
    } else {
      var ds = el('select', INPUT);
      depts.forEach(function (x) { var o = el('option', null, deptName(x)); o.value = x.id; ds.appendChild(o); });
      var us = el('select', INPUT);
      units.forEach(function (x) { var o = el('option', null, x.name); o.value = x.id; us.appendChild(o); });
      var link = el('button', BTN, 'Link'); link.type = 'button';
      var m2 = el('div', 'margin-bottom:8px');
      link.onclick = async function () {
        link.disabled = true;
        var r = await db.from('departments').update({ unit_id: us.value }).eq('id', ds.value);
        link.disabled = false;
        if (r.error) { m2.textContent = 'Not linked: ' + r.error.message; m2.style.color = '#b91c1c'; return; }
        selected = 'u:' + us.value;
        load();
      };
      [ds, us, link, m2].forEach(function (x) { linkBox.appendChild(x); });
    }
    card.appendChild(linkBox);

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
