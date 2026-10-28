(function () {
  var BUCKET = 'avatars';
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function shrink(file, cb) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var tw = 413, th = 531, s = Math.max(tw / img.width, th / img.height), sw = tw / s, sh = th / s, sx = (img.width - sw) / 2, sy = (img.height - sh) * 0.35;
      var cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
      cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
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
  function box(parent) {
    var wrap = el('div');
    var img = el('img', { alt: 'Photo' });
    img.style.cssText = 'display:none;max-width:200px;width:60%;border-radius:12px;margin:8px 0';
    var note = el('p', { text: 'Loading photo...' });
    wrap.appendChild(el('h3', { text: 'Photo' })); wrap.appendChild(img); wrap.appendChild(note);
    parent.appendChild(wrap);
    return { wrap: wrap, img: img, note: note };
  }
  window.YUPhoto = {
    mine: function (parent, uid) {
      var b = box(parent), path = uid + '/photo.jpg';
      var pick = el('input', { type: 'file', accept: 'image/*' });
      var rm = el('button', { type: 'button', text: 'Remove my photo' });
      var msg = el('p');
      b.wrap.appendChild(pick); b.wrap.appendChild(rm); b.wrap.appendChild(msg);
      show(b.img, b.note, path);
      pick.onchange = function () {
        var f = pick.files && pick.files[0]; if (!f) return;
        msg.textContent = 'Preparing...';
        shrink(f, function (blob) {
          if (!blob) { msg.textContent = 'That file is not a picture.'; return; }
          msg.textContent = 'Uploading...';
          db.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: 'image/jpeg' }).then(function (r) {
            if (r.error) { msg.textContent = 'Could not upload: ' + r.error.message; return; }
            msg.textContent = 'Photo saved.'; show(b.img, b.note, path); pick.value = '';
          });
        });
      };
      rm.onclick = function () {
        db.storage.from(BUCKET).remove([path]).then(function (r) {
          msg.textContent = r.error ? ('Could not remove: ' + r.error.message) : 'Photo removed.';
          show(b.img, b.note, path);
        });
      };
    },
    view: function (parent, profileId) {
      var b = box(parent);
      b.wrap.removeChild(b.wrap.firstChild);
      show(b.img, b.note, profileId + '/photo.jpg');
    }
  };
})();
