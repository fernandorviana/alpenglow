import { Button } from '../Button/Button';
import { DropdownMenu } from '../DropdownMenu/DropdownMenu';
import { actionText } from '../DropdownMenu/rows';
import type { DropdownMenuAction } from '../DropdownMenu/rows';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Table.module.css';

/** The first `inline` actions with an icon, and the rest in their order. An action without an icon is never a button. */
export function splitActions(actions: readonly DropdownMenuAction[], inline: number) {
  const shown = actions.filter((action) => action.icon != null).slice(0, Math.max(0, inline));
  return { shown, rest: actions.filter((action) => !shown.includes(action)) };
}

/** The buttons a row shows while its actions are inline: its own, and "⋯" if any are left over. */
export function inlineButtonCount(actions: readonly DropdownMenuAction[], inline: number): number {
  const { shown, rest } = splitActions(actions, inline);
  return shown.length + (rest.length > 0 ? 1 : 0);
}

/**
 * Carbon's overflow-menu--horizontal, on its 32 grid. Inlined because the
 * package does not depend on @carbon/icons-react at runtime. Apache-2.0,
 * © IBM.
 */
function More() {
  return (
    <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="8" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
      <circle cx="24" cy="16" r="2" />
    </svg>
  );
}

function Menu({ items, label }: { items: DropdownMenuAction[]; label: string }) {
  return (
    <DropdownMenu
      items={items}
      trigger={(props) => <Button variant="ghost" tone="neutral" icon={<More />} aria-label={label} {...props} />}
    />
  );
}

/**
 * A row's actions, twice: inline, and gathered into one "⋯". The Table's
 * rules show one or the other by its width. The hidden one is display: none,
 * so it is out of the tab order and the accessibility tree.
 *
 * An inline button is named by its Tooltip (`purpose="label"`), the words a
 * pointer sees; `aria-label` is the same words, for the moment before the
 * Tooltip's panel exists.
 */
export function RowActions({
  actions,
  inline,
  label,
  gather,
}: {
  actions: readonly DropdownMenuAction[];
  inline: number;
  label: string;
  gather: boolean;
}) {
  if (actions.length === 0) return null;
  const { shown, rest } = splitActions(actions, inline);
  return (
    <>
      <span className={styles.actions} data-actions="inline">
        {shown.map((action) => (
          <Tooltip key={action.id} content={action.label} purpose="label">
            <Button
              variant="ghost"
              tone={action.tone ?? 'neutral'}
              icon={action.icon}
              aria-label={actionText(action)}
              disabled={action.disabled}
              onClick={action.onSelect}
            />
          </Tooltip>
        ))}
        {rest.length > 0 && <Menu items={rest} label={label} />}
      </span>
      {gather && (
        <span className={styles.actions} data-actions="gathered">
          <Menu items={[...actions]} label={label} />
        </span>
      )}
    </>
  );
}
