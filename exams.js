// Exam module, stage 1: question bank and exams.
// Real database operations; every read and write is protected by row-level security.
(function () {
  var MANAGERS = ['admin', 'administrator', 'college_head', 'department_head'];
  var ROLES = MANAGERS.concat(['teacher']);
  var QTYPES = { mcq: 'Multiple choice', true_false: 'True / False', short_answer: 'Short answer', essay: 'Essay', matching: 'Matching', fill_blank: 'Fill in the blank' };
  var ETYPES = { midterm: 'Midterm', final: 'Final', quiz: 'Quiz', assignment: 'Assignment', practical: 'Practical', continuous: 'Continuous assessment', makeup: 'Makeup' };
  var role = null, uid = null, courses = [], semesters = [], busy = false, editQ = null, editE = null;

  function g(id) { return document.getElementById(id); }
  function qsa(s) { return [].slice.call(document.querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function opt(v, t) { return el('option', { value: v, text: t }); }
  function field(label, node) { return el('div', null, [el('label', { class: 'f', text: label }), node]); }
  function btn(text, fn, cls) { var b = el('button', { type: 'button', text: text }); if (cls) b.className = cls; b.onclick = fn; return b; }
  function say(id, text, ok) { var b = g(id); if (b) { b.textContent = text || ''; b.style.color = ok ? '#166534' : '#b91c1c'; } }
  function isMgr() { return MANAGERS.indexOf(role) >= 0; }
  function fmt(d) { return d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toLocalInput(iso) { if (!iso) return ''; var d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function courseLabel(c) { return c.course_code + ' - ' + c.title; }
  function typeSelect(id, map) { var s = el('select', { id: id }); Object.keys(map).forEach(function (k) { s.appendChild(opt(k, map[k])); }); return s; }

  var css = [
    '.ex label.f{display:block;font-size:12px;font-weight:600;color:#475569;margin:12px 0 4px}',
    '.ex input,.ex select,.ex textarea{width:100%;box-sizing:border-box;margin:0}',
    '.ex textarea{min-height:80px;font-family:inherit}',
    '.ex .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.ex .item{border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin:8px 0;background:#f8fafc}',
    '.ex .acts button{width:auto;padding:6px 12px;margin:6px 6px 0 0;font-size:13px}',
    '.ex .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#e8eefb;color:#0f2a5e;margin:0 6px 4px 0}',
    '.ex .badge.draft{background:#fef3c7;color:#92400e}.ex .badge.published{background:#dcfce7;color:#166534}.ex .badge.cancelled{background:#fee2e2;color:#991b1b}',
    '.ex .hint{color:#64748b;font-size:13px;margin:4px 0}',
    '.ex .mrow{display:flex;gap:8px;align-items:center;margin:6px 0}',
    '.ex .mrow input[type=radio],.ex .chk input{width:auto}',
    '.ex .prow{margin:6px 0}',
    '.ex .chk{display:flex;gap:8px;align-items:flex-start;margin:6px 0;font-size:14px}',
    '.ex h3{margin:18px 0 0;color:#0f2a5e}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------------- question bank ----------------
  function renderDyn(type, d) {
    var box = g('qb_dyn'); box.textContent = '';
    d = d || {}; var opts = d.opts || [], q = d.q || {};
    if (type === 'mcq') {
      box.appendChild(el('label', { class: 'f', text: 'Answer options (tick the correct one)' }));
      var n = Math.max(4, opts.length);
      var add = btn('+ Add option', function () { if (box.querySelectorAll('.mrow').length < 8) box.insertBefore(mrow(), add); }, 'secondary');
      for (var i = 0; i < n; i++) box.appendChild(mrow(opts[i]));
      box.appendChild(add);
    } else if (type === 'true_false') {
      box.appendChild(el('label', { class: 'f', text: 'Correct answer' }));
      ['true', 'false'].forEach(function (v) {
        var rd = el('input', { type: 'radio', name: 'qb_tf', value: v }); if (q.correct_answer === v) rd.checked = true;
        box.appendChild(el('label', { class: 'chk' }, [rd, v === 'true' ? 'True' : 'False']));
      });
    } else if (type === 'short_answer' || type === 'fill_blank') {
      var a = el('input', { id: 'qb_ans', type: 'text' }); a.value = q.correct_answer || '';
      box.appendChild(field('Accepted answer', a));
      box.appendChild(el('p', { class: 'hint', text: type === 'fill_blank' ? 'Write the question with ___ where the blank goes.' : 'Several accepted answers can be separated with |' }));
    } else if (type === 'essay') {
      box.appendChild(el('p', { class: 'hint', text: 'Essay answers are graded by the teacher. Use the marking guide below if you want one.' }));
    } else if (type === 'matching') {
      box.appendChild(el('label', { class: 'f', text: 'Pairs (left side and what it matches)' }));
      var m = Math.max(4, opts.length);
      for (var j = 0; j < m; j++) box.appendChild(prow(opts[j]));
    }
  }
  function mrow(o) {
    var r = el('div', { class: 'mrow' });
    var rd = el('input', { type: 'radio', name: 'qb_correct' }); if (o && o.is_correct) rd.checked = true;
    var tx = el('input', { type: 'text', placeholder: 'Option text' }); if (o) tx.value = o.option_text;
    r.appendChild(rd); r.appendChild(tx); return r;
  }
  function prow(o) {
    var r = el('div', { class: 'prow row' });
    var a = el('input', { type: 'text', placeholder: 'Left side' }), b = el('input', { type: 'text', placeholder: 'Matches with' });
    if (o) { a.value = o.option_text; b.value = o.match_text || ''; }
    r.appendChild(a); r.appendChild(b); return r;
  }
  function resetQ() {
    editQ = null;
    g('qb_body').value = ''; g('qb_marks').value = '1'; g('qb_diff').value = 'medium'; g('qb_topic').value = ''; g('qb_exp').value = '';
    g('qb_type').value = 'mcq'; renderDyn('mcq');
    g('qb_ft').textContent = 'Add a question'; g('qb_cancel').style.display = 'none'; say('qb_msg', '');
  }
  function collectQ() {
    var type = g('qb_type').value, body = g('qb_body').value.trim(), marks = Number(g('qb_marks').value);
    if (!g('qb_course').value) return { err: 'Choose a subject.' };
    if (!body) return { err: 'Write the question.' };
    if (!(marks > 0)) return { err: 'Marks must be more than 0.' };
    var q = { course_id: g('qb_course').value, question_type: type, body: body, topic: g('qb_topic').value.trim() || null, difficulty: g('qb_diff').value, marks: marks, explanation: g('qb_exp').value.trim() || null, correct_answer: null };
    var opts = [], pos = 0;
    if (type === 'mcq') {
      var any = false;
      qsa('#qb_dyn .mrow').forEach(function (r) {
        var t = r.querySelector('input[type=text]').value.trim(); if (!t) return;
        var c = r.querySelector('input[type=radio]').checked; if (c) any = true;
        opts.push({ position: pos++, option_text: t, is_correct: c });
      });
      if (opts.length < 2) return { err: 'Give at least 2 options.' };
      if (!any) return { err: 'Tick the correct option.' };
    } else if (type === 'true_false') {
      var c2 = document.querySelector('input[name=qb_tf]:checked');
      if (!c2) return { err: 'Choose True or False as the correct answer.' };
      q.correct_answer = c2.value;
    } else if (type === 'short_answer' || type === 'fill_blank') {
      var a = g('qb_ans').value.trim(); if (!a) return { err: 'Write the accepted answer.' };
      q.correct_answer = a;
    } else if (type === 'matching') {
      qsa('#qb_dyn .prow').forEach(function (r) {
        var ins = r.querySelectorAll('input'), l = ins[0].value.trim(), rt = ins[1].value.trim();
        if (l && rt) opts.push({ position: pos++, option_text: l, is_correct: true, match_text: rt });
      });
      if (opts.length < 2) return { err: 'Give at least 2 complete pairs.' };
    }
    return { q: q, opts: opts };
  }
  function saveQ() {
    var r = collectQ(); if (r.err) { say('qb_msg', r.err); return; }
    var isNew = !editQ, id = editQ;
    var p = isNew ? db.from('exam_bank_questions').insert(r.q).select('id').single() : db.from('exam_bank_questions').update(r.q).eq('id', editQ).select('id').single();
    Promise.resolve(p).then(function (x) {
      if (x.error) throw x.error;
      id = x.data.id;
      return Promise.resolve(db.from('exam_bank_options').delete().eq('question_id', id));
    }).then(function (d) {
      if (d.error) throw d.error;
      if (!r.opts.length) return { error: null };
      return Promise.resolve(db.from('exam_bank_options').insert(r.opts.map(function (o) { o.question_id = id; return o; })));
    }).then(function (d) {
      if (d.error) {
        if (isNew) db.from('exam_bank_questions').delete().eq('id', id).then(function () {});
        throw d.error;
      }
      resetQ(); say('qb_msg', isNew ? 'Question saved.' : 'Question updated.', true); loadQ();
    }).catch(function (e) { say('qb_msg', 'Could not save: ' + (e.message || e)); });
  }
  function editQuestion(id) {
    Promise.all([
      Promise.resolve(db.from('exam_bank_questions').select('*').eq('id', id).single()),
      Promise.resolve(db.from('exam_bank_options').select('*').eq('question_id', id).order('position'))
    ]).then(function (r) {
      if (r[0].error) { say('qb_msg', r[0].error.message); return; }
      var q = r[0].data;
      editQ = id;
      g('qb_type').value = q.question_type; g('qb_body').value = q.body; g('qb_marks').value = q.marks;
      g('qb_diff').value = q.difficulty; g('qb_topic').value = q.topic || ''; g('qb_exp').value = q.explanation || '';
      renderDyn(q.question_type, { q: q, opts: r[1].data || [] });
      g('qb_ft').textContent = 'Edit question'; g('qb_cancel').style.display = '';
      g('qb_ft').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    Promise.resolve(db.from('exam_bank_questions').delete().eq('id', id).select('id')).then(function (r) {
      if (r.error) { say('qb_msg', r.error.code === '23503' ? 'This question is used in an exam. Remove it from the exam first.' : r.error.message); return; }
      if (!r.data || !r.data.length) { say('qb_msg', 'You are not allowed to delete this question.'); return; }
      say('qb_msg', 'Question deleted.', true); loadQ();
    });
  }
  function loadQ() {
    var box = g('qb_list'); if (!box) return;
    var cid = g('qb_course').value;
    if (!cid) { box.textContent = 'No subjects are available to you yet.'; return; }
    box.textContent = 'Loading...';
    var q = db.from('exam_bank_questions').select('id, question_type, body, topic, difficulty, marks').eq('course_id', cid).order('created_at', { ascending: false }).limit(200);
    if (g('qb_ftype').value) q = q.eq('question_type', g('qb_ftype').value);
    Promise.resolve(q).then(function (r) {
      box.textContent = '';
      if (r.error) { box.textContent = 'Could not load: ' + r.error.message; return; }
      if (!r.data.length) { box.appendChild(el('p', { class: 'hint', text: 'No questions yet for this subject.' })); return; }
      box.appendChild(el('p', { class: 'hint', text: r.data.length + ' question(s)' }));
      r.data.forEach(function (x) {
        var it = el('div', { class: 'item' });
        it.appendChild(el('div', null, [el('span', { class: 'badge', text: QTYPES[x.question_type] }), el('span', { class: 'badge', text: x.difficulty }), el('span', { class: 'badge', text: x.marks + ' mark(s)' }), x.topic ? el('span', { class: 'badge', text: x.topic }) : null]));
        it.appendChild(el('div', { text: x.body.length > 180 ? x.body.slice(0, 180) + '...' : x.body }));
        it.appendChild(el('div', { class: 'acts' }, [btn('Edit', function () { editQuestion(x.id); }, 'secondary'), btn('Delete', function () { deleteQuestion(x.id); }, 'secondary')]));
        box.appendChild(it);
      });
    });
  }
  function buildQB(ref) {
    var c = el('div', { class: 'card ex', id: 'qbCard' });
    c.appendChild(el('h2', { text: 'Exam question bank' }));
    c.appendChild(el('p', { class: 'hint', text: 'Questions are kept per subject. Correct answers are never sent to students.' }));
    var cs = el('select', { id: 'qb_course' });
    courses.forEach(function (x) { cs.appendChild(opt(x.id, courseLabel(x))); });
    cs.onchange = function () { resetQ(); loadQ(); };
    c.appendChild(field('Subject', cs));
    var ft = typeSelect('qb_ftype', QTYPES); ft.insertBefore(opt('', 'All question types'), ft.firstChild); ft.value = ''; ft.onchange = loadQ;
    c.appendChild(field('Show', ft));
    c.appendChild(el('div', { id: 'qb_list' }));
    c.appendChild(el('h3', { id: 'qb_ft', text: 'Add a question' }));
    var ty = typeSelect('qb_type', QTYPES); ty.onchange = function () { renderDyn(ty.value); };
    c.appendChild(field('Question type', ty));
    c.appendChild(field('Question', el('textarea', { id: 'qb_body', placeholder: 'Write the question here' })));
    var diff = el('select', { id: 'qb_diff' }); ['easy', 'medium', 'hard'].forEach(function (d) { diff.appendChild(opt(d, d)); }); diff.value = 'medium';
    c.appendChild(el('div', { class: 'row' }, [field('Marks', el('input', { id: 'qb_marks', type: 'number', min: '0.5', step: '0.5', value: '1' })), field('Difficulty', diff)]));
    c.appendChild(field('Topic (optional)', el('input', { id: 'qb_topic', type: 'text' })));
    c.appendChild(el('div', { id: 'qb_dyn' }));
    c.appendChild(field('Explanation or marking guide (optional)', el('textarea', { id: 'qb_exp' })));
    c.appendChild(el('div', { style: 'height:12px' }));
    c.appendChild(btn('Save question', saveQ));
    var cancel = btn('Cancel edit', resetQ, 'secondary'); cancel.id = 'qb_cancel'; cancel.style.display = 'none'; c.appendChild(cancel);
    c.appendChild(el('div', { id: 'qb_msg', class: 'msg' }));
    ref.parentNode.insertBefore(c, ref);
    renderDyn('mcq'); loadQ();
  }

  // ---------------- exams ----------------
  function resetE() {
    editE = null;
    ['ex_title', 'ex_start', 'ex_end', 'ex_room', 'ex_ins'].forEach(function (i) { g(i).value = ''; });
    g('ex_dur').value = '60'; g('ex_total').value = '100'; g('ex_pass').value = '50'; g('ex_type').value = 'midterm'; g('ex_sem').value = '';
    g('ex_ft').textContent = 'Create an exam'; g('ex_cancel').style.display = 'none'; g('ex_save').textContent = 'Save exam as draft'; say('ex_msg', '');
  }
  function startEditE(x) {
    editE = x.id;
    g('ex_title').value = x.title; g('ex_course').value = x.course_id; g('ex_type').value = x.exam_type; g('ex_sem').value = x.semester_id || '';
    g('ex_start').value = toLocalInput(x.starts_at); g('ex_end').value = toLocalInput(x.ends_at);
    g('ex_dur').value = x.duration_minutes; g('ex_total').value = x.total_marks; g('ex_pass').value = x.passing_marks;
    g('ex_room').value = x.room || ''; g('ex_ins').value = x.instructions || '';
    g('ex_ft').textContent = 'Edit exam'; g('ex_cancel').style.display = ''; g('ex_save').textContent = 'Save changes'; say('ex_msg', '');
    g('ex_ft').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function saveE() {
    var t = g('ex_title').value.trim();
    if (!t) { say('ex_msg', 'Give the exam a title.'); return; }
    var cid = g('ex_course').value; if (!cid) { say('ex_msg', 'Choose a subject.'); return; }
    var dur = parseInt(g('ex_dur').value, 10), tot = Number(g('ex_total').value), pas = Number(g('ex_pass').value);
    if (!(dur > 0)) { say('ex_msg', 'Duration must be more than 0 minutes.'); return; }
    if (!(tot > 0)) { say('ex_msg', 'Total marks must be more than 0.'); return; }
    if (!(pas >= 0) || pas > tot) { say('ex_msg', 'Passing marks cannot be more than total marks.'); return; }
    var s = g('ex_start').value, e = g('ex_end').value;
    if (s && e && new Date(e) <= new Date(s)) { say('ex_msg', 'The end time must be after the start time.'); return; }
    var row = { title: t, course_id: cid, exam_type: g('ex_type').value, semester_id: g('ex_sem').value || null, starts_at: s ? new Date(s).toISOString() : null, ends_at: e ? new Date(e).toISOString() : null, duration_minutes: dur, total_marks: tot, passing_marks: pas, room: g('ex_room').value.trim() || null, instructions: g('ex_ins').value.trim() || null };
    var was = editE;
    var p = was ? db.from('exams').update(row).eq('id', was).select('id') : db.from('exams').insert(row).select('id');
    Promise.resolve(p).then(function (r) {
      if (r.error) { say('ex_msg', r.error.message); return; }
      if (!r.data || !r.data.length) { say('ex_msg', 'You are not allowed to change this exam.'); return; }
      resetE(); say('ex_msg', was ? 'Exam updated.' : 'Exam saved as a draft.', true); loadE();
    });
  }
  function setStatus(id, status) {
    Promise.resolve(db.from('exams').update({ status: status }).eq('id', id).select('id')).then(function (r) {
      if (r.error) { say('ex_listmsg', r.error.message); return; }
      if (!r.data || !r.data.length) { say('ex_listmsg', 'You are not allowed to do that.'); return; }
      say('ex_listmsg', 'Exam is now ' + status + '.', true); loadE();
    });
  }
  function publish(x) {
    Promise.resolve(db.from('exam_paper_questions').select('marks, exam_bank_questions(marks)').eq('exam_id', x.id)).then(function (r) {
      if (r.error) { say('ex_listmsg', r.error.message); return; }
      if (!r.data.length) { say('ex_listmsg', 'Add questions to this exam before publishing.'); return; }
      var sum = 0;
      r.data.forEach(function (p) { sum += Number(p.marks != null ? p.marks : (p.exam_bank_questions && p.exam_bank_questions.marks) || 0); });
      if (sum !== Number(x.total_marks) && !confirm('The questions add up to ' + sum + ' marks but the exam total is ' + x.total_marks + '. Publish anyway?')) return;
      setStatus(x.id, 'published');
    });
  }
  function deleteE(x) {
    if (!confirm('Delete the draft "' + x.title + '"?')) return;
    Promise.resolve(db.from('exams').delete().eq('id', x.id).select('id')).then(function (r) {
      if (r.error) { say('ex_listmsg', r.error.message); return; }
      if (!r.data || !r.data.length) { say('ex_listmsg', 'Only draft exams can be deleted.'); return; }
      g('ex_paper').textContent = ''; say('ex_listmsg', 'Draft deleted.', true); loadE();
    });
  }
  function openPaper(x) {
    var box = g('ex_paper'); box.textContent = 'Loading questions...';
    Promise.all([
      Promise.resolve(db.from('exam_bank_questions').select('id, question_type, body, marks').eq('course_id', x.course_id).eq('active', true).order('created_at').limit(300)),
      Promise.resolve(db.from('exam_paper_questions').select('question_id').eq('exam_id', x.id))
    ]).then(function (r) {
      box.textContent = '';
      if (r[0].error || r[1].error) { box.textContent = 'Could not load: ' + ((r[0].error || r[1].error).message); return; }
      var qs = r[0].data, have = {}; r[1].data.forEach(function (p) { have[p.question_id] = true; });
      var editable = x.status === 'draft';
      box.appendChild(el('h3', { text: 'Questions for: ' + x.title }));
      if (!editable) box.appendChild(el('p', { class: 'hint', text: 'Only draft exams can change their questions. Set the exam back to draft first.' }));
      if (!qs.length) { box.appendChild(el('p', { class: 'hint', text: 'This subject has no questions yet. Add some in the Exam question bank card.' })); return; }
      var total = el('p', { class: 'hint' });
      var boxes = [];
      qs.forEach(function (q) {
        var cb = el('input', { type: 'checkbox' }); cb.checked = !!have[q.id]; cb.disabled = !editable; cb.onchange = upd; cb._q = q; boxes.push(cb);
        box.appendChild(el('label', { class: 'chk' }, [cb, '[' + QTYPES[q.question_type] + '] ' + (q.body.length > 110 ? q.body.slice(0, 110) + '...' : q.body) + ' (' + q.marks + ')']));
      });
      function upd() {
        var s = 0, n = 0; boxes.forEach(function (b) { if (b.checked) { s += Number(b._q.marks); n++; } });
        total.textContent = n + ' selected, ' + s + ' marks (exam total: ' + x.total_marks + ')';
        total.style.color = s === Number(x.total_marks) ? '#166534' : '#92400e';
      }
      upd(); box.appendChild(total);
      if (editable) box.appendChild(btn('Save exam questions', function () {
        var sel = [], pos = {}; boxes.forEach(function (b, i) { if (b.checked) { sel.push(b._q.id); pos[b._q.id] = i; } });
        var rem = Object.keys(have).filter(function (id) { return sel.indexOf(id) < 0; });
        var add = sel.filter(function (id) { return !have[id]; });
        var ops = rem.length ? Promise.resolve(db.from('exam_paper_questions').delete().eq('exam_id', x.id).in('question_id', rem)) : Promise.resolve({});
        ops.then(function (d) {
          if (d && d.error) throw d.error;
          if (!add.length) return {};
          return Promise.resolve(db.from('exam_paper_questions').insert(add.map(function (id) { return { exam_id: x.id, question_id: id, position: pos[id] }; })));
        }).then(function (d) {
          if (d && d.error) throw d.error;
          say('ex_papermsg', 'Exam questions saved.', true); openPaper(x);
        }).catch(function (e) { say('ex_papermsg', 'Could not save: ' + (e.message || e)); });
      }));
      box.appendChild(el('div', { id: 'ex_papermsg', class: 'msg' }));
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  function loadE() {
    var box = g('ex_list'); if (!box) return;
    box.textContent = 'Loading...';
    Promise.resolve(db.from('exams').select('id,title,exam_type,status,starts_at,ends_at,duration_minutes,total_marks,passing_marks,course_id,semester_id,room,instructions,courses(course_code,title)').order('created_at', { ascending: false }).limit(100)).then(function (r) {
      box.textContent = '';
      if (r.error) { box.textContent = 'Could not load: ' + r.error.message; return; }
      if (!r.data.length) { box.appendChild(el('p', { class: 'hint', text: 'No exams yet.' })); return; }
      r.data.forEach(function (x) {
        var it = el('div', { class: 'item' });
        it.appendChild(el('div', null, [el('span', { class: 'badge ' + x.status, text: x.status }), el('span', { class: 'badge', text: ETYPES[x.exam_type] || x.exam_type })]));
        it.appendChild(el('b', { text: x.title }));
        it.appendChild(el('div', { class: 'hint', text: x.courses ? courseLabel(x.courses) : '' }));
        it.appendChild(el('div', { class: 'hint', text: fmt(x.starts_at) + (x.ends_at ? ' to ' + fmt(x.ends_at) : '') + ' | ' + x.duration_minutes + ' min | ' + x.total_marks + ' marks (pass ' + x.passing_marks + ')' + (x.room ? ' | ' + x.room : '') }));
        var a = el('div', { class: 'acts' });
        if (x.status === 'draft' || isMgr()) a.appendChild(btn('Edit', function () { startEditE(x); }, 'secondary'));
        a.appendChild(btn('Questions', function () { openPaper(x); }, 'secondary'));
        if (isMgr() && x.status === 'draft') a.appendChild(btn('Publish', function () { publish(x); }));
        if (isMgr() && (x.status === 'draft' || x.status === 'published')) a.appendChild(btn('Cancel exam', function () { if (confirm('Cancel this exam?')) setStatus(x.id, 'cancelled'); }, 'secondary'));
        if (isMgr() && (x.status === 'published' || x.status === 'cancelled')) a.appendChild(btn('Back to draft', function () { setStatus(x.id, 'draft'); }, 'secondary'));
        if (x.status === 'draft') a.appendChild(btn('Delete', function () { deleteE(x); }, 'secondary'));
        it.appendChild(a); box.appendChild(it);
      });
    });
  }
  function buildEX(ref) {
    var c = el('div', { class: 'card ex', id: 'examCard' });
    c.appendChild(el('h2', { text: 'Exams' }));
    c.appendChild(el('p', { class: 'hint', text: isMgr() ? 'Create exams, add questions from the bank, then publish.' : 'You can prepare draft exams for your subjects. A head or administrator publishes them.' }));
    c.appendChild(el('div', { id: 'ex_listmsg', class: 'msg' }));
    c.appendChild(el('div', { id: 'ex_list' }));
    c.appendChild(el('div', { id: 'ex_paper' }));
    c.appendChild(el('h3', { id: 'ex_ft', text: 'Create an exam' }));
    c.appendChild(field('Title', el('input', { id: 'ex_title', type: 'text', placeholder: 'e.g. Midterm exam' })));
    var cs = el('select', { id: 'ex_course' }); courses.forEach(function (x) { cs.appendChild(opt(x.id, courseLabel(x))); });
    c.appendChild(field('Subject', cs));
    c.appendChild(el('div', { class: 'row' }, [field('Exam type', typeSelect('ex_type', ETYPES)), field('Semester', (function () { var s = el('select', { id: 'ex_sem' }); s.appendChild(opt('', '(none)')); semesters.forEach(function (x) { s.appendChild(opt(x.id, x.name)); }); return s; })())]));
    c.appendChild(el('div', { class: 'row' }, [field('Starts', el('input', { id: 'ex_start', type: 'datetime-local' })), field('Ends', el('input', { id: 'ex_end', type: 'datetime-local' }))]));
    c.appendChild(el('div', { class: 'row' }, [field('Duration (minutes)', el('input', { id: 'ex_dur', type: 'number', min: '1', value: '60' })), field('Room or lab (optional)', el('input', { id: 'ex_room', type: 'text' }))]));
    c.appendChild(el('div', { class: 'row' }, [field('Total marks', el('input', { id: 'ex_total', type: 'number', min: '1', value: '100' })), field('Passing marks', el('input', { id: 'ex_pass', type: 'number', min: '0', value: '50' }))]));
    c.appendChild(field('Instructions for students', el('textarea', { id: 'ex_ins' })));
    c.appendChild(el('div', { style: 'height:12px' }));
    var sv = btn('Save exam as draft', saveE); sv.id = 'ex_save'; c.appendChild(sv);
    var cancel = btn('Cancel edit', resetE, 'secondary'); cancel.id = 'ex_cancel'; cancel.style.display = 'none'; c.appendChild(cancel);
    c.appendChild(el('div', { id: 'ex_msg', class: 'msg' }));
    ref.parentNode.insertBefore(c, ref);
    loadE();
  }

  // ---------------- start-up ----------------
  function teardown() { ['qbCard', 'examCard'].forEach(function (i) { var n = g(i); if (n) n.remove(); }); role = null; uid = null; editQ = null; editE = null; }
  function build() {
    var ref = g('enrollForm'); if (!ref || g('qbCard')) return;
    if (!courses.length) {
      var n = el('div', { class: 'card ex', id: 'qbCard' }, [el('h2', { text: 'Exam question bank' }), el('p', { class: 'hint', text: 'No subjects are available to you yet. Subjects appear here when a course is in your department or unit, or is assigned to you as a teacher.' })]);
      ref.parentNode.insertBefore(n, ref); return;
    }
    buildQB(ref); buildEX(ref);
  }
  function init() {
    if (busy) return; busy = true;
    db.auth.getSession().then(function (s) {
      var sess = s && s.data && s.data.session;
      if (!sess) { teardown(); busy = false; return; }
      if (uid === sess.user.id && g('qbCard')) { busy = false; return; }
      uid = sess.user.id;
      Promise.resolve(db.from('profiles').select('role').eq('id', uid).single()).then(function (r) {
        role = r.data && r.data.role;
        if (ROLES.indexOf(role) < 0) { teardown(); busy = false; return; }
        return Promise.all([Promise.resolve(db.rpc('exam_my_courses')), Promise.resolve(db.from('semesters').select('id,name,starts_on').order('starts_on', { ascending: false }))]).then(function (x) {
          courses = x[0].data || []; semesters = x[1].data || [];
          build(); busy = false;
        });
      }).catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  db.auth.onAuthStateChange(function () { setTimeout(init, 500); });
  setTimeout(init, 800);
})();
