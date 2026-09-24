import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from './Slider';
import styles from './Slider.module.css';
import { installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const slider = (name: string | RegExp) => screen.getByRole('slider', { name });
const set = (element: HTMLElement, value: number) => fireEvent.change(element, { target: { value: String(value) } });

describe('Slider — one value', () => {
  it('is a range input named by the visible label, with the unit beside it', () => {
    render(<Slider label="Percentage" unit="%" defaultValue={40} />);
    const input = slider('Percentage (%)');
    expect(input).toHaveAttribute('type', 'range');
    expect(input).toHaveValue('40');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '1');
  });

  it('keeps the name when the label is hidden', () => {
    render(<Slider label="Volume" hideLabel defaultValue={3} />);
    expect(slider('Volume')).toBeInTheDocument();
  });

  it('paints the fill by the value’s share of the range', () => {
    const { container } = render(<Slider label="Rating" min={0} max={10} defaultValue={5} />);
    const track = container.querySelector<HTMLElement>(`.${styles.track}`)!;
    expect(track.style.getPropertyValue('--slider-from')).toBe('0%');
    expect(track.style.getPropertyValue('--slider-to')).toBe('50%');
  });

  it('says the value once when it changes, and not for the same value', () => {
    const onChange = vi.fn();
    render(<Slider label="Rating" defaultValue={5} onChange={onChange} />);
    set(slider('Rating'), 7);
    expect(slider('Rating')).toHaveValue('7');
    expect(onChange).toHaveBeenCalledExactlyOnceWith(7);
    set(slider('Rating'), 7);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('shows what the caller says when controlled, and only asks', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Slider label="Rating" value={2} onChange={onChange} />);
    set(slider('Rating'), 9);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(9);
    expect(slider('Rating')).toHaveValue('2');
    rerender(<Slider label="Rating" value={9} onChange={onChange} />);
    expect(slider('Rating')).toHaveValue('9');
  });

  it('holds a value inside the range', () => {
    render(<Slider label="Rating" min={0} max={10} value={14} />);
    expect(slider('Rating')).toHaveValue('10');
  });

  it('shows the balloon with formatValue, and tells a reader the same words', () => {
    const { container } = render(
      <Slider label="Brightness" defaultValue={80} showValue formatValue={(v) => `${v}%`} />,
    );
    const balloon = container.querySelector<HTMLElement>(`.${styles.balloon}`)!;
    expect(balloon).toHaveTextContent('80%');
    expect(balloon).toHaveAttribute('aria-hidden', 'true');
    expect(balloon.style.getPropertyValue('--slider-at')).toBe('80%');
    expect(slider('Brightness')).toHaveAttribute('aria-valuetext', '80%');
  });

  it('draws a mark at every step, and none for a range too fine to mark or a step that does not divide it', () => {
    const { container, rerender } = render(<Slider label="Rating" min={0} max={10} ticks />);
    expect(container.querySelectorAll(`.${styles.tick}`)).toHaveLength(11);
    rerender(<Slider label="Fine" min={0} max={1000} ticks />);
    expect(container.querySelectorAll(`.${styles.tick}`)).toHaveLength(0);
    // Marks are spread evenly, and a step of 3 over 10 has no even spread.
    rerender(<Slider label="Odd" min={0} max={10} step={3} ticks />);
    expect(container.querySelectorAll(`.${styles.tick}`)).toHaveLength(0);
  });

  it('holds a value to the step grid, as the input does', () => {
    const onChange = vi.fn();
    render(<Slider label="Rating" min={0} max={10} step={0.5} showInput onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Rating value' }), { target: { value: '7.3' } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(7.5);
    expect(slider('Rating')).toHaveValue('7.5');
    fireEvent.change(slider('Rating'), { target: { value: '2.1' } });
    // 0.1 × 21 is 2.1, not 2.1000000000000001.
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('describes the input by the caption and puts the ends beside the track', () => {
    render(<Slider label="Brightness" caption="How bright the screen is." start="0%" end="100%" defaultValue={1} />);
    expect(slider('Brightness')).toHaveAccessibleDescription('How bright the screen is.');
    expect(screen.getByText('0%')).toHaveClass(styles.edge!);
    expect(screen.getByText('100%')).toHaveClass(styles.edge!);
  });

  it('puts the explanation behind an info button', () => {
    render(<Slider label="Percentage" info="Share of the total." />);
    expect(screen.getByRole('button', { name: 'Share of the total.' })).toBeInTheDocument();
  });

  it('is disabled as a whole', () => {
    render(<Slider label="Rating" disabled showInput info="Why" />);
    expect(slider('Rating')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Rating value' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Why' })).toBeDisabled();
  });

  it('submits under its name and merges className on the root', () => {
    const { container } = render(<Slider label="Rating" name="rating" className="mine" />);
    expect(slider('Rating')).toHaveAttribute('name', 'rating');
    expect(container.firstElementChild).toHaveClass(styles.slider!, 'mine');
  });
});

describe('Slider — the field', () => {
  it('moves the slider as a value inside the range is typed', () => {
    const onChange = vi.fn();
    render(<Slider label="Percentage" unit="%" defaultValue={40} showInput onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Percentage value' });
    expect(field).toHaveValue('40');
    fireEvent.change(field, { target: { value: '75' } });
    expect(slider('Percentage (%)')).toHaveValue('75');
    expect(onChange).toHaveBeenCalledExactlyOnceWith(75);
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('keeps a value outside the range in the field, marks it and says the bound, and the slider stays', () => {
    const onChange = vi.fn();
    render(<Slider label="Percentage" defaultValue={40} showInput formatValue={(v) => `${v}%`} onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Percentage value' });
    fireEvent.change(field, { target: { value: '101' } });
    expect(field).toHaveValue('101');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription("Value can't be more than 100%");
    expect(slider('Percentage')).toHaveValue('40');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: '-1' } });
    expect(field).toHaveAccessibleDescription("Value can't be less than 0%");
    fireEvent.change(field, { target: { value: 'abc' } });
    expect(field).toHaveAccessibleDescription('Enter a number between 0% and 100%');
  });

  it('shows the value again after leaving a field that is right', () => {
    render(<Slider label="Percentage" defaultValue={40} showInput />);
    const field = screen.getByRole('textbox', { name: 'Percentage value' });
    fireEvent.change(field, { target: { value: '7.' } });
    expect(field).toHaveValue('7.');
    fireEvent.blur(field);
    expect(field).toHaveValue('7');
    fireEvent.change(field, { target: { value: '200' } });
    fireEvent.blur(field);
    expect(field).toHaveValue('200');
  });
});

describe('Slider — a range', () => {
  it('is two inputs named by the label and Minimum or Maximum, submitted as name-min and name-max', () => {
    render(<Slider label="Price" range name="price" defaultValue={[20, 80]} />);
    expect(slider('Price Minimum')).toHaveValue('20');
    expect(slider('Price Maximum')).toHaveValue('80');
    expect(slider('Price Minimum')).toHaveAttribute('name', 'price-min');
    expect(slider('Price Maximum')).toHaveAttribute('name', 'price-max');
  });

  it('paints the fill between the two, and a balloon over each', () => {
    const { container } = render(<Slider label="Price" range defaultValue={[20, 80]} showValue />);
    const track = container.querySelector<HTMLElement>(`.${styles.track}`)!;
    expect(track.style.getPropertyValue('--slider-from')).toBe('20%');
    expect(track.style.getPropertyValue('--slider-to')).toBe('80%');
    expect(container.querySelectorAll(`.${styles.balloon}`)).toHaveLength(2);
  });

  it('says the pair, and never lets the two cross', () => {
    const onChange = vi.fn();
    render(<Slider label="Price" range defaultValue={[20, 80]} onChange={onChange} />);
    set(slider('Price Minimum'), 90);
    expect(onChange).toHaveBeenLastCalledWith([80, 80]);
    set(slider('Price Maximum'), 10);
    expect(onChange).toHaveBeenLastCalledWith([80, 80]);
    set(slider('Price Maximum'), 95);
    expect(onChange).toHaveBeenLastCalledWith([80, 95]);
  });

  it('names the two fields, and holds the low field under the high value', () => {
    render(<Slider label="Price" range defaultValue={[20, 80]} showInput />);
    const low = screen.getByRole('textbox', { name: 'Price minimum' });
    const high = screen.getByRole('textbox', { name: 'Price maximum' });
    expect(low).toHaveValue('20');
    expect(high).toHaveValue('80');
    fireEvent.change(low, { target: { value: '85' } });
    expect(low).toHaveAccessibleDescription("Value can't be more than 80");
    expect(slider('Price Minimum')).toHaveValue('20');
    fireEvent.change(high, { target: { value: '90' } });
    expect(slider('Price Maximum')).toHaveValue('90');
    // The refused 85 fits under 90 now, and is applied with the move: the
    // field would otherwise show 85 with no error over a slider at 20.
    expect(slider('Price Minimum')).toHaveValue('85');
    expect(low).not.toHaveAttribute('aria-invalid');
    // Both wrong: each field is told its own bound.
    fireEvent.change(low, { target: { value: '95' } });
    fireEvent.change(high, { target: { value: '5' } });
    expect(high).toHaveAccessibleDescription("Value can't be less than 85");
    expect(low).toHaveAccessibleDescription("Value can't be more than 90");
  });

  it('moves the nearer thumb to a press on the line, and keeps the one that can move on top', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<Slider label="Price" range defaultValue={[20, 80]} onChange={onChange} />);
    const track = container.querySelector<HTMLElement>(`.${styles.track}`)!;
    const line = container.querySelector<HTMLElement>(`.${styles.line}`)!;
    // The line is the thumb's travel: 200 wide from 8, so 30% is at 68.
    line.getBoundingClientRect = () =>
      ({ left: 8, right: 208, width: 200, top: 10, bottom: 14, height: 4, x: 8, y: 10, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(track, { clientX: 68, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith([30, 80]);
    fireEvent.pointerDown(track, { clientX: 8 + 200 * 0.9, button: 0 });
    expect(onChange).toHaveBeenLastCalledWith([30, 90]);
    // A press on an input itself is the input's own.
    fireEvent.pointerDown(slider('Price Minimum'), { clientX: 68, button: 0 });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(slider('Price Maximum')).toHaveClass(styles.top!);
    rerender(<Slider label="Price" range value={[100, 100]} />);
    expect(slider('Price Minimum')).toHaveClass(styles.top!);
  });
});

describe('Slider — stylesheet', () => {
  const css = readCss('src/components/Slider/Slider.module.css');

  it('names each family’s thumb in a rule of its own', () => {
    // A rule that names a pseudo-element the browser does not know is
    // dropped whole, so no selector list mixes -webkit- and -moz-.
    for (const rule of css.matchAll(/([^{}]+)\{/g)) {
      const selector = rule[1]!;
      expect(selector.includes('-webkit-') && selector.includes('-moz-'), selector).toBe(false);
    }
    expect(block(css, '\n.input::-webkit-slider-thumb {')).toContain('--ap-color-interactive-accent');
    expect(block(css, '\n.input::-moz-range-thumb {')).toContain('--ap-color-interactive-accent');
  });

  it('gives a range’s thumbs the pointer and not their inputs', () => {
    expect(block(css, '.range .input {')).toMatch(/pointer-events:\s*none/);
    expect(block(css, '.range .input::-webkit-slider-thumb')).toMatch(/pointer-events:\s*auto/);
    expect(block(css, '.range .input::-moz-range-thumb')).toMatch(/pointer-events:\s*auto/);
  });

  it('keeps the input’s own track transparent and paints the line from border/strong', () => {
    expect(block(css, '.input::-webkit-slider-runnable-track')).toMatch(/background:\s*transparent/);
    expect(block(css, '.input::-moz-range-track')).toMatch(/background:\s*transparent/);
    expect(block(css, '\n.line {')).toContain('--ap-color-border-strong');
    expect(block(css, '\n.fill {')).toContain('--ap-color-interactive-accent');
  });

  it('insets the line by half a thumb, so the fill meets the thumb’s centre', () => {
    expect(block(css, '\n.line {')).toMatch(/inset-inline:\s*calc\(var\(--slider-thumb\) \/ 2\)/);
  });

  it('sets --control-width on .field instead of width, so control.module.css cannot outrank it when chunk order differs in production', () => {
    // Input's wrapper div carries both .control and .field on the same
    // element. Two rules declaring the literal `width` property there at
    // equal specificity would be decided by whichever stylesheet's chunk
    // loads last — which next dev and the production build do not agree
    // on. Bridging the value through a custom property that only .field
    // declares removes the conflict instead of winning it.
    const field = block(css, '.field {');
    expect(field).not.toMatch(/(?:^|[\s;])width\s*:/);
    expect(field).toMatch(/--control-width:\s*var\(--slider-field-width\)/);

    const controlCss = readCss('src/components/control.module.css');
    expect(block(controlCss, '.control {')).toMatch(/width:\s*var\(--control-width,\s*100%\)/);
  });
});

describe('Slider — axe', () => {
  it('has no violations, plain, full and as a range', async () => {
    const { container } = render(
      <div>
        <Slider label="Rating" defaultValue={5} />
        <Slider
          label="Percentage"
          unit="%"
          info="Share."
          caption="Of the total."
          start="0%"
          end="100%"
          showValue
          showInput
          defaultValue={40}
        />
        <Slider label="Price" range defaultValue={[20, 80]} showValue showInput />
        <Slider label="Quiet" hideLabel disabled />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
