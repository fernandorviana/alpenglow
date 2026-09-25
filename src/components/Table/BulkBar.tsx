'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { isCheckable } from '../DropdownMenu/rows';
import type { DropdownMenuAction } from '../DropdownMenu/rows';
import { StatusGlyph } from '../statusGlyphs';
import { Switch } from '../Switch/Switch';
import { Tooltip } from '../Tooltip/Tooltip';
import { bulkCss } from './columns';
import { ActionButton, MoreMenu, splitActions } from './RowActions';
import styles from './Table.module.css';

/**
 * Until the Switches are measured, a guess on the wide side: 40 of track, 8
 * of gap and 8 a character, 16 between two. Measured before the first paint
 * wherever there is layout, so the guess is only what a server's HTML or a
 * page without layout goes by.
 */
function guess(toggles: readonly DropdownMenuAction[]): number {
  const one = (action: DropdownMenuAction) => 48 + (typeof action.label === 'string' ? action.label.length : 20) * 8;
  return toggles.reduce((sum, action, i) => sum + one(action) + (i > 0 ? 16 : 0), 0);
}

export type BulkBarProps = {
  /** The Table's scope, which the rules are written under. */
  scope: string;
  /** The count in words: the bar's name and its status. */
  label: string;
  /** A menu's actions, which gather; or else `nodes`. */
  actions?: DropdownMenuAction[];
  nodes?: ReactNode;
  inline: number;
  moreLabel: string;
  clearLabel: string;
  onClear: () => void;
};

/**
 * The selection bar: the count, the actions and Clear, on one row. Its own
 * component, and a client one, because a checkable action is drawn as the
 * Switch while the bar has room, and a Switch holds words whose width only
 * the page knows: it is measured here, in a copy no one can see or reach,
 * and the width goes into the same kind of rules the rows' actions use
 * (columns.ts, bulkCss).
 *
 * Three sets, the rules showing one: everything inline — the actions with an
 * icon as buttons, "⋯" for the rest, and the Switches after a divider; the
 * Switches tucked into "⋯" as checkbox rows, the buttons staying; and one
 * "⋯" for all of it.
 */
export function BulkBar({ scope, label, actions, nodes, inline, moreLabel, clearLabel, onClear }: BulkBarProps) {
  const toggles = actions?.filter(isCheckable) ?? [];
  const commands = actions?.filter((action) => !isCheckable(action)) ?? [];
  const { shown, rest } = splitActions(commands, inline);
  const inlineButtons = shown.length + (rest.length > 0 ? 1 : 0);
  const tucked = actions?.filter((action) => !shown.includes(action)) ?? [];
  const tuckedButtons = toggles.length > 0 ? shown.length + 1 : 0;
  const least = toggles.length > 0 ? tuckedButtons : inlineButtons;

  const copy = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState(0);
  const hasToggles = toggles.length > 0;
  useLayoutEffect(() => {
    const element = copy.current;
    if (!element) return;
    // Rounded up, so a Switch of 176.4 is given 177 and never 176.
    const read = () => {
      const width = Math.ceil(element.getBoundingClientRect().width);
      if (width > 0) setMeasured(width);
    };
    read();
    // Again when the font arrives or the words change. jsdom has none.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasToggles]);
  const toggleWidth = hasToggles ? measured || guess(toggles) : 0;

  const switches = (measure: boolean) =>
    toggles.map((action) =>
      measure ? (
        <Switch key={action.id} tabIndex={-1}>
          {action.label}
        </Switch>
      ) : (
        <Switch key={action.id} checked={action.checked} disabled={action.disabled} onChange={() => action.onSelect?.()}>
          {action.label}
        </Switch>
      ),
    );

  return (
    <div className={styles.dock}>
      {actions && <style>{bulkCss(scope, { inlineButtons, toggleWidth, tuckedButtons })}</style>}
      <div className={styles.bar} role="group" aria-label={label}>
        {/* The count and the actions, which give way inside it, the actions
            first; Clear, after it, never does. */}
        <div className={styles.lead}>
          {/* The whole count on hover, for when a long one is cut short. */}
          <span className={styles.count} role="status" title={label}>
            {label}
          </span>
          <span className={styles.divider} aria-hidden="true" />
          <div
            className={[styles.bulk, actions ? styles.gathers : styles.scrolls].join(' ')}
            data-bulk={actions ? 'slot' : undefined}
          >
            {actions ? (
              <>
                <span className={styles.actions} data-bulk="inline">
                  {shown.map((action) => (
                    <ActionButton key={action.id} action={action} size="sm" />
                  ))}
                  {rest.length > 0 && <MoreMenu items={rest} label={moreLabel} size="sm" />}
                  {hasToggles && inlineButtons > 0 && (
                    <span className={`${styles.divider} ${styles.toggleDivider}`} aria-hidden="true" />
                  )}
                  {hasToggles && <span className={styles.toggles}>{switches(false)}</span>}
                </span>
                {hasToggles && (
                  <span className={styles.actions} data-bulk="tucked">
                    {shown.map((action) => (
                      <ActionButton key={action.id} action={action} size="sm" />
                    ))}
                    <MoreMenu items={tucked} label={moreLabel} size="sm" />
                  </span>
                )}
                {least > 1 && (
                  <span className={styles.actions} data-bulk="gathered">
                    <MoreMenu items={actions} label={moreLabel} size="sm" />
                  </span>
                )}
                {hasToggles && (
                  // The copy that is measured: laid out at its own width in a
                  // box of none that clips it, so it never widens the page;
                  // hidden, out of the accessibility tree and out of reach.
                  <span className={styles.measureBox} aria-hidden="true" inert>
                    <span ref={copy} className={`${styles.toggles} ${styles.measure}`}>
                      {switches(true)}
                    </span>
                  </span>
                )}
              </>
            ) : (
              nodes
            )}
          </div>
        </div>
        <span className={styles.divider} aria-hidden="true" />
        {/* Clear twice, as a row's actions are drawn twice: in words, and as
            a ✕ named by its Tooltip for a Table under 25rem, where the words
            do not fit a phone beside the count and a "⋯". The rules show one;
            the other is display: none, out of the tab order and the tree. */}
        <span className={styles.clearWords}>
          <Button variant="outline" tone="neutral" size="sm" onClick={onClear}>
            {clearLabel}
          </Button>
        </span>
        <span className={styles.clearIcon}>
          <Tooltip content={clearLabel} purpose="label">
            <Button
              variant="outline"
              tone="neutral"
              size="sm"
              icon={<StatusGlyph name="close" />}
              aria-label={clearLabel}
              onClick={onClear}
            />
          </Tooltip>
        </span>
      </div>
    </div>
  );
}
