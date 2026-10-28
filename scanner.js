(function () {
  var PATTERN = /^[A-Z]{2,3}-\d{4}-YU\d{5}$/;
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function place(c) {
    var anchor = null;
    document.querySelectorAll('.card').forEach(function (x) { if (!anchor && /Signed in as/.test(x.textContent)) anchor = x; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling); else document.body.appendChild(c);
  }
  function beep(ok) {
    try {
      var A = window.AudioContext || window.webkitAudioContext, a = new A(), o = a.createOscillator();
      o.frequency.value = ok ? 880 : 220; o.connect(a.destination); o.start();
      setTimeout(function () { o.stop(); a.close(); }, ok ? 150 : 400);
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate(ok ? 80 : [200, 100, 200]);
  }
  function card() {
    var c = el('div', { class: 'card', id: 'scannerCard' });
    var d = el('details'); d.appendChild(el('summary', { text: 'Gate and meal scanner' }));
    var mode = el('select');
    [['gate:in', 'Gate - entering'], ['gate:out', 'Gate - leaving'], ['meal:breakfast', 'Meal - breakfast'], ['meal:lunch', 'Meal - lunch'], ['meal:dinner', 'Meal - dinner']].forEach(function (o) { mode.appendChild(el('option', { value: o[0], text: o[1] })); });
    var start = el('button', { type: 'button', text: 'Start camera' });
    var stop = el('button', { type: 'button', text: 'Stop camera' }); stop.style.display = 'none';
    var video = el('video', { playsinline: '' }); video.muted = true;
    video.style.cssText = 'display:none;width:100%;max-width:360px;border-radius:10px;margin:8px 0';
    var canvas = document.createElement('canvas');
    var manual = el('input', { placeholder: 'Or type the ID number', autocapitalize: 'characters' });
    var check = el('button', { type: 'button', text: 'Check ID' });
    var result = el('div');
    [mode, start, stop, video, manual, check, result].forEach(function (x) { d.appendChild(x); });
    c.appendChild(d); place(c);
    var stream = null, timer = null, last = '', lastAt = 0, busy = false;
    function show(r, code, m) {
      result.innerHTML = '';
      var box = el('div'); box.style.cssText = 'border-radius:12px;padding:12px;margin-top:10px;color:#fff;text-align:center';
      if (r.error) { box.style.background = '#b91c1c'; box.appendChild(el('h2', { text: 'ERROR' })); box.appendChild(el('p', { text: r.error.message })); result.appendChild(box); beep(false); return; }
      var x = r.data || {}, ok = !!x.ok;
      box.style.background = ok ? '#15803d' : '#b91c1c';
      box.appendChild(el('h2', { text: ok ? 'ALLOWED' : 'NOT ALLOWED' }));
      if (!ok) box.appendChild(el('p', { text: x.reason || 'Not valid' }));
      if (x.profile_id) {
        var img = el('img', { alt: 'Photo' }); img.style.cssText = 'display:none;width:140px;max-width:60%;border-radius:10px;margin:6px auto;border:2px solid #fff';
        var note = el('p');
        box.appendChild(img); box.appendChild(note);
        db.storage.from('avatars').createSignedUrl(x.profile_id + '/photo.jpg', 300).then(function (u) {
          if (u.data && u.data.signedUrl) { img.src = u.data.signedUrl; img.style.display = 'block'; } else { note.textContent = 'No photo on file'; }
        });
        box.appendChild(el('h3', { text: x.full_name || '' }));
        box.appendChild(el('p', { text: x.id_number + ' (' + String(x.role || '').replace(/_/g, ' ') + ')' }));
      }
      box.appendChild(el('p', { text: mode.options[mode.selectedIndex].text }));
      result.appendChild(box); beep(ok);
    }
    function handle(raw) {
      var code = String(raw || '').trim().toUpperCase();
      if (!PATTERN.test(code)) { result.innerHTML = ''; var b = el('div'); b.style.cssText = 'background:#b91c1c;color:#fff;border-radius:12px;padding:12px;margin-top:10px;text-align:center'; b.appendChild(el('h2', { text: 'NOT ALLOWED' })); b.appendChild(el('p', { text: 'This is not a Yachi University ID card' })); result.appendChild(b); beep(false); return; }
      if (busy || (code === last && Date.now() - lastAt < 4000)) return;
      last = code; lastAt = Date.now(); busy = true;
      var m = mode.value.split(':');
      var call = m[0] === 'gate' ? db.rpc('scan_gate', { p_id_number: code, p_direction: m[1] }) : db.rpc('scan_meal', { p_id_number: code, p_meal: m[1] });
      call.then(function (r) { busy = false; show(r, code, m); });
    }
    function tick() {
      if (video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
        var w = video.videoWidth, h = video.videoHeight, s = Math.min(1, 640 / w);
        canvas.width = Math.round(w * s); canvas.height = Math.round(h * s);
        var cx = canvas.getContext('2d', { willReadFrequently: true });
        cx.drawImage(video, 0, 0, canvas.width, canvas.height);
        var img = cx.getImageData(0, 0, canvas.width, canvas.height);
        var q = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (q && q.data) handle(q.data);
      }
      timer = setTimeout(tick, 200);
    }
    function stopCam() {
      if (timer) clearTimeout(timer); timer = null;
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null;
      video.style.display = 'none'; stop.style.display = 'none'; start.style.display = '';
    }
    start.onclick = function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { result.textContent = 'Camera is not available in this browser.'; return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
        stream = s; video.srcObject = s; video.style.display = 'block'; video.play();
        start.style.display = 'none'; stop.style.display = ''; tick();
      }).catch(function (e) { result.textContent = 'Camera not available: ' + e.message; });
    };
    stop.onclick = stopCam;
    check.onclick = function () { handle(manual.value); };
    d.addEventListener('toggle', function () { if (!d.open) stopCam(); });
  }
  function run() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user; if (!u) return;
      db.from('profiles').select('role').eq('id', u.id).single().then(function (r) {
        if (!r.data) return;
        var ok = ['support_staff', 'admin', 'administrator'].indexOf(r.data.role) >= 0;
        if (ok && !document.getElementById('scannerCard')) card();
      });
    });
  }
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(run, 400); });
  run();
})();
