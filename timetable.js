(function () {
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var CSS = [
    '#timetableCard select,#timetableCard input{width:100%;margin:4px 0}',
    '#timetableCard label{font-size:12px;color:#64748b;display:block;margin-top:6px}',
    '#timetableCard .dh{margin:14px 0 4px;color:#0f2a5e;font-weight:700}',
    '#timetableCard .ro{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #eef2fa;font-size:14px}',
    '#timetableCard .ro button{width:auto;margin:0;padding:6px 12px;background:#dc2626;color:#fff;border:0;border-radius:8px}',
    '#yuUp{background:#fff;border:1px solid #dbe4f5;border-radius:14px;padding:4px 14px 10px;margin-top:14px}',
    '#yuUp .row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eef2fa;font-size:14px;color:#0f2a5e}',
    '#yuUp .row small{color:#64748b;display:block}#yuUp .row .r{text-align:right;white-space:nowrap}',
    '#yuUp .now{color:#14532d;font-weight:700}'
  ].join('\n');
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function loc(x) { return [x.building, x.room].filter(Boolean).join(', '); }
  function hm(t) { return String(t || '').slice(0, 5); }
  function mins(t) { var p = hm(t).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function signedCard() { var s = null; document.querySelectorAll('.card').forEach(function (x) { if (!s && /Signed in as/.test(x.textContent) && !x.querySelector('.card')) s = x; }); return s; }
  function getRole(cb) {
    db.auth.getUser().then(function (u) {
      var user = u.data && u.data.user; if (!user) { cb(null, ''); return; }
      db.from('profiles').select('role').eq('id', user.id).maybeSingle().then(function (p) { cb(user, (p.data && p.data.role) || ''); }, function () { cb(user, ''); });
    });
  }

  // ---------- Admin timetable card ----------
  function buildAdmin(card) {
    card.appendChild(el('h3', { text: 'Timetable' }));
    var course = el('select'), sem = el('select'), day = el('select');
    var st = el('input', { type: 'time' }), en = el('input', { type: 'time' }), room = el('input', { type: 'text', placeholder: 'Room (e.g. Lab 3)' }), bld = el('input', { type: 'text', placeholder: 'Building (e.g. Block A)' });
    var msg = el('p'), list = el('div');
    var add = el('button', { type: 'button', text: 'Add class' });
    function lab(t) { card.appendChild(el('label', { text: t })); }
    lab('Course'); card.appendChild(course); lab('Semester'); card.appendChild(sem); lab('Day'); card.appendChild(day);
    lab('Start time'); card.appendChild(st); lab('End time'); card.appendChild(en); lab('Building'); card.appendChild(bld); lab('Room'); card.appendChild(room);
    card.appendChild(add); card.appendChild(msg); card.appendChild(list);
    DAYS.forEach(function (d, i) { day.appendChild(el('option', { value: String(i + 1), text: d })); });
    db.from('courses').select('id, course_code, title').order('course_code').then(function (r) {
      course.textContent = ''; (r.data || []).forEach(function (c) { course.appendChild(el('option', { value: c.id, text: c.course_code + ' - ' + c.title })); });
      if (!(r.data || []).length) course.appendChild(el('option', { value: '', text: 'No courses yet' }));
    });
    db.from('semesters').select('id, name, starts_on').order('starts_on').then(function (r) {
      sem.textContent = ''; (r.data || []).forEach(function (s) { sem.appendChild(el('option', { value: s.id, text: s.name + ' (' + s.starts_on + ')' })); });
    });
    function refresh() {
      db.from('class_sessions').select('id, day_of_week, start_time, end_time, room, building, courses(course_code, title), semesters(name)')
        .order('day_of_week').order('start_time').limit(500).then(function (r) {
          list.textContent = '';
          if (r.error) { msg.textContent = 'Could not load: ' + r.error.message; return; }
          if (!(r.data || []).length) { list.appendChild(el('p', { text: 'No classes added yet.' })); return; }
          var last = 0;
          r.data.forEach(function (x) {
            if (x.day_of_week !== last) { last = x.day_of_week; list.appendChild(el('div', { class: 'dh', text: DAYS[x.day_of_week - 1] })); }
            var ro = el('div', { class: 'ro' });
            var t = el('span', { text: hm(x.start_time) + '-' + hm(x.end_time) + '  ' + ((x.courses && x.courses.course_code) || '') + ' ' + ((x.courses && x.courses.title) || '') + (loc(x) ? '  |  ' + loc(x) : '') + (x.semesters ? '  (' + x.semesters.name + ')' : '') });
            var del = el('button', { type: 'button', text: 'Delete' });
            del.onclick = function () {
              if (!confirm('Delete this class from the timetable?')) return;
              db.from('class_sessions').delete().eq('id', x.id).select().then(function (d) {
                if (d.error) { msg.textContent = d.error.message; return; }
                if (!d.data || !d.data.length) { msg.textContent = 'Not deleted: no permission.'; return; }
                msg.textContent = 'Deleted.'; refresh();
              });
            };
            ro.appendChild(t); ro.appendChild(del); list.appendChild(ro);
          });
        });
    }
    add.onclick = function () {
      msg.textContent = '';
      if (!course.value || !sem.value || !st.value || !en.value) { msg.textContent = 'Choose the course, semester and both times.'; return; }
      if (mins(en.value) <= mins(st.value)) { msg.textContent = 'End time must be after the start time.'; return; }
      var rm = room.value.trim(), bd = bld.value.trim();
      var q = db.from('class_sessions').select('id, start_time, end_time, room, building, courses(course_code)').eq('semester_id', sem.value).eq('day_of_week', Number(day.value));
      q.then(function (r) {
        var clash = (r.data || []).filter(function (a) { return rm && (a.room || '').toLowerCase() === rm.toLowerCase() && (a.building || '').toLowerCase() === bd.toLowerCase() && mins(a.start_time) < mins(en.value) && mins(a.end_time) > mins(st.value); })[0];
        if (clash) { msg.textContent = 'Room ' + (bd ? bd + ', ' : '') + rm + ' is already used then by ' + ((clash.courses && clash.courses.course_code) || 'another class') + ' (' + hm(clash.start_time) + '-' + hm(clash.end_time) + ').'; return; }
        db.from('class_sessions').insert({ course_id: course.value, semester_id: sem.value, day_of_week: Number(day.value), start_time: st.value, end_time: en.value, room: rm || null, building: bd || null }).select().then(function (i) {
          if (i.error) { msg.textContent = i.error.message; return; }
          if (!i.data || !i.data.length) { msg.textContent = 'Not saved: no permission.'; return; }
          msg.textContent = 'Added.'; room.value = ''; bld.value = ''; refresh();
        });
      });
    };
    refresh();
  }
  function initAdmin() {
    if (typeof db === 'undefined') return;
    getRole(function (user, role) {
      var old = document.getElementById('timetableCard');
      if (!user) { if (old) old.remove(); return; }
      if (old || !/^(admin|administrator)$/.test(role)) return;
      var tries = 0;
      (function place() {
        var s = signedCard();
        if (!s) { if (tries++ < 20) setTimeout(place, 500); return; }
        if (document.getElementById('timetableCard')) return;
        var card = el('div', { class: 'card', id: 'timetableCard' });
        s.parentNode.insertBefore(card, s.nextSibling); buildAdmin(card);
      })();
    });
  }

  // ---------- Upcoming classes panel for Home ----------
  window.YUUpcoming = function (home) {
    var box = el('div', { id: 'yuUp' }); box.style.display = 'none';
    box.appendChild(el('h4', { text: 'Upcoming classes' })); var list = el('div'); box.appendChild(list); home.appendChild(box);
    getRole(function (user, role) {
      if (!user) return;
      function show(courseIds) {
        var q = db.from('class_sessions').select('day_of_week, start_time, end_time, room, building, course_id, courses(course_code, title), semesters(starts_on, ends_on)').limit(500);
        if (courseIds) { if (!courseIds.length) { done([]); return; } q = q.in('course_id', courseIds); }
        q.then(function (r) { done(r.data || []); }, function () { done([]); });
      }
      function done(rows) {
        var now = new Date(Date.now() + 3 * 3600000);
        var dow = ((now.getUTCDay() + 6) % 7) + 1, nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
        var items = [];
        rows.forEach(function (s) {
          var d = (s.day_of_week - dow + 7) % 7;
          if (d === 0 && mins(s.end_time) <= nowMin) d = 7;
          var target = new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);
          var sm = s.semesters || {};
          if (sm.starts_on && target < sm.starts_on) return;
          if (sm.ends_on && target > sm.ends_on) return;
          items.push({ d: d, s: mins(s.start_time), e: mins(s.end_time), row: s, now: d === 0 && mins(s.start_time) <= nowMin });
        });
        items.sort(function (a, b) { return a.d - b.d || a.s - b.s; });
        box.style.display = ''; list.textContent = '';
        if (!items.length) { list.appendChild(el('p', { text: 'No upcoming classes.' })); return; }
        items.slice(0, 6).forEach(function (it) {
          var r = it.row, c = r.courses || {};
          var row = el('div', { class: 'row' });
          var l = el('span', { text: hm(r.start_time) + '-' + hm(r.end_time) + '  ' + (c.course_code || '') + ' ' + (c.title || '') });
          var rt = el('span', { class: 'r' });
          rt.appendChild(el('span', { class: it.now ? 'now' : '', text: it.now ? 'Now' : it.d === 0 ? 'Today' : it.d === 1 ? 'Tomorrow' : DAYS[r.day_of_week - 1] }));
          if (loc(r)) rt.appendChild(el('small', { text: loc(r) }));
          row.appendChild(l); row.appendChild(rt); list.appendChild(row);
        });
      }
      if (/^(admin|administrator)$/.test(role)) { show(null); return; }
      if (role === 'student') {
        db.from('students').select('id').eq('profile_id', user.id).maybeSingle().then(function (s) {
          if (!s.data) return;
          db.from('enrollments').select('course_id').eq('student_id', s.data.id).then(function (e) { show((e.data || []).map(function (x) { return x.course_id; })); });
        });
        return;
      }
      if (role === 'teacher') {
        db.from('teachers').select('id').eq('profile_id', user.id).maybeSingle().then(function (t) {
          if (t.error || !t.data) return;
          db.from('course_assignments').select('course_id').eq('teacher_id', t.data.id).then(function (a) { show((a.data || []).map(function (x) { return x.course_id; })); });
        });
      }
    });
  };

  var st = el('style'); st.textContent = CSS; document.head.appendChild(st);
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(initAdmin, 400); });
  initAdmin(); setTimeout(initAdmin, 1500);
})();
