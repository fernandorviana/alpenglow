import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { primitives } from '@/tokens/primitives';
import { Bedrock, FAMILIES, STOPS } from './Bedrock';

/**
 * One cell per primitive, painted from the token source. A cell painted by
 * hand would be the one number on the home page that could rot.
 */
describe('Bedrock', () => {
  it('draws every family at every stop, from the primitives', () => {
    const { container } = render(<Bedrock />);
    const cells = container.querySelectorAll('.bedrockCell');
    expect(cells).toHaveLength(FAMILIES.length * STOPS.length);

    const painted = [...cells].map((cell) => (cell as HTMLElement).style.background.toLowerCase());
    const expected = FAMILIES.flatMap((family) =>
      STOPS.map((stop) => primitives[`${family}/${stop}` as keyof typeof primitives].toLowerCase()),
    );
    // jsdom serialises a hex background as rgb(); compare by resolving both.
    const rgb = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
    };
    expect(painted).toEqual(expected.map(rgb));
  });

  it('names every family the primitives file has, and no other', () => {
    const families = new Set(
      Object.keys(primitives)
        .map((name) => name.split('/')[0])
        .filter((f) => f !== 'white'),
    );
    expect([...families].sort()).toEqual([...FAMILIES].sort());
  });

  it('is one picture to a screen reader, not a hundred and ten cells', () => {
    render(<Bedrock />);
    expect(screen.getByRole('img', { name: /ten colour families/ })).toBeInTheDocument();
  });
});
