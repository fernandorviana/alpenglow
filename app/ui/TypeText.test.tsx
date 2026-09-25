import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypeText } from './TypeText';

/** The text, with each `<wbr>` as `|`. */
function breaks(el: Element) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let out = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) out += node.nodeValue;
    else if ((node as Element).tagName === 'WBR') out += '|';
  }
  return out;
}

/**
 * One helper for every name the site sets in a narrow column: a Props
 * table's types, an import path, a token's name. Each is offered a line
 * break only where both sides are still words, and keeps every character.
 */
describe('TypeText', () => {
  it('offers a type a break at each hump, after a dot and after a slash, and keeps every character', () => {
    const { container } = render(<TypeText>{'(props: DropdownMenuTriggerProps) => ReactNode; ISODate, a.b/c'}</TypeText>);
    expect(container.textContent).toBe('(props: DropdownMenuTriggerProps) => ReactNode; ISODate, a.b/c');
    expect(breaks(container)).toBe('(props: Dropdown|Menu|Trigger|Props) => React|Node; ISO|Date, a.|b/|c');
  });

  it('makes each type word with a break a block of its own, which moves to the next line whole', () => {
    const { container } = render(<TypeText>{'RefObject<HTMLElement> | null'}</TypeText>);
    const words = [...container.querySelectorAll('.typeName')];
    expect(words.map((w) => w.textContent)).toEqual(['RefObject<HTMLElement>']);
    for (const wbr of container.querySelectorAll('wbr')) expect(wbr.parentElement).toHaveClass('typeName');
  });

  it('sets a path inline, with its breaks, so the code pill around it wraps with it', () => {
    const { container } = render(
      <code>
        <TypeText kind="path">alpenglow/tailwind-theme.css</TypeText>
      </code>,
    );
    expect(container.textContent).toBe('alpenglow/tailwind-theme.css');
    expect(container.querySelector('.typeName')).toBeNull();
    expect(breaks(container)).toBe('alpenglow/|tailwind-theme.|css');
  });

  it('keeps each part of a token’s name to one line, so it breaks after its slash and never at a hyphen', () => {
    const { container } = render(<TypeText kind="token">interactive/on-accent</TypeText>);
    expect(container.textContent).toBe('interactive/on-accent');
    expect(container.querySelector('.typeName')).toBeNull();
    expect([...container.querySelectorAll('.unbroken')].map((part) => part.textContent)).toEqual(['interactive/', 'on-accent']);
    expect(container.querySelectorAll('wbr')).toHaveLength(1);
  });

  it('leaves a word with no break as bare text', () => {
    const { container } = render(<TypeText>{"'md' | 'lg'"}</TypeText>);
    expect(container.innerHTML).toBe("'md' | 'lg'");
  });
});
