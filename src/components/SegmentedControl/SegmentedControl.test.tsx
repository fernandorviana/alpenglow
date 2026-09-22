import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentedControl, type SegmentedOption } from './SegmentedControl';
import segmented from '../segmented.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const OPTIONS: readonly SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const radio = (name: string | RegExp) => screen.getByRole('radio', { name });

describe('SegmentedControl — a radio group', () => {
  it('is a radio group named by its label, one radio per option, all of one name', () => {
    render(<SegmentedControl label="Period" options={OPTIONS} />);
    const group = screen.getByRole('radiogroup', { name: 'Period' });
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios.map((r) => r.getAttribute('name'))).toEqual(Array(3).fill(radios[0]!.getAttribute('name')));
    expect(group.tagName).toBe('FIELDSET');
  });

  it('submits under the name the caller gives, with the option as the value', () => {
    render(<SegmentedControl label="Period" name="period" options={OPTIONS} defaultValue="week" />);
    expect(radio('Week')).toHaveAttribute('name', 'period');
    expect(radio('Week')).toHaveAttribute('value', 'week');
    expect(radio('Week')).toBeChecked();
    expect(radio('Day')).not.toBeChecked();
  });

  it('checks nothing for a value that names nothing, and nothing for a disabled option', () => {
    // A radio group may have no answer yet. Not the Tabs' fallback to the
    // first: a form must not answer for the reader.
    const options = [{ ...OPTIONS[0]!, disabled: true }, OPTIONS[1]!, OPTIONS[2]!];
    const { rerender } = render(<SegmentedControl label="Period" options={options} value="nowhere" />);
    expect(screen.queryByRole('radio', { checked: true })).toBeNull();
    rerender(<SegmentedControl label="Period" options={options} value="day" />);
    expect(screen.queryByRole('radio', { checked: true })).toBeNull();
    expect(radio('Day')).toBeDisabled();
  });

  it('chooses on a click and says so once', () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Period" options={OPTIONS} defaultValue="day" onChange={onChange} />);
    fireEvent.click(radio('Month'));
    expect(radio('Month')).toBeChecked();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('month');
  });

  it('says nothing when the option already chosen is chosen again', () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Period" options={OPTIONS} defaultValue="day" onChange={onChange} />);
    fireEvent.click(radio('Day'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows what the caller says when controlled, and only asks', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SegmentedControl label="Period" options={OPTIONS} value="day" onChange={onChange} />);
    fireEvent.click(radio('Week'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('week');
    expect(radio('Day')).toBeChecked();
    expect(radio('Week')).not.toBeChecked();
    rerender(<SegmentedControl label="Period" options={OPTIONS} value="week" onChange={onChange} />);
    expect(radio('Week')).toBeChecked();
  });

  it('disables the whole group through the fieldset', () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Period" options={OPTIONS} defaultValue="day" disabled onChange={onChange} />);
    for (const r of screen.getAllByRole('radio')) expect(r).toBeDisabled();
    expect(screen.getByRole('radiogroup')).toBeDisabled();
    fireEvent.click(radio('Week'));
    expect(onChange).not.toHaveBeenCalled();
    // The value is still shown: the thumb stays where it was.
    expect(radio('Day')).toBeChecked();
  });

  it('tells the thumb where to be, marks the chosen and the disabled segments, and draws no thumb with nothing chosen', () => {
    const { container, rerender } = render(
      <SegmentedControl
        label="Period"
        options={[...OPTIONS, { value: 'year', label: 'Year', disabled: true }]}
        defaultValue="month"
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveClass(segmented.track!);
    expect(group.style.getPropertyValue('--segmented-index')).toBe('2');
    expect(group.style.getPropertyValue('--segmented-count')).toBe('4');
    expect(container.querySelector(`.${segmented.thumb}`)).toHaveAttribute('aria-hidden', 'true');
    expect(radio('Month').closest('label')).toHaveClass(segmented.segment!, segmented.selected!);
    expect(radio('Day').closest('label')).not.toHaveClass(segmented.selected!);
    expect(radio('Year').closest('label')).toHaveClass(segmented.disabled!);
    rerender(<SegmentedControl label="Period" options={OPTIONS} value="nowhere" />);
    expect(container.querySelector(`.${segmented.thumb}`)).toBeNull();
  });

  it('fills its container when asked, and merges className on the root', () => {
    render(<SegmentedControl label="Period" options={OPTIONS} fullWidth className="mine" />);
    expect(screen.getByRole('radiogroup')).toHaveClass(segmented.fullWidth!, 'mine');
  });
});

describe('SegmentedControl — the shared stylesheet', () => {
  const css = readCss('src/components/segmented.module.css');

  it('sets the segment’s type from the track, two classes to the Tabs’ one', () => {
    // `.tab { font: inherit }` and `.segment { font-size }` are one class
    // each, and the bundler's order of the two stylesheets decided which won:
    // in Chromium the segmented tab measured 14/22 instead of 12/16.
    const segment = block(css, '.track > .segment {');
    expect(segment).toContain('--ap-text-caption-md-size');
    expect(segment).toContain('--ap-text-caption-md-line-height');
    expect(css).not.toMatch(/\n\.segment[\s.:[{]/);
  });

  it('draws the ring for a radio focused off screen inside the segment', () => {
    expect(block(css, '.segment:has(:focus-visible)')).toContain('--ap-color-border-focus');
  });

  it('washes a segment that is neither chosen nor disabled, and only that one', () => {
    expect(block(css, '.segment:hover:not(.disabled, .selected) > .ghost')).toContain(
      '--ap-color-interactive-wash-hover',
    );
    expect(block(css, '.segment:active:not(.disabled, .selected) > .ghost')).toContain(
      '--ap-color-interactive-wash-pressed',
    );
  });

  it('keeps the track a well with a hairline, the Tabs’ decision of 2026-09-18', () => {
    const track = block(css, '\n.track {');
    expect(track).toContain('--ap-color-surface-sunken');
    expect(track).toContain('--ap-color-border-subtle');
  });

  it('never reaches a part through a descendant selector', () => {
    // `.track .segment` would also match the segments of a segmented Tabs
    // nested in a panel of another; the Tabs' own test refuses the shape.
    expect(css).not.toMatch(
      /\.(?:track|segment|ghost|thumb|selected|disabled|fullWidth)\s+\.(?:track|segment|ghost|thumb)\b/,
    );
  });
});

describe('SegmentedControl — axe', () => {
  it('has no violations, chosen, unchosen and disabled', async () => {
    const { container } = render(
      <div>
        <SegmentedControl label="Period" options={OPTIONS} defaultValue="week" />
        <SegmentedControl label="View" options={OPTIONS} />
        <SegmentedControl label="Off" options={OPTIONS} defaultValue="day" disabled />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
