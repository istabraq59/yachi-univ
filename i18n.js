/* i18n.js - shows the system in Amharic or Afaan Oromoo WITHOUT changing the page text that other scripts read.
   The English text stays in the page (hidden); only what you see on screen is swapped.
   Does nothing at all when the language is English. Phrases live in i18n-data.js. */
(function () {
  if (window.yuI18n) return;
  var D = window.YU_DICT || {}, PX = window.YU_PREFIX || [];
  var IDX = { am: 0, om: 1 };
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT|TITLE|CODE|PRE|SVG|PATH)$/;
  var ANCHOR = /Signed in as/;          /* other scripts find this text: leave it alone */
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var lang = 'en', mo = null, queue = [], raf = 0, missing = {}, nMiss = 0;

  var css = document.createElement('style');
  css.textContent = '.yu-w{font-size:0!important;line-height:0!important;letter-spacing:0!important;display:inline!important;background:none!important;border:0!important;padding:0!important;margin:0!important;box-shadow:none!important;width:auto!important;height:auto!important;position:static!important;opacity:1!important}' +
    '.yu-w::before{content:attr(data-tr);font-size:var(--yu-fs,16px);line-height:var(--yu-lh,normal);letter-spacing:var(--yu-ls,normal)}';
  (document.head || document.documentElement).appendChild(css);

  function lookup(core) {
    var i = IDX[lang], e = D[core];
    if (e) return e[i] || null;
    for (var k = 0; k < PX.length; k++) {
      var p = PX[k][0];
      if (core.indexOf(p) === 0 || (p.slice(-1) === ' ' && (core + ' ').indexOf(p) === 0)) {
        var t = PX[k][1][i]; if (t) return t + core.slice(p.length);
      }
    }
    return null;
  }
  function remember(core) {
    if (core.length > 90 || !/[A-Za-z]{3}/.test(core) || /@|^\d/.test(core) || missing[core] || nMiss > 500) return;
    missing[core] = 1; nMiss++;
  }

  function wrapText(n) {
    var p = n.parentNode; if (!p || p.nodeType !== 1) return null;
    if (SKIP.test(p.nodeName) || (p.closest && p.closest('[data-no-i18n]'))) return null;
    if (p.nodeName === 'OPTION') { option(p); return null; }
    var raw = n.nodeValue, core = raw.trim();
    if (core.length < 2) return null;
    if (p.className === 'yu-w') {                       /* already wrapped: has the text changed? */
      if (p.getAttribute('data-src') === core) return null;
      var tr0 = lookup(core);
      if (!tr0) { unwrap(p); remember(core); return null; }
      p.setAttribute('data-tr', tr0); p.setAttribute('data-src', core); return null;
    }
    if (ANCHOR.test(core)) return null;
    var tr = lookup(core);
    if (!tr) { remember(core); return null; }
    var sp = document.createElement('span');
    sp.className = 'yu-w';
    sp.setAttribute('data-src', core);
    sp.setAttribute('data-tr', (/^\s/.test(raw) ? ' ' : '') + tr + (/\s$/.test(raw) ? ' ' : ''));
    p.insertBefore(sp, n); sp.appendChild(n);
    return sp;
  }
  function unwrap(sp) {
    var p = sp.parentNode; if (!p) return;
    while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
    p.removeChild(sp);
  }
  function option(o) {
    var core = (o.textContent || '').trim(), tr = lookup(core);
    if (tr) { if (o.getAttribute('data-src') == null) o.setAttribute('data-src', o.label); o.label = tr; }
  }
  function attrs(el) {
    if (el.closest && el.closest('[data-no-i18n]')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a); if (!v) continue;
      var key = 'data-i18n-' + a, src = el.getAttribute(key);
      if (src != null && lookup(src.trim()) === v) continue;   /* already translated by us */
      var core = v.trim(), tr = lookup(core);
      if (tr) { if (src == null) el.setAttribute(key, v); el.setAttribute(a, tr); } else remember(core);
    }
  }

  function walk(node, out) {
    if (node.nodeType === 3) { var s = wrapText(node); if (s) out.push(s); return; }
    if (node.nodeType !== 1) return;
    if (SKIP.test(node.nodeName)) return;
    if (node.className === 'yu-w') return;
    var tw = document.createTreeWalker(node, 4 /* text */), t, list = [];
    while ((t = tw.nextNode())) list.push(t);
    list.forEach(function (x) { var s = wrapText(x); if (s) out.push(s); });
    if (node.matches && node.matches('[placeholder],[title],[aria-label],[alt]')) attrs(node);
    [].forEach.call(node.querySelectorAll ? node.querySelectorAll('[placeholder],[title],[aria-label],[alt]') : [], attrs);
  }
  function flush() {
    raf = 0; var q = queue; queue = []; var spans = [];
    q.forEach(function (n) { if (n.isConnected !== false) walk(n, spans); });
    /* read all sizes first, then write (one layout pass) */
    var vals = spans.map(function (s) {
      var cs = window.getComputedStyle(s.parentNode);
      return [cs.fontSize, cs.lineHeight, cs.letterSpacing];
    });
    spans.forEach(function (s, i) {
      s.style.setProperty('--yu-fs', vals[i][0]);
      if (vals[i][1] && vals[i][1] !== 'normal') s.style.setProperty('--yu-lh', vals[i][1]);
      if (vals[i][2] && vals[i][2] !== 'normal') s.style.setProperty('--yu-ls', vals[i][2]);
    });
    try { sessionStorage.setItem('yu_missing', JSON.stringify(Object.keys(missing))); } catch (e) {}
  }
  function schedule(n) { queue.push(n); if (!raf) raf = requestAnimationFrame(flush); }

  function start() {
    if (mo || !document.body) return;
    mo = new MutationObserver(function (recs) {
      recs.forEach(function (r) {
        if (r.type === 'childList') [].forEach.call(r.addedNodes, function (n) { if (!(n.nodeType === 1 && n.className === 'yu-w')) schedule(n); });
        else if (r.type === 'characterData') schedule(r.target);
        else if (r.type === 'attributes') schedule(r.target);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    schedule(document.body);
  }
  function stop() {
    if (mo) { mo.disconnect(); mo = null; }
    [].slice.call(document.querySelectorAll('.yu-w')).forEach(unwrap);
    ATTRS.forEach(function (a) {
      [].forEach.call(document.querySelectorAll('[data-i18n-' + a + ']'), function (el) { el.setAttribute(a, el.getAttribute('data-i18n-' + a)); el.removeAttribute('data-i18n-' + a); });
    });
    [].forEach.call(document.querySelectorAll('option[data-src]'), function (o) { o.label = o.getAttribute('data-src'); o.removeAttribute('data-src'); });
  }
  function setLang(l) {
    l = IDX[l] != null ? l : 'en';
    if (l === lang) return;
    if (lang !== 'en') stop();
    lang = l;
    if (lang !== 'en') { if (document.body) start(); else document.addEventListener('DOMContentLoaded', start); }
  }
  function fromPrefs() { try { setLang(window.yuPrefs ? window.yuPrefs.get().language : 'en'); } catch (e) {} }

  window.yuI18n = { set: setLang, lang: function () { return lang; }, missing: function () { return Object.keys(missing); } };
  fromPrefs();
  document.addEventListener('yu-prefs', fromPrefs);
})();
