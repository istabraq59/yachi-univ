(function () {
  var cache = null, ticking = false, timer;
  function money(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB'; }
  function addSide() {
    var nav = document.querySelector('#yuSide nav');
    if (!nav || nav.querySelector('[data-fin]')) return;
    var first = nav.querySelector('button');
    if (!first) return;
    var b = first.cloneNode(true);
    Array.prototype.slice.call(b.attributes).forEach(function (a) {
      if (a.name.indexOf('data-') === 0 || a.name === 'id') b.removeAttribute(a.name);
    });
    ['active', 'on', 'sel', 'current', 'selected'].forEach(function (c) { b.classList.remove(c); });
    b.setAttribute('data-fin', '1');
    var tn = [], w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (w.currentNode.nodeValue.trim()) tn.push(w.currentNode);
    if (tn.length === 0) b.textContent = '💳 Finance';
    else if (tn.length === 1) tn[0].nodeValue = '💳 Finance';
    else { tn[0].nodeValue = '💳'; tn[tn.length - 1].nodeValue = ' Finance'; }
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); location.href = 'finance/'; }, true);
    nav.appendChild(b);
  }
  function render() {
    var home = document.getElementById('yuHome');
    if (!home || !cache) return;
    var c = document.getElementById('finHomeCard');
    if (!c) {
      c = document.createElement('div');
      c.id = 'finHomeCard';
      c.style.cssText = 'background:#fff;border-left:5px solid #1e40af;border-radius:12px;padding:14px 16px;margin:12px 0;box-shadow:0 1px 4px rgba(0,0,0,.12);line-height:1.6';
      var qa = document.getElementById('yuQa');
      if (qa && qa.parentNode) qa.parentNode.insertBefore(c, qa); else home.insertBefore(c, home.firstChild);
    }
    var h = '<b style="color:#1e3a8a">💳 Finance</b><br>';
    if (cache.staff) h += cache.pending + ' payment(s) waiting for review · outstanding ' + money(cache.outstanding) + '<br>';
    if (cache.mine !== null) h += 'Your outstanding balance: <b>' + money(cache.mine) + '</b><br>';
    var btn = 'display:inline-block;margin:6px 8px 0 0;padding:7px 14px;border-radius:8px;text-decoration:none;';
    h += '<a href="finance/" style="' + btn + 'background:#1d4ed8;color:#fff">Open Finance</a>';
    h += '<a href="finance/#/pay" style="' + btn + 'border:1px solid #1d4ed8;color:#1d4ed8">Pay as guest</a>';
    c.innerHTML = h;
  }
  function load() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) return;
      Promise.all([
        db.rpc('fin_overview'),
        db.from('payers').select('id').eq('profile_id', s.user.id).limit(1)
      ]).then(function (res) {
        var ov = (res[0] && res[0].data) || {};
        var py = res[1] && res[1].data && res[1].data[0];
        var info = { staff: !!ov.is_staff, pending: ov.pending_submissions || 0, outstanding: ov.outstanding || 0, mine: null };
        if (py) {
          db.from('invoices').select('balance,status').eq('payer_id', py.id).in('status', ['open', 'partial']).then(function (r2) {
            var t = 0; (r2.data || []).forEach(function (i) { t += Number(i.balance); });
            info.mine = t; cache = info; render();
          });
        } else { cache = info; render(); }
      });
    });
  }
  function ensure() { addSide(); render(); }
  var mo = new MutationObserver(function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; ensure(); });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  db.auth.onAuthStateChange(function () { setTimeout(load, 900); });
  setTimeout(load, 1500);
  clearInterval(timer); timer = setInterval(load, 60000);
})();
