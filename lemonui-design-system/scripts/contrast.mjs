#!/usr/bin/env node
// WCAG 2.x contrast for Lemon UI themes, measured on COMPOSITED glass surfaces.
// Node 18+. No dependencies.
//
// Usage
//   node contrast.mjs --tokens tokens.css [--tokens tokens.dark.css] [--theme light|dark|both]
//       Resolves the CSS custom properties (var() chains included), composites the
//       translucent layers over the canvas, and checks every standard role pair.
//       Exits 1 if any pair fails. Missing roles are skipped, not failed.
//   node contrast.mjs "#ffffff" "#3438fa"                one pair (fg bg)
//   node contrast.mjs "#3438fa" "#0f131b,rgba(26,32,44,.66)" --min 3 --suggest
//       bg may be a comma-free stack "base,layer,layer" (bottom→top) — use `|` or `,`
//       between layers only when each layer is a hex or rgba() value.
//   --suggest  when a pair fails, print the nearest lighter/darker shade of the
//              FOREGROUND that passes (e.g. a brand tint for indicators on dark).
//   --json     machine-readable output.

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const opts = n => args.flatMap((a, i) => (a === n ? [args[i + 1]] : []));

/* ---------- colour maths ---------- */
function parse(c) {
  c = c.trim().toLowerCase();
  if (c === 'transparent') return [0, 0, 0, 0];
  let m = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(c);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map(x => x + x).join('');
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
  }
  m = /^rgba?\(([^)]+)\)$/.exec(c);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  throw new Error(`Unsupported colour: ${c} (use hex or rgb/rgba)`);
}
const over = (top, under) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + under[i] * (1 - a)).concat(1); };
const stack = layers => layers.map(parse).reduce((acc, l) => (acc ? over(l, acc) : over(l, [255, 255, 255, 1])), null);
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (c, target, t) => [0, 1, 2].map(i => c[i] + (target[i] - c[i]) * t).concat(1);

function measure(fgSpec, bgLayers) {
  const bg = stack(bgLayers);
  const fg = over(parse(fgSpec), bg);
  return { r: ratio(fg, bg), fg, bg };
}
function suggest(fgSpec, bgLayers, min) {
  const bg = stack(bgLayers), base = parse(fgSpec);
  const out = {};
  for (const [name, target] of [['lighter', [255, 255, 255]], ['darker', [0, 0, 0]]]) {
    for (let t = 0.02; t <= 1.0001; t += 0.02) {
      const c = mix(base, target, t);
      if (ratio(c, bg) >= min) { out[name] = { hex: hex(c), ratio: +ratio(c, bg).toFixed(2), shift: Math.round(t * 100) + '%' }; break; }
    }
  }
  return out;
}

/* ---------- CSS token resolution ---------- */
function blocks(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const res = { light: {}, dark: {} };
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim();
    const target = /data-theme\s*=\s*["']?dark/.test(sel) ? 'dark' : /^:root$/.test(sel) ? 'light' : null;
    if (!target) continue;
    for (const d of m[2].split(';')) {
      const k = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(d);
      if (k) res[target][k[1]] = k[2];
    }
  }
  return res;
}
function resolver(vars) {
  return function get(name, depth = 0) {
    let v = vars[name];
    if (v == null || depth > 20) return null;
    return v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, n, fb) => get(n, depth + 1) ?? (fb || ''));
  };
}

// fg role, background stack (bottom→top), minimum, what it guards
const PAIRS = [
  ['--text-primary', ['--bg-canvas', '--glass-fill'], 4.5, 'body text on glass card'],
  ['--text-secondary', ['--bg-canvas', '--glass-fill', '--table-surface'], 4.5, 'secondary text in table'],
  ['--text-tertiary', ['--bg-canvas', '--glass-fill', '--table-surface'], 4.5, 'tertiary text / time stamps'],
  ['--text-secondary', ['--table-header-bg'], 4.5, 'table header labels'],
  ['--action-primary-text', ['--action-primary-bg'], 4.5, 'primary button / active nav label'],
  ['--action-primary-text', ['--action-primary-hover'], 4.5, 'primary button hover label'],
  ['--selection-accent-text', ['--selection-accent'], 3, 'tick on checked checkbox'],
  ['--selection-accent', ['--bg-canvas', '--glass-fill', '--table-surface'], 3, 'checkbox fill / selected-row bar vs table'],
  ['--border-focus', ['--bg-canvas', '--glass-fill'], 3, 'keyboard focus ring vs card'],
  ['--border-control', ['--bg-canvas', '--glass-fill'], 3, 'input/checkbox boundary vs card'],
  ['--avatar-text', ['--bg-canvas', '--glass-fill', '--avatar-bg'], 4.5, 'avatar initials'],
  ['--info-text', ['--bg-canvas', '--glass-fill', '--table-surface', '--info-bg'], 4.5, 'info tag'],
  ['--success-text', ['--bg-canvas', '--glass-fill', '--table-surface', '--success-bg'], 4.5, 'success tag'],
  ['--warning-text', ['--bg-canvas', '--glass-fill', '--table-surface', '--warning-bg'], 4.5, 'warning tag'],
  ['--danger-text', ['--bg-canvas', '--glass-fill', '--table-surface', '--danger-bg'], 4.5, 'danger tag / danger button'],
  ['--neutral-tag-text', ['--bg-canvas', '--glass-fill', '--table-surface', '--neutral-tag-bg'], 4.5, 'neutral tag'],
  ['--danger-solid-text', ['--danger-text'], 4.5, 'solid danger button label'],
  ['--text-primary', ['--bg-canvas', '--glass-fill', '--table-surface', '--table-row-selected'], 4.5, 'text on selected row']
];

function runTokens(files, themes) {
  const merged = { light: {}, dark: {} };
  for (const f of files) { const b = blocks(readFileSync(f, 'utf8')); Object.assign(merged.light, b.light); Object.assign(merged.dark, b.dark); }
  const results = [];
  for (const th of themes) {
    const vars = th === 'dark' ? { ...merged.light, ...merged.dark } : merged.light;
    if (th === 'dark' && !Object.keys(merged.dark).length) { console.error('No [data-theme="dark"] block found; skipping dark.'); continue; }
    const get = resolver(vars);
    for (const [fgRole, bgRoles, min, what] of PAIRS) {
      const fg = get(fgRole), bgs = bgRoles.map(r => get(r));
      if (!fg || bgs.some(b => !b)) { results.push({ theme: th, what, fgRole, skipped: true }); continue; }
      try {
        const { r } = measure(fg, bgs);
        const row = { theme: th, what, fgRole, fg, bg: bgRoles.join(' + '), ratio: +r.toFixed(2), min, pass: r >= min };
        if (!row.pass && flag('--suggest')) row.suggest = suggest(fg, bgs, min);
        results.push(row);
      } catch (e) { results.push({ theme: th, what, fgRole, error: e.message }); }
    }
  }
  return results;
}

/* ---------- main ---------- */
const tokenFiles = opts('--tokens');
let results;
if (tokenFiles.length) {
  const th = opt('--theme', 'both');
  results = runTokens(tokenFiles, th === 'both' ? ['light', 'dark'] : [th]);
} else {
  const pos = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').match(/^--(min|theme)$/));
  if (pos.length < 2) {
    console.log('Usage: node contrast.mjs --tokens tokens.css [--tokens tokens.dark.css] [--theme light|dark|both] [--suggest] [--json]\n       node contrast.mjs <fg> <bg[|layer|layer]> [--min 4.5] [--suggest]');
    process.exit(2);
  }
  const min = Number(opt('--min', 4.5));
  const layers = pos[1].split(/\|(?![^(]*\))|,(?=\s*(?:#|rgba?\())/);
  const { r } = measure(pos[0], layers);
  const row = { what: 'pair', fg: pos[0], bg: pos[1], ratio: +r.toFixed(2), min, pass: r >= min };
  if (!row.pass && flag('--suggest')) row.suggest = suggest(pos[0], layers, min);
  results = [row];
}

if (flag('--json')) console.log(JSON.stringify(results, null, 2));
else {
  for (const r of results) {
    if (r.skipped) { console.log(`  skip  ${(r.theme || '').padEnd(5)} ${r.what} (role missing: ${r.fgRole} or a background)`); continue; }
    if (r.error) { console.log(`  ERR   ${(r.theme || '').padEnd(5)} ${r.what}: ${r.error}`); continue; }
    const s = r.pass ? 'pass' : 'FAIL';
    console.log(`  ${s}  ${(r.theme || '').padEnd(5)} ${String(r.ratio).padStart(5)} (≥${r.min})  ${r.what}`);
    if (r.suggest) for (const [k, v] of Object.entries(r.suggest)) console.log(`          ${k}: ${v.hex} → ${v.ratio} (${v.shift} toward ${k === 'lighter' ? 'white' : 'black'})`);
  }
}
process.exit(results.some(r => r.pass === false || r.error) ? 1 : 0);
