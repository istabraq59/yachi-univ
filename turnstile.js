(function () {
  var SITEKEY = '0x4AAAAAAFvl5KaVPqw8kcfn';
  var wid = null, pending = null, loading = null, box;
  function load() {
    if (loading) return loading;
    loading = new Promise(function (res) {
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = function () { res(true); };
      s.onerror = function () { res(false); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function ensureWidget() {
    if (wid !== null) return true;
    if (!window.turnstile) return false;
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:100000';
    document.body.appendChild(box);
    wid = window.turnstile.render(box, {
      sitekey: SITEKEY,
      execution: 'execute',
      appearance: 'interaction-only',
      callback: function (t) { if (pending) { pending(t); pending = null; } },
      'error-callback': function () { if (pending) { pending(null); pending = null; } }
    });
    return true;
  }
  window.yuCaptcha = function () {
    return load().then(function (ok) {
      if (!ok || !ensureWidget()) return null;
      return new Promise(function (resolve) {
        var done = false;
        var t = setTimeout(function () { if (!done) { done = true; pending = null; resolve(null); } }, 8000);
        pending = function (tok) { if (!done) { done = true; clearTimeout(t); resolve(tok); } };
        try { window.turnstile.reset(wid); window.turnstile.execute(wid); }
        catch (e) { pending = null; clearTimeout(t); resolve(null); }
      });
    });
  };
})();

(function () {
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : ((input && input.url) || '');
      if (/\/functions\/v1\/(id-signin|student-signup)/.test(url) && init && typeof init.body === 'string') {
        return (window.yuCaptcha ? window.yuCaptcha() : Promise.resolve(null))
          .catch(function () { return null })
          .then(function (tok) {
            try {
              var o = JSON.parse(init.body);
              o.captcha = tok;
              init = Object.assign({}, init, { body: JSON.stringify(o) });
            } catch (e) {}
            return _fetch(input, init);
          });
      }
    } catch (e) {}
    return _fetch(input, init);
  };
})();

(function () {
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : ((input && input.url) || '');
      if (/\/functions\/v1\/(id-signin|student-signup)/.test(url) && init && typeof init.body === 'string') {
        return (window.yuCaptcha ? window.yuCaptcha() : Promise.resolve(null))
          .catch(function () { return null })
          .then(function (tok) {
            try {
              var o = JSON.parse(init.body);
              o.captcha = tok;
              init = Object.assign({}, init, { body: JSON.stringify(o) });
            } catch (e) {}
            return _fetch(input, init);
          });
      }
    } catch (e) {}
    return _fetch(input, init);
  };
})();

(function () {
  var orig = window.yuCaptcha;
  if (!orig) return;
  window.yuCaptcha = function () {
    return Promise.resolve(orig()).then(function (tok) {
      if (!tok) {
        var d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100001;background:#b91c1c;color:#fff;padding:8px;font:14px sans-serif';
        d.textContent = 'CAPTCHA debug: no token. Cloudflare script loaded: ' + (window.turnstile ? 'yes' : 'NO');
        document.body.appendChild(d);
        setTimeout(function () { d.remove(); }, 15000);
      }
      return tok;
    });
  };
})();

(function () {
  window.__tsErr = 'none reported (timeout or hang)';
  var iv = setInterval(function () {
    if (!window.turnstile || window.turnstile.__p) return;
    window.turnstile.__p = 1;
    clearInterval(iv);
    var r = window.turnstile.render;
    window.turnstile.render = function (el, o) {
      var e0 = o['error-callback'];
      o['error-callback'] = function (c) { window.__tsErr = 'error ' + c; if (e0) e0(c); return true; };
      o['timeout-callback'] = function () { window.__tsErr = 'timeout-callback'; };
      o['unsupported-callback'] = function () { window.__tsErr = 'unsupported browser'; };
      return r.call(window.turnstile, el, o);
    };
  }, 30);
  var o2 = window.yuCaptcha;
  if (!o2) return;
  window.yuCaptcha = function () {
    return Promise.resolve(o2()).then(function (tok) {
      if (!tok) {
        var d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:48px;left:0;right:0;z-index:100001;background:#92400e;color:#fff;padding:8px;font:14px sans-serif';
        d.textContent = 'Turnstile: ' + window.__tsErr;
        document.body.appendChild(d);
        setTimeout(function () { d.remove(); }, 15000);
      }
      return tok;
    });
  };
})();

(function () {
  var KEY = '0x4AAAAAAFvl5KaVPqw8kcfn', wid = null, tok = null, waiters = [], box = null, st = null, slot = null;
  function say(m) { if (st) st.textContent = 'Security check: ' + m; }
  function render() {
    if (wid !== null || !window.turnstile || !slot) return;
    say('running…');
    wid = window.turnstile.render(slot, {
      sitekey: KEY,
      appearance: 'interaction-only',
      callback: function (t) {
        say('ready ✓');
        if (waiters.length) {
          var w = waiters.splice(0); tok = null;
          w.forEach(function (f) { f(t); });
          try { window.turnstile.reset(wid); } catch (e) {}
        } else { tok = t; }
      },
      'error-callback': function (c) { say('error ' + c); waiters.splice(0).forEach(function (f) { f(null); }); return true; },
      'expired-callback': function () { tok = null; try { window.turnstile.reset(wid); } catch (e) {} },
      'timeout-callback': function () { try { window.turnstile.reset(wid); } catch (e) {} }
    });
  }
  function mount() {
    if (box || !document.body) return;
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:100000;background:transparent;padding:0;max-width:95vw';
    st = document.createElement('div'); st.textContent = 'Security check: loading…'; st.style.display = 'none';
    slot = document.createElement('div');
    box.appendChild(st); box.appendChild(slot); document.body.appendChild(box);
    if (window.turnstile) { render(); return; }
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.onload = render; s.onerror = function () { say('could not load Cloudflare'); };
    document.head.appendChild(s);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  window.yuCaptcha = function () {
    mount();
    return new Promise(function (res) {
      if (tok) { var t = tok; tok = null; try { window.turnstile.reset(wid); } catch (e) {} return res(t); }
      var done = false;
      waiters.push(function (t) { if (!done) { done = true; res(t); } });
      setTimeout(function () { if (!done) { done = true; res(null); } }, 25000);
    });
  };
})();
