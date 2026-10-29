(function () {
  var CSS = [
    'body.yu-out{background:linear-gradient(160deg,#eaf0ff,#f6f8fd)}',
    'body.yu-out h1{display:none}',
    '.yu-login-wrap{display:grid;grid-template-columns:1fr;gap:14px;max-width:980px;margin:0 auto}',
    '#yuHero{background:linear-gradient(160deg,#1e3a8a,#1d4ed8 70%,#3b82f6);color:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 30px rgba(30,58,138,.25)}',
    '#yuHero img{width:64px;height:64px;object-fit:cover;border-radius:14px;background:#fff;display:block}',
    '#yuHero h2{margin:12px 0 2px;font-size:26px;color:#fff}',
    '#yuHero .sub{opacity:.95;margin:0 0 10px;font-weight:600}',
    '#yuHero p{margin:6px 0;line-height:1.4}',
    '#yuHero .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}',
    '#yuHero .chips span{background:rgba(255,255,255,.16);border-radius:999px;padding:6px 12px;font-size:12px}',
    'body.yu-out .card input,body.yu-out .card select{border-radius:10px}',
    '@media(min-width:820px){.yu-login-wrap{grid-template-columns:1fr 1fr;align-items:start}.yu-login-wrap>#yuHero{grid-column:1;grid-row:1/span 20;position:sticky;top:20px;min-height:440px;padding:34px}.yu-login-wrap>*:not(#yuHero){grid-column:2}}'
  ].join('\n');
  function el(t, a) { var e = document.createElement(t); for (var k in (a || {})) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); } return e; }
  function loginCard() {
    var c = null;
    document.querySelectorAll('.card').forEach(function (x) {
      if (!c && /Continue with Google/.test(x.textContent) && /Sign in/.test(x.textContent) && !x.querySelector('.card')) c = x;
    });
    return c;
  }
  function buildHero() {
    var h = el('div', { id: 'yuHero' });
    var img = el('img', { src: 'logo.jpg', alt: 'Yachi University' });
    img.onerror = function () { img.style.display = 'none'; };
    h.appendChild(img);
    h.appendChild(el('h2', { text: 'Yachi University' }));
    h.appendChild(el('p', { class: 'sub', text: 'Student Management System' }));
    h.appendChild(el('p', { text: 'Manage students, courses, departments and academic activities easily and efficiently.' }));
    var chips = el('div', { class: 'chips' });
    ['Better Learning', 'Smarter Management', 'Bright Future'].forEach(function (t) { chips.appendChild(el('span', { text: t })); });
    h.appendChild(chips);
    return h;
  }
  function apply(out) {
    document.body.classList.toggle('yu-out', out);
    var hero = document.getElementById('yuHero');
    if (!out) {
      if (hero) hero.remove();
      var w = document.querySelector('.yu-login-wrap'); if (w) w.classList.remove('yu-login-wrap');
      return;
    }
    var lc = loginCard(); if (!lc || !lc.parentNode) return;
    var wrap = lc.parentNode; wrap.classList.add('yu-login-wrap');
    if (!hero) wrap.insertBefore(buildHero(), wrap.firstChild);
  }
  function check() {
    if (typeof db === 'undefined') return;
    db.auth.getSession().then(function (s) { apply(!(s.data && s.data.session)); });
  }
  var st = el('style', { id: 'yuShellStyle' }); st.textContent = CSS; document.head.appendChild(st);
  if (typeof db !== 'undefined') db.auth.onAuthStateChange(function () { setTimeout(check, 300); });
  check(); setTimeout(check, 800); setTimeout(check, 2000);
})();
