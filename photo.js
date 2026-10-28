(function () {
  var BUCKET = 'avatars';
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function shrink(file, cb) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var max = 400, w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) { cb(b); }, 'image/jpeg', 0.8);
    };
    img.onerror = function () { cb(null); };
    img.src = url;
  }
  function show(img, note, path) {
    db.storage.from(BUCKET).createSignedUrl(path, 300).then(function (r) {
      if (r.error || !r.data) { img.style.display = 'none'; note.textContent = 'No photo yet.'; return; }
      img.src = r.data.signedUrl + '&t=' + Date.now(); img.style.display = 'block'; note.textContent = '';
    });
  }
  function myCard(uid) {
    var c = el('div', { class: 'card', id: 'photoCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'My photo' }));
    var img = el('img', { alt: 'My photo' }); img.style.cssText = 'display:none;max-width:200px;width:60%;border-radius:12px;margin:8px 0';
    var note = el('p', { text: 'Loading...' });
    var pick = el('input', { type: 'file', accept: 'image/*' });
    var rm = el('button', { type: 'button', text: 'Remove my photo' });
    var msg = el('p');
    d.appendChild(el('p', { text: 'Only you and the registrar\'s office can see your photo. Use a clear face photo.' }));
    d.appendChild(img); d.appendChild(note); d.appendChild(pick); d.appendChild(rm); d.appendChild(msg);
    c.appendChild(d); place(c);
    var path = uid + '/photo.jpg';
    show(img, note, path);
    pick.onchange = function () {
      var f = pick.files && pick.files[0]; if (!f) return;
      msg.textContent = 'Preparing...';
      shrink(f, function (blob) {
        if (!blob) { msg.textContent = 'That file is not a picture.'; return; }
        msg.textContent = 'Uploading...';
        db.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: 'image/jpeg' }).then(function (r) {
          if (r.error) { msg.textContent = 'Could not upload: ' + r.error.message; return; }
          msg.textContent = 'Saved.'; show(img, note, path); pick.value = '';
        });
      });
    };
    rm.onclick = function () {
      db.storage.from(BUCKET).remove([path]).then(function (r) {
        msg.textContent = r.error ? ('Could not remove: ' + r.error.message) : 'Photo removed.';
        show(img, note, path);
      });
    };
  }
  function lookupCard() {
    var c = el('div', { class: 'card', id: 'photoLookupCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'Look up a photo by ID' }));
    var input = el('input', { placeholder: 'ID number, e.g. STU-2026-YU00001', autocapitalize: 'characters' });
    var go = el('button', { type: 'button', text: 'Show photo' }), out = el('div');
    d.appendChild(input); d.appendChild(go); d.appendChild(out); c.appendChild(d); place(c);
    go.onclick = function () {
      var id = input.value.trim().toUpperCase(); out.innerHTML = '';
      if (!id) { out.textContent = 'Enter an ID number.'; return; }
      db.from('profiles').select('id,full_name').eq('id_number', id).maybeSingle().then(function (p) {
        if (p.error || !p.data) { out.textContent = 'No person with that ID.'; return; }
        out.appendChild(el('h3', { text: id + ' - ' + (p.data.full_name || '') }));
        var img = el('img', { alt: 'Photo' }); img.style.cssText = 'display:none;max-width:220px;width:70%;border-radius:12px';
        var note = el('p', { text: 'Loading...' });
        out.appendChild(img); out.appendChild(note);
        show(img, note, p.data.id + '/photo.jpg');
      });
    };
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (!r.data) return;
        if (!document.getElementById('photoCard')) myCard(u.id);
        if ((r.data.role === 'admin' || r.data.role === 'administrator') && !document.getElementById('photoLookupCard')) lookupCard();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 400); });
  check();
})();
