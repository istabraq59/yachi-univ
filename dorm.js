(function () {
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function studentCard() {
    var c = el('div', { class: 'card', id: 'dormCard' });
    c.appendChild(el('h2', { text: 'My dorm' }));
    var out = el('p', { text: 'Loading...' }); c.appendChild(out); place(c);
    db.rpc('my_dorm').then(function (r) {
      if (r.error) { out.textContent = 'Could not load: ' + r.error.message; return; }
      var d = r.data && r.data[0];
      out.textContent = d ? ('Building ' + d.building + ', room ' + d.room_number) : 'No dorm assigned yet. Please contact the dormitory office.';
    });
  }
  function officeCard() {
    var c = el('div', { class: 'card', id: 'dormOfficeCard' });
    c.innerHTML = '<h2>Dormitory office</h2>' +
      '<details><summary>Add a building</summary><input id="dm_bname" placeholder="Building name"><select id="dm_bgender"><option value="mixed">Mixed</option><option value="male">Male</option><option value="female">Female</option></select><button id="dm_addb" type="button">Add building</button></details>' +
      '<details><summary>Add a room</summary><select id="dm_rbuilding"></select><input id="dm_rnum" placeholder="Room number"><input id="dm_rcap" type="number" min="1" value="4"><button id="dm_addr" type="button">Add room</button></details>' +
      '<h3>Assign a student</h3><input id="dm_search" placeholder="Search student by name or ID"><select id="dm_student"></select><select id="dm_room"></select>' +
      '<button id="dm_assign" type="button">Assign room</button> <button id="dm_remove" type="button">Remove from room</button><p id="dm_msg"></p><div id="dm_list"></div>';
    place(c);
    var $ = function (id) { return c.querySelector('#' + id); };
    var B = [], R = [], A = [], S = [];
    function msg(t) { $('dm_msg').textContent = t; }
    function nameOf(s) { return s.student_number + ' - ' + (s.full_name || s.name || ''); }
    function fillStudents() {
      var q = $('dm_search').value.toLowerCase(), sel = $('dm_student'); sel.innerHTML = '';
      S.filter(function (s) { return nameOf(s).toLowerCase().indexOf(q) >= 0; }).slice(0, 100).forEach(function (s) {
        var o = el('option', { value: s.id, text: nameOf(s) }); sel.appendChild(o);
      });
    }
    function render() {
      var bs = $('dm_rbuilding'), rs = $('dm_room'), list = $('dm_list');
      bs.innerHTML = ''; rs.innerHTML = ''; list.innerHTML = '';
      B.forEach(function (b) { bs.appendChild(el('option', { value: b.id, text: b.name })); });
      B.forEach(function (b) {
        var rooms = R.filter(function (r) { return r.building_id === b.id; });
        var box = el('details'); var used = 0, cap = 0;
        rooms.forEach(function (r) { cap += r.capacity; used += A.filter(function (a) { return a.room_id === r.id; }).length; });
        box.appendChild(el('summary', { text: b.name + ' (' + b.gender + ') - ' + used + '/' + cap }));
        rooms.forEach(function (r) {
          var occ = A.filter(function (a) { return a.room_id === r.id; });
          var names = occ.map(function (a) { var s = S.filter(function (x) { return x.id === a.student_id; })[0]; return s ? nameOf(s) : '?'; });
          rs.appendChild(el('option', { value: r.id, text: b.name + ' - ' + r.room_number + ' (' + occ.length + '/' + r.capacity + ')' }));
          box.appendChild(el('p', { text: 'Room ' + r.room_number + ' (' + occ.length + '/' + r.capacity + '): ' + (names.join(', ') || 'empty') }));
        });
        list.appendChild(box);
      });
      fillStudents();
    }
    function load() {
      Promise.all([
        db.from('dorm_buildings').select('*').order('name'),
        db.from('dorm_rooms').select('*').order('room_number'),
        db.from('dorm_assignments').select('student_id,room_id').is('ended_at', null),
        db.from('students').select('*').order('student_number')
      ]).then(function (x) {
        for (var i = 0; i < x.length; i++) if (x[i].error) { msg('Could not load: ' + x[i].error.message); return; }
        B = x[0].data; R = x[1].data; A = x[2].data; S = x[3].data; render();
      });
    }
    $('dm_search').addEventListener('input', fillStudents);
    $('dm_addb').onclick = function () {
      var n = $('dm_bname').value.trim(); if (!n) { msg('Enter a building name.'); return; }
      db.from('dorm_buildings').insert({ name: n, gender: $('dm_bgender').value }).then(function (r) {
        if (r.error) { msg(r.error.message); return; } $('dm_bname').value = ''; msg('Building added.'); load();
      });
    };
    $('dm_addr').onclick = function () {
      var n = $('dm_rnum').value.trim(), cap = parseInt($('dm_rcap').value, 10), b = $('dm_rbuilding').value;
      if (!b || !n || !(cap > 0)) { msg('Choose a building, room number and capacity.'); return; }
      db.from('dorm_rooms').insert({ building_id: b, room_number: n, capacity: cap }).then(function (r) {
        if (r.error) { msg(r.error.message); return; } $('dm_rnum').value = ''; msg('Room added.'); load();
      });
    };
    $('dm_assign').onclick = function () {
      var s = $('dm_student').value, r = $('dm_room').value; if (!s || !r) { msg('Choose a student and a room.'); return; }
      db.rpc('assign_dorm', { p_student: s, p_room: r }).then(function (x) { msg(x.error ? x.error.message : 'Assigned.'); load(); });
    };
    $('dm_remove').onclick = function () {
      var s = $('dm_student').value; if (!s) { msg('Choose a student.'); return; }
      db.rpc('unassign_dorm', { p_student: s }).then(function (x) { msg(x.error ? x.error.message : 'Removed from room.'); load(); });
    };
    load();
  }
  function apply(r) {
    if (r === 'student' && !document.getElementById('dormCard')) studentCard();
    if ((r === 'admin' || r === 'dorm_officer') && !document.getElementById('dormOfficeCard')) officeCard();
  }
  function check() {
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) { if (r.data) apply(r.data.role); });
    });
  }
  db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
