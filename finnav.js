(function () {
  var open = false, STAFF = null, asked = false;
  var STAFF_ITEMS = [
    ['Finance Dashboard', 'overview'], ['Payer Management', 'payers'],
    ['Payment Management', 'payments'], ['Bank Accounts', 'bankaccounts'],
    ['Payment Verification', 'verify'], ['Invoices', 'invoices'],
    ['Penalties & Fines', 'penalties'], ['Receipts', 'receipts'],
    ['Refund Management', 'refunds'], ['Financial Reports', 'reports'],
    ['Finance Settings', 'settings']
  ];
  function go(id) { location.href = 'finance/#/' + id; }
  function paintHead(head) {
    head.textContent = '';
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
    var a = document.createElement('span'); a.textContent = 'Finance';
    var c = document.createElement('span'); c.textContent = open ? '\u25BE' : '\u25B8';
    head.appendChild(a); head.appendChild(c);
  }
  function paintBody(body) {
    body.style.display = open ? '' : 'none';
    body.innerHTML = '';
    var list = STAFF ? STAFF_ITEMS : [['My finance', 'mine']];
    list.forEach(function (it) {
      var b = document.createElement('button');
      b.textContent = it[0];
      b.onclick = function () { go(it[1]); };
      body.appendChild(b);
    });
  }
  function parts() {
    var nav = document.querySelector('#yuSide nav'); if (!nav) return null;
    var head = nav.querySelector('[data-fin-grp]'); if (!head) return null;
    return { nav: nav, head: head, body: head.nextSibling };
  }
  function refresh() { var p = parts(); if (p) { paintHead(p.head); paintBody(p.body); } }
  function askStaff() {
    if (asked || typeof db === 'undefined') return;
    asked = true;
    try {
      db.rpc('fin_is_staff').then(function (r) { STAFF = !!(r && r.data === true); refresh(); },
        function () { STAFF = false; refresh(); });
    } catch (e) { STAFF = false; }
  }
  function ensure() {
    askStaff();
    var nav = document.querySelector('#yuSide nav'); if (!nav) return;
    if (nav.querySelector('[data-fin-grp]')) return;
    var tmpl = nav.querySelector('.grp'), gb = nav.querySelector('.gb');
    if (!tmpl || !gb) return;
    var old = nav.querySelector('button[data-fin]'); if (old) old.remove();
    var head = tmpl.cloneNode(false), body = gb.cloneNode(false);
    head.setAttribute('data-fin', '1'); head.setAttribute('data-fin-grp', '1');
    head.onclick = function () { open = !open; refresh(); };
    var ex = null;
    [].forEach.call(nav.querySelectorAll('.grp'), function (g) { if (/^Examinations/.test(g.textContent)) ex = g; });
    var ref = ex && ex.nextSibling ? ex.nextSibling.nextSibling : (nav.querySelector('button.out') || null);
    nav.insertBefore(head, ref);
    nav.insertBefore(body, head.nextSibling);
    paintHead(head); paintBody(body);
  }
  setInterval(function () { if (!document.hidden) ensure(); }, 400);
})();
