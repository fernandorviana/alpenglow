import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axeViolations } from './axe';

/**
 * Every axe assertion in the suite expects an empty list, and a helper that
 * ran no rules — a misspelt tag selects none — would pass all of them for
 * ever. These give it violations it must report.
 */
describe('axeViolations', () => {
  it('reports a button with no accessible name', async () => {
    const { container } = render(
      <button type="button">
        <svg aria-hidden="true" />
      </button>,
    );
    expect(await axeViolations(container)).toEqual([expect.stringMatching(/^button-name:/)]);
  });

  it('reports a form control with no label', async () => {
    const { container } = render(<input type="text" />);
    expect(await axeViolations(container)).toEqual([expect.stringMatching(/^label:/)]);
  });

  it('reports ARIA the role does not allow', async () => {
    const { container } = render(<div role="checkbox" aria-selected="true" aria-label="Pick" tabIndex={0} />);
    expect((await axeViolations(container)).join('\n')).toMatch(/aria-(allowed-attr|required-attr)/);
  });

  it('passes a named control', async () => {
    const { container } = render(<button type="button">Save</button>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
