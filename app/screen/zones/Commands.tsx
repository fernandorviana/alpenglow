'use client';

import { useState } from 'react';
import type { Dispatch } from 'react';
import { CommandPalette } from '@/components/CommandPalette';
import type { CommandGroup, CommandItem } from '@/components/CommandPalette';
import { addDays } from '@/components/Calendar/date';
import { DAY } from '../data';
import type { FrameMode } from '../frame';
import type { Action, ScreenState } from '../state';
import { dayTitle, nextFreeHalfHour, practitionerName, timeRange } from './shared';
import { Search } from './glyphs';

/**
 * ⌘K: the day's clients and what the screen can do. The shortcut is bound in
 * Screen, which owns the open state and shows the hint on the TopBar's search
 * button; this is the palette it opens.
 */
export function Commands({
  state,
  dispatch,
  open,
  onClose,
  onToday,
  onTheme,
}: {
  state: ScreenState;
  dispatch: Dispatch<Action>;
  open: boolean;
  onClose: () => void;
  /** Back to the day from an empty section. */
  onToday: () => void;
  onTheme?: (theme: FrameMode) => void;
}) {
  // Each opening starts from an empty field: the palette keeps what was typed while it is mounted.
  const [query, setQuery] = useState('');
  const close = () => {
    setQuery('');
    onClose();
  };

  // Read only while open, which is never on the server: the frame's mode is on :root.
  const dark = open && document.documentElement.getAttribute('data-theme') === 'dark';

  // Each client once, at their first appointment of the day.
  const first = new Map<string, string>();
  for (const id of state.order) {
    const a = state.byId[id]!;
    if (a.kind !== 'appointment') continue;
    const earlier = first.get(a.client);
    if (!earlier || state.byId[earlier]!.start > a.start) first.set(a.client, id);
  }
  const clients: CommandItem[] = [...first]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([client, id]) => {
      const a = state.byId[id]!;
      return { id: `client:${id}`, label: client, description: `${timeRange(a)} · ${practitionerName(a.practitionerId)}` };
    });

  const commands: CommandItem[] = [
    { id: 'go:today', label: 'Go to today', description: dayTitle(DAY) },
    { id: 'go:tomorrow', label: 'Go to tomorrow' },
    { id: 'go:yesterday', label: 'Go to yesterday' },
    { id: 'new', label: 'New appointment', keywords: ['book', 'create'] },
    ...(onTheme ? [{ id: 'theme', label: dark ? 'Switch to light' : 'Switch to dark', keywords: ['mode', 'theme'] }] : []),
  ];

  const groups: CommandGroup[] = [
    { label: 'Clients', items: clients },
    { label: 'Commands', items: commands },
  ];

  const choose = (item: CommandItem) => {
    close();
    if (item.id.startsWith('client:')) {
      const id = item.id.slice('client:'.length);
      onToday();
      // Out of view under the filters, it could not be current: the filters give way.
      if (state.filters.length > 0) dispatch({ type: 'filter', filters: [] });
      dispatch({ type: 'current', id });
      dispatch({ type: 'drawer', open: true });
      return;
    }
    switch (item.id) {
      case 'go:today':
        onToday();
        return dispatch({ type: 'go', date: DAY });
      case 'go:tomorrow':
        onToday();
        return dispatch({ type: 'go', date: addDays(state.date, 1) });
      case 'go:yesterday':
        onToday();
        return dispatch({ type: 'go', date: addDays(state.date, -1) });
      case 'new':
        return dispatch({ type: 'dialog', draft: nextFreeHalfHour(state) });
      case 'theme':
        return onTheme?.(dark ? 'light' : 'dark');
    }
  };

  return (
    <CommandPalette
      open={open}
      onClose={close}
      query={query}
      onQueryChange={setQuery}
      label="Search Ridge Physio"
      placeholder="Search clients and commands"
      icon={<Search />}
      items={groups}
      onSelect={choose}
      emptyText={(typed) => `Nothing matches “${typed}”`}
    />
  );
}
