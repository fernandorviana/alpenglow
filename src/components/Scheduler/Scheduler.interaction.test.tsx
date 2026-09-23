import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Scheduler, type SchedulerEvent } from './Scheduler';
import styles from './Scheduler.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

/**
 * jsdom lays nothing out, so the events layers are given rects: hours 9 to
 * 18 are 540 minutes on a 540px layer, one pixel a minute, starting at
 * y=100; column n runs from x = 100 + 100n. A section's rect is its layer's.
 */
const LAYER_TOP = 100;
const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const section = this.closest<HTMLElement>('section[data-column]');
    if (section && (this.classList.contains(styles.events!) || this === section)) {
      const column = Number(section.dataset.column);
      return rect(100 + column * 100, LAYER_TOP, 100, 540);
    }
    if (this.getAttribute('role') === 'region') return rect(0, 0, 1000, 800);
    return rect(0, 0, 0, 0);
  });
});
afterEach(() => vi.restoreAllMocks());

const ev = (id: string, start: string, end: string, more: Partial<SchedulerEvent> = {}): SchedulerEvent => ({
  id,
  title: `Event ${id}`,
  start,
  end,
  ...more,
});

const sections = () => document.querySelectorAll<HTMLElement>('section[data-column]');
const at = (column: number, minute: number) => ({ clientX: 150 + column * 100, clientY: LAYER_TOP + minute, button: 0, pointerId: 1 });
const ghost = () => document.querySelector<HTMLElement>(`.${styles.draft}`);
const status = () => screen.getByRole('status').textContent!.replace(/\s/g, ' ');

const HOURS = { start: 9, end: 18 };

describe('Scheduler — creating with the pointer', () => {
  it('proposes the default duration on a press, snapped to the step, in the right column', () => {
    const onCreate = vi.fn();
    render(<Scheduler label="Agenda" date="2023-04-20" weekStartsOn={1} days={5} hours={HOURS} events={[]} now={null} onCreate={onCreate} />);
    const wednesday = sections()[2]!;
    expect(wednesday).toHaveClass(styles.creatable!);
    fireEvent.pointerDown(wednesday, at(2, 127));
    fireEvent.pointerUp(wednesday, at(2, 127));
    expect(onCreate).toHaveBeenCalledWith({ start: '2023-04-19T11:00', end: '2023-04-19T11:30' });
    expect(ghost(), 'no ghost after the press').toBeNull();
    expect(status()).toBe('11:00 – 11:30 AM, Wednesday, April 19');
  });

  it('proposes the dragged span, either way, drawing the ghost while the pointer moves', () => {
    const onCreate = vi.fn();
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={HOURS}
        events={[]}
        now={null}
        onCreate={onCreate}
        resources={[{ id: 'a', name: 'Ana', tone: 'moss' }]}
      />,
    );
    const column = sections()[0]!;
    fireEvent.pointerDown(column, at(0, 240));
    fireEvent.pointerMove(column, at(0, 241));
    expect(ghost(), 'under the slop, no drag yet').toBeNull();
    fireEvent.pointerMove(column, at(0, 300));
    const g = ghost()!;
    expect(g.style.getPropertyValue('--event-from')).toBe('240');
    expect(g.style.getPropertyValue('--event-to')).toBe('300');
    expect(g).toHaveClass(styles.moss!, styles.confirmed!);
    expect(g.textContent!.replace(/\s/g, ' ')).toBe('(No title)1:00 – 2:00 PM');
    fireEvent.pointerMove(column, at(0, 180));
    fireEvent.pointerUp(column, at(0, 180));
    expect(onCreate).toHaveBeenCalledWith({ start: '2023-04-20T12:00', end: '2023-04-20T13:00', resourceId: 'a' });
    expect(ghost()).toBeNull();
  });

  it('does nothing without onCreate, taps on touch, and lets go on Escape and on cancel', () => {
    const onCreate = vi.fn();
    const { rerender } = render(<Scheduler label="Agenda" view="day" date="2023-04-20" hours={HOURS} events={[]} now={null} />);
    const column = () => sections()[0]!;
    expect(column()).not.toHaveClass(styles.creatable!);
    fireEvent.pointerDown(column(), at(0, 60));
    fireEvent.pointerUp(column(), at(0, 60));
    expect(ghost()).toBeNull();

    rerender(<Scheduler label="Agenda" view="day" date="2023-04-20" hours={HOURS} events={[]} now={null} onCreate={onCreate} />);
    fireEvent.pointerDown(column(), { ...at(0, 60), pointerType: 'touch' });
    fireEvent.pointerMove(column(), { ...at(0, 200), pointerType: 'touch' });
    expect(ghost(), 'touch does not drag').toBeNull();
    fireEvent.pointerUp(column(), { ...at(0, 200), pointerType: 'touch' });
    expect(onCreate).toHaveBeenLastCalledWith({ start: '2023-04-20T10:00', end: '2023-04-20T10:30' });

    fireEvent.pointerDown(column(), at(0, 60));
    fireEvent.pointerMove(column(), at(0, 120));
    expect(ghost()).not.toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(ghost(), 'Escape lets go').toBeNull();
    fireEvent.pointerUp(column(), at(0, 120));
    expect(onCreate).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(column(), at(0, 60));
    fireEvent.pointerMove(column(), at(0, 120));
    fireEvent.pointerCancel(column(), at(0, 120));
    expect(ghost()).toBeNull();
  });

  it('draws the caller’s draft, pulsing, in its column and person', () => {
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={HOURS}
        events={[]}
        now={null}
        resources={[
          { id: 'a', name: 'Ana' },
          { id: 'b', name: 'Bo' },
        ]}
        draft={{ start: '2023-04-20T14:00', end: '2023-04-20T15:00', resourceId: 'b', title: 'Justin Anderson' }}
        createKind="availability"
      />,
    );
    const g = ghost()!;
    expect(sections()[1]!.contains(g)).toBe(true);
    expect(g).toHaveClass(styles.pulse!, styles.availability!);
    expect(g.style.getPropertyValue('--event-from')).toBe('300');
    expect(g.textContent).toContain('Justin Anderson');
  });
});

describe('Scheduler — moving and resizing with the pointer', () => {
  const events = [ev('a', '2023-04-20T11:00', '2023-04-20T12:00'), ev('b', '2023-04-20T14:00', '2023-04-20T14:30')];

  it('moves a card by the pointer less its grip, across columns, and a press is still a click', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const onSelect = vi.fn();
    render(
      <Scheduler label="Agenda" date="2023-04-20" weekStartsOn={1} days={5} hours={HOURS} events={events} now={null} onMove={onMove} onSelect={onSelect} />,
    );
    const thursday = sections()[3]!;
    const a = screen.getByRole('button', { name: /^Event a,/ });
    expect(a).toHaveClass(styles.movable!);
    // Held 10 minutes into the card, dropped so that 11:10 lands at 15:40 on Friday: the card starts 15:30.
    fireEvent.pointerDown(a, at(3, 130));
    fireEvent.pointerMove(thursday, at(4, 400));
    expect(a.closest('li')).toHaveClass(styles.dragging!);
    expect(sections()[4]!.contains(ghost()!)).toBe(true);
    fireEvent.pointerUp(thursday, at(4, 400));
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-21T15:30', end: '2023-04-21T16:30' });
    expect(ghost()).toBeNull();

    await user.click(screen.getByRole('button', { name: /^Event b,/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('resizes from the handle of the selected card, never under a step, only with onResize', () => {
    const onResize = vi.fn();
    const { rerender } = render(
      <Scheduler label="Agenda" view="day" date="2023-04-20" hours={HOURS} events={events} now={null} selectedId="a" />,
    );
    expect(document.querySelector(`.${styles.handle}`)).toBeNull();
    rerender(<Scheduler label="Agenda" view="day" date="2023-04-20" hours={HOURS} events={events} now={null} selectedId="a" onResize={onResize} />);
    const handles = document.querySelectorAll(`.${styles.handle}`);
    expect(handles, 'on the selected card only').toHaveLength(1);
    const column = sections()[0]!;
    fireEvent.pointerDown(handles[0]!, at(0, 180));
    fireEvent.pointerMove(column, at(0, 247));
    expect(ghost()!.style.getPropertyValue('--event-to'), 'snapped to the quarter').toBe('240');
    fireEvent.pointerMove(column, at(0, 100));
    fireEvent.pointerUp(column, at(0, 100));
    expect(onResize).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-20T11:00', end: '2023-04-20T11:15' });
  });

  it('puts the × on availability cards with onRemove', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={HOURS}
        events={[ev('free', '2023-04-20T15:00', '2023-04-20T16:00', { kind: 'availability', title: 'Free' }), events[0]!]}
        now={null}
        onRemove={onRemove}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Remove Event a' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Remove Free' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'free' }));
  });
});

describe('Scheduler — the keyboard on the hot event', () => {
  const events = [ev('a', '2023-04-20T11:00', '2023-04-20T12:00'), ev('b', '2023-04-20T14:00', '2023-04-20T14:30')];
  const setup = (extra: Record<string, unknown> = {}) => {
    const onMove = vi.fn();
    const onResize = vi.fn();
    const onCreate = vi.fn();
    const onRemove = vi.fn();
    render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        weekStartsOn={1}
        days={5}
        hours={HOURS}
        events={events}
        now={null}
        onMove={onMove}
        onResize={onResize}
        onCreate={onCreate}
        onRemove={onRemove}
        {...extra}
      />,
    );
    return { onMove, onResize, onCreate, onRemove };
  };

  it('moves and resizes the focused event with Shift and the arrows, by a step or a column', async () => {
    const user = userEvent.setup();
    const { onMove, onResize } = setup();
    const a = screen.getByRole('button', { name: /^Event a,/ });
    a.focus();
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-20T11:15', end: '2023-04-20T12:15' });
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-20T10:45', end: '2023-04-20T11:45' });
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-21T11:00', end: '2023-04-21T12:00' });
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-19T11:00', end: '2023-04-19T12:00' });
    await user.keyboard('{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
    expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), { start: '2023-04-20T11:00', end: '2023-04-20T12:15' });
    expect(status()).toBe('11:00 AM – 12:15 PM, Thursday, April 20');
  });

  it('acts on the hovered event rather than the focused one', async () => {
    const user = userEvent.setup();
    const { onMove } = setup();
    screen.getByRole('button', { name: /^Event a,/ }).focus();
    fireEvent.pointerEnter(screen.getByRole('button', { name: /^Event b,/ }));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'b' }), { start: '2023-04-20T14:15', end: '2023-04-20T14:45' });
    fireEvent.pointerLeave(screen.getByRole('button', { name: /^Event b,/ }));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), expect.anything());
  });

  it('pastes a copy from another day at its own length, and a stale hover gives way to the focus', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        weekStartsOn={1}
        days={5}
        hours={HOURS}
        events={[ev('mon', '2023-04-17T09:00', '2023-04-17T11:00'), ev('thu', '2023-04-20T14:00', '2023-04-20T14:30')]}
        now={null}
        onCreate={onCreate}
        onRemove={onRemove}
      />,
    );
    screen.getByRole('button', { name: /^Event mon,/ }).focus();
    await user.keyboard('{Control>}c{/Control}');
    const thu = screen.getByRole('button', { name: /^Event thu,/ });
    thu.focus();
    await user.keyboard('{Control>}v{/Control}');
    expect(onCreate).toHaveBeenLastCalledWith(expect.objectContaining({ start: '2023-04-20T14:30', end: '2023-04-20T16:30' }));

    fireEvent.pointerEnter(thu);
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'thu' }));
    rerender(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        weekStartsOn={1}
        days={5}
        hours={HOURS}
        events={[ev('mon', '2023-04-17T09:00', '2023-04-17T11:00')]}
        now={null}
        onCreate={onCreate}
        onRemove={onRemove}
      />,
    );
    screen.getByRole('button', { name: /^Event mon,/ }).focus();
    await user.keyboard('{Delete}');
    expect(onRemove, 'the removed event under the pointer no longer takes the key').toHaveBeenLastCalledWith(expect.objectContaining({ id: 'mon' }));
  });

  it('copies, pastes after the hot event, duplicates, and removes', async () => {
    const user = userEvent.setup();
    const { onCreate, onRemove } = setup();
    const a = screen.getByRole('button', { name: /^Event a,/ });
    const b = screen.getByRole('button', { name: /^Event b,/ });
    a.focus();
    await user.keyboard('{Control>}c{/Control}');
    expect(status()).toBe('Event a copied');
    b.focus();
    await user.keyboard('{Control>}v{/Control}');
    expect(onCreate).toHaveBeenLastCalledWith({
      start: '2023-04-20T14:30',
      end: '2023-04-20T15:30',
      title: 'Event a',
      from: expect.objectContaining({ id: 'a' }),
    });
    await user.keyboard('{Meta>}d{/Meta}');
    expect(onCreate).toHaveBeenLastCalledWith({
      start: '2023-04-20T14:30',
      end: '2023-04-20T15:00',
      title: 'Event b',
      from: expect.objectContaining({ id: 'b' }),
    });
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('does nothing without the callbacks', async () => {
    const user = userEvent.setup();
    render(<Scheduler label="Agenda" date="2023-04-20" hours={HOURS} events={events} now={null} />);
    screen.getByRole('button', { name: /^Event a,/ }).focus();
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}{Delete}{Control>}d{/Control}');
    expect(document.querySelector(`.${styles.movable}`)).toBeNull();
    expect(screen.getByRole('button', { name: /^Event a,/ })).toHaveFocus();
  });
});

describe('Scheduler — the cursor', () => {
  it('is placed by Enter on the region, moved and stretched by the arrows, and proposed by Enter', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        weekStartsOn={1}
        days={5}
        hours={HOURS}
        events={[]}
        now="2023-04-20T11:16"
        onCreate={onCreate}
      />,
    );
    const region = screen.getByRole('region', { name: 'Agenda' });
    region.focus();
    await user.keyboard('{Enter}');
    const g = ghost()!;
    expect(sections()[3]!.contains(g), "today's column").toBe(true);
    expect(g).toHaveClass(styles.pulse!);
    expect([g.style.getPropertyValue('--event-from'), g.style.getPropertyValue('--event-to')]).toEqual(['0', '30']);
    expect(status()).toBe('9:00 – 9:30 AM, Thursday, April 20');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(ghost()!.style.getPropertyValue('--event-from')).toBe('30');
    expect(status(), 'the status follows the cursor').toBe('9:30 – 10:00 AM, Thursday, April 20');
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(ghost()!.style.getPropertyValue('--event-to')).toBe('75');
    await user.keyboard('{ArrowRight}');
    expect(sections()[4]!.contains(ghost()!)).toBe(true);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(sections()[2]!.contains(ghost()!)).toBe(true);
    await user.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledWith({ start: '2023-04-19T09:30', end: '2023-04-19T10:15' });
    expect(ghost()).toBeNull();

    await user.keyboard('{Enter}');
    expect(ghost()).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(ghost()).toBeNull();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('pastes at the cursor when there is one', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={HOURS}
        events={[ev('a', '2023-04-20T11:00', '2023-04-20T12:00')]}
        now={null}
        onCreate={onCreate}
      />,
    );
    const a = screen.getByRole('button', { name: /^Event a,/ });
    a.focus();
    await user.keyboard('{Control>}c{/Control}');
    const region = screen.getByRole('region', { name: 'Agenda' });
    region.focus();
    await user.keyboard('{Enter}{ArrowDown}');
    fireEvent.pointerEnter(a);
    await user.keyboard('{Control>}v{/Control}');
    expect(onCreate).toHaveBeenCalledWith({
      start: '2023-04-20T09:15',
      end: '2023-04-20T10:15',
      title: 'Event a',
      from: expect.objectContaining({ id: 'a' }),
    });
  });
});

describe('Scheduler — the stylesheet and axe, with the gestures', () => {
  const css = readCss('src/components/Scheduler/Scheduler.module.css');

  it('pulses the draft at the Skeleton’s pace and not under reduced motion; places from the events layer', () => {
    expect(block(css, '\n.pulse {')).toContain('animation: pulse 1.8s');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.pulse\s*\{\s*animation: none/);
    expect(block(css, '\n.events {')).toContain('inset-block: var(--scheduler-pad)');
    expect(block(css, '\n.slot {')).not.toContain('--scheduler-pad');
    expect(block(css, '\n.draft {')).toContain('dashed var(--event-fill)');
    expect(block(css, '\n.handle {')).toContain('var(--ap-color-border-strong)');
  });

  it('has no axe violations with a draft, a handle and a removable card', async () => {
    const { container } = render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={HOURS}
        events={[ev('a', '2023-04-20T11:00', '2023-04-20T12:00'), ev('f', '2023-04-20T15:00', '2023-04-20T16:00', { kind: 'availability' })]}
        now={null}
        selectedId="a"
        draft={{ start: '2023-04-20T13:00', end: '2023-04-20T13:30' }}
        onCreate={() => {}}
        onMove={() => {}}
        onResize={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
