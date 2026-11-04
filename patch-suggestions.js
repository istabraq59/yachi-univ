// Adds "Suggestion Box" to the side menu (System group) and loads its translations.
// Run in ~/sms-web: node patch-suggestions.js   (exact-match; if anything is missing nothing is changed)
const fs = require('fs');
let nav = fs.readFileSync('sysnav.js', 'utf8'), idx = fs.readFileSync('index.html', 'utf8');
if (nav.includes("'Suggestion Box'")) { console.log('Already applied.'); process.exit(0); }
const a = "[['Settings', function () { settings(nav); }],";
const b = "[['Suggestion Box', function () { document.body.classList.remove('yu-open'); location.href = 'suggestions/'; }], ['Settings', function () { settings(nav); }],";
if (nav.split(a).length !== 2) { console.log('MISSING: menu line in sysnav.js. Nothing changed.'); process.exit(1); }
const tag = /sysnav\.js\?v=(\d+)/;
const t = idx.match(tag); if (!t) { console.log('MISSING: sysnav.js tag in index.html. Nothing changed.'); process.exit(1); }
const i = '<script src="i18n.js?v=2"></script>';
if (idx.split(i).length !== 2) { console.log('MISSING: i18n.js tag in index.html (run patch-arabic.js first). Nothing changed.'); process.exit(1); }
nav = nav.replace(a, () => b);
idx = idx.replace(tag, () => 'sysnav.js?v=' + (Number(t[1]) + 1)).replace(i, () => '<script src="i18n-suggest.js?v=1"></script>\n' + i);
fs.writeFileSync('sysnav.js', nav); fs.writeFileSync('index.html', idx);
console.log('OK: Suggestion Box added to the System menu.');
