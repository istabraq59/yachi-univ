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
