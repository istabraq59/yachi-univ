(function () {
  var PLACEHOLDER = /[^\s@]+@students\.yachi\.invalid/i;
  var myId = null, timer = null;
  function apply() {
    if (!myId) return;
    document.querySelectorAll('body *').forEach(function (n) {
      if (n.children.length === 0 && /Signed in as/.test(n.textContent) && PLACEHOLDER.test(n.textContent)) {
        n.textContent = n.textContent.replace(PLACEHOLDER, myId);
      }
    });
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(apply, 200); }
  function load() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) {
      var u = s.data && s.data.session && s.data.session.user;
      if (!u || !PLACEHOLDER.test(u.email || '')) { myId = null; return; }
      db.from('profiles').select('id_number').eq('id', u.id).single().then(function (r) {
        myId = (r.data && r.data.id_number) || null; apply();
      });
    });
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(load, 500); });
  load();
})();
