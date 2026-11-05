// Adds i18n-placement.js to the main site (loads before i18n.js). Safe to run twice.
const fs=require('fs');const f='index.html';
if(!fs.existsSync(f)){console.log('MISSING index.html - run this inside ~/sms-web. Nothing changed.');process.exit(1);}
let s=fs.readFileSync(f,'utf8');
if(s.includes('i18n-placement.js')){console.log('Already applied');process.exit(0);}
const m=s.match(/<script src="i18n\.js[^"]*"><\/script>/);
if(!m){console.log('MISSING the i18n.js script tag. Nothing changed.');process.exit(1);}
s=s.replace(m[0],'<script src="i18n-placement.js?v=1"></script>\n'+m[0]);
fs.writeFileSync(f,s);console.log('OK: placement translations added');
