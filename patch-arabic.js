// Adds Arabic (right-to-left). Run in ~/sms-web: node patch-arabic.js
// Exact-match edits; if any piece is missing nothing is changed.
const fs = require('fs');
const edits = [
 ['i18n.js', "var IDX = { am: 0, om: 1 };", "var IDX = { am: 0, om: 1, ar: 2 };"],
 ['prefs.js', "h.setAttribute('lang', P.language);", "h.setAttribute('lang', P.language);\n    h.setAttribute('dir', P.language === 'ar' ? 'rtl' : 'ltr');"],
 ['index.html', '<script src="i18n.js?v=1"></script>', '<script src="i18n-ar.js?v=1"></script>\n<script src="i18n.js?v=2"></script>'],
 ['index.html', '<script src="prefs.js?v=3"></script>', '<script src="prefs.js?v=4"></script>'],
 ['settings/index.html', "['om', 'Afaan Oromoo']]", "['om', 'Afaan Oromoo'], ['ar', 'العربية']]"],
 ['settings/index.html', "text-align:left; cursor:pointer; }", "text-align:start; cursor:pointer; }"],
 ['settings/index.html', "../prefs.js?v=3", "../prefs.js?v=4"],
 ['settings/index.html', "\n  };\n  function lang() {", AR_BLOCK()],
];
function AR_BLOCK() {
  return ",\n    ar: {\n" +
"      settings:'الإعدادات', account:'إعدادات الحساب', language:'اللغة', notifications:'الإشعارات', security:'الأمان والخصوصية', appearance:'المظهر', regional:'الإعدادات الإقليمية', about:'حول',\n" +
"      saved:'تم الحفظ', save_failed:'تعذّر الحفظ في حسابك. تم الاحتفاظ به على هذا الجهاز. ', need_signin:'يرجى تسجيل الدخول لاستخدام الإعدادات.', go_signin:'الذهاب إلى تسجيل الدخول',\n" +
"      name:'الاسم', email:'البريد الإلكتروني', idnum:'رقم الهوية', role:'الدور', last_signin:'آخر تسجيل دخول', not_set:'(غير محدد)', acc_note:'لتغيير اسمك أو دورك، تواصل مع مكتب المدرسة.', signout:'تسجيل الخروج',\n" +
"      lang_choose:'اختر لغتك', lang_note:'تتم إضافة الترجمات خطوة بخطوة. الأجزاء غير المترجمة تبقى بالإنجليزية.',\n" +
"      notif_note:'يتم حفظ اختياراتك في حسابك. سيفعّل إرسال البريد الإلكتروني من قبل الجامعة لاحقاً.', n_ann:'الإعلانات', n_exam:'تذكيرات الامتحانات', n_res:'النتائج والدرجات', n_fin:'الرسوم والمدفوعات', n_sec:'تنبيهات الأمان (مفعّلة دائماً)', ch_app:'داخل التطبيق', ch_email:'البريد الإلكتروني',\n" +
"      pw_title:'تغيير كلمة المرور', pw_new:'كلمة المرور الجديدة (8 أحرف أو أكثر)', pw_again:'اكتبها مرة أخرى', pw_btn:'تغيير كلمة المرور', pw_short:'استخدم 8 أحرف على الأقل.', pw_mismatch:'كلمتا المرور غير متطابقتين.', pw_ok:'تم تغيير كلمة المرور. استخدمها في المرة القادمة عند تسجيل الدخول بالبريد.', pw_reauth:'لأسباب أمنية، سجّل الخروج ثم الدخول مرة أخرى وحاول من جديد.', pw_fail:'لم يتم التغيير: ',\n" +
"      devices:'الأجهزة', so_others:'تسجيل الخروج من الأجهزة الأخرى', so_all:'تسجيل الخروج من جميع الأجهزة', so_all_q:'تسجيل الخروج من كل جهاز سجّلت الدخول منه؟', so_others_done:'تم تسجيل الخروج من الأجهزة الأخرى.',\n" +
"      privacy:'الخصوصية', privacy_link:'اقرأ سياسة الخصوصية', export:'تنزيل بياناتي', export_note:'ملف يحتوي على بيانات حسابك وإعداداتك.',\n" +
"      theme:'السمة', th_light:'فاتحة', th_dark:'داكنة', th_system:'مطابقة هاتفي', text_size:'حجم النص', sz_small:'صغير', sz_normal:'عادي', sz_large:'كبير', sz_xlarge:'كبير جداً', preview:'هذا مثال على حجم النص.',\n" +
"      timezone:'المنطقة الزمنية', date_fmt:'تنسيق التاريخ', time_fmt:'تنسيق الوقت', calendar:'التقويم', cal_greg:'ميلادي', cal_eth:'إثيوبي', week_start:'يبدأ الأسبوع يوم', mon:'الاثنين', sun:'الأحد', sat:'السبت', now_is:'الآن', h12:'12 ساعة', h24:'24 ساعة', dmy:'يوم/شهر/سنة', mdy:'شهر/يوم/سنة', ymd:'سنة-شهر-يوم', long:'4 Nov 2026',\n" +
"      sys_name:'نظام إدارة الطلاب', university:'جامعة ياتشي', version:'الإصدار', support:'المساعدة والدعم', support_text:'للمساعدة في حسابك أو درجاتك أو مدفوعاتك، تواصل مع مكتب المسجّل أو مكتب المالية.', refresh:'تحديث التطبيق', online:'الاتصال', on:'متصل', off:'غير متصل', tz_other:'أخرى'\n" +
"    }\n  };\n  function lang() {";
}
const cache = {};
const rd = f => cache[f] || (cache[f] = fs.readFileSync(f, 'utf8'));
if (rd('prefs.js').includes("'ar' ? 'rtl'")) { console.log('Already applied.'); process.exit(0); }
for (const [f, a, b] of edits) {
  if (!fs.existsSync(f)) { console.log('MISSING FILE: ' + f + '. Nothing changed.'); process.exit(1); }
  const parts = rd(f).split(a).length - 1;
  if (parts !== 1) { console.log('MISSING (' + parts + ' matches) in ' + f + ': ' + a.slice(0, 50) + '  Nothing changed.'); process.exit(1); }
}
for (const [f, a, b] of edits) cache[f] = cache[f].replace(a, () => b);
for (const f in cache) fs.writeFileSync(f, cache[f]);
console.log('OK: Arabic added to ' + Object.keys(cache).join(', '));
