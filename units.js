// Admin card: colleges, institutes and schools, and which departments belong to each.
(function () {
  'use strict';
  var INPUT = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;margin-bottom:10px';
  var BTN = 'width:100%;padding:12px;font-size:16px;background:#2563eb;color:#fff;border:0;border-radius:8px;margin-bottom:10px;cursor:pointer';

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  function deptName(d) { return d.name || d.department_name || d.title || d.id; }

  var card = el('div');
  card.id = 'unitsCard';
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

  async function load() {
    card.textContent = '';
    card.appendChild(el('h2', 'margin:0 0 12px', 'Colleges, institutes and schools'));

    var u = await db.from('academic_units').select('id, name, type').order('type').order('name');
    var d = await db.from('departments').select('*');
    if (u.error || d.error) {
      card.appendChild(el('div', 'color:#b91c1c', 'Could not load: ' + ((u.error || d.error).message)));
      return;
    }
    var units = u.data || [], depts = d.data || [];

    // List
    units.forEach(function (unit) {
      var mine = depts.filter(function (x) { return x.unit_id === unit.id; });
      var box = el('div', 'border-top:1px solid #e5e7eb;padding:10px 0');
      box.appendChild(el('div', 'font-weight:600', unit.name));
      box.appendChild(el('div', 'font-size:13px;color:#6b7280;text-transform:capitalize',
        unit.type + ' · ' + mine.length + ' department' + (mine.length === 1 ? '' : 's')));
      mine.forEach(function (x) { box.appendChild(el('div', 'margin-left:12px;font-size:15px', '• ' + deptName(x))); });
      card.appendChild(box);
    });
    var loose = depts.filter(function (x) { return !x.unit_id; });
    if (loose.length) {
      var lb = el('div', 'border-top:1px solid #e5e7eb;padding:10px 0');
      lb.appendChild(el('div', 'font-weight:600;color:#b45309', 'Not linked to any unit yet'));
      loose.forEach(function (x) { lb.appendChild(el('div', 'margin-left:12px;font-size:15px', '• ' + deptName(x))); });
      card.appendChild(lb);
    }

    // Add unit
    card.appendChild(el('h3', 'margin:18px 0 6px', 'Add a college, institute or school'));
    var nm = el('input', INPUT); nm.placeholder = 'Full name';
    var ty = el('select', INPUT);
    ['college', 'institute', 'school'].forEach(function (t) {
      var o = el('option', null, t.charAt(0).toUpperCase() + t.slice(1)); o.value = t; ty.appendChild(o);
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
    [nm, ty, add, m1].forEach(function (x) { card.appendChild(x); });

    // Link department
    card.appendChild(el('h3', 'margin:18px 0 6px', 'Link a department to a unit'));
    if (!depts.length) {
      card.appendChild(el('div', 'color:#6b7280', 'No departments yet. Add departments first.'));
      return;
    }
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
      load();
    };
    [ds, us, link, m2].forEach(function (x) { card.appendChild(x); });
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
