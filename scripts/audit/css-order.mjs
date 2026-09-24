#!/usr/bin/env node
/**
 * Compares element geometry between two servers of the same site — e.g. dev
 * (CSS in import order) and production (CSS in chunk order). A difference
 * bigger than 2px means a rule that should win on one side loses on the
 * other.
 *
 * Usage: npm run audit:css-order -- --a <url> --b <url> [--only /a,/b]
 *
 * Routes are discovered from `out/**\/index.html`, the same way
 * responsive.mjs does it — this script only needs a fresh `out/` to know
 * which routes exist; --a and --b can point anywhere, including two remote
 * URLs. Writes .audit/css-order/report.json.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { launch } from './cdp.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT_DIR = join(ROOT, '.audit', 'css-order');
const WIDTHS = [1440, 375];

const { values } = parseArgs({
  options: {
    a: { type: 'string' },
    b: { type: 'string' },
    only: { type: 'string' },
  },
});

if (!values.a || !values.b) {
  console.error('usage: npm run audit:css-order -- --a <url> --b <url> [--only /a,/b]');
  process.exit(2);
}

/** Same route discovery as responsive.mjs: every out/**\/index.html, minus Next internals and 404. */
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

// Geometry of every element under <main>, keyed by its path of tag + unhashed classes.
const PROBE = `(() => {
  const root = document.querySelector('main') || document.body;
  const clean = c => c.replace(/^(.*?)-module__[\\w-]+__/, '$1.').replace(/_[a-z0-9]{5,}$/i, '');
  const key = el => el.tagName.toLowerCase() + [...el.classList].map(clean).filter(c => !/^(inter|__)/.test(c)).map(c => '.' + c).join('');
  const out = []; const walk = (el, path) => { let i = 0;
    for (const ch of el.children) { const k = path + '>' + key(ch) + ':' + (i++);
      const r = ch.getBoundingClientRect(); const cs = getComputedStyle(ch);
      out.push([k, Math.round(r.width), Math.round(r.height), cs.display === 'none' ? 0 : 1, (ch.textContent || '').trim().slice(0, 30)]); walk(ch, k); } };
  walk(root, 'main'); return out;
})()`;

async function measure(page, base, route, w) {
  await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  const loaded = page.waitFor('Page.loadEventFired');
  await page.send('Page.navigate', { url: base + route });
  await loaded;
  await sleep(1500);
  return (await page.eval(PROBE)) ?? [];
}

/** Elements present on both sides whose rounded box or visibility differs by more than the noise floor. Dedupes to the outermost differing ancestor. */
function diffOf(a, b) {
  const bByKey = new Map(b.map((x) => [x[0], x]));
  const diffs = [];
  const seenPrefixes = [];
  for (const x of a) {
    const y = bByKey.get(x[0]);
    if (!y) continue;
    if (Math.abs(x[1] - y[1]) > 2 || Math.abs(x[2] - y[2]) > 2 || x[3] !== y[3]) {
      if (seenPrefixes.some((s) => x[0].startsWith(`${s}>`))) continue;
      seenPrefixes.push(x[0]);
      diffs.push({
        path: x[0].split('>').slice(-3).join(' > '),
        a: `${x[1]}x${x[2]}${x[3] ? '' : ' hidden'}`,
        b: `${y[1]}x${y[2]}${y[3] ? '' : ' hidden'}`,
        text: x[4],
      });
    }
  }
  return diffs;
}

function printSummary(report) {
  for (const r of report) {
    if (r.error) {
      console.log(`${r.route} @${r.w}: ERROR ${r.error}`);
      continue;
    }
    if (r.diffCount === 0) continue;
    console.log(`${r.route} @${r.w}: ${r.diffCount} element(s) differ`);
    for (const d of r.diffs.slice(0, 5)) console.log(`  ${d.path}: a=${d.a} b=${d.b}`);
  }
  const withDiffs = report.filter((r) => !r.error && r.diffCount > 0);
  const errors = report.filter((r) => r.error);
  console.log(`${report.length} runs, ${withDiffs.length} with diffs, ${errors.length} errors`);
  return withDiffs.length > 0 ? 1 : 0;
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

  const a = values.a.replace(/\/$/, '');
  const b = values.b.replace(/\/$/, '');

  const cdp = await launch();
  try {
    const [pageA, pageB] = await Promise.all([cdp.open(), cdp.open()]);
    const report = [];
    for (const route of routes) {
      for (const w of WIDTHS) {
        try {
          const [ga, gb] = await Promise.all([measure(pageA, a, route, w), measure(pageB, b, route, w)]);
          const diffs = diffOf(ga, gb);
          report.push({ route, w, aCount: ga.length, bCount: gb.length, diffs: diffs.slice(0, 30), diffCount: diffs.length });
          process.stdout.write(diffs.length ? 'D' : '.');
        } catch (e) {
          report.push({ route, w, error: String(e) });
          process.stdout.write('x');
        }
      }
    }
    console.log();
    writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 1));
    process.exitCode = printSummary(report);
  } finally {
    await cdp.close();
  }
}

await main();
