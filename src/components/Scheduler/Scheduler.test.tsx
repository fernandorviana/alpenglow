import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Scheduler, type SchedulerEvent, type SchedulerResource } from './Scheduler';
import styles from './Scheduler.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';
import { borderWidth, spacing } from '../../tokens/scale';
import { textStyle } from '../../tokens/typography';

/** Every value `prop` is given in a rule whose selector list names `.cls` on its own. */
const declared = (css: string, cls: string, prop: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors!.split(',').some((s) => s.trim() === `.${cls}`))
    .flatMap(([, , body]) => [...body!.matchAll(new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+)`, 'g'))].map(([, value]) => value!.trim()));

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

  it('lays each person’s head on the same track as the person’s column', () => {
    // jsdom lays nothing out: what holds a head over its column is that the
    // head and the body are one scroll box's two grids with one template and
    // one floor, neither sized by what is in it. A long name in a 900 box.
    const five: SchedulerResource[] = ['Julia Roberts', 'Elizabeth Hall', 'Laura Lee', 'Anthony Jackson', 'Léa Martin'].map(
      (person, i) => ({ id: `p${i}`, name: person }),
    );
    render(
      <div style={{ inlineSize: 900 }}>
        <Scheduler label="Agenda" view="day" date="2023-04-21" resources={five} events={[]} now={null} />
      </div>,
    );
    const region = screen.getByRole('region', { name: 'Agenda' });
    const head = region.querySelector<HTMLElement>(`.${styles.head}`)!;
    const body = region.querySelector<HTMLElement>(`.${styles.body}`)!;
    expect(region.style.getPropertyValue('--scheduler-columns')).toBe('5');
    expect(head.parentElement).toBe(region);
    expect(body.parentElement).toBe(region);
    // The corner and five heads, then the All-day label and five lists: two rows of 1 + 5.
    expect(head.children).toHaveLength(12);
    expect(head.querySelectorAll(`.${styles.person}`)).toHaveLength(5);
    // The hours and five columns.
    expect(body.children).toHaveLength(6);

    const css = readCss('src/components/Scheduler/Scheduler.module.css');
    expect(declared(css, 'head', 'grid-template-columns')).toEqual(declared(css, 'body', 'grid-template-columns'));
    expect(declared(css, 'head', 'grid-template-columns')).toHaveLength(1);
    expect(declared(css, 'head', 'min-inline-size')).toEqual(declared(css, 'body', 'min-inline-size'));
    expect(declared(css, 'head', 'min-inline-size')).toHaveLength(1);
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

  it('sizes the head and the body from the columns, never from what is in them', () => {
    // At max-content the head's unbroken names widened its tracks past the
    // body's: 165 over 144 at 1440, Léa Martin's cards under Anthony Jackson.
    const grids = block(css, '\n.head,\n.body {');
    expect(grids).toContain(
      'min-inline-size: calc(var(--scheduler-hours-width) + var(--scheduler-columns) * var(--scheduler-column))',
    );
    expect(css).not.toContain('max-content');
  });

  it('keeps the hours column at the start while the columns scroll sideways under it', () => {
    // A `position: relative` after the sticky rule had the hours scroll away
    // under a corner and an All-day label that stayed.
    for (const part of ['corner', 'hours', 'allDayLabel']) {
      expect(declared(css, part, 'position'), part).toEqual(['sticky']);
      expect(declared(css, part, 'inset-inline-start'), part).toEqual(['0']);
    }
  });

  it('gives the all-day chip the drawn row, its line inside it', () => {
    // Drawn 170 × 29 in a 28 row, radius 8, 12 SemiBold, the words 10 in.
    expect(block(css, '\n.root {')).toContain('--scheduler-all-day: calc(var(--ap-spacing-300) + var(--ap-spacing-050))');
    const chip = block(css, '\n.allDaySlot > .event {');
    expect(chip).toContain('min-block-size: var(--scheduler-all-day)');
    expect(chip).toContain('block-size: auto');
    expect(chip).toContain('justify-content: center');
    expect(chip).toContain('padding-block: 0');
    // 8 and the hairline edge: the words 9 in, for the drawn 10.
    expect(chip).toContain('padding-inline: var(--ap-spacing-100)');
    expect(block(css, '\n.event {')).toContain('border-radius: var(--ap-radius-lg)');
    expect(block(css, '\n.title {')).toContain('font-size: var(--ap-text-caption-md-size)');
    expect(block(css, '\n.title {')).toContain('font-weight: var(--ap-font-weight-semibold)');
    // The row is the chip: nothing above or below it, 2 at the sides.
    const row = block(css, '\n.allDayList {');
    expect(row).toContain('min-block-size: var(--scheduler-all-day)');
    expect(row).toContain('padding: 0 var(--ap-spacing-025)');
    // Nothing holds the slot to the 20 of a quarter-hour card any more.
    expect(declared(css, 'allDaySlot', 'block-size')).toEqual([]);
    // 28, less the edge above and below, holds the title's 16 line.
    expect(spacing[300] + spacing['050'] - 2 * borderWidth.hairline).toBeGreaterThanOrEqual(textStyle['caption/md'].lineHeight);
  });
});

describe('Scheduler — opening at a day', () => {
  /**
   * A week of seven 128 columns after the 80 hours in a region 400 wide:
   * column n runs from 80 + 128n less the region's scroll, and the sticky
   * hours cover 0 to 80. The region scrolls when its columns pass 400.
   */
  const region = () => screen.getByRole('region', { name: 'Agenda' });
  const rect = (left: number, width: number) =>
    ({ x: left, y: 0, left, top: 0, right: left + width, bottom: 100, width, height: 100, toJSON: () => ({}) }) as DOMRect;
  /** The scroll that puts column n's middle at 240, the middle of 80 to 400. */
  const centred = (n: number) => 80 + 128 * n + 64 - 240;

  beforeEach(() => {
    const own = (el: Element) => el.closest<HTMLElement>('[role=region]')!;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('role') === 'region') return rect(0, 400);
      if (this.classList.contains(styles.hours!)) return rect(0, 80);
      if (this.matches('section[data-column]')) return rect(80 + 128 * Number(this.dataset.column) - own(this).scrollLeft, 128);
      return rect(0, 0);
    });
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
      return this.getAttribute('role') === 'region' ? 400 : 0;
    });
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
      return this.getAttribute('role') === 'region' ? 80 + 128 * this.querySelectorAll('section[data-column]').length : 0;
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('stays where it starts unless asked', () => {
    render(<Scheduler label="Agenda" date="2023-04-20" events={[]} now="2023-04-20T11:16" />);
    expect(region().scrollLeft).toBe(0);
  });

  it('asked, puts today in the middle of what the hours leave, or the day’s column when today is not in the week', () => {
    const { unmount } = render(<Scheduler label="Agenda" date="2023-04-20" events={[]} now="2023-04-20T11:16" scrollToDay />);
    // Thursday, column 4: 592 to 720, its middle 656; the middle of 80 to 400 is 240.
    expect(region().scrollLeft).toBe(416);
    expect(region().scrollLeft).toBe(centred(4));
    unmount();
    render(<Scheduler label="Agenda" date="2023-04-25" events={[]} now="2023-04-20T11:16" scrollToDay />);
    // Tuesday the 25th, column 2.
    expect(region().scrollLeft).toBe(centred(2));
  });

  it('goes to the day asked for in the same week, and to today again when the view changes', () => {
    const at = (date: string, view: 'day' | 'week' = 'week') => (
      <Scheduler label="Agenda" view={view} date={date} events={[]} now="2023-04-20T11:16" scrollToDay />
    );
    const { rerender } = render(at('2023-04-20'));
    expect(region().scrollLeft).toBe(centred(4));
    rerender(at('2023-04-18'));
    expect(region().scrollLeft, 'Tuesday, not pulled back to today').toBe(centred(2));
    rerender(at('2023-04-19'));
    expect(region().scrollLeft).toBe(centred(3));
    rerender(at('2023-04-19', 'day'));
    rerender(at('2023-04-19'));
    expect(region().scrollLeft, 'back to the week: today').toBe(centred(4));
  });

  it('does it again for a new number, with the date already today', () => {
    const at = (request: number) => <Scheduler label="Agenda" date="2023-04-20" events={[]} now="2023-04-20T11:16" scrollToDay={request} />;
    const { rerender } = render(at(0));
    expect(region().scrollLeft, 'a 0 is a request too').toBe(centred(4));
    region().scrollLeft = 0;
    rerender(at(0));
    expect(region().scrollLeft, 'the same number: the reader’s scroll stays').toBe(0);
    rerender(at(1));
    expect(region().scrollLeft).toBe(centred(4));
  });

  it('goes to today when the clock first arrives after hydration', async () => {
    // The server has no clock, so hydration opens at the day asked for; today
    // is known a render later, and the region goes to it once.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2023, 3, 20, 11, 16));
    const ui = <Scheduler label="Agenda" date="2023-04-18" events={[]} scrollToDay />;
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = renderToString(ui);
    const setter = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft')!.set!;
    const seen: number[] = [];
    vi.spyOn(Element.prototype, 'scrollLeft', 'set').mockImplementation(function (this: Element, value: number) {
      if (this.getAttribute('role') === 'region') seen.push(value);
      setter.call(this, value);
    });
    render(ui, { container, hydrate: true });
    expect(seen, 'Tuesday while today is unknown, then Thursday').toEqual([centred(2), centred(4)]);
    expect(region().scrollLeft).toBe(centred(4));
  });

  it('measures what the hours leave by their width, not where they are drawn', () => {
    // Were the hours to scroll with the columns, their box would move and the
    // middle with it; the width from the start edge is the same either way.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const own = this.closest<HTMLElement>('[role=region]')!;
      if (this === own) return rect(0, 400);
      if (this.classList.contains(styles.hours!)) return rect(-own.scrollLeft, 80);
      if (this.matches('section[data-column]')) return rect(80 + 128 * Number(this.dataset.column) - own.scrollLeft, 128);
      return rect(0, 0);
    });
    const at = (date: string) => <Scheduler label="Agenda" date={date} events={[]} now="2023-04-20T11:16" scrollToDay />;
    const { rerender } = render(at('2023-04-20'));
    expect(region().scrollLeft).toBe(centred(4));
    rerender(at('2023-04-22'));
    expect(region().scrollLeft).toBe(centred(6));
    rerender(at('2023-04-20'));
    expect(region().scrollLeft).toBe(centred(4));
  });

  it('stays put when the week fits, and in a day of people', () => {
    const { unmount } = render(<Scheduler label="Agenda" date="2023-04-20" days={2} events={[]} now="2023-04-20T11:16" scrollToDay />);
    expect(region().scrollLeft).toBe(0);
    unmount();
    render(
      <Scheduler
        label="Agenda"
        view="day"
        date="2023-04-20"
        resources={['A', 'B', 'C', 'D'].map((id) => ({ id, name: id }))}
        events={[]}
        now="2023-04-20T11:16"
        scrollToDay
      />,
    );
    expect(region().scrollLeft).toBe(0);
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
