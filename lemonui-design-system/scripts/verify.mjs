#!/usr/bin/env node
// Headless-Chrome check of a Lemon UI page: screenshots + objective audits.
// Node 22+ (built-in WebSocket). Uses installed Chrome/Edge/Chromium; no npm deps.
//
// Usage
//   node verify.mjs <page.html|url> [--out dir] [--sizes 1600x900,1366x768,390x844]
//                   [--themes light,dark] [--font Vazirmatn] [--font-timeout 20000]
//                   [--steps steps.mjs]
//
// For every size × theme it saves <out>/<w>x<h>-<theme>.png and checks:
//   • the font family actually loaded (Google Fonts can take 10s+ on some networks;
//     measurements taken before the font loads are wrong, so this waits for it)
//   • horizontal overflow: elements past the viewport edge that no scroll container clips,
//     and containers that scroll sideways when they should not (tables may; mark
//     other intentional cases with data-lm-scroll-x)
//   • type scale: rendered font sizes/weights outside Lemon's documented scale
//   • labels nearly invisible on their own opaque fill (< 3:1, e.g. a CSS reset
//     overriding a button's text colour). Full contrast lives in contrast.mjs.
//   • console errors and uncaught exceptions
// Themes are switched via <html data-theme="…">. Exit code 1 if anything failed.
//
// --steps: optional module `export default async ({ ev, shot, key, click, sleep, send, log }) => {}`
// run once at the first size/theme for interaction checks (menus, dialogs, keyboard).
//   ev(expr)            evaluate JS in the page, returns the value
//   key(name)           real key press (Enter/Escape/Tab/ArrowDown/… or a character)
//   click(selector)     real mouse click at the element centre
//   shot(name)          extra screenshot
//   log(label, value)   adds a line to the report

import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const target = argv.find((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
if (!target) { console.log('Usage: node verify.mjs <page.html|url> [--out dir] [--sizes 1600x900,1366x768,390x844] [--themes light,dark] [--font Vazirmatn] [--steps steps.mjs]'); process.exit(2); }

const url = /^[a-z]+:\/\//i.test(target) ? target : pathToFileURL(resolve(target)).href;
const outDir = resolve(opt('--out', 'verify-out'));
const sizes = opt('--sizes', '1600x900,1366x768,390x844').split(',').map(s => s.split('x').map(Number));
const themes = opt('--themes', 'light,dark').split(',');
const fontFamily = opt('--font', 'Vazirmatn');
const fontTimeout = Number(opt('--font-timeout', 20000));
const stepsFile = opt('--steps');
const LEMON_SIZES = [7, 8, 9, 10, 12, 14, 16, 20, 24, 32, 48, 56, 64, 72];
const LEMON_WEIGHTS = [400, 600, 700];
mkdirSync(outDir, { recursive: true });

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const c = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ].filter(Boolean);
  for (const p of c) if (existsSync(p)) return p;
  for (const n of ['google-chrome', 'chromium', 'chromium-browser']) { try { return execSync(`command -v ${n}`).toString().trim(); } catch {} }
  throw new Error('No Chrome/Edge/Chromium found. Set CHROME_PATH.');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'lm-verify-'));
const browser = spawn(findBrowser(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });

let targets;
for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
if (!targets) { console.error('Browser did not start.'); process.exit(2); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

let msgId = 0;
const pending = new Map(), waiters = [], consoleErrors = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') consoleErrors.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') consoleErrors.push('console.error: ' + d.params.args.map(a => a.value ?? a.description).join(' '));
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') consoleErrors.push(`${d.params.entry.source}: ${d.params.entry.text}${d.params.entry.url ? ' ' + d.params.entry.url : ''}`);
  for (const w of [...waiters]) if (w.method === d.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(d.params); }
};
const send = (method, params = {}) => new Promise(r => { const id = ++msgId; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const waitFor = (method, ms = 30000) => Promise.race([new Promise(resolve => waiters.push({ method, resolve })), sleep(ms)]);
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
  return r.result?.result?.value;
}
const KEYS = { Enter: [13, '\r'], Escape: [27], Tab: [9], ArrowDown: [40], ArrowUp: [38], ArrowLeft: [37], ArrowRight: [39], Home: [36], End: [35], ' ': [32, ' '], Backspace: [8] };
async function key(k) {
  const [code, text] = KEYS[k] || [k.toUpperCase().charCodeAt(0), k];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: code, text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: code });
  await sleep(60);
}
async function click(selector) {
  const p = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  if (!p) throw new Error('click: no element ' + selector);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p[0], y: p[1], button: 'left', clickCount: 1 });
  await sleep(80);
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = join(outDir, name + '.png');
  writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  return file;
}

const AUDIT = `(() => {
  const vw = innerWidth, out = { overflow: [], offScale: {}, lowContrast: [] };
  const rgb = c => (c.match(/[\\d.]+/g) || []).map(Number);
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const label = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
  const clips = el => { for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true; } return false; };
  for (const el of document.body.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clips(el) && !el.closest('.lm-sr-only,[class*="sr-only"]')) {
      if (out.overflow.length < 12) out.overflow.push(label(el) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ' of ' + vw + ']');
    }
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    // Text drawn on the element's OWN opaque fill (buttons, badges, pills):
    // catches labels whose colour collapsed into their background.
    if (hasText && !el.closest('svg') && !el.disabled && !el.closest('[disabled],[aria-disabled="true"]')) {
      const bg = rgb(s.backgroundColor), fg = rgb(s.color);
      if (bg.length >= 3 && (bg[3] === undefined || bg[3] >= 0.9) && fg.length >= 3) {
        const cr = ratio(fg, bg);
        if (cr < 3 && out.lowContrast.length < 12) out.lowContrast.push(label(el) + ' ' + cr.toFixed(2) + ':1');
      }
    }
    if (hasText && !el.closest('svg')) {
      const size = parseFloat(s.fontSize), w = parseInt(s.fontWeight, 10);
      const k = size + 'px/' + w;
      if (!${JSON.stringify(LEMON_SIZES)}.includes(Math.round(size * 100) / 100) || !${JSON.stringify(LEMON_WEIGHTS)}.includes(w)) out.offScale[k] = (out.offScale[k] || 0) + 1;
    }
  }
  out.docOverflow = document.documentElement.scrollWidth > vw + 1;
  // Containers that scroll sideways. Wide tables are expected to; anything else
  // (a toolbar pushing .lm-main wider, a form row) is a layout defect.
  out.sideScroll = [];
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (!/(auto|scroll)/.test(s.overflowX) || el.scrollWidth <= el.clientWidth + 1 || !el.clientWidth) continue;
    if (el.matches('.lm-table-wrap, [data-lm-scroll-x], .lm-menu') || el.closest('.lm-table-wrap, [data-lm-scroll-x]')) continue;
    if (out.sideScroll.length < 8) out.sideScroll.push(label(el) + ' (' + el.scrollWidth + ' > ' + el.clientWidth + ')');
  }
  return out;
})()`;

const report = { url, font: fontFamily, runs: [], steps: [], consoleErrors };
let failed = false;
await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');

for (const [w, h] of sizes) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  const loaded = waitFor('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  const t0 = Date.now();
  let weights = '';
  while (Date.now() - t0 < fontTimeout) {
    weights = await ev(`(async()=>{ try { await document.fonts.load('600 14px ${fontFamily}'); } catch(e){} return [...document.fonts].filter(f=>f.family.replace(/["']/g,'')==='${fontFamily}'&&f.status==='loaded').map(f=>f.weight).join(',') })()`);
    if (weights) break;
    await sleep(400);
  }
  const fontMs = Date.now() - t0;
  await sleep(500); // let first paint / initial skeletons settle

  for (const theme of themes) {
    await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}; document.dispatchEvent(new CustomEvent('lm:themechange',{detail:${JSON.stringify(theme)}}));`);
    await sleep(350);
    const name = `${w}x${h}-${theme}`;
    const file = await shot(name);
    const a = await ev(AUDIT);
    const run = { size: `${w}x${h}`, theme, screenshot: file, fontLoaded: !!weights, fontWeights: weights, fontWaitMs: fontMs, overflow: a.overflow, documentScrollsSideways: a.docOverflow, offScaleType: a.offScale, lowContrastText: a.lowContrast, unexpectedSideScroll: a.sideScroll };
    report.runs.push(run);
    if (!weights || a.overflow.length || a.docOverflow || Object.keys(a.offScale).length || a.lowContrast.length || a.sideScroll.length) failed = true;
  }

  if (stepsFile && sizes.indexOf(sizes.find(s => s[0] === w && s[1] === h)) === 0) {
    await ev(`document.documentElement.dataset.theme=${JSON.stringify(themes[0])}`);
    const log = (label, value) => { report.steps.push({ label, value }); console.log(`  step  ${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`); };
    const steps = (await import(pathToFileURL(resolve(stepsFile)).href)).default;
    try { await steps({ ev, key, click, shot, sleep, send, log }); }
    catch (e) { failed = true; log('steps threw', e.message); }
    await send('Page.navigate', { url }); await waitFor('Page.loadEventFired'); // reset state for the next size
  }
}
if (consoleErrors.length) failed = true;

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
for (const r of report.runs) {
  const issues = [];
  if (!r.fontLoaded) issues.push(`font ${fontFamily} NOT loaded after ${r.fontWaitMs}ms (fallback rendering, so widths are not representative)`);
  if (r.documentScrollsSideways) issues.push('page scrolls sideways');
  if (r.overflow.length) issues.push(`overflow: ${r.overflow.join('; ')}`);
  const off = Object.entries(r.offScaleType);
  if (off.length) issues.push(`off-scale type: ${off.map(([k, n]) => `${k}×${n}`).join(', ')}`);
  if (r.lowContrastText.length) issues.push(`text nearly invisible on its own fill: ${r.lowContrastText.join('; ')}`);
  if (r.unexpectedSideScroll.length) issues.push(`scrolls sideways (allow with data-lm-scroll-x if intended): ${r.unexpectedSideScroll.join('; ')}`);
  console.log(`${issues.length ? 'FAIL' : 'ok  '}  ${r.size.padEnd(9)} ${r.theme.padEnd(5)} font ${r.fontWeights || '-'} (${r.fontWaitMs}ms)  ${r.screenshot}`);
  for (const i of issues) console.log(`        ${i}`);
}
if (consoleErrors.length) console.log(`console errors:\n  ${consoleErrors.join('\n  ')}`);
console.log(`report: ${join(outDir, 'report.json')}`);

ws.close(); browser.kill();
await sleep(300);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(failed ? 1 : 0);
