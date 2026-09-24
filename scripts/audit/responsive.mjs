#!/usr/bin/env node
/**
 * Responsive audit: drives headless Chrome over every route of the built
 * docs site at five widths (two of them, 375 and 1440, also in dark), and
 * reports what a screenshot alone doesn't show — sideways page scroll,
 * content that overflows the viewport with nothing clipping it, and content
 * a container clips instead of wrapping.
 *
 * Usage: npm run audit:responsive [-- --base <url>] [--only /a,/b] [--widths 320,375] [--shots]
 *
 * With no --base, serves the build in `out/` itself (see serve.mjs). Routes
 * are discovered from `out/**\/index.html`, not hard-coded, so a new page
 * gets audited without editing this file.
 *
 * Writes .audit/responsive/probe.json (every run's full probe output) and,
 * with --shots, .audit/responsive/shots/<route>__<width>[d]__NN.png —
 * one screenshot per viewport-height segment of the page.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { launch } from './cdp.mjs';
import { serve } from './serve.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT_DIR = join(ROOT, '.audit', 'responsive');
const SHOTS_DIR = join(OUT_DIR, 'shots');
const MAX_SEGMENTS = Number(process.env.MAX_SEGMENTS ?? 8);

const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    only: { type: 'string' },
    widths: { type: 'string' },
    shots: { type: 'boolean', default: false },
  },
});

const ALL_VIEWS = [
  { w: 320, h: 700, theme: 'light', mobile: true },
  { w: 375, h: 812, theme: 'light', mobile: true },
  { w: 375, h: 812, theme: 'dark', mobile: true },
  { w: 768, h: 1024, theme: 'light', mobile: true },
  { w: 1024, h: 768, theme: 'light', mobile: false },
  { w: 1440, h: 900, theme: 'light', mobile: false },
  { w: 1440, h: 900, theme: 'dark', mobile: false },
];
const widthFilter = values.widths ? values.widths.split(',').map(Number) : null;
const VIEWS = widthFilter ? ALL_VIEWS.filter((v) => widthFilter.includes(v.w)) : ALL_VIEWS;

const CONCURRENCY = 5;

/** Every route the static export produced, from disk rather than a hand-kept list. Skips Next internals (_next, _not-found) and the 404 page. */
function discoverRoutes(outDir) {
  const routes = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_')) continue;
        walk(join(dir, entry.name), `${prefix}/${entry.name}`);
      } else if (entry.name === 'index.html') {
        routes.push(prefix || '/');
      }
    }
  };
  walk(outDir, '');
  return routes.filter((r) => r !== '/404').sort();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs in the page. Reports what a reviewer cannot see in a screenshot.
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = { path: location.pathname, vw, scrollWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight };
  const desc = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id;
    const c = [...el.classList].map(x => x.replace(/^(.*?)-module__\\w+__/, '$1.')).slice(0, 2); if (c.length) s += '.' + c.join('.');
    const role = el.getAttribute('role'); if (role) s += '[role=' + role + ']';
    const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40); return t ? s + ' "' + t + '"' : s; };
  const hiddenish = el => { for (let a = el; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed' || a.getAttribute('aria-hidden') === 'true' || a.inert) return true;
    if (cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto')) return true; } return false; };
  // An element with a scrolling/clipping ancestor anywhere above it is that
  // ancestor's problem, not the page's — even if the ancestor itself sits
  // off-screen inside a further-out scroll region (a false positive this
  // used to report on /scheduler, whose scrolling table lives inside a
  // scrolling drawer). So this doesn't stop at the nearest such ancestor and
  // ask whether *it* is in bounds; any match anywhere above rules the
  // element out of page-level overflow entirely.
  const clippedBy = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a);
    if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) return a; } return null; };
  const overflow = []; const scrollers = []; const clipped = []; const smallTargets = []; const tinyText = new Set();
  const all = [...document.querySelectorAll('body *')];
  const offenderSet = new Set();
  for (const el of all) {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if ((r.right > vw + 1 || r.left < -1) && !hiddenish(el) && !clippedBy(el)) {
      if (!offenderSet.has(el.parentElement)) overflow.push({ el: desc(el), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
      offenderSet.add(el);
    }
    if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1 && !hiddenish(el))
      scrollers.push({ el: desc(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth });
    if (/(hidden|clip)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis' && !hiddenish(el) && el.clientWidth > 20 && el.textContent.trim())
      clipped.push({ el: desc(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth });
    if (el.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option], [role=slider]')
        && !hiddenish(el) && (r.width < 24 || r.height < 24) && !el.closest('p, li p, td p') && !(el.tagName === 'A' && getComputedStyle(el).display === 'inline'))
      smallTargets.push({ el: desc(el), w: Math.round(r.width), h: Math.round(r.height) });
    if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(cs.fontSize) < 12 && !hiddenish(el))
      tinyText.add(desc(el).slice(0, 60) + ' ' + cs.fontSize);
  }
  Object.assign(out, { overflow: overflow.slice(0, 25), overflowCount: overflow.length, scrollers: scrollers.slice(0, 15), clipped: clipped.slice(0, 15),
    smallTargets: smallTargets.slice(0, 20), smallTargetCount: smallTargets.length, tinyText: [...tinyText].slice(0, 15) });
  return out;
})()`;

function tagFor(route, v) {
  const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  return `${slug}__${v.w}${v.theme === 'dark' ? 'd' : ''}`;
}

async function runOne(page, route, v, base) {
  const tag = tagFor(route, v);
  await page.send('Emulation.setDeviceMetricsOverride', { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: v.mobile });
  await page.send('Emulation.setTouchEmulationEnabled', v.w < 768 ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: v.theme }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  const loaded = page.waitFor('Page.loadEventFired');
  await page.send('Page.navigate', { url: base + route });
  await loaded;
  await sleep(900);
  await page.eval(`document.getAnimations().forEach(a => { try { a.finish() } catch {} }); document.fonts.ready.then(() => 1)`);
  const probe = await page.eval(PROBE);
  let segments = 0;
  if (values.shots) {
    const segs = Math.min(MAX_SEGMENTS, Math.ceil(probe.docHeight / v.h));
    for (let i = 0; i < segs; i++) {
      await page.eval(`window.scrollTo(0, ${i * v.h}); 1`);
      await sleep(120);
      const shot = await page.send('Page.captureScreenshot', { format: 'png' });
      const f = `${tag}__${String(i).padStart(2, '0')}.png`;
      writeFileSync(join(SHOTS_DIR, f), Buffer.from(shot.data, 'base64'));
    }
    segments = segs;
  }
  return { route, view: `${v.w}${v.theme === 'dark' ? ' dark' : ''}`, ...probe, segments, truncated: probe.docHeight > v.h * MAX_SEGMENTS };
}

function printSummary(results) {
  for (const r of results.sort((a, b) => (a.route + a.view).localeCompare(b.route + b.view))) {
    if (r.error) {
      console.log(`${r.route} @${r.view}: ERROR ${r.error}`);
      continue;
    }
    const problems = [];
    if (r.scrollWidth > r.vw) problems.push(`scrolls sideways (scrollWidth ${r.scrollWidth} > ${r.vw})`);
    if (r.overflowCount > 0) problems.push(`overflow unclipped ×${r.overflowCount}`);
    if (r.clipped.length > 0) problems.push(`clips content ×${r.clipped.length}`);
    if (problems.length) console.log(`${r.route} @${r.view}: ${problems.join('; ')}`);
  }
  const sideways = results.filter((r) => !r.error && r.scrollWidth > r.vw);
  const withProblems = results.filter((r) => !r.error && (r.scrollWidth > r.vw || r.overflowCount > 0 || r.clipped.length > 0));
  const errors = results.filter((r) => r.error);
  console.log(`${results.length} runs, ${withProblems.length} with problems, ${sideways.length} scroll sideways, ${errors.length} errors`);
  return sideways.length > 0 ? 1 : 0;
}

async function main() {
  const outDir = join(ROOT, 'out');
  if (!existsSync(outDir)) {
    console.error('run npm run build:docs first');
    process.exit(2);
  }

  const only = values.only ? values.only.split(',') : null;
  const allRoutes = discoverRoutes(outDir);
  const routes = only ? allRoutes.filter((r) => only.includes(r)) : allRoutes;

  mkdirSync(OUT_DIR, { recursive: true });
  if (values.shots) mkdirSync(SHOTS_DIR, { recursive: true });

  const jobs = routes.flatMap((r) => VIEWS.map((v) => [r, v]));
  if (jobs.length === 0) {
    console.log('nothing to audit: no routes × views matched --only / --widths');
    process.exit(0);
  }

  let server = null;
  const base = values.base ? values.base.replace(/\/$/, '') : (server = await serve(outDir)).url;

  const cdp = await launch();
  try {
    const concurrency = Math.min(CONCURRENCY, jobs.length);
    const pages = await Promise.all(Array.from({ length: concurrency }, () => cdp.open()));
    const results = [];
    let next = 0;
    await Promise.all(
      pages.map(async (page) => {
        while (next < jobs.length) {
          const [route, v] = jobs[next++];
          try {
            results.push(await runOne(page, route, v, base));
            process.stdout.write('.');
          } catch (e) {
            results.push({ route, view: `${v.w}${v.theme === 'dark' ? ' dark' : ''}`, error: String(e) });
            process.stdout.write('x');
          }
        }
      }),
    );
    console.log();
    writeFileSync(join(OUT_DIR, 'probe.json'), JSON.stringify(results, null, 1));
    process.exitCode = printSummary(results);
  } finally {
    await cdp.close();
    if (server) await server.close();
  }
}

await main();
