// Usage: node patch-settings.js   (run inside ~/sms-web). Exact-match edits only; stops if anything is not found.
const fs = require('fs');
let failed = false;
const rd = (f) => fs.readFileSync(f, 'utf8');
function once(src, find, repl, label) {
  const i = src.indexOf(find);
  if (i < 0) { console.log('MISSING  ' + label); failed = true; return src; }
  if (src.indexOf(find, i + 1) >= 0) { console.log('MULTIPLE ' + label); failed = true; return src; }
  console.log('ok       ' + label);
  return src.slice(0, i) + repl + src.slice(i + find.length);
}
function between(src, a, b, repl, label) {
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0 || j < i || src.indexOf(a, i + 1) >= 0) { console.log('MISSING  ' + label); failed = true; return src; }
  console.log('ok       ' + label);
  return src.slice(0, i) + repl + src.slice(j);
}
for (const f of ['prefs.js', 'settings/index.html']) if (!fs.existsSync(f)) { console.log(f + ' not found - copy it first'); process.exit(1); }
const edits = {};
const stage = (f, fn) => { edits[f] = fn(edits[f] !== undefined ? edits[f] : rd(f)); };
const stamp = Date.now();

stage('index.html', (h) => {
  h = once(h, '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>',
    '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>\n<script src="prefs.js?v=1"></script>', 'load prefs.js early on the main page');
  for (const f of ['sysnav', 'shell2']) {
    const re = new RegExp('src="' + f + '\\.js(\\?v=[0-9]+)?"');
    if (!re.test(h)) { console.log('MISSING  version tag for ' + f); failed = true; continue; }
    h = h.replace(re, 'src="' + f + '.js?v=' + stamp + '"');
  }
  console.log('ok       version tags bumped');
  return h;
});

/* the existing "Settings" button in the System menu opened the profile popup; now it opens the Settings page */
stage('sysnav.js', (s) => between(s, '  function settings(nav) {', '  function ensure() {',
  "  function settings(nav) {\n    document.body.classList.remove('yu-open');\n    location.href = 'settings/';\n  }\n", 'System menu: Settings opens the new page'));

/* and a Settings button in the profile popup */
stage('shell2.js', (s) => once(s,
  "    var so = el('button', { class: 'out', text: 'Sign out' }); so.onclick = function () { closeProf(); db.auth.signOut(); }; p.appendChild(so);",
  "    var st = el('button', { text: 'Settings' }); st.onclick = function () { closeProf(); location.href = 'settings/'; }; p.appendChild(st);\n" +
  "    var so = el('button', { class: 'out', text: 'Sign out' }); so.onclick = function () { closeProf(); db.auth.signOut(); }; p.appendChild(so);",
  'profile popup: Settings button'));

if (failed) { console.log('\nSTOPPED: nothing was changed. Send me this output.'); process.exit(1); }
for (const f in edits) fs.writeFileSync(f, edits[f]);
console.log('\nAll edits written and version tags updated. Now commit and push.');
