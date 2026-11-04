// Adds the translation files to index.html. Run in ~/sms-web: node patch-i18n.js
const fs=require('fs');
const f='index.html'; let c=fs.readFileSync(f,'utf8');
if(c.includes('i18n-data.js')){console.log('Already applied.');process.exit(0);}
const a='<script src="prefs.js?v=3"></script>';
if(c.split(a).length!==2){console.log('MISSING: prefs.js tag. Nothing changed.');process.exit(1);}
c=c.replace(a,a+'\n<script src="i18n-data.js?v=1"></script>\n<script src="i18n.js?v=1"></script>');
fs.writeFileSync(f,c);console.log('OK: translation files added to index.html');
