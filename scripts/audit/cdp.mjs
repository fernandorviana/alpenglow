/**
 * Minimal Chrome DevTools Protocol driver, no dependencies: Node's global
 * `fetch` talks to Chrome's `/json` HTTP endpoint and its global `WebSocket`
 * talks CDP directly over the per-tab debugger socket.
 *
 * `launch()` starts headless Chrome under a disposable profile — a fresh
 * temp dir, and `--remote-debugging-port=0` so the OS picks a free port,
 * because two audit runs at once must never collide on a fixed one. The
 * port lands in `<profile>/DevToolsActivePort`, whose first line is the
 * port number (the second is a browser target path we don't need).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One CDP target's WebSocket: request/response by id, plus a listener list for events (Page.loadEventFired etc). */
class Page {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result);
      } else if (m.method) {
        this.listeners.forEach((l) => l(m));
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rej(new Error(`timeout ${method}`));
        }
      }, 30000);
    });
  }

  waitFor(method, ms = 20000) {
    return new Promise((res) => {
      const t = setTimeout(() => res(null), ms);
      const l = (m) => {
        if (m.method === method) {
          clearTimeout(t);
          this.listeners = this.listeners.filter((x) => x !== l);
          res(m);
        }
      };
      this.listeners.push(l);
    });
  }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval error');
    return r.result.value;
  }
}

async function waitForPort(profileDir) {
  const file = join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    if (existsSync(file)) {
      const port = readFileSync(file, 'utf8').split('\n')[0].trim();
      if (port) return Number(port);
    }
    await sleep(100);
  }
  throw new Error('Chrome did not write DevToolsActivePort in time');
}

async function waitForChrome(port) {
  for (let i = 0; i < 50; i++) {
    try {
      return await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    } catch {
      await sleep(200);
    }
  }
  throw new Error('Chrome did not start');
}

/** Launches headless Chrome and returns `{ open, close }`. `open()` gives a fresh tab as a `Page`. */
export async function launch() {
  const profileDir = mkdtempSync(join(tmpdir(), 'alpenglow-audit-'));
  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--mute-audio',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    try {
      // SIGKILL, not the default SIGTERM: a graceful shutdown has Chrome's
      // renderer processes still writing to the profile for a moment after
      // the parent exits, which raced rmSync below often enough to leave
      // temp dirs behind. An immediate kill leaves nothing mid-write.
      chrome.kill('SIGKILL');
    } catch {
      // already gone
    }
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // best effort — a locked file here isn't worth failing the run over
    }
  };
  // Belt and braces: close() below is the normal path, these catch the
  // abnormal ones (a thrown error upstream, or Ctrl-C mid-audit) so the temp
  // profile and the Chrome process never outlive the script.
  process.once('exit', cleanup);
  process.once('SIGINT', () => {
    cleanup();
    process.exit(130);
  });

  const port = await waitForPort(profileDir);
  await waitForChrome(port);

  return {
    async open() {
      const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((res, rej) => {
        ws.addEventListener('open', res);
        ws.addEventListener('error', rej);
      });
      const page = new Page(ws);
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      return page;
    },
    close: cleanup,
  };
}
