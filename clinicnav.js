(function () {
  var ROLE, asked = false;
  var ITEMS = [
    ['Clinic dashboard', 'dashboard', ['admin', 'card_room', 'clinic']],
    ['Register student', 'register', ['admin', 'card_room']],
    ['Clinic card', 'card', ['admin', 'card_room']],
    ['Lookup & verify', 'lookup', ['admin', 'card_room', 'clinic']],
    ['New visit', 'visit', ['admin', 'clinic']],
    ['Visit history', 'history', ['admin', 'clinic']],
    ['Clinic staff', 'staff', ['admin']]
  ];
  function go(id) { document.body.classList.remove('yu-open'); location.href = 'clinic/#/' + id; }
  function ensure() {
    if (!asked && typeof db !== 'undefined') {
      asked = true;
      db.rpc('clinic_role').then(function (r) { ROLE = (r && r.data) || 'none'; }, function () { ROLE = 'none'; });
    }
    if (!ROLE || ROLE === 'none') return;
    var nav = document.querySelector('#yuSide nav'); if (!nav) return;
    if (nav.querySelector('[data-clinic-grp]')) return;
    var heads = [].slice.call(nav.querySelectorAll('.grp'));
    var model = heads.filter(function (g) { return /^Examinations/.test(g.textContent); })[0];
    if (!model || !model.nextSibling) return;
    var anchor = heads.filter(function (g) { return /^Finance/.test(g.textContent); })[0] || model;
    var anchorBody = anchor.nextSibling; if (!anchorBody) return;
    var head = model.cloneNode(true);
    var name = head.querySelector('span'); if (name) name.textContent = 'Clinic Services';
    head.setAttribute('data-clinic-grp', '1');
    var body = document.createElement('div');
    body.className = model.nextSibling.className;
    body.setAttribute('data-clinic', '1');
    ITEMS.forEach(function (it) {
      if (it[2].indexOf(ROLE) < 0) return;
      var b = document.createElement('button');
      b.textContent = it[0];
      b.onclick = function () { go(it[1]); };
      body.appendChild(b);
    });
    var spans = head.querySelectorAll('span');
    var arrow = spans.length > 1 ? spans[spans.length - 1] : null;
    head.onclick = function () {
      var hide = body.style.display !== 'none';
      body.style.display = hide ? 'none' : '';
      if (arrow) arrow.textContent = hide ? '\u25B8' : '\u25BE';
    };
    body.style.display = 'none'; if (arrow) arrow.textContent = '\u25B8';
    nav.insertBefore(body, anchorBody.nextSibling);
    nav.insertBefore(head, body);
  }
  setInterval(ensure, 200);
})();
