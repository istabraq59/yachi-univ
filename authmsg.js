// Shows sign-in errors that come back in the web address (e.g. after Google sign-in)
(function () {
  'use strict';
  function params(str) {
    var out = {};
    str.replace(/^[#?]/, '').split('&').forEach(function (p) {
      if (!p) return;
      var kv = p.split('=');
      try {
        out[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      } catch (e) { /* ignore bad encoding */ }
    });
    return out;
  }
  var h = params(location.hash);
  var q = params(location.search);
  var desc = h.error_description || q.error_description || '';
  var code = h.error_code || q.error_code || h.error || q.error || '';
  if (!desc && !code) return;

  var text;
  if (/banned/i.test(desc) || /banned/i.test(code)) {
    text = 'This account has been deactivated. Please contact the school office.';
  } else if (/access_denied/i.test(code) && !desc) {
    text = 'Sign-in was cancelled or not allowed.';
  } else {
    text = 'Sign-in problem: ' + (desc || code);
  }

  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;background:#b91c1c;color:#fff;padding:14px 48px 14px 16px;font-size:16px;line-height:1.4';
  bar.textContent = text;
  var x = document.createElement('button');
  x.type = 'button';
  x.textContent = '×';
  x.setAttribute('aria-label', 'Close');
  x.style.cssText = 'position:absolute;right:8px;top:6px;width:auto;margin:0;padding:0 8px;line-height:1;width:auto;margin:0;padding:0 8px;line-height:1;background:none;border:0;color:#fff;font-size:28px;cursor:pointer';
  x.onclick = function () { bar.remove(); };
  bar.appendChild(x);
  document.body.appendChild(bar);

  // remove the error from the address bar so a reload doesn't show it again
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
})();
