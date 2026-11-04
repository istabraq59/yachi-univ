// Adds "Placement & Internship" to the side menu (above Finance). Run in ~/sms-web: node patch-placement.js
const fs = require('fs'); let idx = fs.readFileSync('index.html', 'utf8');
if (idx.includes('placementnav.js')) { console.log('Already applied.'); process.exit(0); }
const m = idx.match(/<script src="finnav\.js\?v=[^"]*"><\/script>/);
if (!m) { console.log('MISSING: finnav.js tag in index.html. Nothing changed.'); process.exit(1); }
idx = idx.replace(m[0], () => m[0] + '\n<script src="placementnav.js?v=1"></script>');
fs.writeFileSync('index.html', idx); console.log('OK: Placement & Internship added to the side menu.');
