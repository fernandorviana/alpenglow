import type { NextConfig } from 'next';

/**
 * Static export: the documentation site has no server behaviour, so it can be
 * hosted anywhere. `DOCS_BASE` covers GitHub Pages serving the repo from a
 * subpath; on Vercel or a custom domain it is left unset.
 */
const basePath = process.env.DOCS_BASE ?? '';

const config: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default config;
