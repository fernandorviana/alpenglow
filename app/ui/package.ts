import pkg from '../../package.json';

/**
 * What the site says about the package, read from the package itself so a
 * page cannot say one version and ship another. The Install and Developers
 * pages both quote these; one source, so they cannot disagree.
 */
export const VERSION = pkg.version;
export const PEERS = Object.entries(pkg.peerDependencies as Record<string, string>);
export const ENTRY_POINTS = Object.keys(pkg.exports).filter((key) => key !== './package.json').length;
/** Zero today, and read rather than written so the page notices the day it is not. */
export const DEPENDENCIES =
  'dependencies' in pkg ? Object.keys(pkg.dependencies as Record<string, string>).length : 0;
