import { render } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import FullScreen from './page';

// The screen itself is Screen.test.tsx's; here only the frame's side of the talk.
vi.mock('../Screen', () => ({ Screen: () => null }));

/** A parent window to be framed by, whose postMessage the test can watch and answer through. */
const framedBy = (onPost: (message: unknown, origin: string) => void = () => {}) => {
  const parent = { postMessage: vi.fn(onPost) };
  vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window);
  return parent;
};

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-density');
});

describe('/screen/full, framed', () => {
  it('tells its parent it is listening, to its own origin only', () => {
    const parent = framedBy();
    render(<FullScreen />);
    expect(parent.postMessage).toHaveBeenCalledWith({ type: 'alpenglow:frame-ready' }, window.location.origin);
  });

  it('is listening by the time it says so, so an answer sent at once is applied', () => {
    // The parent answers ready with the combination shown now. If the frame
    // said ready before listening, a switch made while it loaded would be lost.
    framedBy((message) => {
      if ((message as { type?: string }).type !== 'alpenglow:frame-ready') return;
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: window.location.origin,
          data: { type: 'alpenglow:frame', density: 'compact', theme: 'dark' },
        }),
      );
    });
    render(<FullScreen />);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-density', 'compact');
  });

  it('says nothing when it is opened in a tab of its own', () => {
    const post = vi.spyOn(window, 'postMessage');
    render(<FullScreen />);
    expect(post).not.toHaveBeenCalled();
  });
});
