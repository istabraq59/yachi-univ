(function () {
  var CSS = [
    '.yu-card{width:323px;height:204px;box-sizing:border-box;border-radius:10px;border:1px solid #cbd5e1;background:#fff;position:relative;overflow:hidden;color:#0f172a;margin:8px 0}',
    '.yu-head{background:#1e3a8a;color:#fff;display:flex;align-items:center;gap:8px;padding:5px 10px;height:42px;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.yu-head img{height:30px;width:30px;object-fit:cover;border-radius:6px;background:#fff}',
    '.yu-head b{font-size:14px;letter-spacing:.5px}.yu-head small{display:block;font-size:9px;opacity:.9}',
    '.yu-body{display:flex;gap:10px;padding:8px 10px}',
    '.yu-photo{width:70px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;background:#f1f5f9;flex:none}',
    '.yu-info{font-size:11px;line-height:1.35;min-width:0}.yu-info .nm{font-size:13px;font-weight:700}',
    '.yu-sign{position:absolute;right:10px;bottom:5px;text-align:center;font-size:9px}',
    '.yu-sign img{display:block;height:34px;max-width:110px;margin:0 auto}',
    '.yu-back{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;font-size:9px;padding:10px}',
    '@media print{body *{visibility:hidden}.yu-printing,.yu-printing *{visibility:visible}.yu-printing{position:absolute;left:0;top:0;width:85.6mm}.yu-printing .yu-card{width:85.6mm;height:54mm;margin:0;border:none;border-radius:0;page-break-after:always}}'
  ].join('\n');
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function nameOf(o) { return o ? (o.name || o.title || o.program_name || o.department_name || o.unit_name || o.code || '') : ''; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function addStyle() {
    if (document.getElementById('yuCardStyle')) return;
    var s = el('style', { id: 'yuCardStyle' }); s.textContent = CSS; document.head.appendChild(s);
    var p = el('style', { id: 'yuPageStyle' }); p.textContent = '@page{size:85.6mm 54mm;margin:0}'; document.head.appendChild(p);
  }
  function assetUrl(prefix, cb) {
    db.storage.from('assets').list('', { limit: 100 }).then(function (r) {
      var re = new RegExp('^' + prefix + '\\.', 'i');
      var f = (r.data || []).filter(function (x) { return re.test(x.name); })[0];
      if (!f) { cb(null); return; }
      db.storage.from('assets').createSignedUrl(f.name, 3600).then(function (u) { cb(u.data ? u.data.signedUrl : null); });
    });
  }
  function cleanSignature(url, img) {
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      try {
        var w = im.naturalWidth, h = im.naturalHeight;
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
        var d = cx.getImageData(0, 0, w, h), p = d.data, minx = w, miny = h, maxx = 0, maxy = 0;
        var barRow = [];
        for (var by = 0; by < h; by++) { var dk = 0, cnt = 0; for (var bx = 0; bx < w; bx += 4) { var bi = (by * w + bx) * 4; cnt++; if ((p[bi] + p[bi + 1] + p[bi + 2]) / 3 < 60) dk++; } barRow[by] = dk > cnt * 0.9; }
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            var i = (y * w + x) * 4, lum = (p[i] + p[i + 1] + p[i + 2]) / 3;
            var a = (lum > 200 || barRow[y]) ? 0 : (255 - lum);
            p[i] = 0; p[i + 1] = 0; p[i + 2] = 0; p[i + 3] = a;
            if (a > 100) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
          }
        }
        if (maxx <= minx || maxy <= miny) throw new Error('empty');
        cx.putImageData(d, 0, 0);
        var pad = 12, sx = Math.max(0, minx - pad), sy = Math.max(0, miny - pad);
        var sw = Math.min(w, maxx + pad) - sx, sh = Math.min(h, maxy + pad) - sy;
        var out = document.createElement('canvas'); out.width = sw; out.height = sh;
        var oc = out.getContext('2d');
        for (var dx = -3; dx <= 3; dx += 3) { for (var dy = -3; dy <= 3; dy += 3) { oc.drawImage(cv, sx, sy, sw, sh, dx, dy, sw, sh); } }
        img.src = out.toDataURL('image/png');
      } catch (e) { img.src = url; }
    };
    im.onerror = function () { img.src = url; };
    im.src = url;
  }
  function render(out, d) {
    out.innerHTML = '';
    var isStudent = !!d.student_number;
    var role = isStudent ? 'Student' : String(d.role || '').replace(/_/g, ' ');
    var unit = nameOf(d.unit), dept = nameOf(d.department), prog = nameOf(d.program);
    var cards = el('div');
    var front = el('div', { class: 'yu-card' });
    var head = el('div', { class: 'yu-head' });
    var logo = el('img', { alt: 'Logo' }); logo.style.display = 'none';
    var ht = el('div'); ht.appendChild(el('b', { text: 'YACHI UNIVERSITY' })); ht.appendChild(el('small', { text: role.toUpperCase() + ' ID CARD' }));
    head.appendChild(logo); head.appendChild(ht); front.appendChild(head);
    var body = el('div', { class: 'yu-body' });
    var photo = el('img', { class: 'yu-photo', alt: 'Photo' }); photo.style.visibility = 'hidden';
    var info = el('div', { class: 'yu-info' });
    info.appendChild(el('div', { class: 'nm', text: d.full_name || '' }));
    function line(k, v) { if (!v) return; var p = el('div'); p.appendChild(el('b', { text: k + ': ' })); p.appendChild(document.createTextNode(v)); info.appendChild(p); }
    line('ID', d.id_number); line('College/School', unit || dept);
    if (unit && dept && unit !== dept) line('Department', dept);
    line('Program', prog); if (!isStudent) line('Title', d.title);
    body.appendChild(photo); body.appendChild(info); front.appendChild(body);
    var sign = el('div', { class: 'yu-sign' });
    var sig = el('img', { alt: '' }); sig.style.display = 'none';
    sign.appendChild(sig); sign.appendChild(el('div', { text: 'Registrar Office' })); front.appendChild(sign);
    var back = el('div', { class: 'yu-card yu-back' });
    var qr = el('div'); back.appendChild(qr);
    back.appendChild(el('b', { text: d.id_number || '' }));
    back.appendChild(el('div', { text: 'Property of Yachi University. Use this card at the gate and for meals. If found, return it to the Registrar Office.' }));
    if (window.QRCode && d.id_number) { new QRCode(qr, { text: d.id_number, width: 96, height: 96, correctLevel: QRCode.CorrectLevel.M }); }
    else { qr.textContent = '[QR not available]'; }
    cards.appendChild(front); cards.appendChild(back);
    var pb = el('button', { type: 'button', text: 'Print / Save as PDF' });
    var note = el('p');
    pb.onclick = function () {
      cards.classList.add('yu-printing');
      var done = function () { cards.classList.remove('yu-printing'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      window.print();
    };
    out.appendChild(cards); out.appendChild(pb); out.appendChild(note);
    assetUrl('logo', function (u) { if (u) { logo.src = u; logo.style.display = 'block'; } });
    assetUrl('signature', function (u) { if (u) { sig.onload = function () { sig.style.display = 'block'; }; cleanSignature(u, sig); } });
    db.storage.from('avatars').createSignedUrl(d.profile_id + '/photo.jpg', 3600).then(function (r) {
      if (r.data && r.data.signedUrl) { photo.src = r.data.signedUrl; photo.style.visibility = 'visible'; }
      else { note.textContent = 'No photo yet. Add one in My biography > Photo, then reopen this card.'; }
    });
  }
  function load(out, id) {
    out.textContent = 'Loading...';
    db.rpc('id_card_data', { p_id_number: id || null }).then(function (r) {
      if (r.error) { out.textContent = 'Could not load: ' + r.error.message; return; }
      if (!r.data) { out.textContent = 'No person with that ID.'; return; }
      render(out, r.data);
    });
  }
  function myCard() {
    var c = el('div', { class: 'card', id: 'idCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'My ID card' }));
    var out = el('div'); d.appendChild(out); c.appendChild(d); place(c);
    var done = false;
    d.addEventListener('toggle', function () { if (d.open && !done) { done = true; load(out, null); } });
  }
  function lookupCard() {
    var c = el('div', { class: 'card', id: 'idLookupCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'Print an ID card by ID' }));
    var input = el('input', { placeholder: 'ID number, e.g. STU-2026-YU00001', autocapitalize: 'characters' });
    var go = el('button', { type: 'button', text: 'Show ID card' }), out = el('div');
    d.appendChild(input); d.appendChild(go); d.appendChild(out); c.appendChild(d); place(c);
    go.onclick = function () { var id = input.value.trim().toUpperCase(); if (!id) { out.textContent = 'Enter an ID number.'; return; } load(out, id); };
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (!r.data) return;
        addStyle();
        if (!document.getElementById('idCard')) myCard();
        if ((r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('idLookupCard')) lookupCard();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
