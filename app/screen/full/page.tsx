'use client';

import { useEffect } from 'react';
import { InlineScript } from '@ui/InlineScript';
import { Screen } from '../Screen';
import { FRAME_SCRIPT, applyFrame, readMessage } from '../frame';
import type { FrameMode } from '../frame';

/** The screen alone, as a product would stand. Framed by /screen, or opened in a tab from it. */
export default function FullScreen() {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const m = readMessage(event, window.location.origin);
      if (m) applyFrame(document.documentElement, m);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onTheme = (theme: FrameMode) => {
    const root = document.documentElement;
    applyFrame(root, { theme, density: root.dataset.density === 'compact' ? 'compact' : 'comfortable' });
    if (window.parent !== window) window.parent.postMessage({ type: 'alpenglow:frame-theme', theme }, window.location.origin);
  };

  return (
    <>
      <InlineScript html={FRAME_SCRIPT} />
      <Screen onTheme={onTheme} />
    </>
  );
}
