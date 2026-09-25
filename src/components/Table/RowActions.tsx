import { Button } from '../Button/Button';
import { DropdownMenu } from '../DropdownMenu/DropdownMenu';
import { actionText, isCheckable } from '../DropdownMenu/rows';
import type { DropdownMenuAction } from '../DropdownMenu/rows';
import { Tooltip } from '../Tooltip/Tooltip';
import type { ControlSize } from '../vocabulary';
import styles from './Table.module.css';

/**
 * The first `inline` actions with an icon, and the rest in their order. An
 * action without an icon is never a button, and neither is a checkable one:
 * a button would drop its state.
 */
export function splitActions(actions: readonly DropdownMenuAction[], inline: number) {
  const shown = actions.filter((action) => action.icon != null && !isCheckable(action)).slice(0, Math.max(0, inline));
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

/** "⋯" and the menu it opens. Left out, the size is the density's, as a row's. */
export function MoreMenu({ items, label, size }: { items: DropdownMenuAction[]; label: string; size?: ControlSize }) {
  return (
    <DropdownMenu
      items={items}
      trigger={(props) => <Button variant="ghost" tone="neutral" size={size} icon={<More />} aria-label={label} {...props} />}
    />
  );
}

/** An action with an icon as its own button, named by its Tooltip (see RowActions). */
export function ActionButton({ action, size }: { action: DropdownMenuAction; size?: ControlSize }) {
  return (
    <Tooltip content={action.label} purpose="label">
      <Button
        variant="ghost"
        tone={action.tone ?? 'neutral'}
        size={size}
        icon={action.icon}
        aria-label={actionText(action)}
        disabled={action.disabled}
        onClick={action.onSelect}
      />
    </Tooltip>
  );
}

/**
 * A row's actions, twice: inline, and gathered into one "⋯". The Table's
 * rules show one or the other by its width. The hidden one is display: none,
 * so it is out of the tab order and the accessibility tree.
 *
 * `aria-label` is only there because the icon-only Button requires a name to
 * compile; `purpose="label"` makes the Tooltip add `aria-labelledby` from its
 * first render, the server's included, and that wins over `aria-label` as the
 * button's actual accessible name. So the prop is a fallback that matters
 * only if the Tooltip is ever taken away — `actionText` is what it falls back
 * to, which is `label` when that is a plain string and otherwise the
 * action's `id`, unless the caller gave a `textValue`.
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
          <ActionButton key={action.id} action={action} />
        ))}
        {rest.length > 0 && <MoreMenu items={rest} label={label} />}
      </span>
      {gather && (
        <span className={styles.actions} data-actions="gathered">
          <MoreMenu items={[...actions]} label={label} />
        </span>
      )}
    </>
  );
}
