// Example --steps module for verify.mjs: interaction checks for assets/shell.html + lemon.js,
// driven with real key presses and clicks. Copy and adapt the selectors for your page.
//   node scripts/verify.mjs assets/shell.html --sizes 1600x900 --themes light --steps scripts/examples/shell-steps.mjs
export default async ({ ev, key, click, log, sleep }) => {
  const active = () => ev(`(e => e.id || e.getAttribute('data-density') || e.textContent.trim().slice(0, 20))(document.activeElement)`);

  // Selection + mixed header state + single-row action gating
  await click('#tbody tr:nth-child(1) .lm-checkbox');
  await click('#tbody tr:nth-child(2) td:nth-child(3)'); // row click
  log('selection: info / mixed / edit disabled / approve enabled', await ev(`[selInfo.textContent, selAll.indeterminate, document.querySelector('[data-act="ویرایش"]').disabled, document.querySelector('[data-act="تائید"]').disabled]`));

  // Menu: keyboard open lands on checked radio, radio changes density, focus returns
  await ev(`viewBtn.focus()`); await key('ArrowDown');
  log('menu: opens on checked item', await active());
  await key('ArrowUp'); await key('Enter');
  log('menu: density / closed / focus', await ev(`[grid.dataset.density, viewMenu.hidden, document.activeElement.id]`));
  // checkbox item keeps the menu open
  await click('#viewBtn'); await click('[data-col="note"][role="menuitemcheckbox"]');
  log('menu: checkbox keeps open / column hidden', await ev(`[!viewMenu.hidden, document.querySelector('th[data-col="note"]').hidden]`));
  await key('Escape');
  log('menu: Escape closes + refocus', await ev(`[viewMenu.hidden, document.activeElement.id]`));
  await click('#viewBtn'); await click('h1');
  log('menu: outside click closes', await ev(`viewMenu.hidden`));

  // Custom select: open panel, keyboard skips disabled, Enter commits to native select, reset syncs
  await click('#advToggle');
  await ev(`document.querySelector('#fChannel-trigger').focus()`);
  await key('ArrowDown');
  log('select: open, active=selected', await ev(`[document.querySelector('#fChannel-listbox').hidden, document.querySelector('#fChannel-trigger').getAttribute('aria-activedescendant')]`));
  await key('End');
  log('select: End skips disabled option', await ev(`document.querySelector('#fChannel-trigger').getAttribute('aria-activedescendant')`));
  await key('Enter');
  log('select: native value / label / closed / focus', await ev(`[fChannel.value, document.querySelector('#fChannel-value').textContent, document.querySelector('#fChannel-listbox').hidden, document.activeElement.id]`));
  await click('#fChannel-trigger'); await click('#fChannel-opt-4');
  log('select: disabled option click ignored', await ev(`fChannel.value`));
  await key('Escape');
  await ev(`advForm.reset()`); await sleep(50);
  log('select: form reset syncs', await ev(`[fChannel.value, document.querySelector('#fChannel-value').textContent]`));
  log('select: accessible name', await ev(`(t => [t.getAttribute('role'), t.getAttribute('aria-labelledby')])(document.querySelector('#fChannel-trigger'))`));

  // Date validation
  await ev(`fFrom.value = '1405/13/40'`); await click('#advForm [type=submit]');
  log('validation: error shown, invalid, focus', await ev(`[!fFromErr.hidden, fFrom.getAttribute('aria-invalid'), document.activeElement.id]`));

  // Confirm dialog: Escape cancels, focus returns
  await click('#tbody tr:nth-child(1) .lm-checkbox');
  await click('[data-act="حذف"]');
  log('confirm: open, initial focus', await ev(`[document.querySelector('#confirm').open, document.activeElement.textContent.trim()]`));
  await key('Escape');
  log('confirm: closed, focus back on delete', await ev(`[document.querySelector('#confirm').open, document.activeElement.dataset.act || document.activeElement.id]`));

  // Drawer
  await click('[data-detail]');
  log('drawer: open, focus on close', await ev(`[drawer.open, document.activeElement.id]`));
  await key('Escape');

  // Tabs: RTL ArrowLeft moves forward
  await ev(`document.querySelector('#tab-list').focus()`); await key('ArrowLeft');
  log('tabs: ArrowLeft → next tab, panel swap', await ev(`[document.activeElement.id, document.querySelector('#panel-report').hidden, document.querySelector('#panel-list').hidden]`));
  await key('ArrowRight');

  // Search + empty state + clear-all recovery
  await ev(`q.focus()`); await key('z'); await key('z');
  log('search: empty state', await ev(`[grid.hidden, document.querySelector('#state h3') && document.querySelector('#state h3').textContent]`));
  await click('#clearAll');
  log('search: recovered rows, focus', await ev(`[document.querySelectorAll('#tbody tr[data-id]').length, document.activeElement.id]`));

  // Theme toggle persists via storage-safe path
  await click('#themeBtn');
  log('theme: dark + pressed', await ev(`[document.documentElement.dataset.theme, themeBtn.getAttribute('aria-pressed')]`));
};
