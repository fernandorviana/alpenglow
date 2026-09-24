/**
 * Static file server for the audit harness: lets `audit:responsive` and
 * `audit:css-order` point Chrome at the built `out/` without a Next dev
 * server. Port 0 so the OS picks a free port (matches `cdp.mjs`'s reasoning
 * — parallel audit runs must never fight over one).
 *
 * Directory URLs resolve to their `index.html`, which is all the static
 * export (`trailingSlash: true`) needs: every route is a folder.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolves a request path to a file under `dir`, following directory → index.html. Returns null if nothing matches or it would escape `dir`. */
function resolveFile(dir, urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = resolve(dir, `.${safePath}`);
  if (!file.startsWith(resolve(dir))) return null; // traversal attempt
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

export async function serve(dir) {
  const server = createServer((req, res) => {
    const file = resolveFile(dir, req.url ?? '/');
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  await new Promise((res, rej) => {
    server.once('error', rej);
    server.listen(0, '127.0.0.1', res);
  });
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((res) => server.close(() => res())),
  };
}
