(function () {
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function today() { return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10); }
  function nextDay(s) { var d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
  function hhmm(ts) { return new Date(new Date(ts).getTime() + 3 * 3600000).toISOString().slice(11, 16); }
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function card() {
    var c = el('div', { class: 'card', id: 'reportsCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'Gate and meal reports' }));
    d.appendChild(el('label', { text: 'Day' }));
    var date = el('input', { type: 'date' }); date.value = today();
    d.appendChild(date);
    d.appendChild(el('label', { text: 'Only this ID number (optional)' }));
    var idf = el('input', { placeholder: 'e.g. STU-2026-YU00001', autocapitalize: 'characters' });
    d.appendChild(idf);
    var go = el('button', { type: 'button', text: 'Show report' });
    var dl = el('button', { type: 'button', text: 'Download CSV' }); dl.style.display = 'none';
    var out = el('div');
    d.appendChild(go); d.appendChild(dl); d.appendChild(out); c.appendChild(d); place(c);
    var csvRows = [], csvName = 'report.csv';
    function who(p) { return p ? { id: p.id_number || '', name: p.full_name || '' } : { id: '', name: '' }; }
    go.onclick = function () {
      var day = date.value || today(), filt = idf.value.trim().toUpperCase();
      var from = day + 'T00:00:00+03:00', to = nextDay(day) + 'T00:00:00+03:00';
      out.textContent = 'Loading...'; dl.style.display = 'none';
      Promise.all([
        db.from('gate_logs').select('direction,scanned_at,profiles!gate_logs_profile_id_fkey(full_name,id_number,role)').gte('scanned_at', from).lt('scanned_at', to).order('scanned_at', { ascending: false }).limit(1000),
        db.from('meal_logs').select('meal,scanned_at,profiles!meal_logs_profile_id_fkey(full_name,id_number)').eq('meal_date', day).order('scanned_at', { ascending: false }).limit(1000)
      ]).then(function (res) {
        var g = res[0], m = res[1];
        if (g.error || m.error) { out.textContent = 'Could not load: ' + ((g.error || m.error).message); return; }
        var gate = (g.data || []).filter(function (r) { return !filt || who(r.profiles).id === filt; });
        var meals = (m.data || []).filter(function (r) { return !filt || who(r.profiles).id === filt; });
        var ins = gate.filter(function (r) { return r.direction === 'in'; }), outs = gate.filter(function (r) { return r.direction === 'out'; });
        var uniq = {}; ins.forEach(function (r) { uniq[who(r.profiles).id] = 1; });
        function cnt(k) { return meals.filter(function (r) { return r.meal === k; }).length; }
        out.innerHTML = '';
        out.appendChild(el('h3', { text: 'Summary for ' + day + (filt ? ' - ' + filt : '') }));
        [['Entered the gate', ins.length + ' scans (' + Object.keys(uniq).length + ' different people)'], ['Left the gate', String(outs.length)], ['Breakfast', String(cnt('breakfast'))], ['Lunch', String(cnt('lunch'))], ['Dinner', String(cnt('dinner'))]].forEach(function (x) {
          var p = el('p'); p.appendChild(el('strong', { text: x[0] + ': ' })); p.appendChild(document.createTextNode(x[1])); out.appendChild(p);
        });
        csvRows = [['type', 'time', 'id_number', 'full_name', 'detail']];
        out.appendChild(el('h3', { text: 'Gate scans (' + gate.length + ')' }));
        gate.slice(0, 200).forEach(function (r) { var w = who(r.profiles); out.appendChild(el('p', { text: hhmm(r.scanned_at) + '  ' + (r.direction === 'in' ? 'IN ' : 'OUT') + '  ' + w.id + '  ' + w.name })); });
        gate.forEach(function (r) { var w = who(r.profiles); csvRows.push(['gate', day + ' ' + hhmm(r.scanned_at), w.id, w.name, r.direction]); });
        out.appendChild(el('h3', { text: 'Meals (' + meals.length + ')' }));
        meals.slice(0, 200).forEach(function (r) { var w = who(r.profiles); out.appendChild(el('p', { text: hhmm(r.scanned_at) + '  ' + r.meal + '  ' + w.id + '  ' + w.name })); });
        meals.forEach(function (r) { var w = who(r.profiles); csvRows.push(['meal', day + ' ' + hhmm(r.scanned_at), w.id, w.name, r.meal]); });
        if (g.data && g.data.length >= 1000 || m.data && m.data.length >= 1000) out.appendChild(el('p', { text: 'Showing the latest 1000 scans per list.' }));
        csvName = 'gate-meals-' + day + '.csv'; dl.style.display = '';
      });
    };
    dl.onclick = function () {
      var text = csvRows.map(function (r) { return r.map(csvCell).join(','); }).join('\n');
      var a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/csv' })), download: csvName });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
  }
  function dbg(t) { var e = document.getElementById('reportsDbg'); if (!e) { e = el('p', { id: 'reportsDbg' }); e.style.cssText = 'font-size:12px;color:#64748b;padding:0 16px'; document.body.appendChild(e); } e.textContent = 'reports.js: ' + t; }
  function run() {
    dbg('started');
    if (typeof db === 'undefined') { dbg('db missing'); return; }
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) { dbg('no session'); return; }
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (!r.data) { dbg('no profile'); return; }
        dbg('role=' + r.data.role); try { if ((r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('reportsCard')) card(); setTimeout(function () { var rc = document.getElementById('reportsCard'); dbg('role=' + r.data.role + ', in page=' + !!rc + ', height=' + (rc ? rc.offsetHeight : 0) + ', display=' + (rc ? getComputedStyle(rc).display : 'none') + ', parent=' + (rc && rc.parentNode ? rc.parentNode.tagName : '')); }, 2500); } catch (e) { dbg('ERROR ' + e.message); }
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(run, 400); });
  run();
})();
