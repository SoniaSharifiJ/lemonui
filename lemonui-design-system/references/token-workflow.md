# Project color system workflow

This adapts Lemon's semantic colour architecture to one project. It's not a published Lemon palette algorithm.

## 1. Find or ask

Look for a theme the project already has: tokens/CSS variables, Tailwind config, brand guides, or colours given earlier. Reuse them and keep their role names where practical. If nothing exists, ask the question from SKILL.md. Accept any of:
- one brand colour, or several
- a palette or scale
- guideline PDFs
- token files
- a screenshot or other reference

Accept any valid CSS colour format and resolve references; don't force everything to hex.

**Colours sampled from a screenshot** are approximations. If you must proceed before the user answers, use the sample and record it as `APPROXIMATED from <source>`. Tell the user, and ask for the official value. When it arrives, swap the `--brand-*` primitives and re-run the contrast check. Nothing else should need to change, which is the point of the role layer.

## 2. Map roles

Start from `assets/tokens.template.css`. Add `assets/tokens.dark.css` only when the project wants a dark mode. Then:

- **Brand primitives:** `--brand-base` holds the user's exact value. Derive `--brand-strong` (hover/pressed: darker by ~15–20% in light mode, lighter in dark mode) and `--brand-subtle` (a pale tint for avatars). Label derived shades as project choices.
- **Actions:** `--action-primary-bg/-hover/-text` drive primary buttons, active nav, pressed chips, the current page and badges. Lemon's default primary is neutral and dark. A supplied brand replaces it when the user wants brand-coloured actions, which is the usual case.
- **Selection indicators:** `--selection-accent` and `--selection-accent-text` drive the checkbox fill, its tick, and the selected-row bar. They're separate from the action roles on purpose (see the next section).
- **Focus:** `--border-focus` is the keyboard ring, often the brand. It needs 3:1 against the surfaces it sits on, in every mode.
- **Status tones** (success, warning, danger, info, neutral) keep their meaning whatever the brand. Don't recolour "danger" to match a red brand. If the brand is close to a tone (a blue brand next to info), that's acceptable, because tags also carry text.
- Keep primitives separate from semantic roles. Components only use semantic roles.

## 3. Measure: the brand-on-dark and light-brand rules

Run:

```bash
node <skill>/scripts/contrast.mjs --tokens tokens.css --tokens tokens.dark.css --suggest
```

It resolves `var()` chains and blends the translucent glass layers over the canvas. Then it checks 18 role pairs per mode: text on glass, tags, buttons, checkbox fill against the table, focus ring against the card, and so on. Thresholds are 4.5:1 for text, and 3:1 for focus rings and essential control boundaries (WCAG 1.4.11). Failures print a suggested lighter and darker shade.

Two failures are predictable:

1. **A mid-dark brand in dark mode** (blue, indigo, purple, red, mid-green). White text on the brand still passes, so keep the brand as `--action-primary-bg`. But the brand against the dark table is often only 2–3:1, too weak for a 16px checkbox or a 3px bar. In the dark block, set `--selection-accent` and `--border-focus` to the lighter tint the script suggests (aim for ≥ 4.5:1 so it reads comfortably, not just barely). Set `--selection-accent-text` to the dark canvas colour, so the tick stays visible on the light tint.
   *Example (Pilsan, #3438FA): 2.5:1 on the dark table. The tint #8B8EFC reaches 6.0:1. White on #3438FA is 6.8:1, so buttons keep the brand.*
2. **A light brand** (yellow, amber, lime, cyan). White text fails on it. Set `--action-primary-text` (and `--selection-accent-text`) to a dark ink. The script's "darker" suggestion is a minimum, so the near-black `--neutral-900` is usually better. In light mode the brand also tends to fail as `--selection-accent` and `--border-focus` against near-white. Use a darkened brand shade for those two roles, the mirror image of rule 1.

Preserve the user's original value in `--brand-base` either way, and explain each adjusted role in the header.

## 4. Record and reuse

Write the record at the top of the project's token file:
- the source of each value (supplied, or approximated from X)
- the derived shades
- the modes
- a short CONTRAST line with the measured ratios

That record ends the first-use setup. Later screens and sessions reuse it without asking, unless the user wants a change. Keep project choices in the project, never in this skill's assets.

## Framework adapter

The skill is framework-neutral. With Tailwind, map the CSS variables into `theme.extend.colors` (e.g. `primary: 'var(--action-primary-bg)'`) instead of copying hex values. In React or Vue, import the CSS files once at the app root and use the `lm-` classes or wrap them in components. Don't add Tailwind or any framework just because this is a design system.
