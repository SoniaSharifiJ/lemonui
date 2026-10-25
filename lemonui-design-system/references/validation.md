# Targeted quality review

Scale the checks to the size of the change. A one-line tweak doesn't need a full audit. A new page or screen needs everything below.

## 1. Automated checks (run them, they're cheap)

```bash
# Theme: 18 role pairs per mode, blended through the glass layers. --suggest prints fixes.
node <skill>/scripts/contrast.mjs --tokens path/tokens.css [--tokens path/tokens.dark.css] --suggest

# Page: screenshots for every size × theme, plus audits. Exit 1 on any finding.
node <skill>/scripts/verify.mjs page.html --out verify-out \
     [--sizes 1600x900,1366x768,390x844] [--themes light,dark] [--steps steps.mjs]
```

`verify.mjs` waits for the font. Layout measured on the fallback font is wrong, because Tahoma is wider than Vazirmatn. A page still on Google Fonts can need 10s+ on some networks, so switch it to the bundled `fonts.css`. Each run reports:
- **font not loaded:** treat every other number as unreliable until this is fixed.
- **overflow / page scrolls sideways / container scrolls sideways:** a toolbar or form forcing width. Tables may scroll inside `.lm-table-wrap`. Mark any other intentional case with `data-lm-scroll-x`.
- **off-scale type:** sizes or weights outside Lemon's scale, such as 13px or weight 500.
- **text nearly invisible on its own fill:** a label colour collapsed into its button's background. Typically a CSS reset outranks the component, which is why the `lm` resets use `:where()`.
- **console errors / exceptions.**

**Then look at the PNGs yourself.** The audits can't judge hierarchy, alignment, crowding, whether the right things wrap at 1366px, or whether the redesign actually answers the brief. Compare against the source screenshot, if there is one.

## 2. Interaction checks (`--steps`)

Write a small steps module for the behaviour you built. `key()` and `click()` send real input events, so a passing step means the real path works. Scripted `el.click()` skips focus and keyboard handling.

```js
// steps.mjs
export default async ({ ev, key, click, log }) => {
  await click('#tbody .lm-checkbox');                              // select one row
  log('bulk mixed', await ev(`document.querySelector('#selAll').indeterminate`));
  await ev(`document.querySelector('#viewBtn').focus()`); await key('ArrowDown');
  log('menu focus', await ev(`document.activeElement.textContent.trim()`));
  await key('Escape');
  log('focus back', await ev(`document.activeElement.id`));        // expect the menu button
};
```

Cover what changed:
- **Menus and selects:** pointer and keyboard paths, active vs selected, outside dismissal, Escape inside a dialog, viewport edges, internal scrolling, disabled options, required fields, programmatic change plus `refresh()`, and form reset.
- **Selection:** a single row, the mixed header state, and pruning when a filter hides selected rows. Single-row actions should be disabled when several rows are selected.
- **Search and filters:** clearing, Escape, empty results with recovery, and the active-filter badge.
- **Loading:** success, empty, error and cancel, plus a rapid repeat (the second request wins). `aria-busy` must never stay stuck.
- **Dialogs:** initial focus, Escape, backdrop click, and focus returning to where it came from.
- **Navigation:** collapse, drawer under 1024px (inert while closed), filter and restore, and `aria-current` matching the page.

## 3. Source, theme and structure

- Keep source facts (lemon-reference.md) separate from project adaptations. Update the access date when you re-check the source.
- **IDs are document-wide.** Namespace SVG symbols (`lm-i-…`) separately from control IDs. Check every `for`, `aria-*` reference and `use href`.
- **Tokens:** no undefined variables, no duplicate or conflicting definitions, no hard-coded brand hex inside components, and no dark CSS in a light-only deliverable.
- **Single-file deliverables:** build them with `scripts/inline.mjs` from the linked sources. It reports anything that still loads from the network.

## 4. Evidence and reporting

Report what actually ran: the commands, the pass/fail counts, the contrast numbers, and the screenshot paths you looked at. Name what wasn't covered (screen readers, real devices, browsers other than Chromium). A syntax check proves syntax. A DOM probe proves only what it modelled. A screenshot can't prove keyboard or screen-reader behaviour. If browser access is blocked, do the code-level checks and say the visual evidence is missing. Don't route around the block, and don't reuse an old screenshot as current.
