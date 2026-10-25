---
name: lemonui-design-system
description: Build, redesign, or review Persian (Farsi) RTL product interfaces in the Lemon UI design system (lemonui.ir) — frosted-glass surfaces, Vazirmatn type, Lemon tokens and component patterns — using bundled, tested CSS/JS components, a starter ERP screen, offline fonts, and contrast/visual verification scripts. Use this whenever the user mentions Lemon UI, لمون, or lemonui.ir, or asks for a Persian/RTL dashboard, admin panel, ERP/CRM screen, data table, form, or HTML mock-up in Farsi — including redesigning a screenshot of an existing Persian system (DevExpress/legacy grids, toolbars full of buttons) — and whenever a project already uses Lemon tokens or `lm-` classes, even if Lemon is not named.
---

# Lemon UI Design System

Lemon ([lemonui.ir](https://lemonui.ir/)) is an RTL-first, variable-driven Figma system, not an installable component package. This skill supplies the missing implementation layer: tokens, components, behaviour and checks that follow Lemon's documented foundations. The documented baseline is in [lemon-reference.md](references/lemon-reference.md). Treat everything else, the `lm-` CSS included, as a project adaptation, and say so when it matters. Don't claim exact Figma fidelity without inspecting the live source.

## What's bundled (use it instead of rewriting it)

| Need | Use |
|---|---|
| Fonts that load instantly, also on slow Iranian networks | `assets/fonts.css` + `assets/fonts/` (Vazirmatn 400/600/700, OFL) |
| Light tokens / optional dark tokens | `assets/tokens.template.css`, `assets/tokens.dark.css` |
| Buttons, inputs, checkbox, tag, chip, menus, app shell, toolbar, action bar, table, skeleton, empty state, pager, drawer, dialog, toast | `assets/components.css` (`lm-` classes) |
| Menu button, accessible custom select, tabs, sidebar nav, theme switch, toasts, Persian digit helpers | `assets/lemon.js` (`window.LemonUI`) |
| A working RTL ERP list screen to start from | `assets/shell.html` |
| Contrast on real composited glass + fixes for failures | `scripts/contrast.mjs` |
| Screenshots + overflow / type-scale / invisible-label / font-load audit | `scripts/verify.mjs` |
| One self-contained HTML file from linked sources | `scripts/inline.mjs` |

The scripts need Node 18+ (`verify.mjs` needs Node 22+ and an installed Chrome, Edge or Chromium). They have no npm dependencies. Run them with the skill directory's absolute path.

Starting from `shell.html` and the shared CSS/JS is faster and more consistent than hand-writing components. It also avoids bugs that were already fixed once, such as a reset overriding button text colour, popups sliding under the workspace, or squashed bars. Extend or override the components rather than forking them, and keep page-specific rules in the page.

## 1. Adopt the project theme once

Look for an existing theme first: project tokens, a brand guide, or colours the user already gave in this conversation or project. If you find one, reuse it without asking again.

If there is none, ask: "What brand colors, palette, or existing color system should this project use? You can share color values, brand guidelines, existing theme tokens, or a reference, or say you have none." Keep working on everything that doesn't depend on colour while you wait. If the user supplied a screenshot of an existing product and you need to proceed, take the brand colour from it. Label it as an approximation in the token file and in your reply, and ask for the official value at the end. A colour you sampled is a placeholder, so never present it as the brand. If the user has no system, propose one and proceed unless they want to approve it first.

Then follow [token-workflow.md](references/token-workflow.md):
- Copy `tokens.template.css` into the project (reuse its existing token location, or create `src/theme/tokens.css`). Add `tokens.dark.css` only if dark mode is wanted. Hints that it is: the product already has a theme toggle, or the user asked for one.
- Keep the user's exact brand value in `--brand-base`, and derive `--brand-strong` and `--brand-subtle` from it.
- Run `node <skill>/scripts/contrast.mjs --tokens <light.css> --tokens <dark.css> --suggest`. Fix each failure the way the workflow describes. Two cases come up most: a mid-dark brand needs a lighter `--selection-accent` and `--border-focus` in dark mode, and a light brand such as yellow needs dark `--action-primary-text`.
- Record in the token file's header comment: the supplied values, what you derived, the modes, and the measured ratios. That record is what lets later sessions skip the question.

Project preferences stay in the project. One product's brand, light-only mode, density or sidebar behaviour must not become global Lemon rules.

## Icon source: Reicon MCP only

Use only [Reicon MCP](references/reicon-icons.md) for product icons. Discover its live tools and use returned assets; do not silently substitute another library, the CLI, or hand-drawn SVG. The bundled starter currently contains legacy illustrative icons without verified Reicon provenance: replace those through the MCP before treating a derived screen as compliant with this icon policy. The same applies to select chevrons/check glyphs generated by `lemon.js`. If Reicon is unavailable, continue unrelated work and disclose the missing dependency. `agents/openai.yaml` declares the dependency; it does not connect it.

## 2. Build or refine

- **Scope first:** the screen, the user's task, framework, direction, modes and viewport range. For a narrow request ("make the search clearable"), change only that and keep existing behaviour.
- **List, grid or ERP screens** (or redesigning a screenshot of one): read [erp-list-pattern.md](references/erp-list-pattern.md). It covers turning a wall of toolbar buttons into a selection-driven action bar, chips versus advanced filters, the details drawer, column choice, density, grouping, and flagging implausible data.
- **Controls:** read the relevant sections of [components-and-interactions.md](references/components-and-interactions.md). It holds the interaction contracts that `lemon.js` implements and the sizing table for heights, densities and menu items.
- **Numbers, dates and codes:** follow [rtl-numbers.md](references/rtl-numbers.md). Persian digits go on displayed quantities and dates. Codes, IDs and VINs keep Latin digits. Everything numeric is isolated as LTR.
- **Type, spacing, radius:** use Vazirmatn at weights 400/600/700 only, and only the documented sizes (product roles are mapped in the token file). Use the 4px spacing scale. Radius goes by role (card lg, input md, tag sm, checkbox xs), not one large radius everywhere. `verify.mjs` flags type that falls off the scale.
- **Glass:** canvas, glass surface and brighter active glass, each with a thin light edge and restrained shadow. Blur only reads over a varied background (the `.lm` canvas glows provide one). Keep tables and data on stronger fills so they stay readable, and keep the opaque fallback.
- **Selection and status:** neutral or brighter-glass selection. Tables go darker or grey on selected rows, cards go brighter. Colour carries status meaning. Tags are non-interactive status labels, chips are clickable filters, and neither relies on hue alone.
- **Shared menu selection:** `LemonUI.navigation` uses one decorative moving glass underlay, with immediate destination selection and independent keyboard focus. It updates after group/filter, font and viewport changes and respects reduced motion.
- **States:** hover, pointer-active, keyboard focus (2px ring, offset 2px), selected, disabled, loading, empty, error and success, all from tokens. A gentle pointer style never removes the keyboard ring.
- **Native first:** use native `<dialog>`, checkbox and `<select>`, and enhance them with `LemonUI.select`. Don't style a closed native select and expect its popup to match.
- **Single-file deliverable:** write the page against linked sources, then run `scripts/inline.mjs` to produce the standalone file. Don't hand-paste CSS: the embedded copy drifts from the source.
- **Data honesty:** keep supplied data exactly as given. Label sample rows as sample data. Never invent records to fill a page or show off a status colour. If pagination totals exceed the rows you have, show an honest "not available in this prototype" state.

## 3. Verify and hand off

Run the checks in [validation.md](references/validation.md) in proportion to the change. For a page or screen:

```bash
node <skill>/scripts/contrast.mjs --tokens <tokens.css> [--tokens <tokens.dark.css>]
node <skill>/scripts/verify.mjs <page.html> --out <dir> [--themes light,dark] [--steps steps.mjs]
```

Use the browser surface permitted by the session. Run `verify.mjs` only when standalone browser automation is permitted; it is not a fallback around a browser-security rejection. If it is blocked, perform source/code checks and report missing visual verification.

Then **open the screenshots and look at them**. The audits catch overflow, off-scale type, labels that vanish into their own fill, and a font that never loaded. They can't judge hierarchy, alignment or whether the page answers the brief. Use `--steps` to exercise menus, dialogs, selection and keyboard paths with real key presses.

In the hand-off, say:
- which theme you adopted and where it came from (supplied or approximated)
- your deliberate departures from the source design
- which checks ran, with the numbers
- what wasn't verified (for example screen readers or real devices)

Different kinds of evidence aren't interchangeable. A syntax check, a scripted DOM probe and a screenshot each prove something different. Never present an invented mock as an original Lemon sample, or a stale screenshot as the current UI.

The skill doesn't authorise publishing, GitHub writes, installing dependencies or touching unrelated projects. Ask for those separately.
