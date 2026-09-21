import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardActions, CardBody, CardMedia, CardTitle, cardElements, cardTitleElements } from './Card';
import styles from './Card.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Card/Card.module.css');

function Location({ href }: { href?: string }) {
  return (
    <Card>
      <CardMedia>
        <img src="clinic.jpg" alt="" />
      </CardMedia>
      <CardBody>
        <CardTitle href={href}>Phoenix Clinic Hospital</CardTitle>
        <div>Rochester, MN 55905, US</div>
        <CardActions>
          <button type="button">Options</button>
        </CardActions>
      </CardBody>
    </Card>
  );
}

describe('Card — structure', () => {
  it('is a div unless told, and keeps a className beside its own', () => {
    const { container } = render(<Card className="mine">Words</Card>);
    expect(container.firstElementChild!.tagName).toBe('DIV');
    expect(container.firstElementChild).toHaveClass(styles.card!, 'mine');
  });

  it.each(cardElements)('can be a %s', (as) => {
    const { container } = render(<Card as={as}>Words</Card>);
    expect(container.querySelector(as)).toHaveClass(styles.card!);
  });

  it('gives each part its class', () => {
    const { container } = render(<Location />);
    for (const part of ['media', 'body', 'title', 'actions'] as const) {
      expect(container.querySelector(`.${styles[part]}`), part).not.toBeNull();
    }
  });

  it('hands the picture its ratio as a custom property, 16 / 9 unless told', () => {
    const { container, rerender } = render(<CardMedia>x</CardMedia>);
    const media = () => container.firstElementChild as HTMLElement;
    expect(media().style.getPropertyValue('--card-media-ratio')).toBe('16 / 9');
    rerender(<CardMedia ratio="1 / 1">x</CardMedia>);
    expect(media().style.getPropertyValue('--card-media-ratio')).toBe('1 / 1');
  });
});

describe('Card — the title', () => {
  it('is an h3 unless told', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toHaveClass(styles.title!);
  });

  it.each(cardTitleElements)('can be a %s', (as) => {
    const { container } = render(<CardTitle as={as}>Title</CardTitle>);
    expect(container.querySelector(as)).toHaveClass(styles.title!);
  });

  it('is not a link without an href, so the card does not answer the pointer', () => {
    render(<Location />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('is the card’s link, named by the title alone', () => {
    render(<Location href="/locations/phoenix" />);
    const link = screen.getByRole('link', { name: 'Phoenix Clinic Hospital' });
    expect(link).toHaveAttribute('href', '/locations/phoenix');
    expect(link).toHaveClass(styles.link!);
    expect(link.parentElement!.tagName).toBe('H3');
  });

  it('passes anchor props to the link, and none to a plain title', () => {
    const { rerender, container } = render(
      <CardTitle href="https://example.com" target="_blank" rel="noreferrer">
        Title
      </CardTitle>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noreferrer');
    rerender(<CardTitle target="_blank">Title</CardTitle>);
    expect(container.querySelector('[target]')).toBeNull();
  });

  it('puts an id on the title’s element, linked or not', () => {
    const { rerender } = render(<CardTitle id="staff">Staff</CardTitle>);
    expect(screen.getByRole('heading')).toHaveAttribute('id', 'staff');
    rerender(
      <CardTitle id="staff" href="/staff">
        Staff
      </CardTitle>,
    );
    expect(screen.getByRole('heading')).toHaveAttribute('id', 'staff');
    expect(screen.getByRole('link')).not.toHaveAttribute('id');
  });

  it('hands a router’s link the href, the class that stretches it and the words', () => {
    render(
      <Card>
        <CardTitle href="/routed" render={({ children, ...props }) => <a data-router="yes" {...props}>{children}</a>}>
          Routed
        </CardTitle>
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Routed' });
    expect(link).toHaveAttribute('data-router', 'yes');
    expect(link).toHaveAttribute('href', '/routed');
    expect(link).toHaveClass(styles.link!);
  });

  it('keeps a control beside the link, never inside it', () => {
    render(<Location href="/locations/phoenix" />);
    expect(screen.getByRole('button', { name: 'Options' }).closest('a')).toBeNull();
  });
});

describe('Card — stylesheet', () => {
  it('is the sunken fill, edged only where forced colours take the fill away', () => {
    const card = block(css, '.card {');
    expect(card).toContain('background-color: var(--ap-color-surface-sunken)');
    expect(css.match(/border(-\w+)?:\s[^;]*solid[^;]*/g)).toEqual(['border: var(--ap-border-width-hairline) solid transparent']);
    expect(card).toContain('padding: calc(var(--ap-spacing-200) - var(--ap-border-width-hairline))');
    expect(card).toContain('isolation: isolate');
  });

  it('washes only a card whose title is a link, and the picture with it', () => {
    expect(css.match(/:hover/g)).toHaveLength(1);
    const hover = block(css, '.card:has(.link):not(:has(.card)):hover');
    expect(hover).toContain('--ap-color-interactive-wash-hover');
    expect(hover).toContain('--card-media-elevation: var(--ap-elevation-lg)');
    expect(block(css, '.media {')).toContain('var(--card-media-elevation, var(--ap-elevation-md))');
  });

  it('does not hand its hover down to a card inside it', () => {
    const card = block(css, '.card {');
    expect(card).toContain('--card-media-wash: initial');
    expect(card).toContain('--card-media-elevation: initial');
  });

  it('covers the picture with its own child, not with an image laid over it', () => {
    expect(css).toContain('.media > img,\n.media > video {');
    expect(css).not.toMatch(/\.media (img|video)/);
  });

  it('stretches the link over the card', () => {
    const after = block(css, '.link::after {');
    expect(after).toContain('position: absolute');
    expect(after).toContain('inset: 0');
  });

  it('moves the ring to the card only where :has() is understood', () => {
    expect(block(css, '.link:focus-visible')).toContain('var(--ap-color-border-focus)');
    const supported = block(css, '@supports selector(:has(*))');
    expect(supported).toContain('.link:focus-visible { outline: none; }');
    expect(supported).toContain('.card:has(.link:focus-visible)');
  });

  it('has one z-index, on the actions', () => {
    expect(css.match(/z-index/g)).toHaveLength(1);
    expect(block(css, '.actions {')).toContain('z-index: 1');
  });
});

describe('Card — axe', () => {
  it('has no violations, plain or linked, in a list', async () => {
    const { container } = render(
      <ul>
        <Card as="li">
          <CardBody>
            <CardTitle>Plain</CardTitle>
          </CardBody>
        </Card>
        <Card as="li">
          <CardMedia>
            <img src="clinic.jpg" alt="" />
          </CardMedia>
          <CardBody>
            <CardTitle href="/a">Linked</CardTitle>
            <CardActions>
              <button type="button">Options</button>
            </CardActions>
          </CardBody>
        </Card>
      </ul>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
