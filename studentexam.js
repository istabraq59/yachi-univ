// Student exam portal (stage 3). Timing, eligibility and grading are enforced by the database; this page only shows them.
(function () {
  var uid = null, busy = false, offset = 0, listTimer = null, open = false;
  function g(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function btn(text, fn, cls) { var b = el('button', { type: 'button', text: text }); if (cls) b.className = cls; b.onclick = fn; return b; }
  function nowMs() { return Date.now() + offset; }
  function fmt(d) { return new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var css = [
    '.se .it{border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:10px 0;background:#f8fafc}',
    '.se .hint{color:#64748b;font-size:13px;margin:4px 0}',
    '.se .bd{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#e8eefb;color:#0f2a5e;margin:0 6px 4px 0}',
    '.se .go{background:#16a34a;color:#fff;margin-top:8px}',
    '.se-ov{position:fixed;inset:0;background:#fff;z-index:1000;display:flex;flex-direction:column;font-family:inherit}',
    '.se-hd{background:#0f2a5e;color:#fff;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.se-hd b{flex:1;min-width:120px}',
    '.se-tmr{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;background:#2563eb;padding:4px 10px;border-radius:8px}',
    '.se-tmr.low{background:#dc2626}',
    '.se-sv{font-size:12px;width:100%}.se-sv.ok{color:#bbf7d0}.se-sv.bad{color:#fecaca}',
    '.se-nav{display:flex;gap:6px;overflow-x:auto;padding:10px 12px;border-bottom:1px solid #e2e8f0}',
    '.se-nav button{flex:none;width:38px;height:38px;padding:0;margin:0;border-radius:8px;background:#e2e8f0;color:#0f2a5e;border:2px solid transparent;font-weight:600}',
    '.se-nav button.ans{background:#bbf7d0}.se-nav button.cur{border-color:#2563eb}',
    '.se-body{flex:1;overflow:auto;padding:14px}',
    '.se-body .opt{display:flex;gap:10px;align-items:flex-start;padding:10px;border:1px solid #cbd5e1;border-radius:10px;margin:8px 0;font-size:16px}',
    '.se-body .opt input{width:auto;margin:3px 0 0}',
    '.se-body input[type=text],.se-body textarea,.se-body select{width:100%;box-sizing:border-box;margin:6px 0;font-size:16px}',
    '.se-body textarea{min-height:200px;font-family:inherit}',
    '.se-ft{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e2e8f0}',
    '.se-ft button{margin:0}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function item(x) {
    var it = el('div', { class: 'it' });
    it.appendChild(el('div', null, [el('span', { class: 'bd', text: x.type }), el('span', { class: 'bd', text: x.duration_minutes + ' min' }), el('span', { class: 'bd', text: x.total_marks + ' marks' })]));
    it.appendChild(el('b', { text: x.title }));
    it.appendChild(el('div', { class: 'hint', text: x.course + (x.room ? ' | ' + x.room : '') }));
    it.appendChild(el('div', { class: 'hint', text: (x.starts_at ? fmt(x.starts_at) : '') + (x.ends_at ? ' to ' + fmt(x.ends_at) : '') }));
    var start = x.starts_at ? Date.parse(x.starts_at) : null, end = x.ends_at ? Date.parse(x.ends_at) : null, t = nowMs();
    if (x.session_status === 'in_progress') {
      it.appendChild(btn('Resume exam', function () { openExam(x.session_id); }, 'go'));
    } else if (x.session_status) {
      if (x.result) {
        var pct = x.total_marks ? Math.round(x.result.score / x.total_marks * 1000) / 10 : 0;
        it.appendChild(el('div', { text: x.result.status === 'graded' ? 'Result: ' + x.result.score + ' / ' + x.total_marks + ' (' + pct + '%) - ' + (x.result.passed ? 'Passed' : 'Failed') : 'Your result is being graded.' }));
      } else it.appendChild(el('div', { class: 'hint', text: 'Submitted. Your result has not been published yet.' }));
    } else if (start && t < start) {
      it.appendChild(el('div', { class: 'hint', text: 'Opens ' + fmt(x.starts_at) }));
    } else if (end && t >= end) {
      it.appendChild(el('div', { class: 'hint', text: 'This exam has ended.' }));
    } else {
      it.appendChild(btn('Start exam', function () { startExam(x); }, 'go'));
    }
    return it;
  }
  function loadList() {
    var box = g('se_list'); if (!box || open) return;
    Promise.resolve(db.rpc('exam_student_list')).then(function (r) {
      if (!g('se_list') || open) return;
      box.textContent = '';
      if (r.error) { box.textContent = 'Could not load your exams: ' + r.error.message; return; }
      offset = Date.parse(r.data.now) - Date.now();
      if (!r.data.exams.length) { box.appendChild(el('p', { class: 'hint', text: 'You have no published exams right now.' })); return; }
      r.data.exams.forEach(function (x) { box.appendChild(item(x)); });
    });
  }
  function startExam(x) {
    if (!confirm('Start "' + x.title + '" now?\nYou have ' + x.duration_minutes + ' minutes. The timer cannot be paused.')) return;
    Promise.resolve(db.rpc('exam_start', { p_exam: x.exam_id })).then(function (r) {
      if (r.error) { alert(r.error.message); return; }
      openExam(r.data);
    });
  }
  function openExam(sid) {
    Promise.resolve(db.rpc('exam_session_paper', { p_session: sid })).then(function (r) {
      if (r.error) { alert(r.error.message); return; }
      runExam(sid, r.data);
    });
  }

  function runExam(sid, data) {
    open = true;
    offset = Date.parse(data.server_now) - Date.now();
    var qs = data.questions, idx = 0, answers = {}, dirty = {}, submitting = false, finished = false, retry = null, tick = null, saveT = null;
    var deadline = Date.parse(data.session.deadline_at), key = 'yuexam_' + sid;
    qs.forEach(function (q) { if (q.answer) answers[q.id] = q.answer; });
    try {
      var loc = JSON.parse(localStorage.getItem(key) || '{}');
      Object.keys(loc).forEach(function (id) { if (!answers[id] && qs.some(function (q) { return q.id === id; })) { answers[id] = loc[id]; dirty[id] = 1; } });
    } catch (e) {}
    function persist() { try { localStorage.setItem(key, JSON.stringify(answers)); } catch (e) {} }

    var ov = el('div', { class: 'se-ov' });
    var tmr = el('span', { class: 'se-tmr', text: '--:--' }), sv = el('span', { class: 'se-sv', text: '' });
    ov.appendChild(el('div', { class: 'se-hd' }, [el('b', { text: data.exam.title }), tmr, sv]));
    var nav = el('div', { class: 'se-nav' }), body = el('div', { class: 'se-body' }), ft = el('div', { class: 'se-ft' });
    ov.appendChild(nav); ov.appendChild(body); ov.appendChild(ft);
    document.body.appendChild(ov);
    window.onbeforeunload = function () { return 'Your exam is still running.'; };

    function answered(q) {
      var a = answers[q.id]; if (!a) return false;
      if (q.type === 'mcq') return !!a.option;
      if (q.type === 'true_false') return !!a.value;
      if (q.type === 'matching') return !!a.pairs && Object.keys(a.pairs).some(function (k) { return a.pairs[k]; });
      return (a.text || '').trim().length > 0;
    }
    function renderNav() {
      nav.textContent = '';
      qs.forEach(function (q, i) {
        var b = btn(String(i + 1), function () { idx = i; renderQ(); }, (answered(q) ? 'ans ' : '') + (i === idx ? 'cur' : ''));
        nav.appendChild(b);
      });
    }
    function setAns(q, obj) { answers[q.id] = obj; dirty[q.id] = 1; persist(); renderNav(); clearTimeout(saveT); saveT = setTimeout(flush, 700); }
    function flush() {
      var ids = Object.keys(dirty);
      if (!ids.length) return Promise.resolve(true);
      var chain = Promise.resolve(true);
      ids.forEach(function (id) {
        chain = chain.then(function (ok) {
          if (!ok) return false;
          return Promise.resolve(db.rpc('exam_save_answer', { p_session: sid, p_question: id, p_answer: answers[id] })).then(function (r) {
            if (r.error) return false;
            if (r.data && r.data.ok === false) { setTimeout(function () { submit(true); }, 0); return false; }
            delete dirty[id]; return true;
          }, function () { return false; });
        });
      });
      return chain.then(function (ok) {
        if (finished) return ok;
        sv.textContent = ok ? 'Saved ' + new Date().toLocaleTimeString() : 'Not saved yet - reconnecting...';
        sv.className = 'se-sv ' + (ok ? 'ok' : 'bad');
        if (!ok) { clearTimeout(retry); retry = setTimeout(flush, 5000); }
        return ok;
      });
    }
    function renderQ() {
      var q = qs[idx]; body.textContent = ''; renderNav();
      if (idx === 0 && data.exam.instructions) body.appendChild(el('div', { class: 'it' }, [el('b', { text: 'Instructions' }), el('div', { text: data.exam.instructions })]));
      body.appendChild(el('div', { class: 'hint', text: 'Question ' + (idx + 1) + ' of ' + qs.length + ' | ' + q.marks + ' mark(s)' }));
      body.appendChild(el('p', { text: q.body, style: 'font-size:17px;white-space:pre-wrap' }));
      var a = answers[q.id] || {};
      if (q.type === 'mcq') {
        q.options.forEach(function (o) {
          var rd = el('input', { type: 'radio', name: 'q_' + q.id }); rd.checked = a.option === o.id;
          rd.onchange = function () { setAns(q, { option: o.id }); };
          body.appendChild(el('label', { class: 'opt' }, [rd, o.text]));
        });
      } else if (q.type === 'true_false') {
        [['true', 'True'], ['false', 'False']].forEach(function (p) {
          var rd = el('input', { type: 'radio', name: 'q_' + q.id }); rd.checked = a.value === p[0];
          rd.onchange = function () { setAns(q, { value: p[0] }); };
          body.appendChild(el('label', { class: 'opt' }, [rd, p[1]]));
        });
      } else if (q.type === 'matching') {
        var pairs = a.pairs || {};
        q.options.forEach(function (o) {
          body.appendChild(el('div', { text: o.left, style: 'margin-top:10px;font-weight:600' }));
          var s = el('select'); s.appendChild(el('option', { value: '', text: '(choose)' }));
          q.choices.forEach(function (c) { s.appendChild(el('option', { value: c, text: c })); });
          s.value = pairs[o.id] || '';
          s.onchange = function () { var p = {}; Object.keys(pairs).forEach(function (k) { p[k] = pairs[k]; }); p[o.id] = s.value; pairs = p; setAns(q, { pairs: p }); };
          body.appendChild(s);
        });
      } else if (q.type === 'essay') {
        var ta = el('textarea', { placeholder: 'Write your answer here' }); ta.value = a.text || '';
        ta.oninput = function () { setAns(q, { text: ta.value }); };
        body.appendChild(ta);
      } else {
        var ti = el('input', { type: 'text', placeholder: 'Your answer' }); ti.value = a.text || '';
        ti.oninput = function () { setAns(q, { text: ti.value }); };
        body.appendChild(ti);
      }
      prev.disabled = idx === 0; next.disabled = idx === qs.length - 1;
    }
    var prev = btn('Previous', function () { if (idx > 0) { idx--; renderQ(); } }, 'secondary');
    var next = btn('Next', function () { if (idx < qs.length - 1) { idx++; renderQ(); } });
    var sub = btn('Submit', function () {
      var un = qs.filter(function (q) { return !answered(q); }).length;
      if (confirm(un ? 'You have ' + un + ' unanswered question(s). Submit anyway?' : 'Submit your exam now? You cannot change your answers afterwards.')) submit(false);
    });
    ft.appendChild(prev); ft.appendChild(next); ft.appendChild(sub);

    function submit(auto) {
      if (submitting || finished) return; submitting = true;
      sv.textContent = 'Submitting...'; sv.className = 'se-sv';
      flush().then(function (ok) {
        if (!ok && !auto) { submitting = false; sv.textContent = 'Could not save your answers. Check your connection and try again.'; sv.className = 'se-sv bad'; return; }
        doSubmit();
      });
    }
    function doSubmit() {
      Promise.resolve(db.rpc('exam_submit', { p_session: sid })).then(function (r) {
        if (r.error) { sv.textContent = 'Submit failed, retrying...'; sv.className = 'se-sv bad'; setTimeout(doSubmit, 4000); return; }
        finish();
      }, function () { setTimeout(doSubmit, 4000); });
    }
    function finish() {
      finished = true; clearInterval(tick); clearTimeout(retry); clearTimeout(saveT);
      try { localStorage.removeItem(key); } catch (e) {}
      window.onbeforeunload = null;
      nav.style.display = 'none'; ft.style.display = 'none'; body.textContent = '';
      body.appendChild(el('h2', { text: 'Your exam has been submitted.' }));
      body.appendChild(el('p', { text: 'You will see your result here once your teacher publishes it.' }));
      body.appendChild(btn('Close', function () { ov.remove(); open = false; loadList(); }));
    }
    function clock() {
      var rem = Math.max(0, Math.floor((deadline - nowMs()) / 1000));
      var h = Math.floor(rem / 3600), m = Math.floor(rem % 3600 / 60), s = rem % 60;
      tmr.textContent = (h ? h + ':' : '') + pad(m) + ':' + pad(s);
      tmr.className = 'se-tmr' + (rem < 300 ? ' low' : '');
      if (rem <= 0 && !finished) submit(true);
    }
    if (!qs.length) { finish(); return; }
    tick = setInterval(clock, 1000); clock(); renderQ(); flush();
  }

  function build() {
    var ref = g('enrollForm'); if (!ref || g('myExamsCard')) return;
    var c = el('div', { class: 'card se', id: 'myExamsCard' });
    c.appendChild(el('h2', { text: 'My exams' }));
    c.appendChild(el('p', { class: 'hint', text: 'Your published exams. Once you start, the timer runs on the server and your answers are saved automatically.' }));
    c.appendChild(el('div', { id: 'se_list', text: 'Loading...' }));
    ref.parentNode.insertBefore(c, ref);
    loadList();
    clearInterval(listTimer); listTimer = setInterval(loadList, 30000);
  }
  function init() {
    if (busy) return; busy = true;
    db.auth.getSession().then(function (s) {
      var sess = s && s.data && s.data.session;
      if (!sess) { var n = g('myExamsCard'); if (n) n.remove(); uid = null; busy = false; return; }
      if (uid === sess.user.id && g('myExamsCard')) { busy = false; return; }
      uid = sess.user.id;
      Promise.resolve(db.from('profiles').select('role').eq('id', uid).single()).then(function (r) {
        if (!r.data || r.data.role !== 'student') { busy = false; return; }
        build(); busy = false;
      }).catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  db.auth.onAuthStateChange(function () { setTimeout(init, 700); });
  setTimeout(init, 1000);
})();
