/* prefs.js - per-person settings (theme, text size, language, regional). Loaded on every page.
   Applies the saved choices instantly from this device, then syncs with the user_settings table. */
(function () {
  if (window.yuPrefs) return;
  var KEY = 'yu_prefs', VERSION = '2026.11.03b';
  var DEF = { language: 'en', theme: 'light', text_size: 'normal', timezone: 'Africa/Addis_Ababa', date_format: 'dmy',
              time_format: '12h', calendar: 'gregorian', week_start: 'mon', notifications: {} };
  var COLS = Object.keys(DEF).join(',');
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  var P;
  try { P = Object.assign(copy(DEF), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { P = copy(DEF); }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function isDark() { return P.theme === 'dark' || (P.theme === 'system' && !!(mq && mq.matches)); }

  var css = document.createElement('style');
  if (!window.YU_NATIVE_THEME) {
    /* pages that have no dark colours of their own get a safe colour inversion */
    css.textContent = 'html[data-theme=dark]{filter:invert(.92) hue-rotate(180deg);background:#fff}' +
      'html[data-theme=dark] img,html[data-theme=dark] video,html[data-theme=dark] canvas,html[data-theme=dark] iframe{filter:invert(1) hue-rotate(180deg)}' +
      /* the navy top bar and side menu are already dark: flip them back so they stay dark */
      'html[data-theme=dark] #yuTop,html[data-theme=dark] #yuSide{filter:invert(.92) hue-rotate(180deg) brightness(1.1)}';
    (document.head || document.documentElement).appendChild(css);
  }
  function apply() {
    var h = document.documentElement;
    h.setAttribute('data-theme', isDark() ? 'dark' : 'light');
    h.setAttribute('lang', P.language);
    h.setAttribute('dir', P.language === 'ar' ? 'rtl' : 'ltr');
    var z = { small: 0.9, normal: 1, large: 1.12, xlarge: 1.25 }[P.text_size] || 1;
    h.style.zoom = z === 1 ? '' : String(z);
  }
  apply();
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);

  function client() { return typeof db !== 'undefined' ? db : null; }
  function session() {
    var d = client(); if (!d) return Promise.resolve(null);
    return d.auth.getSession().then(function (r) { return (r.data && r.data.session) || null; }, function () { return null; });
  }
  function sync() {
    return session().then(function (s) {
      if (!s) return false;
      return client().from('user_settings').select(COLS).eq('user_id', s.user.id).maybeSingle().then(function (x) {
        if (x.error) return false;
        /* a saved row wins. With no row, keep this phone's choices only if they belong to the same person */
        if (x.data) P = Object.assign(copy(DEF), x.data);
        else if (P._uid !== s.user.id) P = copy(DEF);
        P._uid = s.user.id;
        if (!P.notifications || typeof P.notifications !== 'object') P.notifications = {};
        store(); apply();
        document.dispatchEvent(new CustomEvent('yu-prefs'));
        return true;
      });
    }).catch(function () { return false; });
  }
  function set(patch) {
    Object.assign(P, patch); store(); apply();
    document.dispatchEvent(new CustomEvent('yu-prefs'));
    return session().then(function (s) {
      if (!s) return { error: { message: 'Not signed in' } };
      if (P._uid !== s.user.id) { P._uid = s.user.id; store(); }
      var row = Object.assign({ user_id: s.user.id, updated_at: new Date().toISOString() }, patch);
      return client().from('user_settings').upsert(row, { onConflict: 'user_id' }).then(function (r) { return { error: r.error || null }; });
    }).catch(function (e) { return { error: { message: String(e && e.message || e) } }; });
  }

  function tz() { try { new Intl.DateTimeFormat('en', { timeZone: P.timezone }); return P.timezone; } catch (e) { return undefined; } }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(d) {
    d = d ? new Date(d) : new Date(); if (isNaN(d)) return '';
    if (P.calendar === 'ethiopic') {
      try { return new Intl.DateTimeFormat('en-u-ca-ethiopic', { timeZone: tz(), day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s+(ERA\d+|AM)$/i, ''); } catch (e) {}
    }
    var parts = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: tz(), year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
    if (P.date_format === 'mdy') return parts.month + '/' + parts.day + '/' + parts.year;
    if (P.date_format === 'ymd') return parts.year + '-' + parts.month + '-' + parts.day;
    if (P.date_format === 'long') return Number(parts.day) + ' ' + MON[Number(parts.month) - 1] + ' ' + parts.year;
    return parts.day + '/' + parts.month + '/' + parts.year;
  }
  function fmtTime(d) {
    d = d ? new Date(d) : new Date(); if (isNaN(d)) return '';
    return new Intl.DateTimeFormat('en-GB', { timeZone: tz(), hour: '2-digit', minute: '2-digit', hour12: P.time_format === '12h' }).format(d);
  }

  window.yuPrefs = {
    version: VERSION, DEF: DEF,
    get: function () { return copy(P); },
    set: set, sync: sync, apply: apply,
    fmtDate: fmtDate, fmtTime: fmtTime,
    fmtDateTime: function (d) { return fmtDate(d) + ' ' + fmtTime(d); }
  };

  /* connect to the page's Supabase client as soon as it exists */
  var tries = 0, iv = setInterval(function () {
    if (client()) {
      clearInterval(iv);
      sync();
      client().auth.onAuthStateChange(function (ev) {
        if (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') setTimeout(sync, 250);
      });
    } else if (++tries > 100) clearInterval(iv);
  }, 100);
})();
