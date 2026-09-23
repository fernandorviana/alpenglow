'use client';

import { useReducer, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useCommandPaletteShortcut } from '@/components/CommandPalette';
import { EmptyState } from '@/components/EmptyState';
import { Tabs } from '@/components/Tabs';
import { TopBar } from '@/components/TopBar';
import { addDays } from '@/components/Calendar/date';
import { useMediaQuery } from '@/components/useMediaQuery';
import { DAY } from './data';
import type { FrameMode } from './frame';
import { initialState, reducer, visible } from './state';
import type { ScreenState } from './state';
import { Appointments } from './zones/Appointments';
import { Commands } from './zones/Commands';
import { Day } from './zones/Day';
import { DayBar } from './zones/DayBar';
import { Details } from './zones/Details';
import { Navigation, NAV_NARROW, SECTION_ICON, SECTION_LABEL } from './zones/Navigation';
import type { Section } from './zones/Navigation';
import { NewAppointment } from './zones/NewAppointment';
import { dayTitle, shortDayTitle } from './zones/shared';
import { Bell, Next, Previous, Ridge, Search, Today } from './zones/glyphs';
import styles from './screen.module.css';

/**
 * Ridge Physio's day: the Scheduler and the Table on one state. The state is
 * the reducer's; this holds only what is the screen's own chrome — the
 * palette, the tab, the SideNav's sheet and which section is shown.
 */
export function Screen({ onTheme, initial }: { onTheme?: (theme: FrameMode) => void; initial?: ScreenState }) {
  const [state, dispatch] = useReducer(reducer, initial ?? null, (i) => i ?? initialState());
  const [palette, setPalette] = useState(false);
  const [tab, setTab] = useState('schedule');
  const [sheet, setSheet] = useState(false);
  const [section, setSection] = useState<Section>('today');

  const wide = useMediaQuery('(min-width: 1280px)');
  const narrow = useMediaQuery(NAV_NARROW);
  const phone = useMediaQuery('(max-width: 480px)');
  const hint = useCommandPaletteShortcut(() => setPalette(true), 'k');

  const go = (date: string) => {
    setSection('today');
    dispatch({ type: 'go', date });
  };

  // Beside the menu at a phone's width the TopBar has no room for it: it leads the main instead.
  const dateNav = (
    <div className={styles.dateNav}>
      <Button variant="ghost" tone="neutral" iconStart={<Previous />} aria-label="Previous day" onClick={() => go(addDays(state.date, -1))} />
      <Button variant="ghost" tone="neutral" iconStart={<Next />} aria-label="Next day" onClick={() => go(addDays(state.date, 1))} />
      <h1 className={styles.date}>
        <time dateTime={state.date}>{narrow ? shortDayTitle(state.date) : dayTitle(state.date)}</time>
      </h1>
      <Button variant="outline" tone="neutral" iconStart={phone ? undefined : <Today />} onClick={() => go(DAY)}>
        Today
      </Button>
    </div>
  );

  const day = <Day state={state} dispatch={dispatch} />;
  const list = <Appointments state={state} dispatch={dispatch} />;
  const count = visible(state).filter((a) => a.kind === 'appointment').length;

  return (
    <div className={styles.screen}>
      <Navigation section={section} onSection={setSection} open={sheet} onClose={() => setSheet(false)} />

      <div className={styles.column}>
        <TopBar
          brand={
            <span className={styles.brand}>
              <Ridge />
              <span className={styles.brandName}>Ridge Physio</span>
            </span>
          }
          onMenu={narrow ? () => setSheet(true) : undefined}
          menuExpanded={narrow ? sheet : undefined}
          actions={
            <>
              <Button
                variant="outline"
                tone="neutral"
                iconStart={<Search />}
                aria-label="Search"
                aria-keyshortcuts="Meta+K Control+K"
                onClick={() => setPalette(true)}
              >
                <span className={styles.searchWords}>
                  Search
                  {hint && <span className={styles.hint}>{hint}</span>}
                </span>
              </Button>
              {!phone && <Button variant="ghost" tone="neutral" iconStart={<Bell />} aria-label="Notifications" />}
              <Avatar name="Rita Alves" size="md" />
            </>
          }
        >
          {!phone && dateNav}
        </TopBar>

        <main className={styles.main}>
          {phone && <div className={styles.phoneDate}>{dateNav}</div>}
          {section === 'today' ? (
            <>
              <DayBar state={state} dispatch={dispatch} />
              {wide ? (
                <div className={styles.body}>
                  {day}
                  {list}
                </div>
              ) : (
                <Tabs
                  className={styles.tabs}
                  label="Views of the day"
                  value={tab}
                  onChange={setTab}
                  keepMounted
                  items={[
                    { id: 'schedule', label: 'Schedule', content: day },
                    { id: 'appointments', label: 'Appointments', count, content: list },
                  ]}
                />
              )}
            </>
          ) : (
            <EmptyState
              className={styles.empty}
              size="lg"
              headingLevel={2}
              icon={SECTION_ICON[section]}
              title={SECTION_LABEL[section]}
              description="Nothing here yet — the screen draws one day."
              action={<Button onClick={() => setSection('today')}>Back to today</Button>}
            />
          )}
        </main>
      </div>

      <Details state={state} dispatch={dispatch} />
      <NewAppointment state={state} dispatch={dispatch} />
      <Commands
        state={state}
        dispatch={dispatch}
        open={palette}
        onClose={() => setPalette(false)}
        onToday={() => setSection('today')}
        onTheme={onTheme}
      />
    </div>
  );
}
