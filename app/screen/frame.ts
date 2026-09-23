import { densityModes } from '@/tokens/density';
import type { Density } from '@/tokens/density';

/**
 * How /screen talks to /screen/full: the query carries a combination so it
 * can be linked and opened in a tab, and a message changes mode and density
 * in place so the frame does not reload. The frame says ready once it
 * listens, and the page answers with what it shows, because the iframe's
 * load can come before the frame has hydrated. Width is never sent: it is
 * the iframe's own size, a real viewport.
 */

export const widths = [1440, 1024, 768, 375] as const;
export type FrameWidth = (typeof widths)[number];
export type FrameMode = 'light' | 'dark';
export type FrameState = { width: FrameWidth; density: Density; theme: FrameMode };
export type FrameMessage = { type: 'alpenglow:frame'; density: Density; theme: FrameMode };

export const DEFAULT_FRAME: FrameState = { width: 1440, density: 'comfortable', theme: 'light' };

const isDensity = (v: unknown): v is Density => (densityModes as readonly unknown[]).includes(v);
const isMode = (v: unknown): v is FrameMode => v === 'light' || v === 'dark';
const isWidth = (v: number): v is FrameWidth => (widths as readonly number[]).includes(v);

export function parseFrame(search: string): FrameState {
  const q = new URLSearchParams(search);
  const width = Number(q.get('width'));
  const density = q.get('density');
  const theme = q.get('theme');
  return {
    width: isWidth(width) ? width : DEFAULT_FRAME.width,
    density: isDensity(density) ? density : DEFAULT_FRAME.density,
    theme: isMode(theme) ? theme : DEFAULT_FRAME.theme,
  };
}

export function frameQuery(state: FrameState): string {
  const q = new URLSearchParams();
  if (state.width !== DEFAULT_FRAME.width) q.set('width', String(state.width));
  if (state.density !== DEFAULT_FRAME.density) q.set('density', state.density);
  if (state.theme !== DEFAULT_FRAME.theme) q.set('theme', state.theme);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Only this site's own page may drive the frame, and only with values it knows. */
export function readMessage(event: { origin: string; data: unknown }, origin: string): FrameMessage | null {
  if (event.origin !== origin) return null;
  const d = event.data as Partial<FrameMessage> | null;
  if (!d || typeof d !== 'object' || d.type !== 'alpenglow:frame') return null;
  if (!isDensity(d.density) || !isMode(d.theme)) return null;
  return { type: 'alpenglow:frame', density: d.density, theme: d.theme };
}

export function applyFrame(root: HTMLElement, { density, theme }: Pick<FrameState, 'density' | 'theme'>) {
  root.setAttribute('data-theme', theme);
  if (density === 'comfortable') root.removeAttribute('data-density');
  else root.setAttribute('data-density', density);
}

/**
 * Before paint, from the query, so the frame never shows a light flash
 * before turning dark. The site's stored theme is not read: the screen's
 * mode is the frame's, and choosing it must not change the site's.
 */
export const FRAME_SCRIPT = `
try {
  var q = new URLSearchParams(location.search), r = document.documentElement;
  var t = q.get('theme'); r.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  if (q.get('density') === 'compact') r.setAttribute('data-density', 'compact'); else r.removeAttribute('data-density');
} catch (e) {}
`;
