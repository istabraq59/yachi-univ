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
