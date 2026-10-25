# Components and interaction contracts

Read only the sections for the controls you're touching. Source facts are in `lemon-reference.md`. The `lm-` CSS in `assets/components.css` and the behaviour in `assets/lemon.js` implement the contracts below. They're project implementations, not official Lemon code. If you change a component, keep its contract.

## Contents
1. Sizing table
2. Typography and radius integrity
3. Glass
4. Buttons
5. Search and inputs
6. Select dropdowns (`LemonUI.select`)
7. Menus (`LemonUI.menu`)
8. Checkboxes
9. Tags and chips
10. Tabs and navigation
11. Tables, skeletons, empty and error states
12. Dialogs, drawers and toasts
13. Motion

## 1. Sizing table

Values marked *project* aren't published by Lemon. They're chosen on Lemon's 4px scale so screens stay consistent.

| Thing | Value | Source |
|---|---|---|
| Control heights (button, input, select trigger) | 32 (sm) · 40 (default) · 48 · 56 | Lemon |
| Menu / listbox item | min 36px | project (between 32 and 40) |
| Chip | 32px, radius full | project |
| Tag | 24px, radius sm (8) | Lemon radius |
| Checkbox | 16 or 20px box, radius xs (4), 32px hit area | Lemon + project hit area |
| Table row padding: compact / default / comfortable | 4 / 8 / 16px | Lemon names, project values |
| Table cell inline padding | 8px | project |
| Table header text | 12px / 600 | project role |
| Page title · section · body · label/small | 24/700 · 16/700 · 14/400 · 12/600 | project roles on Lemon sizes |
| Card / panel / dialog radius | lg 24 | Lemon (card) |
| Input / button / menu radius | md 12 (sm 8 for 32px buttons) | Lemon (input) + project |
| Sidebar width | 280px desktop; 288px drawer under 1024px | project |
| Breakpoints | 1500 (hide optional context), 1240 (hide context), 1024 (sidebar becomes a drawer), 760 (phone stacking) | project |

## 2. Typography and radius integrity

Use Vazirmatn for both Persian and Latin, at weights 400, 600 and 700 only. Load it from the bundled `assets/fonts.css`, not Google Fonts. Google Fonts can take 10s+ or fail on Iranian networks, and the fallback (Tahoma) is wider, so the page re-flows when the real font arrives.

The documented sizes are 7, 8, 9, 10, 12, 14, 16, 20, 24, 32, 48, 56, 64 and 72px. Map product roles onto them. Avoid 11/13/15px and weights 500/800 (`verify.mjs` reports them). Don't pick microscopic sizes just because the scale has them: 10px is for badges and key hints only.

Use radius by role, and audit computed styles, shorthands, native control styles and breakpoint overrides.

## 3. Glass

`.lm-glass` = translucent fill + blur(24) + a 1px white edge + a faint outer ring, so the edge shows on light canvases. Panels and drawers use `--blur-panel` (48), chips 12, modals 40. Blur only reads when the background varies: `.lm` gives the canvas two faint radial glows. Don't stack blur on hundreds of cells, because tables use a stronger, flatter fill (`--table-surface`). Check contrast on the composited result (`contrast.mjs` does this). The opaque fallback is under `@supports not (backdrop-filter)`.

Stacking: blurred elements create stacking contexts. A popup inside the top bar would slide under the later workspace card, so `.lm-topbar` has `z-index: 5`. Keep that if you restructure the shell.

## 4. Buttons

Primary (`--action-primary-*`), secondary (glass), tertiary (text, hover fill), danger (soft) and danger-solid (confirm dialogs). Use one primary per section. Labels are verbs. The leading icon comes first in the DOM, so it sits on the right in RTL. Icon-only buttons need `aria-label`, and a `title` helps mouse users. A disabled button stays visible at reduced opacity, and its accessible name doesn't change.

## 5. Search and inputs

- `.lm-field` wraps an icon, the input and the clear button. Heights are 32 or 40px. Hover brightens the glass. Focus-within raises it (`--glass-input-focus`, `--shadow-focus`).
- The keyboard ring is drawn on the wrapper via `:has(input:focus-visible)`. The input has `outline: none`, which is safe only because the wrapper shows the ring.
- **Search:** a leading search icon, an `aria-label` or a linked label, an optional `/` shortcut (`aria-keyshortcuts`; the hint hides while focused), and a clear button that is hidden while the field is empty. Clearing updates the query and the results, then puts focus back in the field. Escape also clears.
- Don't put several labelable controls inside one `<label>`.
- **Errors:** `aria-invalid="true"` on the input, a message in `.lm-error` linked through `aria-describedby`, and an actionable message ("format: ۱۴۰۵/۰۷/۰۱"). Read-only (`readonly`, `.lm-field--readonly`) is a different state from disabled.

## 6. Select dropdowns: `LemonUI.select(nativeSelect)`

Start from a native `<select>` with `<label for>`. The enhancer builds a `role="combobox"` button and a `role="listbox"` popup. The native select stays in the form, so it keeps its value, reset, `required`, and `change`/`input` events, but it's visually hidden and taken out of the tab order. If the script never runs, the native control still works.

Contract (implemented; keep it if you modify the code):
- **Focus and state:** focus stays on the trigger. The active option is `aria-activedescendant`, shown as a fill plus ring. The selected option is `aria-selected` plus a check, so active and selected never look the same.
- **Keys:** ArrowUp/Down open the list or move through it (skipping disabled options), Home/End jump, Enter/Space choose, typeahead matches typed text, Escape closes before any enclosing dialog does, and Tab commits and moves on (no trap).
- **Dismissal:** an outside pointer press closes the list. Scrolling the page or resizing the viewport closes it too. Scrolling inside the listbox doesn't. Changing the active option scrolls only the listbox, never the document.
- **Placement:** the popup flips horizontally and vertically to stay in the viewport, caps its height at 360px or 60vh, and scrolls internally.
- **Syncing:** form reset re-syncs. A `MutationObserver` rebuilds the list when options or `disabled` change. After setting `native.value` in code, call `.refresh()`, because browsers fire no event for that. `invalid` (from `required`) marks the trigger `aria-invalid` and focuses it.
- **Cleanup:** `.destroy()` removes listeners, observer and timers, and restores the native select. Call it before re-rendering the control.
- **Inside a modal `<dialog>`:** the popup is a descendant of the dialog, so it shares the top layer and isn't blocked. If a scrolling ancestor clips it, give that ancestor `overflow: visible` or move the field.
- **Test the enhanced control** (trigger and options), not the hidden native select.

## 7. Menus: `LemonUI.menu(button, onSelect)`

The menu-button pattern: `aria-haspopup="menu"`, `aria-expanded` and `aria-controls` on the button. The popup has `role="menu"`, its items are `tabindex="-1"`, and groups are `role="group"` with a label.
- Item types: `menuitem` (an action), `menuitemradio` (one per group; `aria-checked` and a check icon), and `menuitemcheckbox` (toggles, and **keeps the menu open** so several can change).
- Keys: ArrowDown/ArrowUp on the button open the menu at the first or last item. Inside, arrows cycle, Home/End jump, typeahead works by first letter, Escape closes and refocuses the button, and Tab closes without trapping.
- Only one popup is open at a time. An outside pointer press closes it. Use `lm-flip-x` on menus anchored near the inline end. Auto-flip handles the viewport edges anyway.
- Use a menu for actions and view options. Use `LemonUI.select` for a form value that has to submit.

## 8. Checkboxes

Native `input[type=checkbox].lm-checkbox`: a 16px glass box (`--lg` is 20px), radius xs, and a 32px `.lm-checkbox-hit` label for the click target. Checked and indeterminate states fill with `--selection-accent` and show a tick or dash in `--selection-accent-text`. Space works natively. A bulk header checkbox must set `.indeterminate` for partial selection, which screen readers announce as "mixed". In forced-colors mode it falls back to the native look. For checkbox plus label plus description, use `.lm-checkbox-field`: the box comes first in the DOM, so it sits right of the label in RTL.

## 9. Tags and chips

- **Tag** (`lm-tag lm-tone-*`) is non-interactive status: neutral, info, success, warning or danger, soft fill, with the dot after the text. Use it for statuses, categories and counts.
- **Chip** (`button.lm-chip[aria-pressed]`) is a clickable filter. When pressed it gets the action fill plus a check icon, and the dot hides. Build chips and tags from the same status-to-tone map, so one status always has one colour.
- Example tone mapping (a product choice): ثبت شده → neutral, در حال انجام or تایید → info, به اتمام رسیده or ترخیص → success, نیازمند اقدام → warning, ناموفق or لغو شده → danger. Never rename a business status to fit a colour.

## 10. Tabs and navigation

- **Tabs:** `LemonUI.tabs(tablist)` uses automatic activation and roving tabindex. In RTL, ArrowLeft moves forward. Home/End work. The selected tab is brighter glass, not the accent colour.
- **Sidebar:** `LemonUI.navigation(appEl)`. On desktop the toggle hides the sidebar. Under 1024px the sidebar becomes an off-canvas drawer with a scrim, is `inert` while hidden, and closes on Escape or a scrim click, returning focus to the toggle. Groups are disclosure buttons (`aria-expanded`). The menu filter expands matching groups and restores their previous open state when cleared.
- The current page is `aria-current="page"` and must match what's displayed. Clicking a destination that doesn't exist in a prototype shows a toast, not a fake page change.

## 11. Tables, skeletons, empty and error states

Read `erp-list-pattern.md` for list screens. Mechanics:
- The sticky header needs an opaque fill (`--table-header-bg`).
- Sortable headers contain a `button.lm-th-sort`, with `aria-sort` on the `th`.
- Numeric columns use `lm-col-num` (end-aligned) and tabular figures.
- Toggle density by setting `data-density` on the table.
- **Skeletons** (`lm-skeleton`) mirror the real columns and reserve their height. The region gets `aria-busy="true"`, the skeleton rows `aria-hidden="true"`, and bulk select is disabled. Clear the busy state on success, empty, error and cancel alike. Guard loads with a sequence number so stale responses are dropped. For a background refresh, keep the old rows visible instead of flashing a skeleton.
- **States** (`lm-state`, `lm-state--error`): icon, title, one sentence, and one recovery action (clear filters, retry, go to page 1). Don't hide the whole region. Keep the toolbar usable.
- With reduced motion, the skeleton is a static fill.

## 12. Dialogs, drawers and toasts

- **Dialogs and drawers** use native `<dialog>` with `showModal()`, which gives focus containment, Escape and `::backdrop` for free. Put `autofocus` on the safe default: the close button for a drawer, "cancel" for a destructive confirm. Fill the dialog with an inner wrapper (`lm-drawer__inner`, or the `form`), so `e.target === dialog` reliably means a backdrop click.
- **Confirm before destructive actions**, naming the action and the count ("حذف ۲ سفارش؟").
- **Toasts:** `LemonUI.toast(msg)` appends to a polite `role="status"` region. At most three show at once. Use them for confirmations, not for errors that need action.

## 13. Motion

Use 120–180ms for local feedback and 200–320ms for short spatial moves. These are project values: the tokens are `--motion-fast` 160 and `--motion-default` 240. Animate opacity and transform, and never use `transition: all`. Keep repeated interaction instant, and let a popup reopen even while it's still closing. With `prefers-reduced-motion`, keep the state changes but drop the movement and shimmer: the tokens go to 0ms, and popups and skeletons stop animating.

## Shared layout selection in sidebar menus

The sidebar uses one persistent decorative `.lm-nav__highlight` underlay, rather than separately showing a white box on each active item. Selection updates immediately on the actual destination; the shared surface moves to the selected item’s measured bounds. Hover and keyboard focus remain independent. The layer is noninteractive and hidden from assistive technology. Recalculate on group expansion, filtering, font readiness, resize and navigation changes; hidden targets hide the layer. Rapid changes retarget one layer, and reduced motion removes movement. `navigation().refresh()` provides an explicit layout update; destroy removes its observers, listeners and pending frame. Modal-only actions must not acquire `aria-current="page"`.

All new or replaced component icons must follow [Reicon MCP](reicon-icons.md). Bundled illustrative SVGs are not verified Reicon assets; preserve no claim to that provenance and replace them through the connected MCP before icon-policy compliance.
