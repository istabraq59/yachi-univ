// Searchable, dependent dropdowns: College/Institute/School -> Department.
// Usage: var p = UnitDeptPicker.mount(containerElement, { onChange: fn });
//        p.getValue() -> { unit_id, department_id }   p.validate() -> true/false
//        p.setValue(unitId, deptId)   p.reset()
(function () {
  'use strict';
  var uid = 0;

  var CSS = [
    '.udp-root{margin:0 0 12px}',
    '.udp-field{margin-bottom:10px}',
    '.udp-label{display:block;font-weight:600;margin-bottom:6px}',
    '.udp-btn{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;',
    ' padding:12px;font-size:16px;text-align:left;background:#fff;color:#111827;border:1px solid #767676;border-radius:8px;cursor:pointer;margin:0}',
    '.udp-btn:focus-visible{outline:3px solid #2563eb;outline-offset:2px}',
    '.udp-btn[disabled]{opacity:.55;cursor:not-allowed}',
    '.udp-btn-text{flex:1;min-width:0;white-space:normal}',
    '.udp-btn-text.udp-ph{color:#6b7280}',
    '.udp-err{color:#b91c1c;font-size:14px;margin-top:4px;min-height:0}',
    '.udp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:flex-end;justify-content:center}',
    '.udp-dialog{background:#fff;color:#111827;width:100%;max-height:85vh;display:flex;flex-direction:column;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.25)}',
    '@media (min-width:700px){.udp-overlay{align-items:center}.udp-dialog{width:520px;max-height:70vh;border-radius:16px}}',
    '.udp-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px}',
    '.udp-title{font-size:18px;font-weight:700;margin:0}',
    '.udp-close{width:auto;margin:0;padding:6px 12px;font-size:15px;background:#e5e7eb;color:#111827;border:0;border-radius:8px;cursor:pointer}',
    '.udp-search{width:calc(100% - 32px);box-sizing:border-box;margin:6px 16px 8px;padding:12px;font-size:16px;border:1px solid #767676;border-radius:8px}',
    '.udp-search:focus-visible,.udp-close:focus-visible,.udp-retry:focus-visible{outline:3px solid #2563eb;outline-offset:2px}',
    '.udp-status{padding:0 16px 6px;font-size:13px;color:#6b7280}',
    '.udp-list{list-style:none;margin:0;padding:0 8px 12px;overflow-y:auto;flex:1}',
    '.udp-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 10px;border-radius:8px;cursor:pointer;font-size:16px}',
    '.udp-opt.udp-active{background:#dbeafe}',
    '.udp-opt[aria-selected="true"]{font-weight:700}',
    '.udp-sub{display:block;font-size:12px;color:#6b7280;font-weight:400;text-transform:capitalize}',
    '.udp-check{color:#2563eb;font-weight:700;flex:none}',
    '.udp-msg{padding:18px 16px;text-align:center;color:#6b7280}',
    '.udp-msg.udp-bad{color:#b91c1c}',
    '.udp-retry{width:auto;margin:10px auto 0;padding:8px 16px;font-size:15px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer;display:block}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('udpStyles')) return;
    var s = document.createElement('style');
    s.id = 'udpStyles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''; }

  // ---- one searchable field ----
  function makeField(cfg) {
    var id = 'udp' + (++uid);
    var wrap = el('div', 'udp-field');
    var label = el('label', 'udp-label', cfg.label);
    var btn = el('button', 'udp-btn');
    btn.type = 'button';
    btn.id = id + '-b';
    label.htmlFor = btn.id;
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-describedby', id + '-e');
    var btnText = el('span', 'udp-btn-text udp-ph', cfg.placeholder);
    btn.appendChild(btnText);
    btn.appendChild(el('span', 'udp-caret', '\u25BE'));
    var err = el('div', 'udp-err');
    err.id = id + '-e';
    err.setAttribute('role', 'alert');
    wrap.appendChild(label); wrap.appendChild(btn); wrap.appendChild(err);

    var value = null;

    function paintButton() {
      if (value) { btnText.textContent = value.name; btnText.className = 'udp-btn-text'; }
      else { btnText.textContent = cfg.placeholder; btnText.className = 'udp-btn-text udp-ph'; }
    }

    function open() {
      if (btn.disabled) return;
      var items = [], filtered = [], active = -1, loading = true, loadError = '';
      var overlay = el('div', 'udp-overlay');
      var dlg = el('div', 'udp-dialog');
      dlg.setAttribute('role', 'dialog');
      dlg.setAttribute('aria-modal', 'true');
      dlg.setAttribute('aria-label', cfg.label);
      var head = el('div', 'udp-head');
      head.appendChild(el('h3', 'udp-title', cfg.label));
      var closeBtn = el('button', 'udp-close', 'Close');
      closeBtn.type = 'button';
      head.appendChild(closeBtn);
      var search = el('input', 'udp-search');
      search.type = 'search';
      search.placeholder = 'Search\u2026';
      search.autocomplete = 'off';
      search.setAttribute('role', 'combobox');
      search.setAttribute('aria-expanded', 'true');
      search.setAttribute('aria-autocomplete', 'list');
      search.setAttribute('aria-label', 'Search ' + cfg.label);
      var status = el('div', 'udp-status');
      status.setAttribute('aria-live', 'polite');
      var list = el('ul', 'udp-list');
      list.id = id + '-list';
      list.setAttribute('role', 'listbox');
      search.setAttribute('aria-controls', list.id);
      dlg.appendChild(head); dlg.appendChild(search); dlg.appendChild(status); dlg.appendChild(list);
      overlay.appendChild(dlg);
      document.body.appendChild(overlay);
      var prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      function close() {
        document.removeEventListener('keydown', onKey, true);
        document.body.style.overflow = prevOverflow;
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        btn.focus();
      }
      function choose(item) {
        value = item;
        paintButton();
        err.textContent = '';
        close();
        if (cfg.onSelect) cfg.onSelect(item);
      }
      function setActive(i) {
        active = i;
        var rows = list.querySelectorAll('[role=option]');
        for (var k = 0; k < rows.length; k++) rows[k].classList.toggle('udp-active', k === i);
        if (i >= 0 && rows[i]) {
          rows[i].scrollIntoView({ block: 'nearest' });
          search.setAttribute('aria-activedescendant', rows[i].id);
        } else {
          search.removeAttribute('aria-activedescendant');
        }
      }
      function render() {
        list.textContent = '';
        status.textContent = '';
        if (loading) { list.appendChild(el('li', 'udp-msg', 'Loading\u2026')); return; }
        if (loadError) {
          var li = el('li', 'udp-msg udp-bad', 'Could not load: ' + loadError);
          var retry = el('button', 'udp-retry', 'Try again');
          retry.type = 'button';
          retry.onclick = load;
          li.appendChild(retry);
          list.appendChild(li);
          return;
        }
        if (!items.length) { list.appendChild(el('li', 'udp-msg', cfg.emptyText || 'Nothing to show.')); return; }
        if (!filtered.length) {
          list.appendChild(el('li', 'udp-msg', 'No match for \u201C' + search.value.trim() + '\u201D.'));
          return;
        }
        status.textContent = filtered.length + ' of ' + items.length;
        filtered.forEach(function (it, i) {
          var li = el('li', 'udp-opt');
          li.id = id + '-o' + i;
          li.setAttribute('role', 'option');
          var selected = !!(value && value.id === it.id);
          li.setAttribute('aria-selected', selected ? 'true' : 'false');
          var txt = el('span', null, it.name);
          if (it.sub) txt.appendChild(el('span', 'udp-sub', it.sub));
          li.appendChild(txt);
          if (selected) li.appendChild(el('span', 'udp-check', '\u2713'));
          li.onclick = function () { choose(it); };
          list.appendChild(li);
        });
        var sel = -1;
        filtered.forEach(function (it, i) { if (value && value.id === it.id) sel = i; });
        setActive(sel >= 0 ? sel : 0);
      }
      function applyFilter() {
        var q = search.value.trim().toLowerCase();
        filtered = items.filter(function (it) { return it.name.toLowerCase().indexOf(q) !== -1; });
        render();
      }
      function load() {
        loading = true; loadError = ''; render();
        Promise.resolve().then(cfg.getItems).then(function (res) {
          items = res || []; loading = false; applyFilter();
        }).catch(function (e) {
          loading = false; loadError = (e && e.message) || 'unknown error'; render();
        });
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'Tab') {
          e.preventDefault();
          (document.activeElement === search ? closeBtn : search).focus();
          return;
        }
        if (document.activeElement !== search) return;
        var n = filtered.length;
        if (!n || loading || loadError) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % n); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + n) % n); }
        else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
        else if (e.key === 'End') { e.preventDefault(); setActive(n - 1); }
        else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0) choose(filtered[active]); }
      }
      document.addEventListener('keydown', onKey, true);
      closeBtn.onclick = close;
      overlay.onclick = function (e) { if (e.target === overlay) close(); };
      search.oninput = applyFilter;
      load();
      search.focus();
    }
    btn.onclick = open;

    return {
      el: wrap,
      getValue: function () { return value; },
      setValue: function (item) { value = item || null; paintButton(); if (item) err.textContent = ''; },
      clear: function () { value = null; paintButton(); err.textContent = ''; },
      setError: function (m) { err.textContent = m || ''; },
      setDisabled: function (b) { btn.disabled = !!b; },
      focus: function () { btn.focus(); }
    };
  }

  // ---- the two dependent fields ----
  function mount(container, opts) {
    opts = opts || {};
    injectCss();
    var root = el('div', 'udp-root');
    var unitsCache = null;
    var deptCache = {};

    function loadUnits() {
      if (unitsCache) return Promise.resolve(unitsCache);
      return db.from('academic_units').select('id, name, type').order('name').then(function (r) {
        if (r.error) throw new Error(r.error.message);
        unitsCache = (r.data || []).map(function (x) { return { id: x.id, name: x.name, sub: cap(x.type) }; });
        return unitsCache;
      });
    }
    function loadDepts() {
      var unit = unitField.getValue();
      if (!unit) return Promise.resolve([]);
      if (deptCache[unit.id]) return Promise.resolve(deptCache[unit.id]);
      return db.from('departments').select('id, name').eq('unit_id', unit.id).order('name').then(function (r) {
        if (r.error) throw new Error(r.error.message);
        deptCache[unit.id] = (r.data || []).map(function (x) { return { id: x.id, name: x.name }; });
        return deptCache[unit.id];
      });
    }
    function fire() { if (opts.onChange) opts.onChange(api.getValue()); }

    var lastUnit = null;
    var unitField = makeField({
      label: 'Choose College, Institute or School',
      placeholder: 'Choose College, Institute or School',
      emptyText: 'No colleges, institutes or schools found.',
      getItems: loadUnits,
      onSelect: function (item) {
        if (!lastUnit || lastUnit !== item.id) {
          deptField.clear();            // institution changed: clear old department
          deptField.setError('');
        }
        lastUnit = item.id;
        deptField.el.hidden = false;
        fire();
      }
    });
    var deptField = makeField({
      label: 'Choose Department',
      placeholder: 'Choose Department',
      emptyText: 'No departments in this college, institute or school yet.',
      getItems: loadDepts,
      onSelect: function () { fire(); }
    });
    deptField.el.hidden = true;
    root.appendChild(unitField.el);
    root.appendChild(deptField.el);
    container.appendChild(root);

    var api = {
      getValue: function () {
        var u = unitField.getValue(), d = deptField.getValue();
        return { unit_id: u ? u.id : null, department_id: d ? d.id : null };
      },
      validate: function () {
        var v = api.getValue(), ok = true;
        unitField.setError(v.unit_id ? '' : 'Please choose a college, institute or school.');
        if (!v.unit_id) ok = false;
        deptField.setError(v.unit_id && !v.department_id ? 'Please choose a department.' : '');
        if (v.unit_id && !v.department_id) ok = false;
        if (!ok) (v.unit_id ? deptField : unitField).focus();
        return ok;
      },
      reset: function () {
        unitField.clear(); deptField.clear(); deptField.el.hidden = true; lastUnit = null; fire();
      },
      setValue: async function (unitId, deptId) {
        if (!unitId) { api.reset(); return; }
        var units = await loadUnits();
        var u = units.filter(function (x) { return x.id === unitId; })[0];
        if (!u) { api.reset(); return; }
        unitField.setValue(u); lastUnit = u.id; deptField.el.hidden = false; deptField.clear();
        if (deptId) {
          var ds = await loadDepts();
          var d = ds.filter(function (x) { return x.id === deptId; })[0];
          if (d) deptField.setValue(d);
        }
        fire();
      }
    };
    return api;
  }

  window.UnitDeptPicker = { mount: mount };
})();
