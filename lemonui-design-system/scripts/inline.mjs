#!/usr/bin/env node
// Build ONE self-contained HTML file from a page that links local CSS/JS.
// Generating the single file from the canonical sources keeps embedded copies
// in sync (instead of hand-pasting CSS that then drifts).
//
// Usage: node inline.mjs <input.html> <output.html> [--no-fonts]
//   - <link rel="stylesheet" href="local.css">  -> <style>…</style>
//   - <script src="local.js"></script>          -> <script>…</script>
//   - url(fonts/x.woff2) inside inlined CSS     -> data:font/woff2;base64,…
//   - remote URLs (http/https//) are left untouched and reported.
//   --no-fonts  keep font url()s as files (smaller HTML; ship fonts/ alongside).
// Node 18+. No dependencies.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';

const [input, output] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const noFonts = process.argv.includes('--no-fonts');
if (!input || !output) { console.log('Usage: node inline.mjs <input.html> <output.html> [--no-fonts]'); process.exit(2); }

const MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp' };
const isRemote = u => /^(https?:)?\/\//i.test(u) || u.startsWith('data:');
const remote = [], missing = [];

function inlineCssUrls(css, cssPath) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (all, q, u) => {
    if (isRemote(u) || u.startsWith('#')) { if (!u.startsWith('data:') && !u.startsWith('#')) remote.push(u); return all; }
    const p = resolve(dirname(cssPath), u.split(/[?#]/)[0]);
    const ext = extname(p).toLowerCase();
    if (noFonts && /\.(woff2?|ttf)$/.test(ext)) return all;
    if (!existsSync(p)) { missing.push(u); return all; }
    return `url("data:${MIME[ext] || 'application/octet-stream'};base64,${readFileSync(p).toString('base64')}")`;
  });
}

let html = readFileSync(input, 'utf8');
const base = dirname(resolve(input));

html = html.replace(/<link\b[^>]*>/gi, tag => {
  if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
  const href = (/href\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1];
  if (!href) return tag;
  if (isRemote(href)) { remote.push(href); return tag; }
  const p = resolve(base, href);
  if (!existsSync(p)) { missing.push(href); return tag; }
  const media = (/media\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1];
  const css = inlineCssUrls(readFileSync(p, 'utf8'), p);
  return `<style data-source="${href}"${media ? ` media="${media}"` : ''}>\n${css}\n</style>`;
});

html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (all, pre, src, post) => {
  if (isRemote(src)) { remote.push(src); return all; }
  const p = resolve(base, src);
  if (!existsSync(p)) { missing.push(src); return all; }
  const js = readFileSync(p, 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script${pre}${post} data-source="${src}">\n${js}\n</script>`;
});

writeFileSync(output, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Wrote ${output} (${kb} KB)`);
if (remote.length) console.log(`Left remote (needs network): ${[...new Set(remote)].join(', ')}`);
if (missing.length) { console.log(`MISSING local files: ${[...new Set(missing)].join(', ')}`); process.exit(1); }
