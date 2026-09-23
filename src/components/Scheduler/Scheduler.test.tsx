import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Scheduler, type SchedulerEvent, type SchedulerResource } from './Scheduler';
import styles from './Scheduler.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

/** ICU puts a narrow no-break space before AM; the tests read plain spaces. */
const name = (el: HTMLElement) => (el.getAttribute('aria-label') ?? '').replace(/\s/g, ' ');

const ev = (id: string, start: string, end: string, more: Partial<SchedulerEvent> = {}): SchedulerEvent => ({
  id,
  title: `Event ${id}`,
  start,
  end,
  ...more,
});

const columns = () => screen.getAllByRole('region', { name: 'Agenda' })[0]!.querySelectorAll('section');
const slotOf = (id: string) => screen.getByRole('button', { name: new RegExp(`^Event ${id},`) }).closest('li')!;

describe('Scheduler — the columns', () => {
  it('draws a week of seven from any day in it, headed by the day, with today marked', () => {
    render(<Scheduler label="Agenda" date="2023-04-20" events={[]} now="2023-04-20T11:16" />);
    const sections = columns();
    expect(sections).toHaveLength(7);
    expect(sections[0]).toHaveAccessibleName('Sunday, April 16');
    expect(sections[6]).toHaveAccessibleName('Saturday, April 22');
    const heads = document.querySelectorAll(`.${styles.colHead}`);
    expect(heads[4]).toHaveClass(styles.today!);
    expect(heads[3]).not.toHaveClass(styles.today!);
    expect(heads[4]!.querySelector(`.${styles.weekday}`)!.textContent).toBe('Thu');
    expect(heads[4]!.querySelector(`.${styles.day}`)!.textContent).toBe('20');
  });

  it('draws a working week of five from Monday', () => {
    render(<Scheduler label="Agenda" date="2023-04-20" weekStartsOn={1} days={5} events={[]} now={null} />);
    const sections = columns();
    expect(sections).toHaveLength(5);
    expect(sections[0]).toHaveAccessibleName('Monday, April 17');
    expect(sections[4]).toHaveAccessibleName('Friday, April 21');
  });

  it('draws one day, or one column per resource headed by the name, each with its own events', () => {
    const { rerender } = render(<Scheduler label="Agenda" view="day" date="2023-04-21" events={[]} now={null} />);
    expect(columns()).toHaveLength(1);
    expect(columns()[0]).toHaveAccessibleName('Friday, April 21');

    const people: SchedulerResource[] = [
      { id: 'jr', name: 'Julia Roberts', tone: 'moss', avatar: <span data-avatar="jr" /> },
      { id: 'eh', name: 'Elizabeth Hall', tone: 'ember' },
    ];
    rerender(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-21"
        resources={people}
        events={[
          ev('a', '2023-04-21T09:00', '2023-04-21T10:00', { resourceId: 'jr' }),
          ev('b', '2023-04-21T09:00', '2023-04-21T10:00', { resourceId: 'eh', tone: 'glow' }),
          ev('c', '2023-04-21T09:00', '2023-04-21T10:00'),
        ]}
        now={null}
      />,
    );
    const sections = columns();
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveAccessibleName('Julia Roberts');
    expect(sections[1]).toHaveAccessibleName('Elizabeth Hall');
    expect(document.querySelector('[data-avatar="jr"]')).not.toBeNull();
    expect(within(sections[0]!).getByRole('button', { name: /^Event a,/ })).toHaveClass(styles.moss!);
    expect(within(sections[1]!).getByRole('button', { name: /^Event b,/ })).toHaveClass(styles.glow!);
    expect(screen.queryByRole('button', { name: /^Event c,/ })).toBeNull();
  });
});

describe('Scheduler — the events', () => {
  it('places each by its minutes from the first hour, in lanes when they overlap', () => {
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={{ start: 9, end: 18 }}
        events={[
          ev('a', '2023-04-20T11:00', '2023-04-20T12:00'),
          ev('b', '2023-04-20T11:30', '2023-04-20T12:30'),
          ev('c', '2023-04-20T14:00', '2023-04-20T14:15'),
        ]}
        now={null}
      />,
    );
    const a = slotOf('a');
    expect(a.style.getPropertyValue('--event-from')).toBe('120');
    expect(a.style.getPropertyValue('--event-to')).toBe('180');
    expect(a.style.getPropertyValue('--event-lane')).toBe('0');
    expect(a.style.getPropertyValue('--event-lanes')).toBe('2');
    expect(slotOf('b').style.getPropertyValue('--event-lane')).toBe('1');
    expect(slotOf('c').style.getPropertyValue('--event-lanes')).toBe('1');
  });

  it('clips an event to the hours shown and to the day, and drops one wholly outside', () => {
    render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        hours={{ start: 9, end: 18 }}
        events={[
          ev('early', '2023-04-20T08:00', '2023-04-20T10:00'),
          ev('night', '2023-04-20T23:00', '2023-04-21T01:00'),
          ev('gone', '2023-04-20T06:00', '2023-04-20T07:00'),
        ]}
        now={null}
      />,
    );
    const early = slotOf('early');
    expect(early.style.getPropertyValue('--event-from')).toBe('0');
    expect(early.style.getPropertyValue('--event-to')).toBe('60');
    expect(screen.queryByRole('button', { name: /^Event night,/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Event gone,/ })).toBeNull();
  });

  it('shows an event over midnight in both days when the hours allow', () => {
    render(
      <Scheduler label="Agenda" date="2023-04-20" events={[ev('night', '2023-04-20T23:00', '2023-04-21T01:00')]} now={null} />,
    );
    const both = screen.getAllByRole('button', { name: /^Event night,/ });
    expect(both).toHaveLength(2);
    expect(both[0]!.closest('li')!.style.getPropertyValue('--event-from')).toBe('1380');
    expect(both[0]!.closest('li')!.style.getPropertyValue('--event-to')).toBe('1440');
    expect(both[1]!.closest('li')!.style.getPropertyValue('--event-from')).toBe('0');
    expect(both[1]!.closest('li')!.style.getPropertyValue('--event-to')).toBe('60');
  });

  it('names each by its title, its time and its kind, and marks the kind, the tone, the size and the past', () => {
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        now="2023-04-20T13:00"
        events={[
          ev('a', '2023-04-20T11:00', '2023-04-20T13:00', { icon: <svg data-icon="a" /> }),
          ev('b', '2023-04-20T14:00', '2023-04-20T14:45', { kind: 'pending', tone: 'amber', icon: <svg data-icon="b" /> }),
          ev('c', '2023-04-20T15:00', '2023-04-20T15:15', { kind: 'cancelled' }),
          ev('d', '2023-04-20T16:00', '2023-04-20T16:05', { kind: 'blocker' }),
        ]}
        kindLabels={{ blocker: 'Blocked' }}
      />,
    );
    const a = screen.getByRole('button', { name: /^Event a,/ });
    expect(name(a)).toBe('Event a, 11:00 AM – 1:00 PM, Confirmed');
    expect(a).toHaveClass(styles.confirmed!, styles.accent!, styles.past!);
    expect(a).not.toHaveClass(styles.brief!, styles.short!);
    expect(a.querySelector('[data-icon="a"]')).not.toBeNull();

    const b = screen.getByRole('button', { name: /^Event b,/ });
    expect(name(b)).toBe('Event b, 2:00 – 2:45 PM, Pending approval');
    expect(b).toHaveClass(styles.pending!, styles.amber!, styles.short!);
    expect(b).not.toHaveClass(styles.past!);
    expect(b.querySelector('[data-icon="b"]'), 'no icon under an hour').toBeNull();

    const c = screen.getByRole('button', { name: /^Event c,/ });
    expect(name(c)).toBe('Event c, 3:00 – 3:15 PM, Cancelled');
    expect(c).toHaveClass(styles.cancelled!, styles.brief!);

    const d = screen.getByRole('button', { name: /^Event d,/ });
    expect(name(d)).toBe('Event d, 4:00 – 4:15 PM, Blocked');
    expect(slotOf('d').style.getPropertyValue('--event-to')).toBe('975');
  });

  it('puts an all-day event in the row above its day', () => {
    render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        events={[ev('ooo', '2023-04-18T00:00', '2023-04-18T00:00', { allDay: true, title: 'Out of office', kind: 'blocker' })]}
        now={null}
      />,
    );
    const button = screen.getByRole('button', { name: 'Out of office, All-day, Time blocker' });
    const lists = document.querySelectorAll(`.${styles.allDayList}`);
    expect(lists).toHaveLength(7);
    expect(lists[2]!.contains(button)).toBe(true);
    expect(lists[2]).toHaveAccessibleName('All-day, Tuesday, April 18');
    expect(button.closest('li')).toHaveClass(styles.allDaySlot!);
  });

  it('marks an all-day event past once its day is, not at the midnight its end names', () => {
    const allDay = (id: string, day: string) => ev(id, `${day}T00:00`, `${day}T00:00`, { allDay: true });
    render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        now="2023-04-20T11:16"
        events={[allDay('yesterday', '2023-04-19'), allDay('today', '2023-04-20'), allDay('tomorrow', '2023-04-21')]}
      />,
    );
    expect(screen.getByRole('button', { name: /^Event yesterday,/ })).toHaveClass(styles.past!);
    expect(screen.getByRole('button', { name: /^Event today,/ })).not.toHaveClass(styles.past!);
    expect(screen.getByRole('button', { name: /^Event tomorrow,/ })).not.toHaveClass(styles.past!);
  });

  it('marks the selected event, calls onSelect on a press, and adds what renderEvent gives', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        events={[ev('a', '2023-04-20T11:00', '2023-04-20T12:00'), ev('b', '2023-04-20T13:00', '2023-04-20T14:00')]}
        selectedId="b"
        onSelect={onSelect}
        renderEvent={(event) => <em>room {event.id}</em>}
        now={null}
      />,
    );
    const a = screen.getByRole('button', { name: /^Event a,/ });
    const b = screen.getByRole('button', { name: /^Event b,/ });
    expect(b).toHaveAttribute('aria-current', 'true');
    expect(b).toHaveClass(styles.selected!);
    expect(a).not.toHaveAttribute('aria-current');
    expect(a.querySelector('em')!.textContent).toBe('room a');
    await user.click(a);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });
});

describe('Scheduler — the keyboard', () => {
  const week = [
    ev('m1', '2023-04-17T09:00', '2023-04-17T10:00'),
    ev('m2', '2023-04-17T14:00', '2023-04-17T15:00'),
    ev('w1', '2023-04-19T13:30', '2023-04-19T14:30'),
    ev('w2', '2023-04-19T09:30', '2023-04-19T10:00'),
  ];

  it('holds one tab stop, the selected event or the first, and moves it with the arrows', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Scheduler label="Agenda" date="2023-04-20" weekStartsOn={1} days={5} events={week} now={null} onSelect={onSelect} />,
    );
    const button = (id: string) => screen.getByRole('button', { name: new RegExp(`^Event ${id},`) });
    const stops = screen.getAllByRole('button').filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(button('m1'));

    await user.tab();
    expect(screen.getByRole('region', { name: 'Agenda' })).toHaveFocus();
    await user.tab();
    expect(button('m1')).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(button('m2')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(button('m2'), 'stays at the last').toHaveFocus();
    // Right: Tuesday is empty, so Wednesday, and the nearest by start to 14:00 there.
    await user.keyboard('{ArrowRight}');
    expect(button('w1')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(button('w2')).toHaveFocus();
    await user.keyboard('{End}');
    expect(button('w1')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(button('m2')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(button('m1')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'm1' }));
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);

    // The stop follows the focus, so leaving and coming back lands where the reader was.
    await user.tab();
    expect(button('m1')).not.toHaveFocus();
    expect(screen.getAllByRole('button').filter((b) => b.tabIndex === 0)[0]).toBe(button('m1'));
  });

  it('starts the tab stop on the selected event', () => {
    render(<Scheduler label="Agenda" date="2023-04-20" weekStartsOn={1} days={5} events={week} selectedId="w2" now={null} />);
    const stops = screen.getAllByRole('button').filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(name(stops[0]!)).toMatch(/^Event w2,/);
  });
});

describe('Scheduler — now, hours and the off hours', () => {
  afterEach(() => vi.useRealTimers());

  it('draws the now line where told, with its time, and the dot in that day; none for null', () => {
    const { rerender } = render(
      <Scheduler label="Agenda" date="2023-04-20" hours={{ start: 9, end: 18 }} events={[]} now="2023-04-20T11:16" />,
    );
    const line = document.querySelector(`.${styles.now}`) as HTMLElement;
    expect(line.style.getPropertyValue('--scheduler-now')).toBe('136');
    expect(document.querySelector(`.${styles.nowTime}`)!.textContent!.replace(/\s/g, ' ')).toBe('11:16 AM');
    const dots = document.querySelectorAll(`.${styles.nowDot}`);
    expect(dots).toHaveLength(1);
    expect(columns()[4]!.contains(dots[0]!)).toBe(true);

    rerender(<Scheduler label="Agenda" date="2023-04-20" hours={{ start: 9, end: 18 }} events={[]} now="2023-04-27T11:16" />);
    expect(document.querySelector(`.${styles.now}`), 'a now outside the week').toBeNull();

    rerender(<Scheduler label="Agenda" date="2023-04-20" hours={{ start: 9, end: 18 }} events={[]} now="2023-04-20T20:00" />);
    expect(document.querySelector(`.${styles.now}`), 'a now outside the hours').toBeNull();

    rerender(<Scheduler label="Agenda" date="2023-04-20" hours={{ start: 9, end: 18 }} events={[]} now={null} />);
    expect(document.querySelector(`.${styles.now}`)).toBeNull();
    expect(document.querySelector(`.${styles.today}`), 'no today without a now').toBeNull();
  });

  it('reads the clock when no now is given, and ticks with the minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 3, 20, 11, 16, 30));
    render(<Scheduler label="Agenda" date="2023-04-20" events={[ev('a', '2023-04-20T09:00', '2023-04-20T10:00')]} />);
    const line = () => document.querySelector(`.${styles.now}`) as HTMLElement | null;
    expect(line()!.style.getPropertyValue('--scheduler-now')).toBe('676');
    expect(screen.getByRole('button', { name: /^Event a,/ })).toHaveClass(styles.past!);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(line()!.style.getPropertyValue('--scheduler-now')).toBe('677');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(line()!.style.getPropertyValue('--scheduler-now')).toBe('678');
  });

  it('labels the hours shown, by the locale, and bands the hours outside the working day', () => {
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={{ start: 8, end: 20 }}
        workingHours={{ start: 9, end: 17 }}
        locale="pt-PT"
        zoneLabel="WET"
        events={[]}
        now={null}
      />,
    );
    const hours = document.querySelectorAll(`.${styles.hour}`);
    expect(hours).toHaveLength(12);
    expect(hours[0]!.textContent).toBe('08:00');
    expect(hours[11]!.textContent).toBe('19:00');
    expect(document.querySelector(`.${styles.zone}`)!.textContent).toBe('WET');
    const off = document.querySelectorAll(`.${styles.off}`) as NodeListOf<HTMLElement>;
    expect(off).toHaveLength(2);
    expect([off[0]!.style.getPropertyValue('--off-from'), off[0]!.style.getPropertyValue('--off-to')]).toEqual(['0', '60']);
    expect([off[1]!.style.getPropertyValue('--off-from'), off[1]!.style.getPropertyValue('--off-to')]).toEqual(['540', '720']);
  });

  it("bands a resource's own working hours over the component's", () => {
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        hours={{ start: 8, end: 20 }}
        workingHours={{ start: 9, end: 17 }}
        resources={[
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B', workingHours: { start: 8, end: 12 } },
        ]}
        events={[]}
        now="2023-04-20T10:28"
      />,
    );
    const [a, b] = columns();
    expect(document.querySelectorAll(`.${styles.nowDot}`), 'one dot, not one per person').toHaveLength(1);
    expect(a!.contains(document.querySelector(`.${styles.nowDot}`))).toBe(true);
    expect(a!.querySelectorAll(`.${styles.off}`)).toHaveLength(2);
    const bands = b!.querySelectorAll(`.${styles.off}`) as NodeListOf<HTMLElement>;
    expect(bands).toHaveLength(1);
    expect(bands[0]!.style.getPropertyValue('--off-from')).toBe('240');
  });

  it('sets the columns, the hours and a max height on the root', () => {
    render(<Scheduler label="Agenda" date="2023-04-20" days={5} hours={{ start: 9, end: 18 }} maxHeight={480} events={[]} now={null} />);
    const root = screen.getByRole('region', { name: 'Agenda' });
    expect(root.style.getPropertyValue('--scheduler-columns')).toBe('5');
    expect(root.style.getPropertyValue('--scheduler-hours')).toBe('9');
    expect(root.style.getPropertyValue('--scheduler-max-height')).toBe('480px');
    expect(root).toHaveClass(styles.bounded!);
    expect(root).toHaveAttribute('tabindex', '0');
  });
});

describe('Scheduler — the stylesheet', () => {
  const css = readCss('src/components/Scheduler/Scheduler.module.css');

  it('places everything from the hour and the column floor, as custom properties', () => {
    const root = block(css, '\n.root {');
    expect(root).toContain('--scheduler-hour: var(--ap-density-hour)');
    expect(root).toContain('--scheduler-column: var(--ap-spacing-1200)');
    // A quarter of the hour, so quarter-hour events in a row do not overlap.
    expect(root).toContain('--scheduler-event-min: var(--ap-spacing-250)');
    expect(block(css, '\n.slot {')).toContain('var(--event-from) / 60 * var(--scheduler-hour)');
    expect(block(css, '\n.slot {')).toContain('var(--event-lane) / var(--event-lanes)');
  });

  it('takes its hour from density', () => {
    expect(block(readCss('src/components/Scheduler/Scheduler.module.css'), '.root {')).toContain('--scheduler-hour: var(--ap-density-hour);');
  });

  it('paints a tone from the category tokens and a kind from the tone', () => {
    for (const hue of ['glacier', 'moss', 'amber', 'ember', 'glow', 'flare']) {
      const tone = block(css, `\n.${hue} {`);
      expect(tone).toContain(`--event-fill: var(--ap-color-category-${hue})`);
      expect(tone).toContain(`--event-on: var(--ap-color-category-on-${hue})`);
      expect(tone).toContain(`--event-tint: var(--ap-color-category-${hue}-subtle)`);
      expect(tone).toContain(`--event-text: var(--ap-color-category-${hue}-text)`);
    }
    expect(block(css, '\n.accent {')).toContain('--event-fill: var(--ap-color-interactive-accent)');
    expect(block(css, '\n.confirmed {')).toContain('background: var(--event-fill)');
    expect(block(css, '\n.pending {')).toContain('border-color: var(--event-fill)');
    expect(block(css, '\n.past.confirmed {')).toContain('background: var(--event-tint)');
    expect(css).not.toMatch(/\.past[^{]*\{[^}]*opacity/);
  });

  it('draws the now line and the dot in the danger edge', () => {
    expect(block(css, '\n.now {')).toContain('var(--ap-color-border-danger)');
    expect(block(css, '\n.nowDot {')).toContain('var(--ap-color-border-danger)');
  });
});

describe('Scheduler — accessibility', () => {
  it('has no axe violations in a week with events of every kind, and with resources', async () => {
    const kinds = ['confirmed', 'pending', 'cancelled', 'blocker', 'external', 'availability'] as const;
    const { container, rerender } = render(
      <Scheduler
        label="Agenda"
        date="2023-04-20"
        now="2023-04-20T11:16"
        zoneLabel="WET"
        events={[
          ...kinds.map((kind, i) => ev(kind, `2023-04-1${7 + (i % 3)}T${9 + i}:00`, `2023-04-1${7 + (i % 3)}T${10 + i}:00`, { kind })),
          ev('ooo', '2023-04-18T00:00', '2023-04-18T00:00', { allDay: true }),
        ]}
        selectedId="pending"
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
    rerender(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        resources={[{ id: 'a', name: 'Ana' }]}
        events={[ev('x', '2023-04-20T09:00', '2023-04-20T10:00', { resourceId: 'a' })]}
        now={null}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
