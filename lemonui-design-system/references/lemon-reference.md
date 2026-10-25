# Lemon source baseline

Primary source: [lemonui.ir](https://lemonui.ir/). Baseline reviewed against source pages visible in this project on 2026-10-25. This is a scoped record of documented rules, not an export of the Figma library. Recheck the relevant page for newer behavior or exact visual matching. Volatile component/variant counts are intentionally omitted.

## Identity and selection

[Overview](https://lemonui.ir/#overview): Persian, RTL-first, variable-driven. Frosted layers, soft shadows and a thin light edge separate surfaces. General selection uses brighter glass or black; color carries semantic meaning. The customization section permits adapting color, radius, font, opacity and spacing.

There is a specific table distinction: [Table](https://lemonui.ir/#table) describes selected rows as darker, and its light example uses gray. [Card](https://lemonui.ir/#card) specifies brighter selected glass. Do not force one selection fill onto all component families.

## Typography

[Typography](https://lemonui.ir/#typography): Vazirmatn for Persian and Latin. Weights Regular=400, SemiBold=600, Bold=700. Sizes 7, 8, 9, 10, 12, 14, 16, 20, 24, 32, 48, 56, 64, 72px. Naming: `Text/size/weight`. Persian copy uses Persian digits, `٬` thousands and `٫` decimal separators.

The inspected page does not establish universal product-specific size assignments or a full CSS line-height/letter-spacing table. Do not claim inferred values are exact Figma styles.

## Spacing and radius

[Tokens](https://lemonui.ir/#tokens): common 4px-based scale.

- Gap: 0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 64px.
- Padding: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40px.
- Radius: none=0, xs=4, sm=8, md=12, lg=24, xl=32, 2xl=64, full=9999px.
- Border width: none=0, sm=1, md=1.5, lg=2px.

## Color and effects

[Color](https://lemonui.ir/#color) separates primitive scales from semantic roles for backgrounds, text, icons, borders, glass, tables, skeletons and charts, with mode mappings. Project-generated brand shades are not official Lemon primitives.

[Effects](https://lemonui.ir/#effects): regular/focus 24px blur, panel 48px, chip 12px and modal 40px recipes. [Light & Dark](https://lemonui.ir/#themes): bright translucent light surfaces and darker smoked surfaces in dark mode. Exact project opacity values and off-white canvas colors are adaptations unless verified against a source token.

## Buttons, inputs and select

[Button](https://lemonui.ir/#button): default Primary dark, Secondary glass, Tertiary text/hover; Danger for destructive actions. One primary per section; action labels are verbs. Heights 32/40/48/56px match inputs. Leading icons are right in RTL. Directional icons mirror; icon-only controls need accessible names.

[Input](https://lemonui.ir/#input): glass field with brighter, raised active glass (`glass/focus`), radius/md. Inside/outside labels; helpers/errors below. Read-only is visible but not editable. Search supports a shortcut and clear action. Placeholder is not a label. Codes and numbers remain LTR. Keyboard focus: 2px outside ring, 2px away, using `border/focus`.

[Select](https://lemonui.ir/#select) is the source to inspect for precise select visuals. This baseline does not claim to cover all its variants or web behavior. The companion popup contract is implementation guidance.

## Checkbox

[Checkbox](https://lemonui.ir/#checkbox): delicate glass square, 16/20px, radius/xs, dark border when checked. Empty, checked, indeterminate; Checkbox Field adds label/description. Space toggles; indeterminate is announced as mixed. Disabled, hover, focus and error are documented. The control sits right of its label in RTL.

## Card, table and status

[Card](https://lemonui.ir/#card): glass, elevated, outline, filled; radius/lg; resting, hover, selected, disabled and focus states. One topic per card, equal heights in a row, avoid nested cards and multiple primaries. Selected cards brighten instead of taking an accent fill.

[Table](https://lemonui.ir/#table): toolbar with search/filters, headers, rows/cells and footer; compact/default/comfortable densities. Describes sorting, bulk selection, row details, loading skeletons, empty/error states and pagination. Expose sort state where sorting exists. RTL first column is right; numeric columns align appropriately with tabular figures. Source examples are component previews, not a universal ERP app shell.

[Tag](https://lemonui.ir/#tag): noninteractive status/category label, Soft/Outline, neutral/success/warning/danger/info, radius/sm. Optional dot/icon; dot follows text in RTL. Keep labels short and meanings consistent. [Chip](https://lemonui.ir/#chip) is the source for clickable filter behavior.

## Limits

The inspected source does not define this project's sidebar, app shell, breakpoints, density choice, brand ramp, near-white canvas, CSS variable names, full contrast report, or universal animation timings. These are project decisions. This record does not establish exact JavaScript for comboboxes, loading timers, or shared navigation animation.

This skill's own answers to those gaps are project adaptations, not Lemon facts, and are labelled as such: the sizing table in `components-and-interactions.md`, the `lm-` component CSS, `lemon.js`, and the token roles in `assets/`.
