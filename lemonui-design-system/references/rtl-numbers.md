# RTL, digits and numeric strings

Persian UIs mix two directions and two digit sets. Most "the date shows backwards" or "the separators jumped" bugs come from skipping one of the rules below.

## Which digits where

| Content | Digits | Direction | Example |
|---|---|---|---|
| Counts, quantities, totals, page numbers | Persian | (plain text) | ۱٬۰۴۵ ردیف |
| Money | Persian, `٬` grouping | isolate LTR | ۱۸۴٬۵۰۰٬۰۰۰ ریال |
| Jalali dates and times | Persian | isolate LTR | ۱۴۰۵/۰۷/۲۸ · ۱۴:۱۱:۵۶ |
| Measurements (km, kg) | Persian, `٬` grouping, `٫` decimals | isolate LTR | ۵۴۶٬۸۱۱ |
| **Codes and identifiers**: order/work-order numbers, VIN/chassis, part numbers, national IDs, IBAN, invoice numbers | **Latin**, exactly as stored | isolate LTR | 405100001698 · N471CBWA7R1002082 |
| Phone numbers | Latin, or Persian if the product already uses it; be consistent | isolate LTR | 0912 345 6789 |
| User input fields for any of the above | accept both digit sets | `dir="ltr"` on the input | |

**Why codes stay Latin:** people copy them into other systems and search for them, and they're compared byte for byte. Converting them breaks search and copy-paste. Persian digits are for reading quantities.

## Isolation

In an RTL paragraph, a digit run with separators can reorder. The Persian thousands separator `٬` (U+066C) has a different bidi class from the digits around it. Dates like `۱۴۰۵/۰۷/۲۸` are only safe when isolated. Wrap every numeric string in an LTR isolate:

```html
<span class="lm-ltr lm-num">۱۴۰۵/۰۷/۲۸</span>   <!-- direction:ltr; unicode-bidi:isolate -->
```

or use `<bdi dir="ltr">`. Add `lm-num` (tabular figures) wherever numbers stack in a column.

## Helpers in lemon.js

```js
LemonUI.fa('1405/07/28')       // '۱۴۰۵/۰۷/۲۸'   display only
LemonUI.faNum(184500000)       // '۱۸۴٬۵۰۰٬۰۰۰'  Intl fa-IR grouping
LemonUI.en('۱۴۰۵/۷/۱')         // '1405/7/1'     normalize input before validating/comparing/sending
```

Store and compare in Latin digits, and convert only at render time. Normalise every user input with `en()` first, because people type either digit set. Arabic-Indic digits (٠-٩) also show up from Arabic keyboards.

## Dates

- Validate Jalali input after `en()`: `^\d{4}[/.-]\d{1,2}[/.-]\d{1,2}$`, month 1–12, day 1–31. Zero-pad before comparing as strings.
- Show the expected format in the placeholder with Persian digits (`۱۴۰۵/۰۷/۰۱`), and show it again in the error message. The placeholder is not a label.
- In tables, stack date over time (time in small tertiary text). In compact density, put them on one line.

## Mirroring

- Mirror directional icons only: back/forward, undo, logout, "next page" chevrons. Use `lm-flip-rtl`, or draw them already pointing the right way.
- Don't mirror real-world objects or brand marks: printer, car, clock, checkmark, search glass.
- In RTL, "previous page" points right and "next" points left. "First" is on the right.
- Use logical CSS properties (`inset-inline-start`, `margin-inline-end`, `border-inline-start`) so the same component works in LTR.

## Empty values

Show a dash for a missing value and give screen readers the real meaning:

```html
<span class="lm-nil" aria-hidden="true">—</span><span class="lm-sr-only">ثبت نشده</span>
```

Read-only booleans in a list ("has warranty") should be text ("دارد" with a check icon) or a dash. Don't use disabled checkboxes, which look editable and get skipped by assistive tech.
