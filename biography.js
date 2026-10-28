(function () {
  var SECTIONS = [
    ['Contact details', [['phone', 'Phone', 'tel', 30], ['contact_email', 'Contact email', 'email', 120], ['address', 'Address', 'text', 300]]],
    ['Personal details', [['date_of_birth', 'Date of birth', 'date'], ['gender', 'Gender', 'gender'], ['place_of_birth', 'Place of birth', 'text', 120], ['nationality', 'Nationality', 'text', 80], ['religion', 'Religion (optional)', 'text', 80]]],
    ['Emergency contact', [['emergency_name', 'Name', 'text', 120], ['emergency_relationship', 'Relationship', 'text', 60], ['emergency_phone', 'Phone', 'tel', 30]]],
    ['Education and about me', [['previous_school', 'Previous school', 'text', 200], ['grade12_result', 'Grade 12 result', 'text', 60], ['about', 'A few lines about yourself', 'textarea', 1000]]]
  ];
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function myCard(uid) {
    var c = el('div', { class: 'card', id: 'bioCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'My biography' }));
    var intro = el('p', { text: 'Only you and the registrar\'s office can see this. Fill in what you can and tap Save.' });
    var form = el('div'), msg = el('p');
    d.appendChild(intro); if (window.YUPhoto) window.YUPhoto.mine(d, uid); d.appendChild(form); d.appendChild(msg); c.appendChild(d); place(c);
    var inputs = {};
    SECTIONS.forEach(function (s) {
      form.appendChild(el('h3', { text: s[0] }));
      s[1].forEach(function (f) {
        form.appendChild(el('label', { text: f[1] }));
        var i;
        if (f[2] === 'gender') {
          i = el('select');
          [['', ''], ['male', 'Male'], ['female', 'Female']].forEach(function (o) { i.appendChild(el('option', { value: o[0], text: o[1] })); });
        } else if (f[2] === 'textarea') { i = el('textarea', { rows: '4', maxlength: String(f[3]) }); }
        else { i = el('input', { type: f[2] }); if (f[3]) i.setAttribute('maxlength', String(f[3])); }
        inputs[f[0]] = i; form.appendChild(i);
      });
    });
    var save = el('button', { type: 'button', text: 'Save biography' }); form.appendChild(save);
    function fill(row) { Object.keys(inputs).forEach(function (k) { if (row && row[k] != null) inputs[k].value = row[k]; }); }
    db.from('biographies').select('*').eq('profile_id', uid).maybeSingle().then(function (r) {
      if (r.data) { fill(r.data); return; }
      db.from('students').select('phone,address,date_of_birth,gender,email').eq('profile_id', uid).maybeSingle().then(function (s) {
        if (!s.data) return;
        var row = { phone: s.data.phone, address: s.data.address, date_of_birth: s.data.date_of_birth };
        var g = (s.data.gender || '').toLowerCase(); if (g === 'male' || g === 'female') row.gender = g;
        if (s.data.email && !/\.invalid$/i.test(s.data.email)) row.contact_email = s.data.email;
        fill(row);
      });
    });
    save.onclick = function () {
      var row = { profile_id: uid };
      Object.keys(inputs).forEach(function (k) { var v = inputs[k].value.trim(); row[k] = v === '' ? null : v; });
      save.disabled = true; msg.textContent = 'Saving...';
      db.from('biographies').upsert(row).then(function (r) {
        save.disabled = false;
        msg.textContent = r.error ? ('Could not save: ' + r.error.message) : 'Saved.';
      });
    };
  }
  function lookupCard() {
    var c = el('div', { class: 'card', id: 'bioLookupCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'Look up a biography by ID' }));
    var input = el('input', { placeholder: 'ID number, e.g. STU-2026-YU00001', autocapitalize: 'characters' });
    var go = el('button', { type: 'button', text: 'Show biography' }), out = el('div');
    d.appendChild(input); d.appendChild(go); d.appendChild(out); c.appendChild(d); place(c);
    go.onclick = function () {
      var id = input.value.trim().toUpperCase(); out.innerHTML = '';
      if (!id) { out.textContent = 'Enter an ID number.'; return; }
      db.from('profiles').select('id,full_name,role').eq('id_number', id).maybeSingle().then(function (p) {
        if (p.error || !p.data) { out.textContent = 'No person with that ID.'; return; }
        db.from('biographies').select('*').eq('profile_id', p.data.id).maybeSingle().then(function (b) {
          out.appendChild(el('h3', { text: id + ' - ' + (p.data.full_name || '') + ' (' + p.data.role + ')' }));
          if (window.YUPhoto) window.YUPhoto.view(out, p.data.id);
          if (b.error || !b.data) { out.appendChild(el('p', { text: 'No biography filled in yet.' })); return; }
          SECTIONS.forEach(function (s) {
            var any = s[1].filter(function (f) { return b.data[f[0]]; });
            if (!any.length) return;
            out.appendChild(el('h4', { text: s[0] }));
            any.forEach(function (f) { var p2 = el('p'); p2.appendChild(el('strong', { text: f[1] + ': ' })); p2.appendChild(document.createTextNode(b.data[f[0]])); out.appendChild(p2); });
          });
        });
      });
    };
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (!r.data) return;
        if (!document.getElementById('bioCard')) myCard(u.id);
        if ((r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('bioLookupCard')) lookupCard();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
