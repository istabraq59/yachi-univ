(function () {
  var el, timer, maxT, obs;
  function arm(ms) { clearTimeout(timer); timer = setTimeout(hide, ms); }
  function hide() {
    clearTimeout(timer); clearTimeout(maxT);
    if (!el) return;
    var e = el; el = null;
    e.style.opacity = '0';
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); if (obs) obs.disconnect(); }, 400);
  }
  el = document.createElement('div');
  el.id = 'yuSplash';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#f3f6fb;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;transition:opacity .35s';
  el.innerHTML = '<style>@keyframes yuspin{to{transform:rotate(360deg)}}</style><div style="width:42px;height:42px;border:4px solid #c7d2fe;border-top-color:#1e40af;border-radius:50%;animation:yuspin .8s linear infinite"></div><div style="font:600 15px sans-serif;color:#1e3a8a">Yachi University</div>';
  document.documentElement.appendChild(el);
  arm(1500);
  maxT = setTimeout(hide, 6000);
  obs = new MutationObserver(function () { if (el) arm(1200); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
