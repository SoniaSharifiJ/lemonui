# ERP list-screen pattern

The most common Lemon request is a record list: receptions, orders, invoices, work orders. Often it's a redesign of a legacy grid, with fifteen toolbar buttons, a drag-to-group strip and checkbox columns. `assets/shell.html` implements this whole pattern. Start from it and keep the decisions below unless the brief says otherwise.

## Layout (top to bottom inside the workspace card)

1. **Header row:** page title (24/700) and a one-line subtitle with the total row count. View tabs (`lm-tabs`) sit next to the title. The section's single primary action ("+ new …") goes at the inline end. Putting the tabs in the title row saves a full row of height.
2. **Toolbar:** quick search (with a `/` shortcut, a clear button, and a placeholder naming the searchable fields) and status chips. At the end: an "advanced search" toggle with an active-filter count badge, a "table view" icon menu, and refresh.
3. **Advanced filter panel** (collapsed by default): labelled fields in a grid, date validation with an inline error, "reset" (tertiary) and "apply" (secondary). It's secondary because the header already has the section's primary action.
4. **Action bar:** selection-driven actions (next section).
5. **Table** in a scrolling region (`role="region"`, `tabindex="0"`, labelled) with a sticky header.
6. **Footer:** "page X of Y · N rows" (plus "n results on this page" when filters are active) and the pager.

The context the old app showed in boxes (company, branch, fiscal year) moves to the top bar as a compact `lm-ctx` list. The user and theme controls sit at its end.

## Replacing a wall of toolbar buttons

Legacy screens show every action at all times, enabled or not. Instead:

- **Always render the action bar.** Keep the actions disabled until rows are selected, so the layout never jumps. The info text says "no row selected", or "n selected" with a "clear selection" button.
- **Classify each action:**
  - needs exactly one row (edit, copy request): `data-single`
  - works on many rows (approve, reject, void, close)
  - destructive (delete, void): confirmation dialog first, `lm-btn--danger`, placed at the end
  - variants of one idea (print / print for customer, follow up / stop following): one menu button
  - rare: a "more" (⋯) menu
- **Keep the original action names.** Users know them. Changing "اختتام" to a synonym breaks training material.
- **Toolbar-level, not row-level:** "new", "refresh" and "print list" stay in the toolbar or header.

## Filters

- **Status → chips** (`button[aria-pressed]`), one per status plus "all". Use single-select unless the product supports multiple. The pressed chip shows a check icon, so selection doesn't rely on colour alone.
- **Free text → quick search** across the obvious columns (code, VIN/customer, status, number). Normalise digits with `LemonUI.en()` first.
- **Everything else → the advanced panel.** Give the toggle button a badge counting active advanced filters.
- An empty result shows an `lm-state` with a "clear all filters" button that resets search, chips and the panel.

## Table decisions

- **Selection:** a checkbox column, a header checkbox with a real `indeterminate` state, and row click toggles selection (ignored on buttons, links and inputs). Selected rows go grey/darker (`--table-row-selected`) with a `--selection-accent` bar on the start edge. Prune the selection when filters hide a row, so actions never hit invisible rows.
- **Sorting:** only on columns where order means something (code, dates, amounts). The button sits in the `th`, with `aria-sort` on the `th` and an icon that reflects the state.
- **Status:** `lm-tag` with a tone. Use the same status and tone everywhere, including chips (build both from one map).
- **Booleans:** "دارد" with a check icon, or a dash. Never read-only checkboxes.
- **Long repeated text** (agency or branch name on every row): let it wrap (`td.lm-wrap`) rather than ellipsis-truncating the only copy.
- **Row details:** an eye icon button (`aria-label="جزئیات …"`) opens an `lm-drawer` with the full record in `lm-kv` sections. This replaces the legacy "+" expander or a "more details" text button and saves a wide column.
- **Fit before scroll:** at 1440–1600px the table should fit. If it doesn't:
  1. Hide columns that are empty for every row behind the "table view" menu (`menuitemcheckbox`, off by default). Tell the user which columns you hid.
  2. Let headers wrap.
  3. Use 8px cell padding.
  4. Turn text actions into icon buttons.

  Only then accept horizontal scroll, which stays inside `.lm-table-wrap`.
- **Group-by** (replaces "drag a column here to group"): `menuitemradio` items in the view menu. Group rows are a `th colspan` with the group label (a tag for status) and a count.
- **Density:** compact, default or comfortable rows (4/8/16px padding) in the same view menu.

## Data honesty and implausible values

- Transcribe real rows exactly as given. If a screenshot shows 6 of 20 rows, render 6. Don't invent the other 14 to fill the page. Other pages show an honest state like "this prototype only has page 1".
- **Flag implausible values instead of hiding them.** Add a small warning icon (`lm-flag`) with a tooltip and sr-only text, and explain it in the drawer (`lm-callout`). Common tells:
  - `2147483647` (int32 max) or `9999999` in a measurement
  - odometer readings in the hundreds of millions
  - dates before the system existed
  - negative quantities

  Say what's wrong in plain language. Don't "fix" the data.
- Actions in a prototype don't mutate data. Show a toast saying what would happen, and label it as a prototype.

## Loading

The refresh and page-change requests show skeleton rows that mirror the real column widths. The region gets `aria-busy="true"`, the skeleton rows `aria-hidden`, and the header checkbox is disabled. Guard each load with a request sequence number, so a stale response can't overwrite a newer page. Any demo delay is labelled as a demo constant.
