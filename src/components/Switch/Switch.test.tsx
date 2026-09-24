import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';
import styles from './Switch.module.css';
import { readCss, block } from '../../test/css';

describe('Switch', () => {
  it('announces itself as a switch, not a checkbox', () => {
    // The role is the whole point: a screen reader says "on" and "off" rather
    // than "checked" and "not checked", which is what a switch means.
    render(<Switch>Send reminders</Switch>);
    expect(screen.getByRole('switch', { name: 'Send reminders' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('is labelled by its own text, with no id needed', () => {
    render(<Switch>Send reminders</Switch>);
    expect(screen.getByRole('switch', { name: 'Send reminders' })).toBeInTheDocument();
  });

  it('toggles when the label text is clicked', async () => {
    render(<Switch>Send reminders</Switch>);
    await userEvent.click(screen.getByText('Send reminders'));
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('toggles with the space key', async () => {
    render(<Switch>Send reminders</Switch>);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('announces the description separately from its name', () => {
    render(<Switch description="They get an email the day before.">Send reminders</Switch>);
    const control = screen.getByRole('switch');
    expect(control).toHaveAccessibleName('Send reminders');
    expect(control).toHaveAccessibleDescription('They get an email the day before.');
  });

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn();
    render(<Switch disabled onChange={onChange}>Send reminders</Switch>);
    await userEvent.click(screen.getByText('Send reminders'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('works controlled', async () => {
    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <Switch checked={on} onChange={(e) => setOn(e.target.checked)}>
          Send reminders
        </Switch>
      );
    }
    render(<Controlled />);
    const control = screen.getByRole('switch');
    await userEvent.click(control);
    expect(control).toBeChecked();
    await userEvent.click(control);
    expect(control).not.toBeChecked();
  });

  it('forwards a ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch ref={ref}>Send reminders</Switch>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('participates in a form under its name', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      expect(new FormData(e.currentTarget).get('reminders')).toBe('on');
    });
    render(
      <form onSubmit={onSubmit}>
        <Switch name="reminders" defaultChecked>Send reminders</Switch>
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe('Switch — description indent (production chunk order)', () => {
  it('sets --choice-indent on its own root class instead of overriding margin-left, so choice.module.css cannot outrank it when chunk order differs in production', () => {
    // .description sits in choice.module.css, shared with Checkbox and
    // Radio. Overriding its margin-left from Switch.module.css at equal
    // specificity is decided by whichever stylesheet's chunk loads last —
    // which next dev and the production build do not agree on. Bridging
    // the value through a custom property set on an ancestor of
    // .description removes the conflict instead of winning it.
    const switchCss = readCss('src/components/Switch/Switch.module.css');
    expect(switchCss).not.toMatch(/\.description\s*\{/);
    expect(block(switchCss, '.root {')).toMatch(/--choice-indent:\s*40px/);

    const choiceCss = readCss('src/components/choice.module.css');
    expect(block(choiceCss, '.description {')).toMatch(
      /margin-left:\s*calc\(var\(--choice-indent,\s*20px\)\s*\+\s*var\(--ap-spacing-100\)\)/,
    );
  });

  it('puts --choice-indent on an actual ancestor of the description, not a sibling it could never reach', () => {
    render(<Switch description="They get an email the day before.">Send reminders</Switch>);
    const description = screen.getByText('They get an email the day before.');
    const root = description.closest(`.${styles.root}`);
    expect(root).not.toBeNull();
    expect(root).toContainElement(description);
  });
});
