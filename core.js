/* core.js - cuts duplicate Supabase requests. Must load AFTER config.js and BEFORE supabase.createClient.
   Safe by design: it only shares identical read requests, and any write clears the shared copies. */
(function () {
  if (window.__yuCore || !window.fetch || typeof SUPABASE_URL !== 'string') return;
  window.__yuCore = 1;
  var base = SUPABASE_URL, _fetch = window.fetch.bind(window);
  var SHORT = 8000, LONG = 60000, store = {};
  var ROLE_RPC = /^\/rest\/v1\/rpc\/(exam_role|clinic_role|fin_is_staff)(\?|$)/;
  /* read-only rpc functions: calling them never changes data, so they do not clear the shared copies */
  var READ_RPC = /^\/rest\/v1\/rpc\/(list_\w+|pending_\w+|my_\w+|dorm_students|id_card_data|fin_overview|fin_is_staff|clinic_reg_info|exam_(role|dashboard|student_list|results_list|my_courses|conflicts|eligible_students|session_paper|grading_paper|report_\w+))(\?|$)/;
  var KEYH = ['authorization', 'accept', 'prefer', 'range', 'range-unit', 'accept-profile', 'content-profile'];

  function flush(keepLong) {
    for (var k in store) if (!keepLong || !store[k].long) delete store[k];
  }
  function subOf(auth) {
    try { var t = String(auth || '').replace(/^Bearer /i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(atob(t)).sub || ''; } catch (e) { return ''; }
  }
  window.yuFresh = function () { flush(true); };   /* drops short-lived copies, keeps role lookups */

  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || String(input);
      if (url.indexOf(base) !== 0) return _fetch(input, init);
      var path = url.slice(base.length);
      var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      var roleRpc = method === 'POST' && ROLE_RPC.test(path);
      var readRpc = roleRpc || (method === 'POST' && READ_RPC.test(path));
      var read = (method === 'GET' || method === 'HEAD') && (path.indexOf('/rest/v1/') === 0 || path.indexOf('/auth/v1/user') === 0);
      if (!read && !readRpc) {
        if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && !(method === 'POST' && READ_RPC.test(path))) {
          flush(false);
          var w = _fetch(input, init);
          w.then(function () { flush(false); }, function () {});
          return w;
        }
        return _fetch(input, init);
      }
      if (init && init.signal) return _fetch(input, init);
      var h = new Headers((init && init.headers) || (input && input.headers) || undefined);
      var key = method + ' ' + url + '|' + KEYH.map(function (n) { return h.get(n) || ''; }).join('|') +
        (readRpc ? '|' + (init && typeof init.body === 'string' ? init.body : '') : '');
      var now = Date.now(), e = store[key];
      if (e && e.t > now) return e.p.then(function (r) { return r.clone(); });
      var long = roleRpc || path.indexOf('/auth/v1/user') === 0 ||
        (path.indexOf('/rest/v1/profiles?') === 0 && path.indexOf('id=eq.' + subOf(h.get('authorization'))) > -1 && subOf(h.get('authorization')) !== '');
      var p = _fetch(input, init);
      var ent = { p: p, t: now + (long ? LONG : SHORT), long: long };
      store[key] = ent;
      p.then(function (r) { if (!r.ok && store[key] === ent) delete store[key]; },
             function () { if (store[key] === ent) delete store[key]; });
      return p.then(function (r) { return r.clone(); });
    } catch (err) { return _fetch(input, init); }
  };

  /* A click or form submit means the person wants fresh data. */
  document.addEventListener('click', window.yuFresh, true);
  document.addEventListener('submit', window.yuFresh, true);

  /* Load a heavy library only when it is needed. */
  var loaded = {};
  window.yuLoad = function (src) {
    if (loaded[src]) return loaded[src];
    return (loaded[src] = new Promise(function (res) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { res(true); };
      s.onerror = function () { delete loaded[src]; res(false); };
      document.head.appendChild(s);
    }));
  };
})();
