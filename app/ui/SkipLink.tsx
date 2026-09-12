/**
 * The first thing a keyboard reaches. Twenty-four stops — the brand, the
 * theme toggle and every page in the sidebar — precede the prose on every
 * page, so a reader who arrived by Tab would cross them all on every page
 * they open. Hidden until focused; then it sits over the sidebar's head.
 */
export function SkipLink() {
  return (
    <a href="#content" className="skipLink">
      Skip to content
    </a>
  );
}
