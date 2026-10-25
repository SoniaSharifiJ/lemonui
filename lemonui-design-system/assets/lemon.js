/* Lemon UI behaviour layer: framework-free, no dependencies.
   Exposes window.LemonUI. Pairs with components.css (lm- classes).
   Implements the interaction contracts in references/components-and-interactions.md:
     LemonUI.menu(button, onSelect)   menu-button pattern (menuitem / radio / checkbox)
     LemonUI.select(nativeSelect)     accessible custom select over a native <select>
     LemonUI.tabs(tablist)            automatic-activation tabs, RTL-aware arrows
     LemonUI.navigation(appEl)        sidebar toggle/drawer, collapsible groups, menu filter
     LemonUI.theme                    light/dark switch with safe storage
     LemonUI.toast(message)           polite status toasts
     LemonUI.fa / en / faNum          Persian digit helpers
   Every init returns { destroy } so re-renders do not stack listeners. */
(function (global) {
  'use strict';

  const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  /** Latin digits -> Persian digits (display only; never for codes/IDs). */
  const fa = s => String(s).replace(/[0-9]/g, d => FA[d]);
  /** Persian/Arabic-Indic digits -> Latin (normalize user input before comparing/sending). */
  const en = s => String(s).replace(/[۰-۹]/g, d => FA.indexOf(d)).replace(/[٠-٩]/g, d => AR.indexOf(d));
  /** Number -> Persian digits with ٬ grouping. Wrap the result in .lm-ltr. */
  const faNum = (n, opts) => Number(n).toLocaleString('fa-IR', opts);

  const isRtl = el => getComputedStyle(el).direction === 'rtl';
  let uid = 0;
  const ensureId = (el, prefix) => el.id || (el.id = `${prefix}-${++uid}`);

  /* ---------- Popup placement: flip inside the viewport ---------- */
  function place(pop) {
    pop.classList.remove('lm-flip-y');
    const baseFlip = pop.dataset.lmBaseFlip === '1';
    pop.classList.toggle('lm-flip-x', baseFlip);
    let r = pop.getBoundingClientRect();
    if (r.left < 8 || r.right > innerWidth - 8) pop.classList.toggle('lm-flip-x');
    r = pop.getBoundingClientRect();
    if (r.bottom > innerHeight - 8 && r.height < r.top) pop.classList.add('lm-flip-y');
  }

  /* One popup open at a time; outside pointer, resize and real scrolling close it. */
  let openPopup = null;
  document.addEventListener('pointerdown', e => {
    if (openPopup && !openPopup.contains(e.target)) openPopup.close(false);
  });
  addEventListener('resize', () => openPopup && openPopup.close(false));
  // Escape closes an open popup even if focus drifted outside it (e.g. after a
  // pointer click). Popup handlers stop propagation, so this is the fallback.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openPopup) { e.preventDefault(); e.stopPropagation(); openPopup.close(true); }
  });
  document.addEventListener('scroll', e => {
    // Scrolling inside the popup itself (long option lists) must not dismiss it.
    if (openPopup && !openPopup.popup.contains(e.target)) openPopup.close(false);
  }, true);

  /* ---------- Menu button ----------
     Markup:
       <div class="lm-menu-wrap">
         <button aria-haspopup="menu" aria-expanded="false" aria-controls="m1">…</button>
         <div class="lm-menu" role="menu" id="m1" aria-labelledby="…" hidden>
           <button role="menuitem" tabindex="-1">…</button>
           <div role="group" aria-labelledby="g"><button role="menuitemradio" aria-checked="true" tabindex="-1">…</button></div>
           <button role="menuitemcheckbox" aria-checked="false" tabindex="-1">…</button>
     onSelect(item) runs after radio/checkbox state is updated.
     Checkbox items keep the menu open (multiple toggles); others close it. */
  function menu(btn, onSelect) {
    const pop = document.getElementById(btn.getAttribute('aria-controls'));
    const wrap = btn.closest('.lm-menu-wrap') || btn.parentElement;
    pop.dataset.lmBaseFlip = pop.classList.contains('lm-flip-x') ? '1' : '0';
    const items = () => [...pop.querySelectorAll('[role^="menuitem"]')].filter(i => !i.disabled && i.getAttribute('aria-disabled') !== 'true');
    const api = { popup: pop, contains: n => wrap.contains(n), close };

    function open(focusLast) {
      if (openPopup && openPopup !== api) openPopup.close(false);
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      openPopup = api;
      place(pop);
      const its = items();
      const target = focusLast ? its[its.length - 1] : (its.find(i => i.getAttribute('aria-checked') === 'true') || its[0]);
      target && target.focus();
    }
    function close(refocus) {
      if (pop.hidden) return;
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (openPopup === api) openPopup = null;
      if (refocus) btn.focus();
    }
    const onBtnClick = () => (pop.hidden ? open() : close(true));
    const onBtnKey = e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(e.key === 'ArrowUp'); }
    };
    const onPopKey = e => {
      const its = items(), i = its.indexOf(document.activeElement);
      let next = null;
      switch (e.key) {
        case 'ArrowDown': next = its[(i + 1) % its.length]; break;
        case 'ArrowUp': next = its[(i - 1 + its.length) % its.length]; break;
        case 'Home': next = its[0]; break;
        case 'End': next = its[its.length - 1]; break;
        case 'Escape': e.preventDefault(); e.stopPropagation(); close(true); return; // before any enclosing dialog
        case 'Tab': close(false); return;                                           // never trap Tab
        default:
          if (e.key.length === 1 && e.key !== ' ') {
            next = its.slice(i + 1).concat(its.slice(0, i + 1)).find(x => x.textContent.trim().startsWith(e.key));
          }
      }
      if (next) { e.preventDefault(); next.focus(); }
    };
    const onPopClick = e => {
      const it = e.target.closest('[role^="menuitem"]');
      if (!it || it.disabled || it.getAttribute('aria-disabled') === 'true') return;
      const role = it.getAttribute('role');
      if (role === 'menuitemcheckbox') {
        it.setAttribute('aria-checked', String(it.getAttribute('aria-checked') !== 'true'));
        it.focus(); // keep keyboard (Escape, arrows) working after a pointer toggle
        onSelect && onSelect(it);
        return;
      }
      if (role === 'menuitemradio') {
        const scope = it.closest('[role="group"]') || pop;
        scope.querySelectorAll('[role="menuitemradio"]').forEach(x => x.setAttribute('aria-checked', String(x === it)));
      }
      close(true);
      onSelect && onSelect(it);
    };
    btn.addEventListener('click', onBtnClick);
    btn.addEventListener('keydown', onBtnKey);
    pop.addEventListener('keydown', onPopKey);
    pop.addEventListener('click', onPopClick);
    return {
      open, close,
      destroy() {
        close(false);
        btn.removeEventListener('click', onBtnClick);
        btn.removeEventListener('keydown', onBtnKey);
        pop.removeEventListener('keydown', onPopKey);
        pop.removeEventListener('click', onPopClick);
      }
    };
  }

  /* ---------- Custom select (combobox + listbox, focus stays on trigger) ----------
     Progressive enhancement: start from a working native <select> with a <label for>.
     The native select stays in the form (values, reset, required, change events)
     but is visually hidden and removed from the tab order; the visible trigger
     takes the label. If this script never runs, the native select still works.
     Usage: const s = LemonUI.select(document.querySelector('#status')); s.destroy() */
  function select(native) {
    const id = ensureId(native, 'lm-sel');
    const label = document.querySelector(`label[for="${id}"]`);
    const labelId = label ? ensureId(label, 'lm-lbl') : null;

    const wrap = document.createElement('div');
    wrap.className = 'lm-menu-wrap lm-menu-wrap--block';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lm-field lm-field--button';
    trigger.id = id + '-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const valueSpan = document.createElement('span');
    valueSpan.id = id + '-value';
    trigger.append(valueSpan);
    trigger.insertAdjacentHTML('beforeend', '<svg class="lm-i lm-i--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
    if (labelId) trigger.setAttribute('aria-labelledby', `${labelId} ${valueSpan.id}`);
    else trigger.setAttribute('aria-label', native.getAttribute('aria-label') || native.name || '');
    const list = document.createElement('div');
    list.className = 'lm-menu lm-menu--full';
    list.id = id + '-listbox';
    list.setAttribute('role', 'listbox');
    if (labelId) list.setAttribute('aria-labelledby', labelId);
    list.hidden = true;
    trigger.setAttribute('aria-controls', list.id);
    if (native.hasAttribute('aria-describedby')) trigger.setAttribute('aria-describedby', native.getAttribute('aria-describedby'));
    wrap.append(trigger, list);
    native.after(wrap);
    native.classList.add('lm-sr-only');
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    if (label) label.addEventListener('click', focusTrigger);

    let active = -1;
    const api = { popup: list, contains: n => wrap.contains(n), close };
    const opts = () => [...list.children];

    function build() {
      list.textContent = '';
      [...native.options].forEach((o, i) => {
        const el = document.createElement('div');
        el.id = `${id}-opt-${i}`;
        el.setAttribute('role', 'option');
        el.dataset.index = i;
        el.setAttribute('aria-selected', String(o.selected));
        if (o.disabled) el.setAttribute('aria-disabled', 'true');
        el.innerHTML = '<span></span><svg class="lm-i lm-i--sm lm-menu__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
        el.firstChild.textContent = o.text;
        list.append(el);
      });
      sync();
    }
    function sync() {
      const o = native.options[native.selectedIndex];
      valueSpan.textContent = o ? o.text : '';
      trigger.disabled = native.disabled;
      opts().forEach((el, i) => {
        const sel = i === native.selectedIndex;
        el.setAttribute('aria-selected', String(sel));
      });
    }
    function setActive(i) {
      const all = opts();
      all.forEach(el => el.classList.remove('is-active'));
      active = i;
      if (i < 0 || !all[i]) { trigger.removeAttribute('aria-activedescendant'); return; }
      all[i].classList.add('is-active');
      trigger.setAttribute('aria-activedescendant', all[i].id);
      // Scroll only the listbox, never the document.
      const el = all[i], top = el.offsetTop, bottom = top + el.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }
    const enabled = i => !native.options[i].disabled;
    function step(from, dir) {
      const n = native.options.length;
      for (let k = 1; k <= n; k++) { const i = (from + dir * k + n * 2) % n; if (enabled(i)) return i; }
      return from;
    }
    function open() {
      if (native.disabled) return;
      if (openPopup && openPopup !== api) openPopup.close(false);
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      openPopup = api;
      place(list);
      setActive(native.selectedIndex >= 0 ? native.selectedIndex : step(-1, 1));
    }
    function close(refocus) {
      if (list.hidden) return;
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      setActive(-1);
      if (openPopup === api) openPopup = null;
      if (refocus) trigger.focus();
    }
    function choose(i) {
      if (i < 0 || !enabled(i)) return;
      if (native.selectedIndex !== i) {
        native.selectedIndex = i;
        native.dispatchEvent(new Event('input', { bubbles: true }));
        native.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
      trigger.removeAttribute('aria-invalid');
      close(true);
    }
    let typed = '', typedTimer = 0;
    function onKey(e) {
      const isOpen = !list.hidden;
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); isOpen ? setActive(step(active, 1)) : open(); return;
        case 'ArrowUp': e.preventDefault(); isOpen ? setActive(step(active, -1)) : open(); return;
        case 'Home': if (isOpen) { e.preventDefault(); setActive(step(-1, 1)); } return;
        case 'End': if (isOpen) { e.preventDefault(); setActive(step(native.options.length, -1)); } return;
        case 'Enter': case ' ':
          if (e.key === ' ' && typed) break; // space inside typeahead
          e.preventDefault(); isOpen ? choose(active) : open(); return;
        case 'Escape': if (isOpen) { e.preventDefault(); e.stopPropagation(); close(true); } return;
        case 'Tab': if (isOpen) { choose(active); } return; // commit like a native select, never trap
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        clearTimeout(typedTimer);
        typed += e.key;
        typedTimer = setTimeout(() => (typed = ''), 600);
        const all = [...native.options];
        const start = Math.max(active, native.selectedIndex);
        const order = all.slice(start + 1).concat(all.slice(0, start + 1));
        const hit = order.find(o => !o.disabled && o.text.trim().startsWith(typed));
        if (hit) { isOpen ? setActive(hit.index) : choose(hit.index); }
      }
    }
    function focusTrigger(e) { e.preventDefault(); trigger.focus(); }
    const onClick = () => (list.hidden ? open() : close(true));
    const onListDown = e => e.preventDefault(); // keep focus on the trigger
    const onListClick = e => { const o = e.target.closest('[role="option"]'); if (o) choose(+o.dataset.index); };
    const onListMove = e => { const o = e.target.closest('[role="option"]'); if (o && enabled(+o.dataset.index)) setActive(+o.dataset.index); };
    const onNativeChange = () => sync();
    const onReset = () => setTimeout(sync); // after the browser restores defaults
    const onInvalid = e => { e.preventDefault(); trigger.setAttribute('aria-invalid', 'true'); trigger.focus(); };

    trigger.addEventListener('click', onClick);
    trigger.addEventListener('keydown', onKey);
    list.addEventListener('mousedown', onListDown);
    list.addEventListener('click', onListClick);
    list.addEventListener('mousemove', onListMove);
    native.addEventListener('change', onNativeChange);
    native.addEventListener('invalid', onInvalid);
    native.form && native.form.addEventListener('reset', onReset);
    // Programmatic changes to options/disabled are picked up automatically.
    const mo = new MutationObserver(build);
    mo.observe(native, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'label'] });
    build();

    return {
      refresh: build,   // call after setting native.value from code (no event fires for that)
      open, close,
      destroy() {
        close(false);
        mo.disconnect();
        clearTimeout(typedTimer);
        native.removeEventListener('change', onNativeChange);
        native.removeEventListener('invalid', onInvalid);
        native.form && native.form.removeEventListener('reset', onReset);
        if (label) label.removeEventListener('click', focusTrigger);
        wrap.remove();
        native.classList.remove('lm-sr-only');
        native.removeAttribute('tabindex');
        native.removeAttribute('aria-hidden');
      }
    };
  }

  /* ---------- Tabs (automatic activation) ----------
     <div role="tablist"><button role="tab" aria-selected="true" aria-controls="p1">…</button>…</div>
     <section role="tabpanel" id="p1" aria-labelledby="…">…</section> */
  function tabs(tablist, onChange) {
    const all = () => [...tablist.querySelectorAll('[role="tab"]')];
    function select(tab, focus) {
      all().forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      onChange && onChange(tab);
    }
    const onClick = e => { const t = e.target.closest('[role="tab"]'); if (t) select(t); };
    const onKey = e => {
      const ts = all(), i = ts.indexOf(document.activeElement);
      if (i < 0) return;
      const fwd = isRtl(tablist) ? 'ArrowLeft' : 'ArrowRight';
      const back = isRtl(tablist) ? 'ArrowRight' : 'ArrowLeft';
      const map = { [fwd]: (i + 1) % ts.length, [back]: (i - 1 + ts.length) % ts.length, Home: 0, End: ts.length - 1 };
      if (e.key in map) { e.preventDefault(); select(ts[map[e.key]], true); }
    };
    tablist.addEventListener('click', onClick);
    tablist.addEventListener('keydown', onKey);
    const current = all().find(t => t.getAttribute('aria-selected') === 'true') || all()[0];
    if (current) all().forEach(t => (t.tabIndex = t === current ? 0 : -1));
    return {
      select,
      destroy() { tablist.removeEventListener('click', onClick); tablist.removeEventListener('keydown', onKey); }
    };
  }

  /* ---------- Toasts ---------- */
  function toast(message, { timeout = 3200 } = {}) {
    let host = document.querySelector('.lm-toasts');
    if (!host) {
      host = document.createElement('div');
      host.className = 'lm-toasts';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.append(host);
    }
    const el = document.createElement('div');
    el.className = 'lm-toast';
    el.textContent = message;
    host.append(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 260); }, timeout);
    return el;
  }

  /* ---------- Theme ---------- */
  const theme = {
    key: 'lm-theme',
    get() { return document.documentElement.dataset.theme || 'light'; },
    set(t) {
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem(this.key, t); } catch (_) { /* private mode / blocked storage */ }
      document.dispatchEvent(new CustomEvent('lm:themechange', { detail: t }));
    },
    toggle() { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
    restore(fallback = 'light') {
      let t = fallback;
      try { t = localStorage.getItem(this.key) || fallback; } catch (_) {}
      this.set(t);
      return t;
    }
  };

  /* ---------- App navigation ----------
     appEl: .lm-app. Needs #… ids wired via data attributes:
       [data-lm-nav-toggle] button (aria-controls = sidebar id), .lm-sidebar, .lm-scrim,
       .lm-nav__group-btn (aria-controls = list id), optional [data-lm-nav-filter] input. */
  function navigation(app) {
    const toggle = app.querySelector('[data-lm-nav-toggle]');
    const sidebar = app.querySelector('.lm-sidebar');
    const scrim = app.querySelector('.lm-scrim');
    const filter = app.querySelector('[data-lm-nav-filter]');
    const narrow = matchMedia('(max-width: 1024px)');
    const nav = sidebar.querySelector('.lm-nav');
    let highlight = null, layoutFrame = 0, disposed = false;
    function updateHighlight() {
      layoutFrame = 0;
      if (!nav || disposed) return;
      const current = nav.querySelector('.lm-nav__item[aria-current="page"]');
      const box = current && current.getBoundingClientRect();
      if (!box || !box.width || !box.height) { highlight.hidden = true; return; }
      const container = nav.getBoundingClientRect();
      highlight.hidden = false;
      highlight.style.width = box.width + 'px';
      highlight.style.height = box.height + 'px';
      highlight.style.transform = 'translate(' + (box.left - container.left + nav.scrollLeft) + 'px,' + (box.top - container.top + nav.scrollTop) + 'px)';
    }
    function scheduleHighlight() { if (!disposed && !layoutFrame) layoutFrame = requestAnimationFrame(updateHighlight); }
    const onDestination = e => {
      const item = e.target.closest('a.lm-nav__item');
      if (!item || !nav.contains(item)) return;
      nav.querySelectorAll('.lm-nav__item[aria-current]').forEach(n => n.removeAttribute('aria-current'));
      item.setAttribute('aria-current', 'page');
      scheduleHighlight();
    };
    let navResize, navMutation;
    if (nav) {
      nav.classList.add('lm-nav--shared');
      highlight = document.createElement('div');
      highlight.className = 'lm-nav__highlight';
      highlight.setAttribute('aria-hidden', 'true');
      highlight.hidden = true;
      nav.prepend(highlight);
      nav.addEventListener('click', onDestination);
      nav.addEventListener('scroll', scheduleHighlight);
      if (typeof ResizeObserver !== 'undefined') { navResize = new ResizeObserver(scheduleHighlight); navResize.observe(nav); }
      if (typeof MutationObserver !== 'undefined') { navMutation = new MutationObserver(scheduleHighlight); navMutation.observe(nav, {subtree:true, childList:true, attributes:true, attributeFilter:['aria-current','aria-expanded','hidden','class']}); }
      if (document.fonts) document.fonts.ready.then(scheduleHighlight);
      addEventListener('resize', scheduleHighlight);
      scheduleHighlight();
    }
    const groupBtns = [...app.querySelectorAll('.lm-nav__group-btn')];

    function syncState() {
      const visible = narrow.matches ? app.classList.contains('is-nav-open') : !app.classList.contains('is-nav-hidden');
      toggle && toggle.setAttribute('aria-expanded', String(visible));
      if (scrim) scrim.hidden = !(narrow.matches && visible);
      sidebar.inert = narrow.matches && !visible; // off-canvas drawer is not tabbable
    }
    function closeDrawer(refocus) { app.classList.remove('is-nav-open'); syncState(); if (refocus && toggle) toggle.focus(); }
    const onToggle = () => {
      if (narrow.matches) {
        app.classList.toggle('is-nav-open');
        syncState();
        if (app.classList.contains('is-nav-open')) (filter || sidebar.querySelector('a, button')).focus();
      } else {
        app.classList.toggle('is-nav-hidden');
        syncState();
      }
    };
    const onScrim = () => closeDrawer(true);
    const onSidebarKey = e => { if (e.key === 'Escape' && narrow.matches && app.classList.contains('is-nav-open')) closeDrawer(true); };
    const onMedia = () => { app.classList.remove('is-nav-open'); syncState(); };
    const setGroup = (btn, open) => {
      btn.setAttribute('aria-expanded', String(open));
      document.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
    };
    const onGroup = e => { const b = e.target.closest('.lm-nav__group-btn'); if (b) setGroup(b, b.getAttribute('aria-expanded') !== 'true'); };

    let saved = null;
    function runFilter() {
      const term = filter.value.trim();
      if (term && !saved) saved = groupBtns.map(b => b.getAttribute('aria-expanded') === 'true');
      let any = false;
      app.querySelectorAll('.lm-nav__group').forEach((g, gi) => {
        const btn = g.querySelector('.lm-nav__group-btn');
        const labelHit = term && btn.textContent.includes(term);
        let hits = 0;
        g.querySelectorAll('li').forEach(li => {
          const note = li.classList.contains('lm-nav__note');
          const show = !term || labelHit || (!note && li.textContent.includes(term));
          li.hidden = !show;
          if (show && !note) hits++;
        });
        const show = !term || labelHit || hits > 0;
        g.hidden = !show;
        if (show) any = true;
        if (term) setGroup(btn, show); else if (saved) setGroup(btn, saved[gi]);
      });
      if (!term) saved = null;
      const empty = app.querySelector('.lm-nav__empty');
      if (empty) empty.hidden = any;
    }
    const onFilterKey = e => { if (e.key === 'Escape' && filter.value) { e.preventDefault(); e.stopPropagation(); filter.value = ''; runFilter(); } };

    toggle && toggle.addEventListener('click', onToggle);
    scrim && scrim.addEventListener('click', onScrim);
    sidebar.addEventListener('keydown', onSidebarKey);
    sidebar.addEventListener('click', onGroup);
    narrow.addEventListener('change', onMedia);
    if (filter) { filter.addEventListener('input', runFilter); filter.addEventListener('keydown', onFilterKey); }
    syncState();
    return {
      filter: runFilter,
      refresh: scheduleHighlight,
      destroy() {
        disposed = true;
        if (layoutFrame) cancelAnimationFrame(layoutFrame);
        if (nav) { nav.removeEventListener('click', onDestination); nav.removeEventListener('scroll', scheduleHighlight); nav.classList.remove('lm-nav--shared'); highlight.remove(); }
        if (navResize) navResize.disconnect();
        if (navMutation) navMutation.disconnect();
        removeEventListener('resize', scheduleHighlight);
        toggle && toggle.removeEventListener('click', onToggle);
        scrim && scrim.removeEventListener('click', onScrim);
        sidebar.removeEventListener('keydown', onSidebarKey);
        sidebar.removeEventListener('click', onGroup);
        narrow.removeEventListener('change', onMedia);
        if (filter) { filter.removeEventListener('input', runFilter); filter.removeEventListener('keydown', onFilterKey); }
      }
    };
  }

  global.LemonUI = { fa, en, faNum, menu, select, tabs, toast, theme, navigation };
})(window);
