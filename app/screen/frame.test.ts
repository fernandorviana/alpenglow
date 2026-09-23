import { describe, it, expect } from 'vitest';
import { parseFrame, frameQuery, readMessage, applyFrame, DEFAULT_FRAME, FRAME_SCRIPT } from './frame';

describe('the frame’s query', () => {
  it('reads what it knows and ignores the rest', () => {
    expect(parseFrame('?width=768&density=compact&theme=dark')).toEqual({ width: 768, density: 'compact', theme: 'dark' });
    expect(parseFrame('?width=900&density=cosy&theme=sepia&x=1')).toEqual(DEFAULT_FRAME);
    expect(parseFrame('')).toEqual(DEFAULT_FRAME);
  });

  it('writes only what differs from the default, and round-trips', () => {
    expect(frameQuery(DEFAULT_FRAME)).toBe('');
    const s = { width: 375, density: 'compact', theme: 'dark' } as const;
    expect(parseFrame(frameQuery(s))).toEqual(s);
  });
});

describe('the frame’s messages', () => {
  const origin = 'https://alpenglow.example';
  const ok = { type: 'alpenglow:frame', density: 'compact', theme: 'dark' };

  it('accepts its own message from its own origin', () => {
    expect(readMessage({ origin, data: ok }, origin)).toEqual(ok);
  });

  it('refuses another origin', () => {
    expect(readMessage({ origin: 'https://evil.example', data: ok }, origin)).toBeNull();
  });

  it('refuses a value outside the enum, or another shape', () => {
    expect(readMessage({ origin, data: { ...ok, theme: 'sepia' } }, origin)).toBeNull();
    expect(readMessage({ origin, data: { ...ok, density: 'cosy' } }, origin)).toBeNull();
    expect(readMessage({ origin, data: 'alpenglow:frame' }, origin)).toBeNull();
    expect(readMessage({ origin, data: null }, origin)).toBeNull();
  });
});

describe('applying it', () => {
  it('sets both attributes, and removes density at comfortable', () => {
    const root = document.createElement('html');
    applyFrame(root, { density: 'compact', theme: 'dark' });
    expect(root.dataset).toMatchObject({ density: 'compact', theme: 'dark' });
    applyFrame(root, { density: 'comfortable', theme: 'light' });
    expect(root.hasAttribute('data-density')).toBe(false);
    expect(root.dataset.theme).toBe('light');
  });

  it('ships a pre-paint script that never touches the site’s stored theme', () => {
    expect(FRAME_SCRIPT).not.toContain('localStorage');
    expect(FRAME_SCRIPT).toContain('data-density');
  });
});
