/**
 * Where a key takes focus in a horizontal tab list, or `null` when the key is
 * not the list's.
 *
 * Pure, so every rule is a test without a DOM. `enabled[i]` says whether tab
 * `i` can be selected; a disabled tab is skipped the way DropdownMenu skips a
 * disabled row. Arrows wrap. ArrowUp and ArrowDown are not claimed: the list
 * is horizontal and those keys scroll the page.
 */
export function nextTab(key: string, at: number, enabled: readonly boolean[], rtl: boolean): number | null {
  const count = enabled.length;
  if (!enabled.some(Boolean)) return null;

  const seek = (from: number, step: 1 | -1) => {
    for (let i = 1; i <= count; i++) {
      const index = (((from + step * i) % count) + count) % count;
      if (enabled[index]) return index;
    }
    return from;
  };

  switch (key) {
    case 'ArrowRight':
      return seek(at, rtl ? -1 : 1);
    case 'ArrowLeft':
      return seek(at, rtl ? 1 : -1);
    case 'Home':
      return seek(-1, 1);
    case 'End':
      return seek(count, -1);
    default:
      return null;
  }
}
