import { resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { readCss, block } from '@/test/css';
import { Button } from '@/components/Button';
import { spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import { Card, Cards } from './Card';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom has no matchMedia; the section pages' pictures ask it.
window.matchMedia = (query: string) =>
  ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;

/**
 * The card is a link with a picture in it. Two things have to hold: the
 * link is named by the title alone, and the picture's controls are out of
 * reach — a button inside a link is a control inside a control.
 */
describe('Card', () => {
  it('is a list item whose link is named by the title', () => {
    render(
      <Cards>
        <Card href="/button" title="Button" description="Three variants, five tones." />
      </Cards>,
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/button');
    expect(link).toHaveAccessibleName('Button');
  });

  it('keeps the visual inert, so its controls are pictures', () => {
    const { container } = render(
      <Cards>
        <Card href="/button" title="Button" description="…" visual={<Button>Confirm</Button>} />
      </Cards>,
    );
    const visual = container.querySelector('.cardVisual');
    expect(visual).toHaveAttribute('inert');
    expect(visual).toContainElement(screen.getByRole('button'));
  });

  it('renders no visual box when there is no visual', () => {
    const { container } = render(
      <Cards>
        <Card href="/why" title="Why" description="…" />
      </Cards>,
    );
    expect(container.querySelector('.cardVisual')).toBeNull();
  });
});

describe('the card stylesheet', () => {
  const css = readCss('app/docs.css');
  const rule = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors]) => selectors!.split(',').some((s) => s.trim() === selector))
      .map(([, , body]) => body!.replace(/\s+/g, ' ').trim())
      .join(' ');

  it('stretches the link over the whole card', () => {
    expect(rule('.cardLink::after')).toMatch(/position: absolute/);
    expect(rule('.cardLink::after')).toMatch(/inset: 0/);
    expect(rule('.card')).toMatch(/position: relative/);
  });

  it('moves the focus ring from the link to the card, and never loses it', () => {
    // The link's own ring would sit around the title while the hit area is
    // the card. The ring goes on the card instead; `outline: none` on the
    // link is only allowed because of that replacement.
    expect(rule('.cardLink:focus-visible')).toMatch(/outline: none/);
    expect(rule('.card:has(.cardLink:focus-visible)')).toMatch(
      /outline: var\(--ap-border-width-ring\)/,
    );
  });

  it("sets the drawn Card's two lines, each as a whole text style", () => {
    // Figma 3072:3359, State=Default: the title 16/24 semibold, the
    // description 12/16 medium. Size, line height and tracking from one token
    // each, and the weight: a style declared in part let the prose's `h3`
    // supply the rest — a 14px title with the subheading's tracking.
    const whole = (selector: string, style: string, weight: string) => {
      const body = rule(selector);
      expect(body).toContain(`font-size: var(--ap-text-${style}-size)`);
      expect(body).toContain(`line-height: var(--ap-text-${style}-line-height)`);
      expect(body).toContain(`letter-spacing: var(--ap-text-${style}-tracking)`);
      expect(body).toContain(`font-weight: var(--ap-font-weight-${weight})`);
    };
    whole('.cardTitle', 'body-lg', 'semibold');
    whole('.cardDescription', 'caption-md', 'medium');
    expect(textStyle['body/lg']).toMatchObject({ size: 16, lineHeight: 24 });
    expect(textStyle['caption/md']).toMatchObject({ size: 12, lineHeight: 16 });
  });

  it('nests its radii concentrically', () => {
    // Outer radius = inner radius + padding: 2xl (16) = sm (4) + 12.
    expect(rule('.card')).toMatch(/border-radius: var\(--ap-radius-2xl\)/);
    expect(rule('.card')).toMatch(/padding: var\(--ap-spacing-150\)/);
    expect(rule('.cardVisual')).toMatch(/border-radius: var\(--ap-radius-sm\)/);
  });
});

/**
 * The grid used to be `repeat(auto-fill, minmax(232px, 1fr))`: at 768 the
 * column is 656, two cards fit and three do not, so every three-card grid —
 * the home page's two, /develop's — stood as two and one beside an empty
 * cell, and /components' 33 left its last card alone; at 1160, where the
 * column is 1032, four fit and the 33rd was alone again. Now the count of
 * columns answers the width the cards have, and a row is always full.
 */
describe('the card grid', () => {
  const css = readCss('app/docs.css');
  const CARD = 232;
  const GAP = spacing[200];
  const rem = (px: number) => `${px / 16}rem`;

  /** Every grid a page draws, by its number of cards. */
  const counts = async () => {
    const found: number[] = [];
    for (const page of ['page.tsx', 'develop/page.tsx', 'foundations/page.tsx', 'components/page.tsx']) {
      const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve('app', page));
      const { container, unmount } = render(<Page />);
      for (const list of container.querySelectorAll('ul.cards')) found.push(list.children.length);
      unmount();
    }
    return found;
  };

  it('sits in a frame that is its container, so the columns answer the cards’ own width', () => {
    const { container } = render(
      <Cards>
        <Card href="/why" title="Why" description="…" />
      </Cards>,
    );
    expect(container.querySelector('.cardsFrame > ul.cards')).not.toBeNull();
    expect(block(css, '.cardsFrame {')).toMatch(/container-type: inline-size/);
    // No auto-fill and no auto-fit: those count columns from the track size
    // alone and leave whatever the count does not fill.
    expect(block(css, '.cards {')).not.toMatch(/auto-fill|auto-fit/);
    expect(block(css, '.cards {')).toMatch(/grid-template-columns: minmax\(0, 1fr\)/);
  });

  it('goes two across at two cards of 232, the last of an odd count taking the row', () => {
    const two = block(css, `@container (${rem(2 * CARD + GAP)} <= width < ${rem(3 * CARD + 2 * GAP)})`);
    expect(block(two, '.cards {')).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    expect(block(two, '.cards > :last-child:nth-child(odd)')).toMatch(/grid-column: 1 \/ -1/);
  });

  it('goes three across at three, and the last row is shared by what is left', () => {
    // Six tracks, two to a card: a last row of two takes three each, a last
    // card alone takes all six.
    const three = block(css, `@container (width >= ${rem(3 * CARD + 2 * GAP)})`);
    expect(block(three, '.cards {')).toMatch(/grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
    expect(block(three, '.cards > * {')).toMatch(/grid-column: span 2/);
    expect(block(three, '.cards > :nth-last-child(2):nth-child(3n + 1)')).toMatch(/grid-column: span 3/);
    expect(three).toMatch(/\.cards > :last-child:nth-child\(3n \+ 2\)[^{]*\{[^}]*grid-column: span 3/);
    expect(block(three, '.cards > :last-child:nth-child(3n + 1) {')).toMatch(/grid-column: span 6/);
  });

  it('keeps a count of four, eight, twelve four across once four cards of 232 fit (61rem)', () => {
    // /foundations' eight stood as two rows of four from 1104 to 1279 under
    // auto-fill, where the column is 976 to 1032; three across left them
    // 3, 3, 2. Four across is kept only where it fills every row.
    const four = block(css, `@container (width >= ${rem(4 * CARD + 3 * GAP)})`);
    expect(block(four, '.cards:has(> :last-child:nth-child(4n)) {')).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
    expect(block(four, '.cards:has(> :last-child:nth-child(4n)) > * {')).toMatch(/grid-column: auto/);
    // After the three-across block, which its children's rule has to beat at
    // the same weight.
    expect(css.indexOf(`@container (width >= ${rem(4 * CARD + 3 * GAP)})`)).toBeGreaterThan(
      css.indexOf(`@container (width >= ${rem(3 * CARD + 2 * GAP)})`),
    );
  });

  it('puts three cards alone in one row of three from 40rem, rather than two and one', () => {
    const trio = block(css, `@container (40rem <= width < ${rem(3 * CARD + 2 * GAP)})`);
    expect(block(trio, '.cards:has(> :last-child:nth-child(3)) {')).toMatch(/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    expect(block(trio, '.cards:has(> :last-child:nth-child(3)) > :last-child')).toMatch(/grid-column: auto/);
  });

  it('leaves no row with a hole, for every count a page draws, at every width its column takes', async () => {
    // The column's width at 320, 375, 640, 768, 1024, 1160, 1440 and 1536,
    // measured on the built site. The model is the rules above, read as
    // numbers: the tracks by width, each card's span, and auto-placement.
    const widths = [288, 343, 608, 656, 896, 1032, 852, 740];
    const found = await counts();
    expect(found).toEqual([3, 3, 3, 8, 33]);
    const rows = (count: number, width: number) => {
      let tracks = 1;
      let span = (_: number) => 1;
      if (count === 3 && width >= 640 && width < 3 * CARD + 2 * GAP) tracks = 3;
      else if (count % 4 === 0 && width >= 4 * CARD + 3 * GAP) tracks = 4;
      else if (width >= 3 * CARD + 2 * GAP) {
        tracks = 6;
        span = (i) => (count % 3 === 1 && i === count - 1 ? 6 : count % 3 === 2 && i >= count - 2 ? 3 : 2);
      } else if (width >= 2 * CARD + GAP) {
        tracks = 2;
        span = (i) => (count % 2 === 1 && i === count - 1 ? 2 : 1);
      }
      const used: number[] = [];
      let row = 0;
      for (let i = 0; i < count; i++) {
        if (row + span(i) > tracks) {
          used.push(row);
          row = 0;
        }
        row += span(i);
      }
      used.push(row);
      return { tracks, used };
    };
    for (const count of found) {
      for (const width of widths) {
        const { tracks, used } = rows(count, width);
        expect(used.every((u) => u === tracks), `${count} cards at ${width}: ${used.join(', ')} of ${tracks}`).toBe(true);
      }
    }
    // /foundations at 1160, the column 1032: two rows of four, as before.
    expect(rows(8, 1032)).toEqual({ tracks: 4, used: [4, 4] });
    // The three-card grids and /components' 33 keep three across there.
    expect(rows(3, 1032).tracks).toBe(6);
    expect(rows(33, 1032).used).toHaveLength(11);
  });
});

/**
 * The home page's Developers card draws two lines of code, and a line never
 * wraps — a wrapped shell line is a different command — so the well clipped
 * `import "alpenglow/styles.css";` (200 wide) at 768, and its install line
 * (140) where the card is narrowest. The narrowest card is three across at
 * 40rem of grid: (640 − 2 × 16) / 3. Inside it, the card's padding, the
 * well's, the code box's and its hairline leave 128. A line has to fit at
 * 0.6em a character, the widest of the fallback monospace faces (SF Mono
 * measures 6.68 at 12px; Menlo and Consolas 7.2).
 */
describe('the home page’s Developers picture', () => {
  it('fits the narrowest card whole, line by line', async () => {
    const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve('app/page.tsx'));
    const { container } = render(<Page />);
    const code = [...container.querySelectorAll('.card')]
      .find((card) => card.querySelector('.cardTitle')?.textContent === 'Developers')
      ?.querySelector('.miniCode');
    expect(code).toBeTruthy();
    const css = readCss('app/docs.css');
    const pad = (selector: string) => {
      const name = block(css, `${selector} {`).match(/padding: (?:var\(--ap-spacing-\w+\) )?var\(--ap-spacing-(\w+)\)/)?.[1];
      return spacing[name as unknown as keyof typeof spacing];
    };
    expect(block(css, '.miniCode {')).toMatch(/font-size: var\(--ap-text-caption-md-size\)/);
    const card = (640 - 2 * spacing[200]) / 3;
    const room = card - 2 * pad('.card') - 2 * pad('.cardVisual') - 2 * pad('.miniCode') - 2 * 1;
    expect(room).toBeCloseTo(128.67, 1);
    const advance = 0.6 * textStyle['caption/md'].size;
    for (const line of code!.textContent!.split('\n')) expect(line.length * advance, line).toBeLessThanOrEqual(room);
  });
});
