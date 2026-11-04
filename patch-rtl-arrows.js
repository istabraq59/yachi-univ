// Flips the back arrow and list chevrons in Arabic. Run in ~/sms-web: node patch-rtl-arrows.js
const fs=require('fs');const f='settings/index.html';let c=fs.readFileSync(f,'utf8');
if(c.includes('html[dir=rtl] header.top')){console.log('Already applied.');process.exit(0);}
const a='  header.top h1 { font-size:1.15rem; margin:0; }';
if(c.split(a).length!==2){console.log('MISSING: header rule. Nothing changed.');process.exit(1);}
c=c.replace(a,a+'\n  html[dir=rtl] header.top a, html[dir=rtl] header.top button, html[dir=rtl] .list .go { transform:scaleX(-1); }');
fs.writeFileSync(f,c);console.log('OK: arrows flip in Arabic');
