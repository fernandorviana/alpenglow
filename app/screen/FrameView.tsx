'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Link } from '@/components/Link';
import { DEFAULT_FRAME, frameQuery, parseFrame, widths } from './frame';
import type { FrameMessage, FrameState, FrameWidth } from './frame';
import styles from './frame.module.css';

const HEIGHT = 900;

/**
 * The site's base path, `DOCS_BASE` at build time, inlined by `env` in
 * next.config.ts. The Link's href goes through Next's link, which adds the
 * base itself; the iframe's src is a raw attribute and needs it written in.
 * Read when called rather than at module scope, so a test can set it.
 */
const base = () => process.env.NEXT_PUBLIC_DOCS_BASE ?? '';

/**
 * `/screen/full` in an iframe, with the system's own controls over it. The
 * width is the iframe's viewport, so the screen's media queries answer it as
 * a product's would; mode and density reach the frame by message.
 *
 * The combination is in the page's query, so it can be linked. It is read
 * from the router, not from `window.location`: after a client-side
 * navigation Next writes the new URL at commit, after this renders, so the
 * window would still show the page being left. A static page that asks for
 * the query is drawn on the client below its Suspense boundary; the static
 * HTML has the fallback, the default bar with no frame.
 */
export function Frame({ count }: { count: number }) {
  return (
    <Suspense fallback={<Live count={count} initial={DEFAULT_FRAME} live={false} />}>
      <FromQuery count={count} />
    </Suspense>
  );
}

function FromQuery({ count }: { count: number }) {
  const query = useSearchParams();
  return <Live count={count} initial={parseFrame(`?${query.toString()}`)} live />;
}

function Live({ count, initial, live }: { count: number; initial: FrameState; live: boolean }) {
  const [state, setState] = useState<FrameState>(initial);
  // The combination the iframe was loaded with. Its src is built from this
  // alone, so a change of mode or density travels by message and never
  // reloads it; the width is the iframe's own size and is not in its src at
  // all. Held once: later renders hand in the query as it has since been
  // rewritten, and are not read.
  const [first] = useState(() => (live ? initial : null));
  const [room, setRoom] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  // The combination shown now, for the frame's ready: its listener is
  // attached once, and a closure over `state` would answer with the first.
  const shown = useRef(state);

  const send = (s: FrameState) => {
    const message: FrameMessage = { type: 'alpenglow:frame', density: s.density, theme: s.theme };
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  };

  useEffect(() => {
    shown.current = state;
  }, [state]);

  useEffect(() => {
    if (!first) return;
    const { pathname, hash } = window.location;
    // `null`, Next's documented form: its own state object here would stop
    // the router syncing, and a later update of it would wipe the query.
    window.history.replaceState(null, '', `${pathname}${frameQuery(state)}${hash}`);
    send(state);
  }, [state, first]);

  // The screen's own "Switch to dark" tells the page, so the bar says what is
  // shown. The frame's ready is answered with what is shown: onLoad alone can
  // arrive before the frame listens.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !e.source || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: unknown; theme?: unknown } | null;
      if (d?.type === 'alpenglow:frame-ready') return send(shown.current);
      if (d?.type !== 'alpenglow:frame-theme' || (d.theme !== 'light' && d.theme !== 'dark')) return;
      const theme = d.theme;
      setState((s) => (s.theme === theme ? s : { ...s, theme }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // jsdom has no ResizeObserver, and the page is rendered there by the axe
  // suite: without one the frame is drawn at full size.
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setRoom(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = room === null ? 1 : Math.min(1, room / state.width);
  const open = `/screen/full/${frameQuery(state)}`;
  const src = first && `${base()}/screen/full/${frameQuery({ ...first, width: DEFAULT_FRAME.width })}`;

  return (
    <section aria-label="The screen" className={styles.frame}>
      <div className={styles.actions}>
        <Link href={open} target="_blank" variant="standalone" render={(props) => <NextLink {...props} prefetch={false} />}>
          Open full screen
        </Link>
        <Link href="https://github.com/fernandorviana/alpenglow/tree/main/app/screen" external variant="standalone">
          Source
        </Link>
        <span className={styles.count}>{count} components, 0 local values</span>
      </div>
      <div className={styles.bar}>
        <SegmentedControl
          label="Width"
          options={widths.map((w) => ({ value: String(w), label: String(w) }))}
          value={String(state.width)}
          onChange={(v) => setState((s) => ({ ...s, width: Number(v) as FrameWidth }))}
        />
        <SegmentedControl
          label="Density"
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
          value={state.density}
          onChange={(v) => setState((s) => ({ ...s, density: v as FrameState['density'] }))}
        />
        <SegmentedControl
          label="Mode"
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={state.theme}
          onChange={(v) => setState((s) => ({ ...s, theme: v as FrameState['theme'] }))}
        />
      </div>
      <div ref={stage}>
        <div className={styles.well} style={{ inlineSize: state.width * scale, blockSize: HEIGHT * scale }}>
          {src && (
            <iframe
              ref={frame}
              title="Ridge Physio, a scheduling day built from Alpenglow"
              src={src}
              width={state.width}
              height={HEIGHT}
              className={styles.screen}
              style={{ transform: `scale(${scale})` }}
              onLoad={() => send(state)}
            />
          )}
        </div>
      </div>
      {scale < 1 && <p className={styles.caption}>Shown at {Math.round(scale * 100)}%</p>}
    </section>
  );
}
