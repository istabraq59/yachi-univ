(function () {
  // EDIT THIS TEXT: shown when someone taps Help & Support
  var HELP_TITLE = 'Help & Support';
  var HELP_TEXT = 'For help with your account, grades or payments, contact the Registrar\'s office or the Finance office. You can also use the Announcements section for notices.';

  function help() {
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    var c = document.createElement('div');
    c.style.cssText = 'background:#fff;color:#1b2540;border-radius:14px;padding:20px;max-width:420px;width:100%;font:16px/1.5 Roboto,Arial,sans-serif';
    var h = document.createElement('div'); h.textContent = HELP_TITLE; h.style.cssText = 'font-weight:700;font-size:18px;margin-bottom:8px';
    var p = document.createElement('div'); p.textContent = HELP_TEXT;
    var x = document.createElement('button'); x.textContent = 'Close';
    x.style.cssText = 'margin-top:14px;padding:10px 18px;border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-size:16px';
    x.onclick = function () { o.remove(); };
    o.onclick = function (e) { if (e.target === o) o.remove(); };
    c.appendChild(h); c.appendChild(p); c.appendChild(x); o.appendChild(c);
    document.body.appendChild(o);
  }
  function settings(nav) {
    document.body.classList.remove('yu-open');
    location.href = 'settings/';
  }
  function ensure() {
    var nav = document.querySelector('#yuSide nav'); if (!nav) return;
    if (nav.querySelector('[data-sys]')) return;
    var tmpl = nav.querySelector('.grp'), gb = nav.querySelector('.gb'), out = nav.querySelector('button.out');
    if (!tmpl || !gb || !out) return;
    var head = tmpl.cloneNode(false);
    head.textContent = 'System'; head.setAttribute('data-sys', '1');
    head.style.cssText = 'cursor:default'; head.onclick = null;
    var body = gb.cloneNode(false); body.style.display = '';
    [['Suggestion Box', function () { document.body.classList.remove('yu-open'); location.href = 'suggestions/'; }], ['Settings', function () { settings(nav); }], ['Help & Support', function () { document.body.classList.remove('yu-open'); help(); }]]
      .forEach(function (it) {
        var b = document.createElement('button'); b.textContent = it[0]; b.onclick = it[1]; body.appendChild(b);
      });
    nav.insertBefore(head, out); nav.insertBefore(body, out);
  }
  setInterval(function () { if (!document.hidden) ensure(); }, 400);
})();
